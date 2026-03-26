/**
 * Jira export CSV parser utility
 */

import { TEAM_CONFIG } from './workloadCalc'

function isOfficeHoursTs(ts) {
  if (!ts) return null
  const hour = new Date(ts).getHours()
  return hour >= TEAM_CONFIG.workStartHour && hour < TEAM_CONFIG.workEndHour
}

function toDateStr(ts) {
  const d = new Date(ts)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

const ASSIGNEE_COLUMNS = ['assignee', 'assigned to', 'owner', 'responsible']
const STATUS_COLUMNS = ['status', 'state', 'issue status']
const TYPE_COLUMNS = ['issue type', 'issuetype', 'type', 'kind']
const PRIORITY_COLUMNS = ['priority', 'severity', 'importance']
const CREATED_COLUMNS = ['created', 'created date', 'creation date', 'date created']
const RESOLVED_COLUMNS = ['resolved', 'resolution date', 'resolutiondate', 'resolved date', 'closed date', 'date resolved']
const TIME_SPENT_COLUMNS = ['time spent', 'timespent', 'actual time', 'logged time', 'hours spent']
const STORY_POINTS_COLUMNS = [
  'story points', 'story point estimate', 'custom field (story points)',
  'story_points', 'points', 'sp', 'estimate'
]
const SUMMARY_COLUMNS = ['summary', 'title', 'subject', 'issue summary', 'name']
const KEY_COLUMNS = ['issue key', 'key', 'id', 'issue id', 'ticket id', 'ticket']

const RESOLVED_STATUSES = ['done', 'closed', 'resolved', 'completed', 'fixed', "won't fix", 'wont fix', 'duplicate', 'invalid', 'cancelled']

const QUICK_RESOLVE_THRESHOLD_MS = 20 * 60 * 1000  // 20 minutes in ms

function findColumn(headers, candidates) {
  for (const candidate of candidates) {
    const match = headers.find(h => h === candidate)
    if (match) return match
  }
  for (const candidate of candidates) {
    const match = headers.find(h => h.includes(candidate) || candidate.includes(h))
    if (match) return match
  }
  return null
}

/**
 * Parse Jira time format: "Xh Ym" or plain seconds
 */
function parseTimeSpent(value) {
  if (!value || String(value).trim() === '') return 0
  const str = String(value).trim()
  if (/^\d+$/.test(str)) return parseInt(str)

  let seconds = 0
  const weekMatch = str.match(/(\d+)\s*w/i)
  const dayMatch = str.match(/(\d+)\s*d/i)
  const hourMatch = str.match(/(\d+)\s*h/i)
  const minMatch = str.match(/(\d+)\s*m(?!s)/i)
  const secMatch = str.match(/(\d+)\s*s/i)

  if (weekMatch) seconds += parseInt(weekMatch[1]) * 5 * 8 * 3600
  if (dayMatch) seconds += parseInt(dayMatch[1]) * 8 * 3600
  if (hourMatch) seconds += parseInt(hourMatch[1]) * 3600
  if (minMatch) seconds += parseInt(minMatch[1]) * 60
  if (secMatch) seconds += parseInt(secMatch[1])
  return seconds
}

/**
 * Robustly parse a date/datetime string to a Date object
 * Handles: ISO 8601, "DD/Mon/YY", "YYYY-MM-DD HH:mm", "YYYY-MM-DD"
 */
function parseDate(value) {
  if (!value || String(value).trim() === '') return null
  const str = String(value).trim()

  // Try native Date parse first (handles ISO 8601 and many common formats)
  const d = new Date(str)
  if (!isNaN(d.getTime())) return d

  // Jira legacy: "15/Mar/26 09:30", "15/Mar/26 8:37 PM", or "15/Mar/2026"
  const dmyMatch = str.match(/^(\d{1,2})\/(\w{3})\/(\d{2,4})(?:\s+(\d{1,2}):(\d{2})(?:\s*(AM|PM))?)?/i)
  if (dmyMatch) {
    const year = dmyMatch[3].length === 2 ? `20${dmyMatch[3]}` : dmyMatch[3]
    let hour = dmyMatch[4] ? parseInt(dmyMatch[4]) : 0
    const ampm = dmyMatch[6] ? dmyMatch[6].toUpperCase() : null
    if (ampm === 'AM' && hour === 12) hour = 0
    if (ampm === 'PM' && hour !== 12) hour += 12
    const time = `${String(hour).padStart(2, '0')}:${dmyMatch[5] || '00'}:00`
    const attempt = new Date(`${dmyMatch[2]} ${dmyMatch[1]}, ${year} ${time}`)
    if (!isNaN(attempt.getTime())) return attempt
  }

  return null
}

export function isResolved(status) {
  if (!status) return false
  const lower = status.toLowerCase().trim()
  return RESOLVED_STATUSES.some(s => lower === s || lower.includes(s))
}

/**
 * Normalize raw CSV rows to standard shape (with quickResolved flag)
 * @param {Array<Object>} rows - raw PapaParse rows
 * @returns {Array<Object>} normalized issue objects
 */
export function normalizeJiraRows(rows) {
  if (!rows || rows.length === 0) return []

  const originalKeys = Object.keys(rows[0])
  const lowerKeyMap = {}
  originalKeys.forEach(k => { lowerKeyMap[k.toLowerCase().trim()] = k })
  const lowerHeaders = Object.keys(lowerKeyMap)

  const assigneeCol = findColumn(lowerHeaders, ASSIGNEE_COLUMNS)
  const statusCol = findColumn(lowerHeaders, STATUS_COLUMNS)
  const typeCol = findColumn(lowerHeaders, TYPE_COLUMNS)
  const priorityCol = findColumn(lowerHeaders, PRIORITY_COLUMNS)
  const createdCol = findColumn(lowerHeaders, CREATED_COLUMNS)
  const resolvedCol = findColumn(lowerHeaders, RESOLVED_COLUMNS)
  const timeCol = findColumn(lowerHeaders, TIME_SPENT_COLUMNS)
  const pointsCol = findColumn(lowerHeaders, STORY_POINTS_COLUMNS)
  const summaryCol = findColumn(lowerHeaders, SUMMARY_COLUMNS)
  const keyCol = findColumn(lowerHeaders, KEY_COLUMNS)

  const get = (row, col) => col ? row[lowerKeyMap[col]] : null

  return rows
    .filter(row => {
      const assignee = get(row, assigneeCol)
      return assignee && String(assignee).trim() !== '' && String(assignee).trim().toLowerCase() !== 'unassigned'
    })
    .map(row => {
      const createdDate = parseDate(get(row, createdCol))
      const resolvedDate = parseDate(get(row, resolvedCol))

      let quickResolved = false
      let resolveTimeMinutes = null
      if (createdDate && resolvedDate && resolvedDate > createdDate) {
        resolveTimeMinutes = (resolvedDate.getTime() - createdDate.getTime()) / 60000
        quickResolved = resolveTimeMinutes < 20
      }

      return {
        key: String(get(row, keyCol) || '').trim(),
        summary: String(get(row, summaryCol) || '').trim(),
        assignee: String(get(row, assigneeCol) || '').trim(),
        status: String(get(row, statusCol) || 'Unknown').trim(),
        type: String(get(row, typeCol) || 'Unknown').trim(),
        priority: String(get(row, priorityCol) || 'Unknown').trim(),
        created: String(get(row, createdCol) || '').trim(),
        resolved: String(get(row, resolvedCol) || '').trim(),
        createdTs: createdDate ? createdDate.getTime() : null,
        resolvedTs: resolvedDate ? resolvedDate.getTime() : null,
        resolveTimeMinutes,
        quickResolved,
        timeSpentSeconds: parseTimeSpent(get(row, timeCol)),
        storyPoints: parseFloat(get(row, pointsCol)) || 0,
      }
    })
}

/**
 * Filter normalized rows to those created within an arbitrary date range.
 * startDate and endDate are Date objects; endDate is inclusive (entire day).
 * Rows with no createdTs are always included.
 */
export function filterJiraByDateRange(rows, startDate, endDate) {
  if (!rows) return []
  const startMs = startDate.getTime()
  // Add one day to endDate so the entire end day is included
  const endMs = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate() + 1).getTime()
  return rows.filter(row => {
    if (row.createdTs === null || row.createdTs === undefined) return true
    return row.createdTs >= startMs && row.createdTs < endMs
  })
}

