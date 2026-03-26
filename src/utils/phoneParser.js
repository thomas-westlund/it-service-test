/**
 * Phone record CSV parser utility
 * Supports two formats:
 *   1. Aggregate per-agent report (one row per agent, columns like total calls, avg duration)
 *   2. Norwegian per-call log (one row per call, columns: Besvart, Besvart av, Varighet, …)
 */

import { TEAM_CONFIG } from './workloadCalc'

const AGENT_COLUMNS = ['agent name', 'agent', 'name', 'user', 'employee', 'representative']
const TOTAL_CALLS_COLUMNS = ['total calls', 'calls', 'total', 'count', 'call count', 'num calls']
const ANSWERED_COLUMNS = ['answered calls', 'answered', 'connected', 'picked up']
const MISSED_COLUMNS = ['missed calls', 'missed', 'unanswered', 'abandoned', 'not answered']
const AVG_DURATION_COLUMNS = [
  'avg duration', 'average duration', 'avg call duration', 'mean duration',
  'average call duration', 'avg talk time', 'average talk time', 'avg handle time'
]
const TOTAL_DURATION_COLUMNS = [
  'total duration', 'total talk time', 'total time', 'talk time', 'handle time'
]

// Norwegian per-call log column names
const NOR_ANSWERED_BY_COLUMNS = ['besvart av', 'answered by']
const NOR_ANSWERED_COLUMNS    = ['besvart']
const NOR_DURATION_COLUMNS    = ['varighet']
const NOR_DATE_COLUMNS        = ['dato', 'date']
const NOR_TIME_COLUMNS        = ['tid', 'time', 'tidspunkt', 'klokkeslett']

function parseNorDate(str) {
  const m = String(str).trim().match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})$/)
  if (!m) return null
  const d = new Date(parseInt(m[3]), parseInt(m[2]) - 1, parseInt(m[1]))
  return isNaN(d.getTime()) ? null : d
}

/** Parse "HH:MM" or "HH:MM:SS" → return hour 0-23, or null */
function parseNorHour(str) {
  const m = String(str || '').trim().match(/^(\d{1,2}):\d{2}/)
  if (!m) return null
  const h = parseInt(m[1])
  return h >= 0 && h <= 23 ? h : null
}

