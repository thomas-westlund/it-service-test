/**
 * Phone record CSV parser utility
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

/**
 * Find a matching column key from a list of candidate names
 * @param {string[]} headers - Lowercased header keys
 * @param {string[]} candidates - Candidate column name patterns
 * @returns {string|null}
 */
function findColumn(headers, candidates) {
  for (const candidate of candidates) {
    const match = headers.find(h => h === candidate)
    if (match) return match
  }
  // Partial match fallback
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

  // Already a plain number
  if (/^\d+(\.\d+)?$/.test(str)) {
    return parseFloat(str)
  }

  // HH:MM:SS or MM:SS
  const colonMatch = str.match(/^(\d+):(\d+)(?::(\d+))?$/)
  if (colonMatch) {
    if (colonMatch[3] !== undefined) {
      // HH:MM:SS
      return parseInt(colonMatch[1]) * 3600 + parseInt(colonMatch[2]) * 60 + parseInt(colonMatch[3])
    } else {
      // MM:SS
      return parseInt(colonMatch[1]) * 60 + parseInt(colonMatch[2])
    }
  }

  // "Xh Ym Zs" format
  let seconds = 0
  const hourMatch = str.match(/(\d+)\s*h/i)
  const minMatch = str.match(/(\d+)\s*m/i)
  const secMatch = str.match(/(\d+)\s*s/i)
  if (hourMatch) seconds += parseInt(hourMatch[1]) * 3600
  if (minMatch) seconds += parseInt(minMatch[1]) * 60
  if (secMatch) seconds += parseInt(secMatch[1])
  if (hourMatch || minMatch || secMatch) return seconds

  return 0
}

/**
 * Parse phone record CSV data
 * @param {Array<Object>} rows - Parsed CSV rows from PapaParse
 * @returns {Array<Object>} Normalized agent records
 */
export function parsePhoneCSV(rows) {
  if (!rows || rows.length === 0) return []

  // Build lowercase key map
  const originalKeys = Object.keys(rows[0])
  const lowerKeyMap = {}
  originalKeys.forEach(k => {
    lowerKeyMap[k.toLowerCase().trim()] = k
  })

  const lowerHeaders = Object.keys(lowerKeyMap)

  const agentCol = findColumn(lowerHeaders, AGENT_COLUMNS)
  const totalCol = findColumn(lowerHeaders, TOTAL_CALLS_COLUMNS)
  const answeredCol = findColumn(lowerHeaders, ANSWERED_COLUMNS)
  const missedCol = findColumn(lowerHeaders, MISSED_COLUMNS)
  const avgDurCol = findColumn(lowerHeaders, AVG_DURATION_COLUMNS)
  const totalDurCol = findColumn(lowerHeaders, TOTAL_DURATION_COLUMNS)

  return rows
    .filter(row => {
      const agentVal = agentCol ? row[lowerKeyMap[agentCol]] : null
      return agentVal && String(agentVal).trim() !== ''
    })
    .map(row => {
      const get = (col) => col ? row[lowerKeyMap[col]] : null

      const totalCalls = parseInt(get(totalCol)) || 0
      const answeredCalls = parseInt(get(answeredCol)) || 0
      const missedCalls = parseInt(get(missedCol)) || (totalCalls - answeredCalls) || 0
      const avgDurationSeconds = parseDurationToSeconds(get(avgDurCol))
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
}

/**
 * Detect if CSV headers look like phone records
 * @param {string[]} headers
 * @returns {boolean}
 */
export function detectPhoneCSV(headers) {
  const lower = headers.map(h => h.toLowerCase().trim())
  const hasAgent = findColumn(lower, AGENT_COLUMNS) !== null
  const hasCalls = findColumn(lower, TOTAL_CALLS_COLUMNS) !== null ||
    findColumn(lower, ANSWERED_COLUMNS) !== null ||
    findColumn(lower, MISSED_COLUMNS) !== null
  const hasDuration = findColumn(lower, AVG_DURATION_COLUMNS) !== null ||
    findColumn(lower, TOTAL_DURATION_COLUMNS) !== null
  return hasAgent && (hasCalls || hasDuration)
}
