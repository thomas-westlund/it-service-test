import React, { useState, useMemo } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer
} from 'recharts'
import StatCard from './StatCard'
import {
  TEAM_CONFIG, WORKLOAD_DEFAULTS,
  computeCapacity, calculateAgentWorkload, formatMinutes, formatMinutesLong
} from '../utils/workloadCalc'
import './WorkloadDashboard.css'

function shortenName(name) {
  const parts = name.split(' ')
  return parts.length >= 2 ? `${parts[0]} ${parts[1][0]}.` : name
}

function scoreColor(pct) {
  if (pct >= 90) return 'var(--danger)'
  if (pct >= 70) return 'var(--warning)'
  if (pct >= 40) return 'var(--success)'
  return 'var(--primary)'
}

const WorkloadTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null
  const d = payload[0]?.payload
  if (!d) return null
  return (
    <div style={{ background: 'white', border: '1px solid var(--border)', borderRadius: 6, padding: '10px 14px', boxShadow: 'var(--shadow-md)', fontSize: 12 }}>
      <div style={{ fontWeight: 600, marginBottom: 6 }}>{d.fullName}</div>
      <div style={{ color: '#6366f1' }}>Phone time: <strong>{formatMinutes(d.phoneMid)}</strong> <span style={{ color: 'var(--text-muted)' }}>({formatMinutes(d.phoneLow)}–{formatMinutes(d.phoneHigh)})</span></div>
      <div style={{ color: '#0891b2' }}>Ticket time: <strong>{formatMinutes(d.ticketMid)}</strong> <span style={{ color: 'var(--text-muted)' }}>({formatMinutes(d.ticketLow)}–{formatMinutes(d.ticketHigh)})</span></div>
      <div style={{ borderTop: '1px solid var(--border)', marginTop: 6, paddingTop: 6, fontWeight: 600 }}>
        Total: {formatMinutes(d.totalMid)} <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>({formatMinutes(d.totalLow)}–{formatMinutes(d.totalHigh)})</span>
      </div>
      {d.avgResolve != null && (
        <div style={{ marginTop: 4, color: 'var(--text-secondary)' }}>Avg resolve: {formatMinutes(d.avgResolve)}</div>
      )}
    </div>
  )
}

