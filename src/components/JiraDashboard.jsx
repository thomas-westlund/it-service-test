import React from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  PieChart, Pie, Cell, ResponsiveContainer
} from 'recharts'
import StatCard from './StatCard'
import './PhoneDashboard.css'
import './JiraDashboard.css'

const STATUS_COLORS = {
  'Done': '#057a55',
  'Closed': '#057a55',
  'Resolved': '#057a55',
  'In Progress': '#1a56db',
  'Open': '#6b7280',
  'To Do': '#9ca3af',
  'Reopened': '#c27803',
  'Pending': '#c27803',
  'Unknown': '#d1d5db',
}

const PRIORITY_COLORS = {
  'Critical': '#e02424',
  'High': '#c27803',
  'Medium': '#1a56db',
  'Low': '#057a55',
  'Unknown': '#9ca3af',
}

const PIE_COLORS = [
  '#1a56db', '#057a55', '#c27803', '#e02424', '#7c3aed',
  '#0891b2', '#db7700', '#5850ec', '#9ca3af', '#374151'
]

function getStatusColor(status) {
  return STATUS_COLORS[status] || '#9ca3af'
}

function getPriorityColor(priority) {
  return PRIORITY_COLORS[priority] || '#9ca3af'
}

function shortenName(name) {
  const parts = name.split(' ')
  if (parts.length >= 2) return `${parts[0]} ${parts[1][0]}.`
  return name
}

function formatHours(seconds) {
  if (!seconds) return '0h'
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  if (h === 0) return `${m}m`
  if (m === 0) return `${h}h`
  return `${h}h ${m}m`
}

const CustomPieTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null
  const { name, value } = payload[0]
  return (
    <div style={{
      background: 'white', border: '1px solid var(--border)', borderRadius: 6,
      padding: '8px 12px', boxShadow: 'var(--shadow-md)', fontSize: 12
    }}>
      <strong>{name}</strong>: {value} tickets
    </div>
  )
}

const STOP_WORDS = new Set([
  // Norwegian
  'og', 'i', 'er', 'på', 'til', 'av', 'for', 'med', 'at', 'en', 'et', 'den', 'det',
  'de', 'ikke', 'som', 'har', 'fra', 'om', 'men', 'seg', 'kan', 'vil', 'var', 'vi',
  'så', 'da', 'når', 'noe', 'ny', 'nye', 'sin', 'sitt', 'sine', 'han', 'hun', 'etter',
  'inn', 'ut', 'over', 'under', 'mot', 'hos', 'alle', 'har', 'også', 'ble', 'bli',
  // English
  'the', 'a', 'an', 'and', 'or', 'in', 'on', 'at', 'to', 'for', 'of', 'with',
  'is', 'are', 'was', 'be', 'been', 'has', 'have', 'had', 'not', 'it', 'its',
  'from', 'by', 'as', 'this', 'that', 'but', 'can', 'will', 'do', 'did',
  'after', 'into', 'up', 'out', 'no', 'new', 'all', 'so', 'when', 'if',
])

function extractTopKeywords(rows, topN = 15) {
  const freq = {}
  for (const row of rows) {
    if (!row.summary) continue
    const words = row.summary
      .toLowerCase()
      .replace(/[^a-zæøåéèàü0-9\s]/g, ' ')
      .split(/\s+/)
      .filter(w => w.length >= 3 && !STOP_WORDS.has(w) && !/^\d+$/.test(w))
    for (const word of words) {
      freq[word] = (freq[word] || 0) + 1
    }
  }
  return Object.entries(freq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, topN)
    .map(([word, count]) => ({ word, count }))
}

