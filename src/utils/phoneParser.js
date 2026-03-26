/**
 * Phone record CSV parser utility
 * Supports two formats:
 *   1. Aggregate per-agent report (one row per agent, columns like total calls, avg duration)
 *   2. Norwegian per-call log (one row per call, columns: Besvart, Besvart av, Varighet, …)
 */

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

function parseNorDate(str) {
  const m = String(str).trim().match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})$/)
  if (!m) return null
  const d = new Date(parseInt(m[3]), parseInt(m[2]) - 1, parseInt(m[1]))
  return isNaN(d.getTime()) ? null : d
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
 * Returns { agents, dateRange } where dateRange is { start: Date, end: Date } | null.
 */
function parseNorwegianCallLog(rows, lowerHeaders, lowerKeyMap) {
  const get = (row, col) => col ? row[lowerKeyMap[col]] : null

  const agentCol    = findColumn(lowerHeaders, NOR_ANSWERED_BY_COLUMNS)
  const durationCol = findColumn(lowerHeaders, NOR_DURATION_COLUMNS)
  const dateCol     = findColumn(lowerHeaders, NOR_DATE_COLUMNS)

  const agentMap = {}
  let minDate = null
  let maxDate = null

  for (const row of rows) {
    const agent    = String(get(row, agentCol) || '').trim()
    const duration = parseDurationToSeconds(get(row, durationCol))

    // Track date range regardless of whether the call was answered
    if (dateCol) {
      const d = parseNorDate(String(get(row, dateCol) || ''))
      if (d) {
        if (!minDate || d < minDate) minDate = d
        if (!maxDate || d > maxDate) maxDate = d
      }
    }

    if (!agent) continue  // unanswered calls have no agent

    if (!agentMap[agent]) {
      agentMap[agent] = { answeredCalls: 0, totalDurationSeconds: 0 }
    }
    agentMap[agent].answeredCalls++
    agentMap[agent].totalDurationSeconds += duration
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
  }))

  const dateRange = (minDate && maxDate) ? { start: minDate, end: maxDate } : null
  return { agents, dateRange }
}

/**
 * Parse phone record CSV data
 * Handles both aggregate-per-agent and Norwegian per-call log formats.
 * @param {Array<Object>} rows - Parsed CSV rows from PapaParse
 * @returns {Array<Object>} Normalised agent records
 */
export function parsePhoneCSV(rows) {
  if (!rows || rows.length === 0) return []

  const originalKeys = Object.keys(rows[0])
  const lowerKeyMap = {}
  originalKeys.forEach(k => { lowerKeyMap[k.toLowerCase().trim()] = k })
  const lowerHeaders = Object.keys(lowerKeyMap)

  // Norwegian per-call log path
  if (isNorwegianCallLog(lowerHeaders)) {
    return parseNorwegianCallLog(rows, lowerHeaders, lowerKeyMap)  // returns { agents, dateRange }
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
      }
    })
    .filter(r => r.agent)

  return { agents, dateRange: null }
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
