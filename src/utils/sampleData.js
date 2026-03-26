/**
 * Sample data for demo purposes.
 * Team: 5 members — Alice, Bob, Carol, David, Eva
 * Covers March 2026 (current) and February 2026 (historical, saved to localStorage on load)
 */

import { aggregateJiraRows } from './jiraParser'
import { saveMonthToHistory } from './historyStorage'

// ── Phone records ──────────────────────────────────────────────────────────────

export const samplePhoneData = [
  { agent: 'Alice Johnson',  totalCalls: 142, answeredCalls: 131, missedCalls: 11, avgDurationSeconds: 245, totalDurationSeconds: 34790 },
  { agent: 'Bob Martinez',   totalCalls:  98, answeredCalls:  88, missedCalls: 10, avgDurationSeconds: 312, totalDurationSeconds: 30576 },
  { agent: 'Carol Williams', totalCalls: 167, answeredCalls: 158, missedCalls:  9, avgDurationSeconds: 198, totalDurationSeconds: 33066 },
  { agent: 'David Chen',     totalCalls:  89, answeredCalls:  79, missedCalls: 10, avgDurationSeconds: 421, totalDurationSeconds: 37469 },
  { agent: 'Eva Kowalski',   totalCalls: 203, answeredCalls: 191, missedCalls: 12, avgDurationSeconds: 156, totalDurationSeconds: 31668 },
]

export const samplePhoneDataFeb = [
  { agent: 'Alice Johnson',  totalCalls: 128, answeredCalls: 117, missedCalls: 11, avgDurationSeconds: 231, totalDurationSeconds: 29568 },
  { agent: 'Bob Martinez',   totalCalls: 112, answeredCalls: 103, missedCalls:  9, avgDurationSeconds: 298, totalDurationSeconds: 33376 },
  { agent: 'Carol Williams', totalCalls: 154, answeredCalls: 147, missedCalls:  7, avgDurationSeconds: 210, totalDurationSeconds: 32340 },
  { agent: 'David Chen',     totalCalls:  76, answeredCalls:  67, missedCalls:  9, avgDurationSeconds: 445, totalDurationSeconds: 33820 },
  { agent: 'Eva Kowalski',   totalCalls: 189, answeredCalls: 178, missedCalls: 11, avgDurationSeconds: 162, totalDurationSeconds: 30618 },
]

// ── Jira rows (normalized shape) ───────────────────────────────────────────────
// Timestamps allow quick-resolve detection.
// Tickets resolved within 20 min of creation are marked quick-resolved automatically.