export default function JiraDashboard({ data, fileName }) {
  if (!data) return null

  const { normalizedRows = [], byAssignee = {}, statusCounts = {}, priorityCounts = {} } = data

  const totalTickets = normalizedRows.length
  const totalOpen = Object.values(byAssignee).reduce((s, a) => s + a.openTickets, 0)
  const totalResolved = Object.values(byAssignee).reduce((s, a) => s + a.resolvedTickets, 0)
  const agentCount = Object.keys(byAssignee).length
  const avgTickets = agentCount > 0 ? Math.round(totalTickets / agentCount) : 0

  // Assignee chart data
  const assigneeList = Object.entries(byAssignee)
    .sort((a, b) => b[1].totalTickets - a[1].totalTickets)

  const assigneeChartData = assigneeList.map(([name, stats]) => ({
    name: shortenName(name),
    fullName: name,
    Open: stats.openTickets,
    Resolved: stats.resolvedTickets,
  }))

  // Status pie data
  const statusPieData = Object.entries(statusCounts)
    .sort((a, b) => b[1] - a[1])
    .map(([name, value]) => ({ name, value }))

  // Priority pie data
  const priorityPieData = Object.entries(priorityCounts)
    .sort((a, b) => b[1] - a[1])
    .map(([name, value]) => ({ name, value }))

  const AssigneeTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null
    const item = assigneeChartData.find(d => d.name === label) || {}
    return (
      <div style={{
        background: 'white', border: '1px solid var(--border)', borderRadius: 6,
        padding: '10px 14px', boxShadow: 'var(--shadow-md)', fontSize: 12
      }}>
        <div style={{ fontWeight: 600, marginBottom: 6 }}>{item.fullName || label}</div>
        {payload.map(p => (
          <div key={p.name} style={{ color: p.fill, display: 'flex', justifyContent: 'space-between', gap: 16 }}>
            <span>{p.name}:</span><span style={{ fontWeight: 600 }}>{p.value}</span>
          </div>
        ))}
      </div>
    )
  }

  const resolveRate = totalTickets > 0 ? Math.round((totalResolved / totalTickets) * 100) : 0

  const topKeywords = extractTopKeywords(normalizedRows)
  const maxKeywordCount = topKeywords[0]?.count || 1

  return (
    <div className="jira-dashboard">
      {fileName && <div className="file-source">Source: {fileName}</div>}

      {/* Summary Stats */}
      <div className="dashboard-section" style={{ marginTop: 16 }}>
        <div className="section-header">📊 Summary Statistics</div>
        <div className="stats-grid">
          <StatCard title="Total Tickets" value={totalTickets.toLocaleString()} subtitle={`Across ${agentCount} assignees`} color="var(--primary)" />
          <StatCard title="Open Tickets" value={totalOpen.toLocaleString()} subtitle="Awaiting resolution" color="var(--warning)" />
          <StatCard title="Resolved Tickets" value={totalResolved.toLocaleString()} subtitle={`${resolveRate}% resolution rate`} color="var(--success)" />
          <StatCard title="Avg Tickets/Agent" value={avgTickets.toLocaleString()} subtitle="Per assignee" color="#7c3aed" />
        </div>
      </div>

      {/* Tickets per Assignee */}
      <div className="dashboard-section">
        <div className="section-header">📈 Tickets Per Assignee</div>
        <div className="chart-card">
          <div className="chart-title">Open vs Resolved by Assignee</div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={assigneeChartData} margin={{ top: 4, right: 8, left: -10, bottom: 40 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis
                dataKey="name"
                tick={{ fontSize: 11 }}
                angle={-30}
                textAnchor="end"
                interval={0}
              />
              <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
              <Tooltip content={<AssigneeTooltip />} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar dataKey="Resolved" stackId="a" fill="#057a55" radius={[0, 0, 0, 0]} />
              <Bar dataKey="Open" stackId="a" fill="#c27803" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Pie Charts */}
      <div className="dashboard-section">
        <div className="section-header">🥧 Distribution Charts</div>
        <div className="pie-charts-grid">
          <div className="chart-card">
            <div className="chart-title">Status Distribution</div>
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie
                  data={statusPieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={90}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {statusPieData.map((entry, index) => (
                    <Cell key={entry.name} fill={getStatusColor(entry.name) || PIE_COLORS[index % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip content={<CustomPieTooltip />} />
              </PieChart>
            </ResponsiveContainer>
            <div className="custom-legend">
              {statusPieData.map((entry, i) => (
                <div key={entry.name} className="legend-item">
                  <div className="legend-dot" style={{ background: getStatusColor(entry.name) || PIE_COLORS[i % PIE_COLORS.length] }} />
                  {entry.name} ({entry.value})
                </div>
              ))}
            </div>
          </div>

          <div className="chart-card">
            <div className="chart-title">Priority Distribution</div>
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie
                  data={priorityPieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={90}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {priorityPieData.map((entry, index) => (
                    <Cell key={entry.name} fill={getPriorityColor(entry.name) || PIE_COLORS[index % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip content={<CustomPieTooltip />} />
              </PieChart>
            </ResponsiveContainer>
            <div className="custom-legend">
              {priorityPieData.map((entry, i) => (
                <div key={entry.name} className="legend-item">
                  <div className="legend-dot" style={{ background: getPriorityColor(entry.name) || PIE_COLORS[i % PIE_COLORS.length] }} />
                  {entry.name} ({entry.value})
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Most Common Issues */}
      {topKeywords.length > 0 && (
        <div className="dashboard-section">
          <div className="section-header">🔍 Most Common Issue Keywords</div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 10 }}>
            Top words from ticket summaries (stop words excluded)
          </div>
          <div className="data-table-wrapper">
            <table className="data-table" style={{ maxWidth: 520 }}>
              <thead>
                <tr>
                  <th style={{ width: 28 }}>#</th>
                  <th>Keyword</th>
                  <th className="number" style={{ width: 64 }}>Count</th>
                  <th style={{ minWidth: 160 }}>Frequency</th>
                </tr>
              </thead>
              <tbody>
                {topKeywords.map(({ word, count }, i) => (
                  <tr key={word}>
                    <td style={{ color: 'var(--text-muted)', fontSize: 12 }}>{i + 1}</td>
                    <td style={{ fontWeight: i < 3 ? 600 : 400 }}>{word}</td>
                    <td className="number">{count}</td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{
                          flex: 1, height: 10, background: 'var(--border)', borderRadius: 5, overflow: 'hidden'
                        }}>
                          <div style={{
                            width: `${Math.round((count / maxKeywordCount) * 100)}%`,
                            height: '100%',
                            background: i < 3 ? 'var(--primary)' : 'var(--text-muted)',
                            borderRadius: 5,
                          }} />
                        </div>
                        <span style={{ fontSize: 11, color: 'var(--text-muted)', width: 34, textAlign: 'right' }}>
                          {Math.round((count / totalTickets) * 100)}%
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Assignee Table */}
      <div className="dashboard-section">
        <div className="section-header">📋 Assignee Breakdown</div>
        <div className="data-table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>Assignee</th>
                <th className="number">Total</th>
                <th className="number">Open</th>
                <th className="number">Resolved</th>
                <th className="number">Resolution %</th>
                <th className="number">Story Points</th>
                <th className="number">Time Logged</th>
              </tr>
            </thead>
            <tbody>
              {assigneeList.map(([name, stats]) => {
                const rate = stats.totalTickets > 0
                  ? Math.round((stats.resolvedTickets / stats.totalTickets) * 100)
                  : 0
                const rateColor = rate >= 70 ? 'var(--success)' : rate >= 40 ? 'var(--warning)' : 'var(--danger)'
                return (
                  <tr key={name}>
                    <td className="agent-name">{name}</td>
                    <td className="number">{stats.totalTickets}</td>
                    <td className="number" style={{ color: stats.openTickets > 0 ? 'var(--warning)' : 'inherit' }}>{stats.openTickets}</td>
                    <td className="number" style={{ color: 'var(--success)' }}>{stats.resolvedTickets}</td>
                    <td className="number">
                      <span style={{ color: rateColor, fontWeight: 600 }}>{rate}%</span>
                    </td>
                    <td className="number">{stats.totalStoryPoints || 0}</td>
                    <td className="number">{formatHours(stats.totalTimeSpentSeconds)}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
