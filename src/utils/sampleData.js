/**
 * Sample data for demo purposes
 */

export const samplePhoneData = [
  { agent: 'Alice Johnson', totalCalls: 142, answeredCalls: 131, missedCalls: 11, avgDurationSeconds: 245, totalDurationSeconds: 34790 },
  { agent: 'Bob Martinez', totalCalls: 98, answeredCalls: 88, missedCalls: 10, avgDurationSeconds: 312, totalDurationSeconds: 30576 },
  { agent: 'Carol Williams', totalCalls: 167, answeredCalls: 158, missedCalls: 9, avgDurationSeconds: 198, totalDurationSeconds: 33066 },
  { agent: 'David Chen', totalCalls: 89, answeredCalls: 79, missedCalls: 10, avgDurationSeconds: 421, totalDurationSeconds: 37469 },
  { agent: 'Eva Kowalski', totalCalls: 203, answeredCalls: 191, missedCalls: 12, avgDurationSeconds: 156, totalDurationSeconds: 31668 },
  { agent: 'Frank Thompson', totalCalls: 74, answeredCalls: 65, missedCalls: 9, avgDurationSeconds: 389, totalDurationSeconds: 28786 },
  { agent: 'Grace Lee', totalCalls: 118, answeredCalls: 112, missedCalls: 6, avgDurationSeconds: 267, totalDurationSeconds: 31506 },
  { agent: 'Henry Patel', totalCalls: 156, answeredCalls: 145, missedCalls: 11, avgDurationSeconds: 178, totalDurationSeconds: 27768 },
]

