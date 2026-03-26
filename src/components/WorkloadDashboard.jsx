import React, { useMemo } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  Legend, ResponsiveContainer, Cell
} from 'recharts'
import StatCard from './StatCard'
import './PhoneDashboard.css'
import './WorkloadDashboard.css'

// Fuzzy name match: normalize and check if names are close enough
function normalizeName(name) {
  return name.toLowerCase().replace(/[^a-z]/g, '')
}

function namesMatch(a, b) {
  const na = normalizeName(a)
  const nb = normalizeName(b)
  if (na === nb) return true
  // Check if one contains the other (handles initials or shortened names)
  if (na.includes(nb) || nb.includes(na)) return true
  // Check first+last name parts overlap
  const partsA = a.toLowerCase().split(/\s+/)
  const partsB = b.toLowerCase().split(/\s+/)
  const sharedParts = partsA.filter(p => partsB.some(q => q === p || q.startsWith(p) || p.startsWith(q)))
  return sharedParts.length >= 2
}

function getWorkloadColor(score) {
  if (score >= 80) return '#e02424'
  if (score >= 60) return '#c27803'
  if (score >= 40) return '#1a56db'
  return '#057a55'
}

function shortenName(name) {
  const parts = name.split(' ')
  if (parts.length >= 2) return `${parts[0]} ${parts[1][0]}.`
  return name
}