/**
 * Filter normalized rows to only those created within a given month
 * If a row has no createdTs, it is included (no date to filter on)
 */
export function filterJiraByMonth(rows, year, month) {
  if (!rows) return []
  const start = new Date(year, month - 1, 1).getTime()
  const end = new Date(year, month, 1).getTime()  // exclusive
  return rows.filter(row => {
    if (row.createdTs === null || row.createdTs === undefined) return true
    return row.createdTs >= start && row.createdTs < end
  })
}

/**
 * Aggregate normalized rows into byAssignee map + global counts
 */
export function aggregateJiraRows(normalizedRows) {
  const byAssignee = {}
  const statusCounts = {}
  const priorityCounts = {}
  const dailyMap = {}

  // Global office-hours counters
  let officeHoursCreated = 0, onCallCreated = 0
  let officeHoursResolved = 0, onCallResolved = 0

  for (const issue of normalizedRows) {
    const name = issue.assignee
    if (!byAssignee[name]) {
      byAssignee[name] = {
        totalTickets: 0,
        openTickets: 0,
        resolvedTickets: 0,
        ticketsByStatus: {},
        ticketsByPriority: {},
        ticketsByType: {},
        totalTimeSpentSeconds: 0,
        totalStoryPoints: 0,
        resolveTimesArr: [],        // resolve time (minutes) for all resolved tickets with timestamps
      }
    }

    const a = byAssignee[name]
    a.totalTickets++

    // Office-hours classification (computed from createdTs if flag not on row)
    const createdOH = issue.createdOfficeHours ?? isOfficeHoursTs(issue.createdTs)
    if (createdOH === true) officeHoursCreated++
    else if (createdOH === false) onCallCreated++

    // Daily stats (created date)
    if (issue.createdTs) {
      const dateStr = toDateStr(issue.createdTs)
      if (!dailyMap[dateStr]) dailyMap[dateStr] = { created: 0, resolved: 0, officeHoursCreated: 0, onCallCreated: 0, officeHoursResolved: 0, onCallResolved: 0 }
      dailyMap[dateStr].created++
      if (createdOH === true) dailyMap[dateStr].officeHoursCreated++
      else if (createdOH === false) dailyMap[dateStr].onCallCreated++
    }

    if (isResolved(issue.status)) {
      a.resolvedTickets++
      if (issue.resolveTimeMinutes != null) {
        a.resolveTimesArr.push(issue.resolveTimeMinutes)
      }
      const resolvedOH = issue.resolvedOfficeHours ?? isOfficeHoursTs(issue.resolvedTs)
      if (resolvedOH === true) officeHoursResolved++
      else if (resolvedOH === false) onCallResolved++

      if (issue.resolvedTs) {
        const dateStr = toDateStr(issue.resolvedTs)
        if (!dailyMap[dateStr]) dailyMap[dateStr] = { created: 0, resolved: 0, officeHoursCreated: 0, onCallCreated: 0, officeHoursResolved: 0, onCallResolved: 0 }
        dailyMap[dateStr].resolved++
        if (resolvedOH === true) dailyMap[dateStr].officeHoursResolved++
        else if (resolvedOH === false) dailyMap[dateStr].onCallResolved++
      }
    } else {
      a.openTickets++
    }

    a.ticketsByStatus[issue.status] = (a.ticketsByStatus[issue.status] || 0) + 1
    a.ticketsByPriority[issue.priority] = (a.ticketsByPriority[issue.priority] || 0) + 1
    a.ticketsByType[issue.type] = (a.ticketsByType[issue.type] || 0) + 1
    a.totalTimeSpentSeconds += issue.timeSpentSeconds
    a.totalStoryPoints += issue.storyPoints

    statusCounts[issue.status] = (statusCounts[issue.status] || 0) + 1
    priorityCounts[issue.priority] = (priorityCounts[issue.priority] || 0) + 1
  }

  // No static avg resolve time or quick-resolved count — these are computed
  // dynamically in calculateAgentWorkload using a threshold derived from slider values.

  const jiraDailyStats = Object.entries(dailyMap)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, s]) => ({ date, ...s }))

  const hasOfficeHoursData = normalizedRows.some(r => r.createdTs != null)

  const officeHoursStats = {
    officeHoursCreated, onCallCreated,
    officeHoursResolved, onCallResolved,
    hasOfficeHoursData,
  }

  return {
    normalizedRows, byAssignee, statusCounts, priorityCounts,
    jiraDailyStats, officeHoursStats,
  }
}

/**
 * Full parse: normalize + aggregate (no month filter)
 * Kept for compatibility; use normalizeJiraRows + filterJiraByMonth + aggregateJiraRows for month-aware flow
 */
export function parseJiraCSV(rows) {
  const normalized = normalizeJiraRows(rows)
  return aggregateJiraRows(normalized)
}

/**
 * Detect if CSV headers look like a Jira export
 */
export function detectJiraCSV(headers) {
  const lower = headers.map(h => h.toLowerCase().trim())
  const hasAssignee = findColumn(lower, ASSIGNEE_COLUMNS) !== null
  const hasStatus = findColumn(lower, STATUS_COLUMNS) !== null
  const hasType = findColumn(lower, TYPE_COLUMNS) !== null
  const hasKey = findColumn(lower, KEY_COLUMNS) !== null
  const hasPriority = findColumn(lower, PRIORITY_COLUMNS) !== null
  const score = [hasAssignee, hasStatus, hasType, hasKey, hasPriority].filter(Boolean).length
  return score >= 2
}
