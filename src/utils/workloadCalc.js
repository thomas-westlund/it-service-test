/**
 * Business rules and workload calculations for IT support team
 */

// Team configuration
export const TEAM_CONFIG = {
  teamSize: 5,
  phonesAlwaysStaffed: 3,       // 3 of 5 always on phones
  onCallIntervalWeeks: 7,        // one person on-call duty every 7 weeks
  workDayMinutes: 480,           // 8-hour day
  lunchBreakMinutes: 30,         // 30 min lunch
  breakMinutesPerHour: 5,        // 5 min break per hour
  vacationWeeks: 4,              // 4 weeks vacation per year
  workStartHour: 8,              // start at 08:00
  workEndHour: 16,               // end at 16:00 (8h day)
  onCallLeaveHour: 14,           // on-call day: leave at 14:00
}

/**
 * Return true if a Unix timestamp falls within configured office hours.
 * Returns null when timestamp is falsy.
 */
export function isOfficeHours(timestamp) {
  if (!timestamp) return null
  const hour = new Date(timestamp).getHours()
  return hour >= TEAM_CONFIG.workStartHour && hour < TEAM_CONFIG.workEndHour
}

// Workload estimation ranges
export const WORKLOAD_DEFAULTS = {
  afterCallLow: 5,               // minutes after-call work, low estimate
  afterCallMid: 7.5,             // midpoint
  afterCallHigh: 10,             // high estimate
  ticketLow: 15,                 // minutes actual work per qualifying ticket, low
  ticketMid: 20,                 // midpoint
  ticketHigh: 45,                // high estimate
  quickResolveThresholdMin: 20,  // tickets resolved within 20 min are treated as call-handled
}

/**
 * Compute capacity metrics from team config
 */
export function computeCapacity(config = TEAM_CONFIG) {
  const hoursPerDay = config.workDayMinutes / 60
  const breaksPerDay = Math.floor(hoursPerDay) * config.breakMinutesPerHour  // 8×5 = 40 min
  const netMinutesPerDay = config.workDayMinutes - config.lunchBreakMinutes - breaksPerDay
  // 480 - 30 - 40 = 410 min/day

  const annualWorkingDays = 52 * 5 - config.vacationWeeks * 5  // 260 - 20 = 240
  const annualNetMinutes = netMinutesPerDay * annualWorkingDays

  // On-call: person leaves at 14:00 instead of end of 8h day
  const onCallWorkedMinutes = (config.onCallLeaveHour - config.workStartHour) * 60  // 6h = 360 min
  const onCallMinutesLostPerOccurrence = config.workDayMinutes - onCallWorkedMinutes  // 120 min
  const onCallTimesPerYear = 52 / config.onCallIntervalWeeks  // ≈7.43
  const onCallMinutesLostAnnual = Math.round(onCallTimesPerYear * onCallMinutesLostPerOccurrence)

  return {
    netMinutesPerDay,
    breaksPerDay,
    annualWorkingDays,
    annualNetMinutes,
    onCallTimesPerYear: Math.round(onCallTimesPerYear * 10) / 10,
    onCallMinutesLostPerOccurrence,
    onCallMinutesLostAnnual,
  }
}

/**
 * Count actual Mon–Fri working days between two Date objects (inclusive).
 */
export function countWorkingDays(startDate, endDate) {
  if (!startDate || !endDate) return null
  let count = 0
  const d = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate())
  const end = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate())
  while (d <= end) {
    const dow = d.getDay()
    if (dow !== 0 && dow !== 6) count++
    d.setDate(d.getDate() + 1)
  }
  return count
}

/**
 * Calculate workload estimates for one agent for a period.
 * Quick-resolved tickets are counted as ≈ avg call duration + after-call work each,
 * since they represent call-handled work not already covered by phone call time.
 */