function formatDuration(seconds) {
  if (!seconds) return '0:00'
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${String(Math.floor(s)).padStart(2, '0')}`
}

export default function WorkloadDashboard({ phoneData, jiraData }) {
  const { byAssignee } = jiraData || {}

  const agents = useMemo(() => {
    const phoneAgents = phoneData || []
    const jiraAgentNames = Object.keys(byAssignee || {})

    // Max values for normalization
    const maxCalls = Math.max(...phoneAgents.map(a => a.totalCalls), 1)
    const maxDuration = Math.max(...phoneAgents.map(a => a.totalDurationSeconds), 1)
    const maxTickets = Math.max(...jiraAgentNames.map(n => byAssignee[n].totalTickets), 1)

    // Build combined agent list
    const allNames = new Set()
    phoneAgents.forEach(a => allNames.add(a.agent))
    jiraAgentNames.forEach(n => allNames.add(n))

    const result = []
    const usedJiraNames = new Set()

    for (const name of allNames) {
      // Find phone record
      const phone = phoneAgents.find(a => namesMatch(a.agent, name))
      // Find jira record
      let jiraName = null
      for (const jn of jiraAgentNames) {
        if (!usedJiraNames.has(jn) && namesMatch(jn, name)) {
          jiraName = jn
          break
        }
      }

      // Skip if this agent is already represented through a jira match
      if (!phone && jiraName && usedJiraNames.has(jiraName)) continue

      if (jiraName) usedJiraNames.add(jiraName)

      const jira = jiraName ? byAssignee[jiraName] : null

      // Workload score (0-100)
      // Weights: calls 35%, duration 25%, tickets 40%
      const callScore = phone ? (phone.totalCalls / maxCalls) * 35 : 0
      const durationScore = phone ? (phone.totalDurationSeconds / maxDuration) * 25 : 0
      const ticketScore = jira ? (jira.totalTickets / maxTickets) * 40 : 0
      const workloadScore = Math.round(callScore + durationScore + ticketScore)

      const canonicalName = phone ? phone.agent : (jiraName || name)

      // Avoid duplicates
      if (result.find(r => normalizeName(r.agent) === normalizeName(canonicalName))) continue

      result.push({
        agent: canonicalName,
        // Phone
        totalCalls: phone?.totalCalls || 0,
        answeredCalls: phone?.answeredCalls || 0,
        missedCalls: phone?.missedCalls || 0,
        avgDurationSeconds: phone?.avgDurationSeconds || 0,
        totalDurationSeconds: phone?.totalDurationSeconds || 0,
        hasPhone: !!phone,
        // Jira
        totalTickets: jira?.totalTickets || 0,
        openTickets: jira?.openTickets || 0,
        resolvedTickets: jira?.resolvedTickets || 0,
        totalStoryPoints: jira?.totalStoryPoints || 0,
        hasJira: !!jira,
        // Score
        workloadScore,
        callScore: Math.round(callScore),
        durationScore: Math.round(durationScore),
        ticketScore: Math.round(ticketScore),
      })
    }

    return result.sort((a, b) => b.workloadScore - a.workloadScore)
  }, [phoneData, jiraData, byAssignee])

  const chartData = agents.map(a => ({
    name: shortenName(a.agent),
    fullName: a.agent,
    'Phone Calls': a.callScore,
    'Call Duration': a.durationScore,
    'Jira Tickets': a.ticketScore,
    total: a.workloadScore,
  }))

  const bothCount = agents.filter(a => a.hasPhone && a.hasJira).length
  const phoneOnlyCount = agents.filter(a => a.hasPhone && !a.hasJira).length
  const jiraOnlyCount = agents.filter(a => !a.hasPhone && a.hasJira).length
  const avgScore = agents.length > 0 ? Math.round(agents.reduce((s, a) => s + a.workloadScore, 0) / agents.length) : 0
  const topAgent = agents[0]

  const WorkloadTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null
    const item = chartData.find(d => d.name === label) || {}
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
        <div style={{ borderTop: '1px solid var(--border)', marginTop: 6, paddingTop: 6, fontWeight: 700 }}>
          Total Score: {item.total}/100
        </div>
      </div>
    )
  }

  return (
    <div className="workload-dashboard">
      {/* Summary */}
      <div className="dashboard-section" style={{ marginTop: 16 }}>
        <div className="section-header">⚖️ Combined Workload Summary</div>
        <div className="stats-grid">
          <StatCard title="Total Agents" value={agents.length} subtitle="Across both datasets" color="var(--primary)" />
          <StatCard title="In Both Datasets" value={bothCount} subtitle="Phone + Jira matched" color="var(--success)" />
          <StatCard title="Avg Workload Score" value={`${avgScore}/100`} subtitle="Normalized 0–100" color="var(--warning)" />
          {topAgent && (
            <StatCard
              title="Highest Workload"
              value={topAgent.agent.split(' ')[0]}
              subtitle={`Score: ${topAgent.workloadScore}/100`}
              color="var(--danger)"
            />
          )}
        </div>
      </div>

      {/* Scoring legend */}
      <div className="dashboard-section">
        <div className="workload-legend">
          <strong style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Score Weights:</strong>
          <div className="workload-legend-item">
            <div className="workload-legend-dot" style={{ background: '#1a56db' }} />
            Phone Calls — 35%
          </div>
          <div className="workload-legend-item">
            <div className="workload-legend-dot" style={{ background: '#7c3aed' }} />
            Call Duration — 25%
          </div>
          <div className="workload-legend-item">
            <div className="workload-legend-dot" style={{ background: '#c27803' }} />
            Jira Tickets — 40%
          </div>
        </div>
      </div>

      {/* Workload Bar Chart */}
      <div className="dashboard-section">
        <div className="section-header">📊 Workload Score by Agent</div>
        <div className="chart-card">
          <div className="chart-title">Stacked Workload Contribution (0–100 scale)</div>
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={chartData} margin={{ top: 4, right: 8, left: -10, bottom: 40 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis
                dataKey="name"
                tick={{ fontSize: 11 }}
                angle={-30}
                textAnchor="end"
                interval={0}
              />
              <YAxis tick={{ fontSize: 11 }} domain={[0, 100]} />
              <Tooltip content={<WorkloadTooltip />} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar dataKey="Phone Calls" stackId="a" fill="#1a56db" />
              <Bar dataKey="Call Duration" stackId="a" fill="#7c3aed" />
              <Bar dataKey="Jira Tickets" stackId="a" fill="#c27803" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Combined Table */}
      <div className="dashboard-section">
        <div className="section-header">📋 Agent Workload Details</div>
        <div className="data-table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>Agent</th>
                <th>Data Source</th>
                <th className="number">Calls</th>
                <th className="number">Answer Rate</th>
                <th className="number">Avg Duration</th>
                <th className="number">Tickets</th>
                <th className="number">Open</th>
                <th className="number">Story Pts</th>
                <th className="number">Workload Score</th>
              </tr>
            </thead>
            <tbody>
              {agents.map((agent) => {
                const answerRate = agent.totalCalls > 0
                  ? Math.round((agent.answeredCalls / agent.totalCalls) * 100)
                  : null
                const scoreColor = getWorkloadColor(agent.workloadScore)
                return (
                  <tr key={agent.agent}>
                    <td className="agent-name">{agent.agent}</td>
                    <td>
                      {agent.hasPhone && agent.hasJira ? (
                        <span className="match-badge both">📞🎫 Both</span>
                      ) : agent.hasPhone ? (
                        <span className="match-badge phone-only">📞 Phone</span>
                      ) : (
                        <span className="match-badge jira-only">🎫 Jira</span>
                      )}
                    </td>
                    <td className="number">{agent.hasPhone ? agent.totalCalls.toLocaleString() : '—'}</td>
                    <td className="number">
                      {answerRate !== null ? (
                        <span style={{
                          color: answerRate >= 90 ? 'var(--success)' : answerRate >= 75 ? 'var(--warning)' : 'var(--danger)',
                          fontWeight: 600
                        }}>
                          {answerRate}%
                        </span>
                      ) : '—'}
                    </td>
                    <td className="number">{agent.hasPhone ? formatDuration(agent.avgDurationSeconds) : '—'}</td>
                    <td className="number">{agent.hasJira ? agent.totalTickets : '—'}</td>
                    <td className="number" style={{ color: agent.openTickets > 0 ? 'var(--warning)' : 'inherit' }}>
                      {agent.hasJira ? agent.openTickets : '—'}
                    </td>
                    <td className="number">{agent.hasJira ? (agent.totalStoryPoints || 0) : '—'}</td>
                    <td className="number">
                      <div className="workload-score-bar">
                        <div className="workload-score-track">
                          <div
                            className="workload-score-fill"
                            style={{ width: `${agent.workloadScore}%`, background: scoreColor }}
                          />
                        </div>
                        <span className="workload-score-value" style={{ color: scoreColor }}>
                          {agent.workloadScore}
                        </span>
                      </div>
                    </td>
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