const marchJiraRows = [
  // ── Alice Johnson ──
  { key: 'IT-101', summary: 'VPN connection issues',          assignee: 'Alice Johnson',  status: 'Done',        type: 'Bug',  priority: 'High',     created: '2026-03-01T08:45:00', resolved: '2026-03-02T14:20:00', createdTs: null, resolvedTs: null, resolveTimeMinutes: null, quickResolved: false, timeSpentSeconds: 7200,  storyPoints: 3 },
  { key: 'IT-102', summary: 'Email client configuration',     assignee: 'Alice Johnson',  status: 'In Progress', type: 'Task', priority: 'Medium',   created: '2026-03-03T09:10:00', resolved: '',                    createdTs: null, resolvedTs: null, resolveTimeMinutes: null, quickResolved: false, timeSpentSeconds: 3600,  storyPoints: 2 },
  { key: 'IT-103', summary: 'Password reset — quick call',    assignee: 'Alice Johnson',  status: 'Done',        type: 'Task', priority: 'Low',      created: '2026-03-04T10:05:00', resolved: '2026-03-04T10:17:00', createdTs: null, resolvedTs: null, resolveTimeMinutes: null, quickResolved: false, timeSpentSeconds: 720,   storyPoints: 1 },
  { key: 'IT-104', summary: 'New employee onboarding setup',  assignee: 'Alice Johnson',  status: 'Done',        type: 'Task', priority: 'High',     created: '2026-03-05T08:30:00', resolved: '2026-03-06T16:00:00', createdTs: null, resolvedTs: null, resolveTimeMinutes: null, quickResolved: false, timeSpentSeconds: 10800, storyPoints: 5 },
  { key: 'IT-105', summary: 'Software license renewal',       assignee: 'Alice Johnson',  status: 'Open',        type: 'Task', priority: 'Medium',   created: '2026-03-08T11:00:00', resolved: '',                    createdTs: null, resolvedTs: null, resolveTimeMinutes: null, quickResolved: false, timeSpentSeconds: 0,     storyPoints: 2 },
  { key: 'IT-106', summary: 'Account unlock — quick fix',     assignee: 'Alice Johnson',  status: 'Done',        type: 'Task', priority: 'Low',      created: '2026-03-10T14:22:00', resolved: '2026-03-10T14:30:00', createdTs: null, resolvedTs: null, resolveTimeMinutes: null, quickResolved: false, timeSpentSeconds: 480,   storyPoints: 1 },

  // ── Bob Martinez ──
  { key: 'IT-201', summary: 'Active Directory account lock',  assignee: 'Bob Martinez',   status: 'Done',        type: 'Bug',  priority: 'Critical', created: '2026-03-01T09:00:00', resolved: '2026-03-01T09:09:00', createdTs: null, resolvedTs: null, resolveTimeMinutes: null, quickResolved: false, timeSpentSeconds: 540,   storyPoints: 2 },
  { key: 'IT-202', summary: 'SharePoint permissions',         assignee: 'Bob Martinez',   status: 'In Progress', type: 'Task', priority: 'Medium',   created: '2026-03-03T10:30:00', resolved: '',                    createdTs: null, resolvedTs: null, resolveTimeMinutes: null, quickResolved: false, timeSpentSeconds: 5400,  storyPoints: 3 },
  { key: 'IT-203', summary: 'Laptop performance issues',      assignee: 'Bob Martinez',   status: 'Done',        type: 'Bug',  priority: 'High',     created: '2026-03-06T08:15:00', resolved: '2026-03-07T11:00:00', createdTs: null, resolvedTs: null, resolveTimeMinutes: null, quickResolved: false, timeSpentSeconds: 9000,  storyPoints: 5 },
  { key: 'IT-204', summary: 'USB device not recognized',      assignee: 'Bob Martinez',   status: 'Open',        type: 'Bug',  priority: 'Low',      created: '2026-03-09T13:00:00', resolved: '',                    createdTs: null, resolvedTs: null, resolveTimeMinutes: null, quickResolved: false, timeSpentSeconds: 0,     storyPoints: 1 },
  { key: 'IT-205', summary: 'Outlook calendar sync',          assignee: 'Bob Martinez',   status: 'In Progress', type: 'Task', priority: 'Medium',   created: '2026-03-10T09:45:00', resolved: '',                    createdTs: null, resolvedTs: null, resolveTimeMinutes: null, quickResolved: false, timeSpentSeconds: 3600,  storyPoints: 2 },
  { key: 'IT-206', summary: 'VPN quick setup call',           assignee: 'Bob Martinez',   status: 'Done',        type: 'Task', priority: 'Low',      created: '2026-03-12T11:05:00', resolved: '2026-03-12T11:18:00', createdTs: null, resolvedTs: null, resolveTimeMinutes: null, quickResolved: false, timeSpentSeconds: 780,   storyPoints: 1 },

  // ── Carol Williams ──
  { key: 'IT-301', summary: 'Network drive mapping',          assignee: 'Carol Williams', status: 'Done',        type: 'Task', priority: 'High',     created: '2026-03-02T09:30:00', resolved: '2026-03-03T10:00:00', createdTs: null, resolvedTs: null, resolveTimeMinutes: null, quickResolved: false, timeSpentSeconds: 3600,  storyPoints: 2 },
  { key: 'IT-302', summary: 'Firewall rule update',           assignee: 'Carol Williams', status: 'Done',        type: 'Task', priority: 'Critical', created: '2026-03-04T08:00:00', resolved: '2026-03-04T16:30:00', createdTs: null, resolvedTs: null, resolveTimeMinutes: null, quickResolved: false, timeSpentSeconds: 7200,  storyPoints: 8 },
  { key: 'IT-303', summary: 'Antivirus deployment',           assignee: 'Carol Williams', status: 'In Progress', type: 'Task', priority: 'High',     created: '2026-03-05T10:00:00', resolved: '',                    createdTs: null, resolvedTs: null, resolveTimeMinutes: null, quickResolved: false, timeSpentSeconds: 14400, storyPoints: 5 },
  { key: 'IT-304', summary: 'Password reset portal issue',    assignee: 'Carol Williams', status: 'Done',        type: 'Bug',  priority: 'Medium',   created: '2026-03-07T13:00:00', resolved: '2026-03-08T09:30:00', createdTs: null, resolvedTs: null, resolveTimeMinutes: null, quickResolved: false, timeSpentSeconds: 5400,  storyPoints: 3 },
  { key: 'IT-305', summary: 'SSL certificate renewal',        assignee: 'Carol Williams', status: 'Open',        type: 'Task', priority: 'High',     created: '2026-03-09T09:00:00', resolved: '',                    createdTs: null, resolvedTs: null, resolveTimeMinutes: null, quickResolved: false, timeSpentSeconds: 0,     storyPoints: 3 },
  { key: 'IT-306', summary: 'Quick printer mapping call',     assignee: 'Carol Williams', status: 'Done',        type: 'Task', priority: 'Low',      created: '2026-03-11T15:10:00', resolved: '2026-03-11T15:24:00', createdTs: null, resolvedTs: null, resolveTimeMinutes: null, quickResolved: false, timeSpentSeconds: 840,   storyPoints: 1 },

  // ── David Chen ──
  { key: 'IT-401', summary: 'Database performance tuning',    assignee: 'David Chen',     status: 'In Progress', type: 'Task', priority: 'High',     created: '2026-03-01T08:00:00', resolved: '',                    createdTs: null, resolvedTs: null, resolveTimeMinutes: null, quickResolved: false, timeSpentSeconds: 18000, storyPoints: 8 },
  { key: 'IT-402', summary: 'SQL query optimization',         assignee: 'David Chen',     status: 'Done',        type: 'Task', priority: 'Medium',   created: '2026-03-03T09:00:00', resolved: '2026-03-05T17:00:00', createdTs: null, resolvedTs: null, resolveTimeMinutes: null, quickResolved: false, timeSpentSeconds: 14400, storyPoints: 5 },
  { key: 'IT-403', summary: 'ERP integration bug',            assignee: 'David Chen',     status: 'Open',        type: 'Bug',  priority: 'Critical', created: '2026-03-08T10:00:00', resolved: '',                    createdTs: null, resolvedTs: null, resolveTimeMinutes: null, quickResolved: false, timeSpentSeconds: 0,     storyPoints: 13 },
  { key: 'IT-404', summary: 'Report generation failure',      assignee: 'David Chen',     status: 'In Progress', type: 'Bug',  priority: 'High',     created: '2026-03-09T14:00:00', resolved: '',                    createdTs: null, resolvedTs: null, resolveTimeMinutes: null, quickResolved: false, timeSpentSeconds: 7200,  storyPoints: 5 },
  { key: 'IT-405', summary: 'Quick reboot confirmation call', assignee: 'David Chen',     status: 'Done',        type: 'Task', priority: 'Low',      created: '2026-03-13T16:40:00', resolved: '2026-03-13T16:52:00', createdTs: null, resolvedTs: null, resolveTimeMinutes: null, quickResolved: false, timeSpentSeconds: 720,   storyPoints: 1 },

  // ── Eva Kowalski ──
  { key: 'IT-501', summary: 'Help desk portal setup',         assignee: 'Eva Kowalski',   status: 'Done',        type: 'Task', priority: 'High',     created: '2026-03-01T08:00:00', resolved: '2026-03-04T17:00:00', createdTs: null, resolvedTs: null, resolveTimeMinutes: null, quickResolved: false, timeSpentSeconds: 21600, storyPoints: 8 },
  { key: 'IT-502', summary: 'Knowledge base article',         assignee: 'Eva Kowalski',   status: 'Done',        type: 'Task', priority: 'Low',      created: '2026-03-05T10:00:00', resolved: '2026-03-06T11:00:00', createdTs: null, resolvedTs: null, resolveTimeMinutes: null, quickResolved: false, timeSpentSeconds: 5400,  storyPoints: 2 },
  { key: 'IT-503', summary: 'User training session prep',     assignee: 'Eva Kowalski',   status: 'In Progress', type: 'Task', priority: 'Medium',   created: '2026-03-07T09:00:00', resolved: '',                    createdTs: null, resolvedTs: null, resolveTimeMinutes: null, quickResolved: false, timeSpentSeconds: 10800, storyPoints: 5 },
  { key: 'IT-504', summary: 'MFA enrollment issues',          assignee: 'Eva Kowalski',   status: 'In Progress', type: 'Bug',  priority: 'High',     created: '2026-03-12T11:00:00', resolved: '',                    createdTs: null, resolvedTs: null, resolveTimeMinutes: null, quickResolved: false, timeSpentSeconds: 7200,  storyPoints: 5 },
  { key: 'IT-505', summary: 'Quick Zoom link fix',            assignee: 'Eva Kowalski',   status: 'Done',        type: 'Task', priority: 'Low',      created: '2026-03-14T13:55:00', resolved: '2026-03-14T14:08:00', createdTs: null, resolvedTs: null, resolveTimeMinutes: null, quickResolved: false, timeSpentSeconds: 780,   storyPoints: 1 },
  { key: 'IT-506', summary: 'Patch management review',        assignee: 'Eva Kowalski',   status: 'Done',        type: 'Task', priority: 'High',     created: '2026-03-13T09:00:00', resolved: '2026-03-14T15:30:00', createdTs: null, resolvedTs: null, resolveTimeMinutes: null, quickResolved: false, timeSpentSeconds: 9000,  storyPoints: 5 },
]