export function calculateAgentWorkload(phoneAgent, jiraStats, settings = {}) {
  const s = { ...WORKLOAD_DEFAULTS, ...settings }

  // Phone workload
  let phoneCallMinutes = 0
  let afterCallLow = 0, afterCallMid = 0, afterCallHigh = 0
  let avgCallMin = 0
  if (phoneAgent) {
    phoneCallMinutes = (phoneAgent.totalDurationSeconds || 0) / 60
    const answered = phoneAgent.answeredCalls || 0
    afterCallLow = answered * s.afterCallLow
    afterCallMid = answered * s.afterCallMid
    afterCallHigh = answered * s.afterCallHigh
    avgCallMin = answered > 0 ? phoneCallMinutes / answered : 0
  }

  // Qualifying ticket workload
  let ticketCount = 0, quickCount = 0
  let ticketLow = 0, ticketMid = 0, ticketHigh = 0
  let quickLow = 0, quickMid = 0, quickHigh = 0
  let avgResolveTimeMinutes = null
  if (jiraStats) {
    ticketCount = jiraStats.qualifyingTickets ?? jiraStats.totalTickets ?? 0
    quickCount = jiraStats.quickResolvedCount ?? 0
    ticketLow = ticketCount * s.ticketLow
    ticketMid = ticketCount * s.ticketMid
    ticketHigh = ticketCount * s.ticketHigh
    // Quick-resolved: ≈ avg call duration + after-call work per ticket
    const qLow = avgCallMin + s.afterCallLow
    const qMid = avgCallMin + s.afterCallMid
    const qHigh = avgCallMin + s.afterCallHigh
    quickLow = quickCount * qLow
    quickMid = quickCount * qMid
    quickHigh = quickCount * qHigh
    avgResolveTimeMinutes = jiraStats.avgResolveTimeMinutes ?? null
  }

  return {
    phoneCallMinutes,
    afterCallLow, afterCallMid, afterCallHigh,
    phoneTotalLow: phoneCallMinutes + afterCallLow,
    phoneTotalMid: phoneCallMinutes + afterCallMid,
    phoneTotalHigh: phoneCallMinutes + afterCallHigh,
    ticketCount,
    quickCount,
    ticketTotalLow: ticketLow,
    ticketTotalMid: ticketMid,
    ticketTotalHigh: ticketHigh,
    quickTotalLow: quickLow,
    quickTotalMid: quickMid,
    quickTotalHigh: quickHigh,
    totalLow: phoneCallMinutes + afterCallLow + ticketLow + quickLow,
    totalMid: phoneCallMinutes + afterCallMid + ticketMid + quickMid,
    totalHigh: phoneCallMinutes + afterCallHigh + ticketHigh + quickHigh,
    avgResolveTimeMinutes,
  }
}

/**
 * Normalise an agent name to a matching key using first + last word only.
 * "Jarle Alexander Dominici Pedersen" → "jarle pedersen"
 * "Jarle A Dominici Pedersen"         → "jarle pedersen"
 */
export function nameMatchKey(name) {
  const parts = String(name || '').trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return ''
  if (parts.length === 1) return parts[0].toLowerCase()
  return `${parts[0]} ${parts[parts.length - 1]}`.toLowerCase()
}

/** Format minutes as Xh Ym (clock time, for small durations) */
export function formatMinutes(min) {
  if (min == null || isNaN(min) || min < 0) return '—'
  const h = Math.floor(min / 60)
  const m = Math.round(min % 60)
  if (h === 0) return `${m}m`
  if (m === 0) return `${h}h`
  return `${h}h ${m}m`
}

/**
 * Format minutes as working days / hours / minutes.
 * 1 working day = netMinutesPerDay (default 410 min).
 * Examples (at 410m/day):
 *   45m   → "45m"
 *   90m   → "1h 30m"
 *   410m  → "1d"
 *   500m  → "1d 1h 30m"
 *   820m  → "2d"
 *  8610m  → "21d"
 */
export function formatWorkTime(min, netMinPerDay = 410) {
  if (min == null || isNaN(min) || min < 0) return '—'
  const totalMin = Math.round(min)
  if (totalMin < netMinPerDay) {
    // Less than one working day — show as Xh Ym
    const h = Math.floor(totalMin / 60)
    const m = totalMin % 60
    if (h === 0) return `${m}m`
    if (m === 0) return `${h}h`
    return `${h}h ${m}m`
  }
  const days = Math.floor(totalMin / netMinPerDay)
  const rem = totalMin % netMinPerDay
  const hours = Math.floor(rem / 60)
  const minutes = rem % 60
  const parts = [`${days}d`]
  if (hours > 0) parts.push(`${hours}h`)
  if (minutes > 0) parts.push(`${minutes}m`)
  return parts.join(' ')
}

/** Format minutes as days + hours (for annual/long figures, 8h clock day) */
export function formatMinutesLong(min) {
  if (min == null || isNaN(min)) return '—'
  const days = Math.floor(min / (60 * 8))
  const hours = Math.round((min % (60 * 8)) / 60)
  if (days === 0) return `${hours}h`
  if (hours === 0) return `${days}d`
  return `${days}d ${hours}h`
}