export const sampleJiraData = {
  normalizedRows: [
    // Alice Johnson
    { key: 'IT-101', summary: 'VPN connection issues', assignee: 'Alice Johnson', status: 'Done', type: 'Bug', priority: 'High', created: '2026-03-01', resolved: '2026-03-02', timeSpentSeconds: 7200, storyPoints: 3 },
    { key: 'IT-102', summary: 'Email client configuration', assignee: 'Alice Johnson', status: 'In Progress', type: 'Task', priority: 'Medium', created: '2026-03-03', resolved: '', timeSpentSeconds: 3600, storyPoints: 2 },
    { key: 'IT-103', summary: 'Printer driver install', assignee: 'Alice Johnson', status: 'Done', type: 'Task', priority: 'Low', created: '2026-03-04', resolved: '2026-03-04', timeSpentSeconds: 1800, storyPoints: 1 },
    { key: 'IT-104', summary: 'New employee onboarding setup', assignee: 'Alice Johnson', status: 'Done', type: 'Task', priority: 'High', created: '2026-03-05', resolved: '2026-03-06', timeSpentSeconds: 10800, storyPoints: 5 },
    { key: 'IT-105', summary: 'Software license renewal', assignee: 'Alice Johnson', status: 'Open', type: 'Task', priority: 'Medium', created: '2026-03-08', resolved: '', timeSpentSeconds: 0, storyPoints: 2 },
    { key: 'IT-106', summary: 'Monitor replacement', assignee: 'Alice Johnson', status: 'In Progress', type: 'Task', priority: 'Low', created: '2026-03-10', resolved: '', timeSpentSeconds: 900, storyPoints: 1 },
    // Bob Martinez
    { key: 'IT-201', summary: 'Active Directory account lock', assignee: 'Bob Martinez', status: 'Done', type: 'Bug', priority: 'Critical', created: '2026-03-01', resolved: '2026-03-01', timeSpentSeconds: 1800, storyPoints: 2 },
    { key: 'IT-202', summary: 'SharePoint permissions', assignee: 'Bob Martinez', status: 'In Progress', type: 'Task', priority: 'Medium', created: '2026-03-03', resolved: '', timeSpentSeconds: 5400, storyPoints: 3 },
    { key: 'IT-203', summary: 'Laptop performance issues', assignee: 'Bob Martinez', status: 'Done', type: 'Bug', priority: 'High', created: '2026-03-06', resolved: '2026-03-07', timeSpentSeconds: 9000, storyPoints: 5 },
    { key: 'IT-204', summary: 'USB device not recognized', assignee: 'Bob Martinez', status: 'Open', type: 'Bug', priority: 'Low', created: '2026-03-09', resolved: '', timeSpentSeconds: 0, storyPoints: 1 },
    { key: 'IT-205', summary: 'Outlook calendar sync', assignee: 'Bob Martinez', status: 'In Progress', type: 'Task', priority: 'Medium', created: '2026-03-10', resolved: '', timeSpentSeconds: 3600, storyPoints: 2 },
    // Carol Williams
    { key: 'IT-301', summary: 'Network drive mapping', assignee: 'Carol Williams', status: 'Done', type: 'Task', priority: 'High', created: '2026-03-02', resolved: '2026-03-03', timeSpentSeconds: 3600, storyPoints: 2 },
    { key: 'IT-302', summary: 'Firewall rule update', assignee: 'Carol Williams', status: 'Done', type: 'Task', priority: 'Critical', created: '2026-03-04', resolved: '2026-03-04', timeSpentSeconds: 7200, storyPoints: 8 },
    { key: 'IT-303', summary: 'Antivirus deployment', assignee: 'Carol Williams', status: 'In Progress', type: 'Task', priority: 'High', created: '2026-03-05', resolved: '', timeSpentSeconds: 14400, storyPoints: 5 },
    { key: 'IT-304', summary: 'Password reset portal issue', assignee: 'Carol Williams', status: 'Done', type: 'Bug', priority: 'Medium', created: '2026-03-07', resolved: '2026-03-08', timeSpentSeconds: 5400, storyPoints: 3 },
    { key: 'IT-305', summary: 'SSL certificate renewal', assignee: 'Carol Williams', status: 'Open', type: 'Task', priority: 'High', created: '2026-03-09', resolved: '', timeSpentSeconds: 0, storyPoints: 3 },
    { key: 'IT-306', summary: 'Server backup verification', assignee: 'Carol Williams', status: 'Done', type: 'Task', priority: 'Medium', created: '2026-03-10', resolved: '2026-03-11', timeSpentSeconds: 3600, storyPoints: 2 },
    { key: 'IT-307', summary: 'Disk space alert on FS01', assignee: 'Carol Williams', status: 'In Progress', type: 'Bug', priority: 'High', created: '2026-03-11', resolved: '', timeSpentSeconds: 1800, storyPoints: 3 },
    // David Chen
    { key: 'IT-401', summary: 'Database performance tuning', assignee: 'David Chen', status: 'In Progress', type: 'Task', priority: 'High', created: '2026-03-01', resolved: '', timeSpentSeconds: 18000, storyPoints: 8 },
    { key: 'IT-402', summary: 'SQL query optimization', assignee: 'David Chen', status: 'Done', type: 'Task', priority: 'Medium', created: '2026-03-03', resolved: '2026-03-05', timeSpentSeconds: 14400, storyPoints: 5 },
    { key: 'IT-403', summary: 'ERP integration bug', assignee: 'David Chen', status: 'Open', type: 'Bug', priority: 'Critical', created: '2026-03-08', resolved: '', timeSpentSeconds: 0, storyPoints: 13 },
    { key: 'IT-404', summary: 'Report generation failure', assignee: 'David Chen', status: 'In Progress', type: 'Bug', priority: 'High', created: '2026-03-09', resolved: '', timeSpentSeconds: 7200, storyPoints: 5 },
    // Eva Kowalski
    { key: 'IT-501', summary: 'Help desk ticket portal setup', assignee: 'Eva Kowalski', status: 'Done', type: 'Task', priority: 'High', created: '2026-03-01', resolved: '2026-03-04', timeSpentSeconds: 21600, storyPoints: 8 },
    { key: 'IT-502', summary: 'Knowledge base article', assignee: 'Eva Kowalski', status: 'Done', type: 'Task', priority: 'Low', created: '2026-03-05', resolved: '2026-03-06', timeSpentSeconds: 5400, storyPoints: 2 },
    { key: 'IT-503', summary: 'User training session prep', assignee: 'Eva Kowalski', status: 'In Progress', type: 'Task', priority: 'Medium', created: '2026-03-07', resolved: '', timeSpentSeconds: 10800, storyPoints: 5 },
    { key: 'IT-504', summary: 'Asset inventory update', assignee: 'Eva Kowalski', status: 'Open', type: 'Task', priority: 'Low', created: '2026-03-10', resolved: '', timeSpentSeconds: 0, storyPoints: 3 },
    { key: 'IT-505', summary: 'Zoom license management', assignee: 'Eva Kowalski', status: 'Done', type: 'Task', priority: 'Medium', created: '2026-03-11', resolved: '2026-03-11', timeSpentSeconds: 3600, storyPoints: 2 },
    { key: 'IT-506', summary: 'MFA enrollment issues', assignee: 'Eva Kowalski', status: 'In Progress', type: 'Bug', priority: 'High', created: '2026-03-12', resolved: '', timeSpentSeconds: 7200, storyPoints: 5 },
    { key: 'IT-507', summary: 'Mobile device management', assignee: 'Eva Kowalski', status: 'Open', type: 'Task', priority: 'Medium', created: '2026-03-12', resolved: '', timeSpentSeconds: 0, storyPoints: 3 },
    { key: 'IT-508', summary: 'Patch management review', assignee: 'Eva Kowalski', status: 'Done', type: 'Task', priority: 'High', created: '2026-03-13', resolved: '2026-03-14', timeSpentSeconds: 9000, storyPoints: 5 },
    // Frank Thompson
    { key: 'IT-601', summary: 'Network switch replacement', assignee: 'Frank Thompson', status: 'Done', type: 'Task', priority: 'High', created: '2026-03-02', resolved: '2026-03-03', timeSpentSeconds: 14400, storyPoints: 8 },
    { key: 'IT-602', summary: 'Cable management project', assignee: 'Frank Thompson', status: 'In Progress', type: 'Task', priority: 'Low', created: '2026-03-06', resolved: '', timeSpentSeconds: 7200, storyPoints: 3 },
    { key: 'IT-603', summary: 'UPS battery replacement', assignee: 'Frank Thompson', status: 'Open', type: 'Task', priority: 'Medium', created: '2026-03-10', resolved: '', timeSpentSeconds: 0, storyPoints: 2 },
    // Grace Lee
    { key: 'IT-701', summary: 'CRM system bug', assignee: 'Grace Lee', status: 'Done', type: 'Bug', priority: 'Critical', created: '2026-03-01', resolved: '2026-03-02', timeSpentSeconds: 10800, storyPoints: 8 },
    { key: 'IT-702', summary: 'API integration failure', assignee: 'Grace Lee', status: 'In Progress', type: 'Bug', priority: 'High', created: '2026-03-04', resolved: '', timeSpentSeconds: 14400, storyPoints: 8 },
    { key: 'IT-703', summary: 'Web portal performance', assignee: 'Grace Lee', status: 'Open', type: 'Bug', priority: 'High', created: '2026-03-08', resolved: '', timeSpentSeconds: 0, storyPoints: 5 },
    { key: 'IT-704', summary: 'User access review', assignee: 'Grace Lee', status: 'Done', type: 'Task', priority: 'Medium', created: '2026-03-10', resolved: '2026-03-11', timeSpentSeconds: 7200, storyPoints: 3 },
    { key: 'IT-705', summary: 'SSO configuration', assignee: 'Grace Lee', status: 'In Progress', type: 'Task', priority: 'High', created: '2026-03-12', resolved: '', timeSpentSeconds: 18000, storyPoints: 13 },
    // Henry Patel
    { key: 'IT-801', summary: 'BYOD policy implementation', assignee: 'Henry Patel', status: 'Done', type: 'Task', priority: 'Medium', created: '2026-03-01', resolved: '2026-03-05', timeSpentSeconds: 21600, storyPoints: 8 },
    { key: 'IT-802', summary: 'Remote desktop issues', assignee: 'Henry Patel', status: 'In Progress', type: 'Bug', priority: 'High', created: '2026-03-06', resolved: '', timeSpentSeconds: 9000, storyPoints: 5 },
    { key: 'IT-803', summary: 'Teams meeting room setup', assignee: 'Henry Patel', status: 'Done', type: 'Task', priority: 'Medium', created: '2026-03-08', resolved: '2026-03-09', timeSpentSeconds: 7200, storyPoints: 3 },
    { key: 'IT-804', summary: 'Wi-Fi dead zone report', assignee: 'Henry Patel', status: 'Open', type: 'Bug', priority: 'Medium', created: '2026-03-11', resolved: '', timeSpentSeconds: 0, storyPoints: 3 },
    { key: 'IT-805', summary: 'Software deployment automation', assignee: 'Henry Patel', status: 'In Progress', type: 'Task', priority: 'High', created: '2026-03-12', resolved: '', timeSpentSeconds: 14400, storyPoints: 8 },
  ],
  byAssignee: {},
  statusCounts: {},
  priorityCounts: {},
}

// Build byAssignee, statusCounts, priorityCounts from normalizedRows
function buildJiraAggregates(data) {
  const isResolved = (status) => {
    const lower = status.toLowerCase().trim()
    return ['done', 'closed', 'resolved', 'completed', 'fixed'].some(s => lower === s || lower.includes(s))
  }

  data.byAssignee = {}
  data.statusCounts = {}
  data.priorityCounts = {}

  for (const issue of data.normalizedRows) {
    const name = issue.assignee
    if (!data.byAssignee[name]) {
      data.byAssignee[name] = {
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

    const a = data.byAssignee[name]
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

    data.statusCounts[issue.status] = (data.statusCounts[issue.status] || 0) + 1
    data.priorityCounts[issue.priority] = (data.priorityCounts[issue.priority] || 0) + 1
  }

  return data
}

buildJiraAggregates(sampleJiraData)
