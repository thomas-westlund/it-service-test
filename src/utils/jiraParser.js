/**
 * Jira export CSV parser utility
 */

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

const OPEN_STATUSES = ['open', 'to do', 'todo', 'new', 'in progress', 'in review', 'reopened', 'pending', 'waiting']
const RESOLVED_STATUSES = ['done', 'closed', 'resolved', 'completed', 'fixed', 'won\'t fix', 'wont fix', 'duplicate', 'invalid', 'cancelled']

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
  const minMatch = str.match(/(\d+)\s*m/i)
  const secMatch = str.match(/(\d+)\s*s/i)

  if (weekMatch) seconds += parseInt(weekMatch[1]) * 5 * 8 * 3600
  if (dayMatch) seconds += parseInt(dayMatch[1]) * 8 * 3600
  if (hourMatch) seconds += parseInt(hourMatch[1]) * 3600
  if (minMatch) seconds += parseInt(minMatch[1]) * 60
  if (secMatch) seconds += parseInt(secMatch[1])

  return seconds
}

function isResolved(status) {
  if (!status) return false
  const lower = status.toLowerCase().trim()
  return RESOLVED_STATUSES.some(s => lower === s || lower.includes(s))
}

function isOpen(status) {
  return !isResolved(status)
}

/**
 * Parse Jira export CSV
 * @param {Array<Object>} rows
 * @returns {{ normalizedRows, byAssignee, statusCounts, priorityCounts }}
 */
export function parseJiraCSV(rows) {
  if (!rows || rows.length === 0) {
    return { normalizedRows: [], byAssignee: {}, statusCounts: {}, priorityCounts: {} }
  }

  const originalKeys = Object.keys(rows[0])
  const lowerKeyMap = {}
  originalKeys.forEach(k => {
    lowerKeyMap[k.toLowerCase().trim()] = k
  })
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

  const normalizedRows = rows
    .filter(row => {
      const assignee = get(row, assigneeCol)
      return assignee && String(assignee).trim() !== '' && String(assignee).trim().toLowerCase() !== 'unassigned'
    })
    .map(row => ({
      key: String(get(row, keyCol) || '').trim(),
      summary: String(get(row, summaryCol) || '').trim(),
      assignee: String(get(row, assigneeCol) || '').trim(),
      status: String(get(row, statusCol) || 'Unknown').trim(),
      type: String(get(row, typeCol) || 'Unknown').trim(),
      priority: String(get(row, priorityCol) || 'Unknown').trim(),
      created: String(get(row, createdCol) || '').trim(),
      resolved: String(get(row, resolvedCol) || '').trim(),
      timeSpentSeconds: parseTimeSpent(get(row, timeCol)),
      storyPoints: parseFloat(get(row, pointsCol)) || 0,
    }))

  // Aggregate by assignee
  const byAssignee = {}
  const statusCounts = {}
  const priorityCounts = {}

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
      }
    }

    const a = byAssignee[name]
    a.totalTickets++
    if (isResolved(issue.status)) {
      a.resolvedTickets++
    } else {
      a.openTickets++
    }

    a.ticketsByStatus[issue.status] = (a.ticketsByStatus[issue.status] || 0) + 1
    a.ticketsByPriority[issue.priority] = (a.ticketsByPriority[issue.priority] || 0) + 1
    a.ticketsByType[issue.type] = (a.ticketsByType[issue.type] || 0) + 1
    a.totalTimeSpentSeconds += issue.timeSpentSeconds
    a.totalStoryPoints += issue.storyPoints

    // Global counts
    statusCounts[issue.status] = (statusCounts[issue.status] || 0) + 1
    priorityCounts[issue.priority] = (priorityCounts[issue.priority] || 0) + 1
  }

  return { normalizedRows, byAssignee, statusCounts, priorityCounts }
}

/**
 * Detect if CSV headers look like a Jira export
 * @param {string[]} headers
 * @returns {boolean}
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