function toDateStr(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

/**
 * Find a matching column key from a list of candidate names
 */
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
 * Parse duration string to seconds
 * Handles: plain numbers (seconds), "MM:SS", "HH:MM:SS", "Xm Ys", "Xh Ym Zs"
 */
function parseDurationToSeconds(value) {
  if (value === null || value === undefined || value === '') return 0
  const str = String(value).trim()

  if (/^\d+(\.\d+)?$/.test(str)) return parseFloat(str)

  const colonMatch = str.match(/^(\d+):(\d+)(?::(\d+))?$/)
  if (colonMatch) {
    if (colonMatch[3] !== undefined) {
      return parseInt(colonMatch[1]) * 3600 + parseInt(colonMatch[2]) * 60 + parseInt(colonMatch[3])
    } else {
      return parseInt(colonMatch[1]) * 60 + parseInt(colonMatch[2])
    }
  }

  let seconds = 0
  const hourMatch = str.match(/(\d+)\s*h/i)
  const minMatch  = str.match(/(\d+)\s*m/i)
  const secMatch  = str.match(/(\d+)\s*s/i)
  if (hourMatch) seconds += parseInt(hourMatch[1]) * 3600
  if (minMatch)  seconds += parseInt(minMatch[1]) * 60
  if (secMatch)  seconds += parseInt(secMatch[1])
  if (hourMatch || minMatch || secMatch) return seconds

  return 0
}

/**
 * Detect if headers look like a Norwegian per-call log
 */
function isNorwegianCallLog(lowerHeaders) {
  return (
    findColumn(lowerHeaders, NOR_ANSWERED_BY_COLUMNS) !== null &&
    findColumn(lowerHeaders, NOR_DURATION_COLUMNS) !== null
  )
}

/**
 * Aggregate a Norwegian per-call log into per-agent summary rows.
 * Returns { agents, dateRange, dailyStats, hasOfficeHoursData }
 * - dailyStats: array of { date, totalCalls, answeredCalls, officeHoursCalls, onCallCalls, totalDurationSeconds }
 * - hasOfficeHoursData: true if time column was present and parseable
 */
function parseNorwegianCallLog(rows, lowerHeaders, lowerKeyMap) {
  const get = (row, col) => col ? row[lowerKeyMap[col]] : null

  const agentCol    = findColumn(lowerHeaders, NOR_ANSWERED_BY_COLUMNS)
  const durationCol = findColumn(lowerHeaders, NOR_DURATION_COLUMNS)
  const dateCol     = findColumn(lowerHeaders, NOR_DATE_COLUMNS)
  const timeCol     = findColumn(lowerHeaders, NOR_TIME_COLUMNS)

  const agentMap = {}
  const dailyMap = {}
  let minDate = null
  let maxDate = null
  let hasOfficeHoursData = false

  for (const row of rows) {
    const agent    = String(get(row, agentCol) || '').trim()
    const duration = parseDurationToSeconds(get(row, durationCol))
    const isAnswered = !!agent

    // Parse date
    let dateStr = null
    if (dateCol) {
      const d = parseNorDate(String(get(row, dateCol) || ''))
      if (d) {
        if (!minDate || d < minDate) minDate = d
        if (!maxDate || d > maxDate) maxDate = d
        dateStr = toDateStr(d)
      }
    }

    // Parse time → office hours determination
    let officeHours = null
    if (timeCol) {
      const hour = parseNorHour(String(get(row, timeCol) || ''))
      if (hour !== null) {
        hasOfficeHoursData = true
        officeHours = hour >= TEAM_CONFIG.workStartHour && hour < TEAM_CONFIG.workEndHour
      }
    }

    // Track daily stats (all calls, not just answered)
    if (dateStr) {
      if (!dailyMap[dateStr]) {
        dailyMap[dateStr] = {
          totalCalls: 0, answeredCalls: 0,
          officeHoursCalls: 0, onCallCalls: 0,
          totalDurationSeconds: 0,
        }
      }
      dailyMap[dateStr].totalCalls++
      if (isAnswered) {
        dailyMap[dateStr].answeredCalls++
        dailyMap[dateStr].totalDurationSeconds += duration
        if (officeHours === true) dailyMap[dateStr].officeHoursCalls++
        else if (officeHours === false) dailyMap[dateStr].onCallCalls++
      }
    }

    if (!agent) continue  // unanswered calls have no agent

    if (!agentMap[agent]) {
      agentMap[agent] = {
        answeredCalls: 0, totalDurationSeconds: 0,
        officeHoursCalls: 0, onCallCalls: 0,
        officeHoursDurationSeconds: 0, onCallDurationSeconds: 0,
      }
    }
    agentMap[agent].answeredCalls++
    agentMap[agent].totalDurationSeconds += duration
    if (officeHours === true) {
      agentMap[agent].officeHoursCalls++
      agentMap[agent].officeHoursDurationSeconds += duration
    } else if (officeHours === false) {
      agentMap[agent].onCallCalls++
      agentMap[agent].onCallDurationSeconds += duration
    }
  }

  const agents = Object.entries(agentMap).map(([agent, stats]) => ({
    agent,
    totalCalls: stats.answeredCalls,
    answeredCalls: stats.answeredCalls,
    missedCalls: 0,
    avgDurationSeconds: stats.answeredCalls > 0
      ? Math.round(stats.totalDurationSeconds / stats.answeredCalls)
      : 0,
    totalDurationSeconds: stats.totalDurationSeconds,
    officeHoursCalls: stats.officeHoursCalls,
    onCallCalls: stats.onCallCalls,
    officeHoursDurationSeconds: stats.officeHoursDurationSeconds,
    onCallDurationSeconds: stats.onCallDurationSeconds,
  }))

  const dailyStats = Object.entries(dailyMap)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, s]) => ({ date, ...s }))

  const dateRange = (minDate && maxDate) ? { start: minDate, end: maxDate } : null
  return { agents, dateRange, dailyStats, hasOfficeHoursData }
}