const febJiraRows = [
  // ── Alice Johnson ──
  { key: 'IT-F101', summary: 'Office 365 activation issues',  assignee: 'Alice Johnson',  status: 'Done',        type: 'Bug',  priority: 'High',     created: '2026-02-02T09:00:00', resolved: '2026-02-03T11:00:00', createdTs: null, resolvedTs: null, resolveTimeMinutes: null, quickResolved: false, timeSpentSeconds: 5400,  storyPoints: 3 },
  { key: 'IT-F102', summary: 'Teams audio not working',       assignee: 'Alice Johnson',  status: 'Done',        type: 'Bug',  priority: 'High',     created: '2026-02-05T10:00:00', resolved: '2026-02-05T16:30:00', createdTs: null, resolvedTs: null, resolveTimeMinutes: null, quickResolved: false, timeSpentSeconds: 4800,  storyPoints: 3 },
  { key: 'IT-F103', summary: 'Quick account unlock call',     assignee: 'Alice Johnson',  status: 'Done',        type: 'Task', priority: 'Low',      created: '2026-02-07T11:12:00', resolved: '2026-02-07T11:25:00', createdTs: null, resolvedTs: null, resolveTimeMinutes: null, quickResolved: false, timeSpentSeconds: 780,   storyPoints: 1 },
  { key: 'IT-F104', summary: 'New laptop setup',              assignee: 'Alice Johnson',  status: 'Done',        type: 'Task', priority: 'Medium',   created: '2026-02-10T08:30:00', resolved: '2026-02-11T17:00:00', createdTs: null, resolvedTs: null, resolveTimeMinutes: null, quickResolved: false, timeSpentSeconds: 9000,  storyPoints: 5 },
  { key: 'IT-F105', summary: 'Slow network investigation',    assignee: 'Alice Johnson',  status: 'Done',        type: 'Bug',  priority: 'Medium',   created: '2026-02-18T09:00:00', resolved: '2026-02-19T12:00:00', createdTs: null, resolvedTs: null, resolveTimeMinutes: null, quickResolved: false, timeSpentSeconds: 7200,  storyPoints: 3 },

  // ── Bob Martinez ──
  { key: 'IT-F201', summary: 'Printer driver issue',          assignee: 'Bob Martinez',   status: 'Done',        type: 'Task', priority: 'Medium',   created: '2026-02-03T09:00:00', resolved: '2026-02-03T14:00:00', createdTs: null, resolvedTs: null, resolveTimeMinutes: null, quickResolved: false, timeSpentSeconds: 3600,  storyPoints: 2 },
  { key: 'IT-F202', summary: 'Quick password reset',          assignee: 'Bob Martinez',   status: 'Done',        type: 'Task', priority: 'Low',      created: '2026-02-06T14:03:00', resolved: '2026-02-06T14:14:00', createdTs: null, resolvedTs: null, resolveTimeMinutes: null, quickResolved: false, timeSpentSeconds: 660,   storyPoints: 1 },
  { key: 'IT-F203', summary: 'VPN timeout issue',             assignee: 'Bob Martinez',   status: 'Done',        type: 'Bug',  priority: 'High',     created: '2026-02-10T08:45:00', resolved: '2026-02-11T15:30:00', createdTs: null, resolvedTs: null, resolveTimeMinutes: null, quickResolved: false, timeSpentSeconds: 8400,  storyPoints: 5 },
  { key: 'IT-F204', summary: 'Email migration support',       assignee: 'Bob Martinez',   status: 'Done',        type: 'Task', priority: 'High',     created: '2026-02-17T09:00:00', resolved: '2026-02-19T17:00:00', createdTs: null, resolvedTs: null, resolveTimeMinutes: null, quickResolved: false, timeSpentSeconds: 12600, storyPoints: 8 },

  // ── Carol Williams ──
  { key: 'IT-F301', summary: 'Server restart scheduling',     assignee: 'Carol Williams', status: 'Done',        type: 'Task', priority: 'Medium',   created: '2026-02-04T10:00:00', resolved: '2026-02-04T15:00:00', createdTs: null, resolvedTs: null, resolveTimeMinutes: null, quickResolved: false, timeSpentSeconds: 3600,  storyPoints: 3 },
  { key: 'IT-F302', summary: 'Backup failure investigation',  assignee: 'Carol Williams', status: 'Done',        type: 'Bug',  priority: 'Critical', created: '2026-02-08T08:00:00', resolved: '2026-02-09T17:00:00', createdTs: null, resolvedTs: null, resolveTimeMinutes: null, quickResolved: false, timeSpentSeconds: 10800, storyPoints: 8 },
  { key: 'IT-F303', summary: 'Quick reboot request',          assignee: 'Carol Williams', status: 'Done',        type: 'Task', priority: 'Low',      created: '2026-02-12T15:50:00', resolved: '2026-02-12T16:04:00', createdTs: null, resolvedTs: null, resolveTimeMinutes: null, quickResolved: false, timeSpentSeconds: 840,   storyPoints: 1 },
  { key: 'IT-F304', summary: 'Network switch firmware update',assignee: 'Carol Williams', status: 'Done',        type: 'Task', priority: 'High',     created: '2026-02-18T08:30:00', resolved: '2026-02-20T17:00:00', createdTs: null, resolvedTs: null, resolveTimeMinutes: null, quickResolved: false, timeSpentSeconds: 14400, storyPoints: 8 },

  // ── David Chen ──
  { key: 'IT-F401', summary: 'Database index rebuild',        assignee: 'David Chen',     status: 'Done',        type: 'Task', priority: 'High',     created: '2026-02-02T09:00:00', resolved: '2026-02-03T17:00:00', createdTs: null, resolvedTs: null, resolveTimeMinutes: null, quickResolved: false, timeSpentSeconds: 10800, storyPoints: 5 },
  { key: 'IT-F402', summary: 'Reporting service crash',       assignee: 'David Chen',     status: 'Done',        type: 'Bug',  priority: 'Critical', created: '2026-02-11T10:30:00', resolved: '2026-02-12T15:00:00', createdTs: null, resolvedTs: null, resolveTimeMinutes: null, quickResolved: false, timeSpentSeconds: 9000,  storyPoints: 8 },
  { key: 'IT-F403', summary: 'Data migration planning',       assignee: 'David Chen',     status: 'Done',        type: 'Task', priority: 'Medium',   created: '2026-02-16T09:00:00', resolved: '2026-02-20T17:00:00', createdTs: null, resolvedTs: null, resolveTimeMinutes: null, quickResolved: false, timeSpentSeconds: 21600, storyPoints: 13 },

  // ── Eva Kowalski ──
  { key: 'IT-F501', summary: 'ITSM tool configuration',       assignee: 'Eva Kowalski',   status: 'Done',        type: 'Task', priority: 'High',     created: '2026-02-03T08:00:00', resolved: '2026-02-06T17:00:00', createdTs: null, resolvedTs: null, resolveTimeMinutes: null, quickResolved: false, timeSpentSeconds: 18000, storyPoints: 8 },
  { key: 'IT-F502', summary: 'Quick link fix for portal',     assignee: 'Eva Kowalski',   status: 'Done',        type: 'Task', priority: 'Low',      created: '2026-02-09T10:05:00', resolved: '2026-02-09T10:19:00', createdTs: null, resolvedTs: null, resolveTimeMinutes: null, quickResolved: false, timeSpentSeconds: 840,   storyPoints: 1 },
  { key: 'IT-F503', summary: 'Asset inventory audit',         assignee: 'Eva Kowalski',   status: 'Done',        type: 'Task', priority: 'Medium',   created: '2026-02-13T09:00:00', resolved: '2026-02-18T17:00:00', createdTs: null, resolvedTs: null, resolveTimeMinutes: null, quickResolved: false, timeSpentSeconds: 14400, storyPoints: 5 },
  { key: 'IT-F504', summary: 'Training doc update',           assignee: 'Eva Kowalski',   status: 'Done',        type: 'Task', priority: 'Low',      created: '2026-02-20T10:00:00', resolved: '2026-02-20T15:00:00', createdTs: null, resolvedTs: null, resolveTimeMinutes: null, quickResolved: false, timeSpentSeconds: 3600,  storyPoints: 2 },
]

