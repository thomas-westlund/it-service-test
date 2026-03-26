import React from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts'
import StatCard from './StatCard'
import './PhoneDashboard.css'

function formatDuration(seconds) {
  if (!seconds) return '0:00'
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${String(Math.floor(s)).padStart(2, '0')}`
}

function shortenName(name) {
  const parts = name.split(' ')
  if (parts.length >= 2) return `${parts[0]} ${parts[1][0]}.`
  return name
}

const COLORS = {
  answered: '#1a56db',
  missed: '#e02424',
  total: '#6b7280',
  duration: '#057a55',
}

export default function PhoneDashboard({ data, fileName }) {
  if (!data || data.length === 0) return null

  const totalCalls = data.reduce((s, a) => s + a.totalCalls, 0)
  const totalAnswered = data.reduce((s, a) => s + a.answeredCalls, 0)
  const totalMissed = data.reduce((s, a) => s + a.missedCalls, 0)
  const answerRate = totalCalls > 0 ? Math.round((totalAnswered / totalCalls) * 100) : 0
  const avgCallsPerAgent = data.length > 0 ? Math.round(totalCalls / data.length) : 0
  const avgDuration = data.reduce((s, a) => s + a.avgDurationSeconds, 0) / (data.length || 1)

  const sortedData = [...data].sort((a, b) => b.totalCalls - a.totalCalls)

  const chartData = sortedData.map(a => ({
    name: shortenName(a.agent),
    fullName: a.agent,
    Answered: a.answeredCalls,
    Missed: a.missedCalls,
    avgDuration: Math.round(a.avgDurationSeconds),
    avgDurationLabel: formatDuration(a.avgDurationSeconds),
  }))

  const CustomTooltip = ({ active, payload, label }) => {
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
      </div>
    )
  }

  const DurationTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null
    const item = chartData.find(d => d.name === label) || {}
    return (
      <div style={{
        background: 'white', border: '1px solid var(--border)', borderRadius: 6,
        padding: '10px 14px', boxShadow: 'var(--shadow-md)', fontSize: 12
      }}>
        <div style={{ fontWeight: 600, marginBottom: 6 }}>{item.fullName || label}</div>
        <div style={{ color: COLORS.duration }}>
          Avg Duration: <strong>{formatDuration(payload[0]?.value)}</strong>
        </div>
      </div>
    )
  }

  return (
    <div className="phone-dashboard">
      {fileName && <div className="file-source">Source: {fileName}</div>}

      {/* Summary Stats */}
      <div className="dashboard-section" style={{ marginTop: 16 }}>
        <div className="section-header">📊 Summary Statistics</div>
        <div className="stats-grid">
          <StatCard title="Total Calls" value={totalCalls.toLocaleString()} subtitle={`Across ${data.length} agents`} color="var(--primary)" />
          <StatCard title="Answered Calls" value={totalAnswered.toLocaleString()} subtitle={`${answerRate}% answer rate`} color="var(--success)" />
          <StatCard title="Missed Calls" value={totalMissed.toLocaleString()} subtitle={`${100 - answerRate}% miss rate`} color="var(--danger)" />
          <StatCard title="Avg Calls/Agent" value={avgCallsPerAgent.toLocaleString()} subtitle="Per agent average" color="var(--warning)" />
          <StatCard title="Avg Call Duration" value={formatDuration(Math.round(avgDuration))} subtitle="Team average" color="#7c3aed" />
          <StatCard title="Active Agents" value={data.length} subtitle="With call records" color="#0891b2" />
        </div>
      </div>

      {/* Charts */}
      <div className="dashboard-section">
        <div className="section-header">📈 Charts</div>
        <div className="charts-grid">
          <div className="chart-card">
            <div className="chart-title">Calls Per Agent</div>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={chartData} margin={{ top: 4, right: 8, left: -10, bottom: 40 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 11 }}
                  angle={-30}
                  textAnchor="end"
                  interval={0}
                />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="Answered" stackId="a" fill={COLORS.answered} radius={[0, 0, 0, 0]} />
                <Bar dataKey="Missed" stackId="a" fill={COLORS.missed} radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="chart-card">
            <div className="chart-title">Avg Call Duration Per Agent (seconds)</div>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={chartData} margin={{ top: 4, right: 8, left: -10, bottom: 40 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 11 }}
                  angle={-30}
                  textAnchor="end"
                  interval={0}
                />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip content={<DurationTooltip />} />
                <Bar dataKey="avgDuration" fill={COLORS.duration} radius={[3, 3, 0, 0]} name="Avg Duration (s)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="dashboard-section">
        <div className="section-header">📋 Agent Breakdown</div>
        <div className="data-table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>Agent</th>
                <th className="number">Total Calls</th>
                <th className="number">Answered</th>
                <th className="number">Missed</th>
                <th>Answer Rate</th>
                <th className="number">Avg Duration</th>
                <th className="number">Total Duration</th>
              </tr>
            </thead>
            <tbody>
              {sortedData.map((agent) => {
                const rate = agent.totalCalls > 0
                  ? Math.round((agent.answeredCalls / agent.totalCalls) * 100)
                  : 0
                const rateColor = rate >= 90 ? 'var(--success)' : rate >= 75 ? 'var(--warning)' : 'var(--danger)'
                return (
                  <tr key={agent.agent}>
                    <td className="agent-name">{agent.agent}</td>
                    <td className="number">{agent.totalCalls.toLocaleString()}</td>
                    <td className="number" style={{ color: 'var(--success)' }}>{agent.answeredCalls.toLocaleString()}</td>
                    <td className="number" style={{ color: agent.missedCalls > 0 ? 'var(--danger)' : 'inherit' }}>{agent.missedCalls.toLocaleString()}</td>
                    <td>
                      <div className="answer-rate-bar">
                        <div className="answer-rate-track">
                          <div
                            className="answer-rate-fill"
                            style={{ width: `${rate}%`, background: rateColor }}
                          />
                        </div>
                        <span className="answer-rate-label" style={{ color: rateColor }}>{rate}%</span>
                      </div>
                    </td>
                    <td className="number">{formatDuration(agent.avgDurationSeconds)}</td>
                    <td className="number">{formatDuration(agent.totalDurationSeconds)}</td>
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
