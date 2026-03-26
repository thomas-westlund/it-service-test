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
  onCallLeaveHour: 14,           // on-call day: leave at 14:00
}

// Workload estimation ranges
export const WORKLOAD_DEFAULTS = {
  afterCallLow: 5,               // minutes after-call work, low estimate
  afterCallMid: 7.5,             // midpoint
  afterCallHigh: 10,             // high estimate
  ticketLow: 15,                 // minutes actual work per qualifying ticket, low
  ticketMid: 30,                 // midpoint
  ticketHigh: 45,                // high estimate
  quickResolveThresholdMin: 20,  // tickets resolved within 20 min are excluded
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
 * Calculate workload estimates for one agent for a period
 */
export function calculateAgentWorkload(phoneAgent, jiraStats, settings = {}) {
  const s = { ...WORKLOAD_DEFAULTS, ...settings }

  // Phone workload
  let phoneCallMinutes = 0
  let afterCallLow = 0, afterCallMid = 0, afterCallHigh = 0
  if (phoneAgent) {
    phoneCallMinutes = (phoneAgent.totalDurationSeconds || 0) / 60
    const answered = phoneAgent.answeredCalls || 0
    afterCallLow = answered * s.afterCallLow
    afterCallMid = answered * s.afterCallMid
    afterCallHigh = answered * s.afterCallHigh
  }

  // Ticket workload (qualifying = excluding quick-resolved)
  let ticketCount = 0, quickCount = 0
  let ticketLow = 0, ticketMid = 0, ticketHigh = 0
  let avgResolveTimeMinutes = null
  if (jiraStats) {
    ticketCount = jiraStats.qualifyingTickets ?? jiraStats.totalTickets ?? 0
    quickCount = jiraStats.quickResolvedCount ?? 0
    ticketLow = ticketCount * s.ticketLow
    ticketMid = ticketCount * s.ticketMid
    ticketHigh = ticketCount * s.ticketHigh
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
    totalLow: phoneCallMinutes + afterCallLow + ticketLow,
    totalMid: phoneCallMinutes + afterCallMid + ticketMid,
    totalHigh: phoneCallMinutes + afterCallHigh + ticketHigh,
    avgResolveTimeMinutes,
  }
}

/** Format minutes as Xh Ym */
export function formatMinutes(min) {
  if (min == null || isNaN(min) || min < 0) return '—'
  const h = Math.floor(min / 60)
  const m = Math.round(min % 60)
  if (h === 0) return `${m}m`
  if (m === 0) return `${h}h`
  return `${h}h ${m}m`
}

/** Format minutes as days + hours (for annual figures) */
export function formatMinutesLong(min) {
  if (min == null || isNaN(min)) return '—'
  const days = Math.floor(min / (60 * 8))
  const hours = Math.round((min % (60 * 8)) / 60)
  if (days === 0) return `${hours}h`
  if (hours === 0) return `${days}d`
  return `${days}d ${hours}h`
}
