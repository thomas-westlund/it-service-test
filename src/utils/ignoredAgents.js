/**
 * Persist the set of ignored agent nameMatchKeys in localStorage.
 * Keys are normalised via nameMatchKey (first + last word, lowercase).
 */

const STORAGE_KEY = 'ignoredAgents'

// Default ignored agents (first+last name keys).
// These two are non-core team members per project configuration.
const DEFAULT_IGNORED = ['sigurd bruun', 'ole vingelsgaard', 'ole vingelsgård']

export function loadIgnoredAgents() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return new Set(raw !== null ? JSON.parse(raw) : DEFAULT_IGNORED)
  } catch {
    return new Set(DEFAULT_IGNORED)
  }
}

export function saveIgnoredAgents(set) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...set]))
  } catch {}
}