// Compute actual timestamps and quickResolved for each row
function hydrateRows(rows) {
  return rows.map(row => {
    const createdDate = row.created ? new Date(row.created) : null
    const resolvedDate = row.resolved ? new Date(row.resolved) : null
    const createdTs = createdDate && !isNaN(createdDate) ? createdDate.getTime() : null
    const resolvedTs = resolvedDate && !isNaN(resolvedDate) ? resolvedDate.getTime() : null
    let resolveTimeMinutes = null
    let quickResolved = false
    if (createdTs && resolvedTs && resolvedTs > createdTs) {
      resolveTimeMinutes = (resolvedTs - createdTs) / 60000
      quickResolved = resolveTimeMinutes < 20
    }
    return { ...row, createdTs, resolvedTs, resolveTimeMinutes, quickResolved }
  })
}

export const sampleMarchJiraRows = hydrateRows(marchJiraRows)
export const sampleFebJiraRows = hydrateRows(febJiraRows)

// Pre-aggregated for direct use
export const sampleJiraData = aggregateJiraRows(sampleMarchJiraRows)

/**
 * Pre-populate localStorage with February 2026 data so comparison works immediately.
 * Called once when "Load Sample Data" is clicked.
 */
export function seedSampleHistory() {
  saveMonthToHistory('2026-02', samplePhoneDataFeb, sampleFebJiraRows)
}