export default function WorkloadDashboard({ phoneData, jiraData }) {
  const [afterCallMid, setAfterCallMid] = useState(WORKLOAD_DEFAULTS.afterCallMid)
  const [ticketMid, setTicketMid] = useState(WORKLOAD_DEFAULTS.ticketMid)

  const capacity = useMemo(() => computeCapacity(TEAM_CONFIG), [])

  const agentRows = useMemo(() => {
    const phoneMap = {}
    if (phoneData) phoneData.forEach(a => { phoneMap[a.agent.toLowerCase()] = a })

    const jiraMap = {}
    if (jiraData?.byAssignee) {
      Object.entries(jiraData.byAssignee).forEach(([name, stats]) => {
        jiraMap[name.toLowerCase()] = { name, stats }
      })
    }

    const allNames = new Set([...Object.keys(phoneMap), ...Object.keys(jiraMap)])
    const settings = { afterCallMid, ticketMid }

    return Array.from(allNames).map(key => {
      const phone = phoneMap[key] || null
      const jiraEntry = jiraMap[key] || null
      const displayName = phone?.agent || jiraEntry?.name || key
      const wl = calculateAgentWorkload(phone, jiraEntry?.stats, settings)
      return { displayName, phone, jiraStats: jiraEntry?.stats || null, wl, hasPhone: !!phone, hasJira: !!jiraEntry }
    }).sort((a, b) => b.wl.totalMid - a.wl.totalMid)
  }, [phoneData, jiraData, afterCallMid, ticketMid])

  const totalQuickResolved = jiraData?.totalQuickResolved ?? 0
  const avgResolveTime = jiraData?.avgResolveTimeMinutes ?? null

  const chartData = agentRows.map(r => ({
    name: shortenName(r.displayName),
    fullName: r.displayName,
    phoneMid: Math.round(r.wl.phoneTotalMid),
    phoneLow: Math.round(r.wl.phoneTotalLow),
    phoneHigh: Math.round(r.wl.phoneTotalHigh),
    ticketMid: Math.round(r.wl.ticketTotalMid),
    ticketLow: Math.round(r.wl.ticketTotalLow),
    ticketHigh: Math.round(r.wl.ticketTotalHigh),
    totalMid: Math.round(r.wl.totalMid),
    totalLow: Math.round(r.wl.totalLow),
    totalHigh: Math.round(r.wl.totalHigh),
    avgResolve: r.wl.avgResolveTimeMinutes != null ? Math.round(r.wl.avgResolveTimeMinutes) : null,
  }))

  const teamTotalMid = agentRows.reduce((s, r) => s + r.wl.totalMid, 0)
  const teamTotalLow = agentRows.reduce((s, r) => s + r.wl.totalLow, 0)
  const teamTotalHigh = agentRows.reduce((s, r) => s + r.wl.totalHigh, 0)
  const agentCount = agentRows.length || 1
  const avgWorkloadMid = teamTotalMid / agentCount
  const monthlyNetMinutes = capacity.netMinutesPerDay * 21

  return (
    <div className="workload-dashboard">

      {/* Assumptions */}
      <div className="dashboard-section" style={{ marginTop: 16 }}>
        <div className="section-header">⚙️ Workload Assumptions</div>
        <div className="assumptions-grid">

          <div className="assumption-group">
            <div className="assumption-title">After-call work per answered call</div>
            <div className="slider-row">
              <span className="slider-label">{WORKLOAD_DEFAULTS.afterCallLow}m</span>
              <input type="range"
                min={WORKLOAD_DEFAULTS.afterCallLow} max={WORKLOAD_DEFAULTS.afterCallHigh}
                step={0.5} value={afterCallMid}
                onChange={e => setAfterCallMid(parseFloat(e.target.value))}
                className="range-slider"
              />
              <span className="slider-label">{WORKLOAD_DEFAULTS.afterCallHigh}m</span>
              <span className="slider-value">{afterCallMid}m</span>
            </div>
            <div className="assumption-note">Tickets created &amp; resolved within 20 min are excluded (handled during the call)</div>
          </div>

          <div className="assumption-group">
            <div className="assumption-title">Actual work per qualifying ticket</div>
            <div className="slider-row">
              <span className="slider-label">{WORKLOAD_DEFAULTS.ticketLow}m</span>
              <input type="range"
                min={WORKLOAD_DEFAULTS.ticketLow} max={WORKLOAD_DEFAULTS.ticketHigh}
                step={1} value={ticketMid}
                onChange={e => setTicketMid(parseInt(e.target.value))}
                className="range-slider"
              />
              <span className="slider-label">{WORKLOAD_DEFAULTS.ticketHigh}m</span>
              <span className="slider-value">{ticketMid}m</span>
            </div>
            <div className="assumption-note">Rest of ticket lifetime is estimated wait / queue time</div>
          </div>

          <div className="assumption-group">
            <div className="assumption-title">Daily capacity (per person)</div>
            <div className="capacity-breakdown">
              <span>{TEAM_CONFIG.workDayMinutes / 60}h day</span>
              <span className="cap-sep">−</span>
              <span>{TEAM_CONFIG.lunchBreakMinutes}m lunch</span>
              <span className="cap-sep">−</span>
              <span>{capacity.breaksPerDay}m breaks ({TEAM_CONFIG.breakMinutesPerHour}m/h)</span>
              <span className="cap-sep">=</span>
              <strong>{capacity.netMinutesPerDay}m net/day</strong>
            </div>
            <div className="assumption-note">
              {capacity.annualWorkingDays} working days/yr · {TEAM_CONFIG.vacationWeeks} wks vacation ·
              on-call ~{capacity.onCallTimesPerYear}×/yr (leave {TEAM_CONFIG.onCallLeaveHour}:00, −{formatMinutes(capacity.onCallMinutesLostPerOccurrence)}/occurrence)
            </div>
          </div>

          <div className="assumption-group">
            <div className="assumption-title">Team structure</div>
            <div className="team-structure-badges">
              <span className="team-badge total">{TEAM_CONFIG.teamSize} members</span>
              <span className="team-badge phones">{TEAM_CONFIG.phonesAlwaysStaffed} always on phones</span>
              <span className="team-badge tickets">{TEAM_CONFIG.teamSize - TEAM_CONFIG.phonesAlwaysStaffed} on tickets</span>
            </div>
            <div className="assumption-note">On-call rotation every {TEAM_CONFIG.onCallIntervalWeeks} weeks per person</div>
          </div>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="dashboard-section">
        <div className="section-header">📊 Workload Summary</div>
        <div className="stats-grid">
          <StatCard
            title="Team Total Workload"
            value={formatMinutes(teamTotalMid)}
            subtitle={`Range: ${formatMinutes(teamTotalLow)} – ${formatMinutes(teamTotalHigh)}`}
            color="var(--primary)"
          />
          <StatCard
            title="Avg Workload / Agent"
            value={formatMinutes(avgWorkloadMid)}
            subtitle={`vs ${formatMinutes(monthlyNetMinutes)} net capacity (~21 work days)`}
            color={scoreColor((avgWorkloadMid / monthlyNetMinutes) * 100)}
          />
          <StatCard
            title="Quick-Resolved Tickets"
            value={totalQuickResolved}
            subtitle="Excluded — created & resolved <20 min (handled during call)"
            color="var(--text-muted)"
          />
          <StatCard
            title="Avg Ticket Resolve Time"
            value={avgResolveTime != null ? formatMinutes(avgResolveTime) : '—'}
            subtitle={avgResolveTime != null ? 'Non-quick tickets with resolution timestamp' : 'Needs resolved timestamps in Jira data'}
            color="#7c3aed"
          />
          <StatCard
            title="Net Capacity / Day"
            value={`${capacity.netMinutesPerDay}m`}
            subtitle={`${capacity.annualWorkingDays} working days/yr after ${TEAM_CONFIG.vacationWeeks} wks vacation`}
            color="var(--success)"
          />
          <StatCard
            title="On-Call Impact / Person"
            value={formatMinutesLong(capacity.onCallMinutesLostAnnual)}
            subtitle={`~${capacity.onCallTimesPerYear}×/yr × ${formatMinutes(capacity.onCallMinutesLostPerOccurrence)} each`}
            color="var(--warning)"
          />
        </div>
      </div>

      {/* Chart */}
      <div className="dashboard-section">
        <div className="section-header">📈 Estimated Workload Per Agent</div>
        <div className="workload-legend">
          <div className="workload-legend-item">
            <div className="workload-legend-dot" style={{ background: '#6366f1' }} />
            Phone time (call duration + {afterCallMid}m after-call work per answered call)
          </div>
          <div className="workload-legend-item">
            <div className="workload-legend-dot" style={{ background: '#0891b2' }} />
            Ticket time (qualifying tickets × {ticketMid}m)
          </div>
        </div>
        <div className="chart-card">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData} margin={{ top: 4, right: 8, left: -10, bottom: 40 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} angle={-30} textAnchor="end" interval={0} />
              <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `${v}m`} />
              <Tooltip content={<WorkloadTooltip />} />
              <Bar dataKey="phoneMid" stackId="a" fill="#6366f1" name="Phone" radius={[0, 0, 0, 0]} />
              <Bar dataKey="ticketMid" stackId="a" fill="#0891b2" name="Tickets" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Per-Agent Table */}
      <div className="dashboard-section">
        <div className="section-header">📋 Agent Workload Breakdown</div>
        <div className="data-table-wrapper">
          <table className="data-table workload-table">
            <thead>
              <tr>
                <th>Agent</th>
                <th>Data</th>
                <th className="number">Answered calls</th>
                <th className="number">Phone time</th>
                <th className="number">Tickets</th>
                <th className="number">Quick excl.</th>
                <th className="number">Ticket time</th>
                <th className="number">Avg resolve</th>
                <th className="number">Low</th>
                <th className="number">Mid</th>
                <th className="number">High</th>
                <th style={{ minWidth: 130 }}>vs capacity</th>
              </tr>
            </thead>
            <tbody>
              {agentRows.map(({ displayName, phone, jiraStats, wl, hasPhone, hasJira }) => {
                const pct = monthlyNetMinutes > 0 ? (wl.totalMid / monthlyNetMinutes) * 100 : 0
                const color = scoreColor(pct)
                return (
                  <tr key={displayName}>
                    <td className="agent-name">{displayName}</td>
                    <td>
                      <div style={{ display: 'flex', gap: 3 }}>
                        {hasPhone && <span className="match-badge phone-only">📞</span>}
                        {hasJira && <span className="match-badge jira-only">🎫</span>}
                      </div>
                    </td>
                    <td className="number">{phone ? phone.answeredCalls : '—'}</td>
                    <td className="number">{formatMinutes(wl.phoneTotalMid)}</td>
                    <td className="number">{jiraStats ? jiraStats.qualifyingTickets : '—'}</td>
                    <td className="number" style={{ color: 'var(--text-muted)' }}>{jiraStats ? wl.quickCount : '—'}</td>
                    <td className="number">{formatMinutes(wl.ticketTotalMid)}</td>
                    <td className="number">{wl.avgResolveTimeMinutes != null ? formatMinutes(wl.avgResolveTimeMinutes) : '—'}</td>
                    <td className="number" style={{ color: 'var(--text-muted)', fontSize: 12 }}>{formatMinutes(wl.totalLow)}</td>
                    <td className="number" style={{ fontWeight: 600 }}>{formatMinutes(wl.totalMid)}</td>
                    <td className="number" style={{ color: 'var(--text-muted)', fontSize: 12 }}>{formatMinutes(wl.totalHigh)}</td>
                    <td>
                      <div className="workload-score-bar">
                        <div className="workload-score-track">
                          <div className="workload-score-fill" style={{ width: `${Math.min(pct, 100)}%`, background: color }} />
                        </div>
                        <span className="workload-score-value" style={{ color }}>{Math.round(pct)}%</span>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 8, paddingLeft: 4 }}>
          % = mid estimate vs ~{formatMinutes(monthlyNetMinutes)} net monthly capacity (21 working days × {capacity.netMinutesPerDay}m/day)
        </div>
      </div>
    </div>
  )
}
