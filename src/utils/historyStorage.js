/**
 * localStorage helpers for monthly workload history
 */

const STORAGE_KEY = 'it_workload_history'

/**
 * Save phone + jira data for a given period (YYYY-MM) to localStorage
 */
export function saveMonthToHistory(period, phoneData, jiraRawRows) {
  const history = loadHistory()
  history[period] = {
    phoneData: phoneData || null,
    jiraRawRows: jiraRawRows || null,
    savedAt: new Date().toISOString(),
  }
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(history))
    return true
  } catch (e) {
    console.error('Failed to save history (storage full?):', e)
    return false
  }
}

/**
 * Load entire history map { [YYYY-MM]: { phoneData, jiraRawRows, savedAt } }
 */
export function loadHistory() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : {}
  } catch {
    return {}
  }
}

/**
 * Delete a single period from history
 */
export function deleteFromHistory(period) {
  const history = loadHistory()
  delete history[period]
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(history))
  } catch (e) {
    console.error('Failed to update history:', e)
  }
}

/**
 * Return sorted list of saved period keys, newest first
 */
export function listHistoryPeriods() {
  return Object.keys(loadHistory()).sort().reverse()
}

/**
 * Format a YYYY-MM string as "Month YYYY" (e.g. "March 2026")
 */
export function formatPeriodLabel(period) {
  if (!period) return ''
  const [y, m] = period.split('-')
  try {
    return new Date(+y, +m - 1, 1).toLocaleString('default', { month: 'long', year: 'numeric' })
  } catch {
    return period
  }
}

/**
 * Return the current month as YYYY-MM
 */
export function currentPeriod() {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
}