/**
 * Parse phone record CSV data
 * Handles both aggregate-per-agent and Norwegian per-call log formats.
 * @param {Array<Object>} rows - Parsed CSV rows from PapaParse
 * @returns { agents, dateRange, dailyStats, hasOfficeHoursData }
 */
export function parsePhoneCSV(rows) {
  if (!rows || rows.length === 0) return { agents: [], dateRange: null, dailyStats: null, hasOfficeHoursData: false }

  const originalKeys = Object.keys(rows[0])
  const lowerKeyMap = {}
  originalKeys.forEach(k => { lowerKeyMap[k.toLowerCase().trim()] = k })
  const lowerHeaders = Object.keys(lowerKeyMap)

  // Norwegian per-call log path
  if (isNorwegianCallLog(lowerHeaders)) {
    return parseNorwegianCallLog(rows, lowerHeaders, lowerKeyMap)
  }

  // Standard aggregate-per-agent path
  const agentCol    = findColumn(lowerHeaders, AGENT_COLUMNS)
  const totalCol    = findColumn(lowerHeaders, TOTAL_CALLS_COLUMNS)
  const answeredCol = findColumn(lowerHeaders, ANSWERED_COLUMNS)
  const missedCol   = findColumn(lowerHeaders, MISSED_COLUMNS)
  const avgDurCol   = findColumn(lowerHeaders, AVG_DURATION_COLUMNS)
  const totalDurCol = findColumn(lowerHeaders, TOTAL_DURATION_COLUMNS)

  const agents = rows
    .filter(row => {
      const agentVal = agentCol ? row[lowerKeyMap[agentCol]] : null
      return agentVal && String(agentVal).trim() !== ''
    })
    .map(row => {
      const get = (col) => col ? row[lowerKeyMap[col]] : null

      const totalCalls        = parseInt(get(totalCol)) || 0
      const answeredCalls     = parseInt(get(answeredCol)) || 0
      const missedCalls       = parseInt(get(missedCol)) || (totalCalls - answeredCalls) || 0
      const avgDurationSeconds   = parseDurationToSeconds(get(avgDurCol))
      const totalDurationSeconds = parseDurationToSeconds(get(totalDurCol))

      return {
        agent: String(get(agentCol)).trim(),
        totalCalls,
        answeredCalls,
        missedCalls: Math.max(0, missedCalls),
        avgDurationSeconds,
        totalDurationSeconds: totalDurationSeconds || (avgDurationSeconds * totalCalls),
        officeHoursCalls: 0,
        onCallCalls: 0,
        officeHoursDurationSeconds: 0,
        onCallDurationSeconds: 0,
      }
    })
    .filter(r => r.agent)

  return { agents, dateRange: null, dailyStats: null, hasOfficeHoursData: false }
}

/**
 * Detect if CSV headers look like phone records (either format)
 */
export function detectPhoneCSV(headers) {
  const lower = headers.map(h => h.toLowerCase().trim())

  // Norwegian per-call log
  if (isNorwegianCallLog(lower)) return true

  // Standard aggregate format
  const hasAgent    = findColumn(lower, AGENT_COLUMNS) !== null
  const hasCalls    = findColumn(lower, TOTAL_CALLS_COLUMNS) !== null ||
    findColumn(lower, ANSWERED_COLUMNS) !== null ||
    findColumn(lower, MISSED_COLUMNS) !== null
  const hasDuration = findColumn(lower, AVG_DURATION_COLUMNS) !== null ||
    findColumn(lower, TOTAL_DURATION_COLUMNS) !== null
  return hasAgent && (hasCalls || hasDuration)
}
