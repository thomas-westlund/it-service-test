import React, { useState, useMemo } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ComposedChart, Legend
} from 'recharts'
import StatCard from './StatCard'
import {
  TEAM_CONFIG, WORKLOAD_DEFAULTS,
  computeCapacity, calculateAgentWorkload,
  formatMinutes, formatWorkTime, formatMinutesLong,
  nameMatchKey, countWorkingDays
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

function fmtDate(dateStr) {
  const [, , d] = dateStr.split('-')
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
  const mIdx = parseInt(dateStr.split('-')[1]) - 1
  return `${parseInt(d)} ${months[mIdx]}`
}

const WorkloadTooltip = ({ active, payload, netMinPerDay }) => {
  if (!active || !payload?.length) return null
  const d = payload[0]?.payload
  if (!d) return null
  const fmt = m => formatWorkTime(m, netMinPerDay)
  return (
    <div style={{ background: 'white', border: '1px solid var(--border)', borderRadius: 6, padding: '10px 14px', boxShadow: 'var(--shadow-md)', fontSize: 12 }}>
      <div style={{ fontWeight: 600, marginBottom: 6 }}>{d.fullName}</div>
      <div style={{ color: '#6366f1' }}>Phone time: <strong>{fmt(d.phoneMid)}</strong> <span style={{ color: 'var(--text-muted)' }}>({fmt(d.phoneLow)}–{fmt(d.phoneHigh)})</span></div>
      <div style={{ color: '#a78bfa' }}>Quick tickets: <strong>{fmt(d.quickMid)}</strong></div>
      <div style={{ color: '#0891b2' }}>Ticket time: <strong>{fmt(d.ticketMid)}</strong> <span style={{ color: 'var(--text-muted)' }}>({fmt(d.ticketLow)}–{fmt(d.ticketHigh)})</span></div>
      <div style={{ borderTop: '1px solid var(--border)', marginTop: 6, paddingTop: 6, fontWeight: 600 }}>
        Total: {fmt(d.totalMid)} <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>({fmt(d.totalLow)}–{fmt(d.totalHigh)})</span>
      </div>
      {d.avgResolve != null && (
        <div style={{ marginTop: 4, color: 'var(--text-secondary)' }}>Avg resolve: {formatMinutes(d.avgResolve)}</div>
      )}
    </div>
  )
}

const CapacityTooltip = ({ active, payload, netMinPerDay, periodCapacity }) => {
  if (!active || !payload?.length) return null
  const d = payload[0]?.payload
  if (!d) return null
  const pct = Math.round((d.workload / periodCapacity) * 100)
  const fmt = m => formatWorkTime(m, netMinPerDay)
  return (
    <div style={{ background: 'white', border: '1px solid var(--border)', borderRadius: 6, padding: '10px 14px', boxShadow: 'var(--shadow-md)', fontSize: 12 }}>
      <div style={{ fontWeight: 600, marginBottom: 6 }}>{d.fullName}</div>
      <div style={{ color: scoreColor(pct) }}>Workload: <strong>{fmt(d.workload)}</strong> ({pct}%)</div>
      <div style={{ color: 'var(--success)' }}>Remaining: <strong>{fmt(Math.max(0, d.remaining))}</strong></div>
      <div style={{ color: 'var(--text-muted)', marginTop: 4 }}>Capacity: {fmt(periodCapacity)}</div>
    </div>
  )
}

export default function WorkloadDashboard({
  phoneData, jiraData,
  phoneDailyStats, phoneHasOfficeHoursData,
  phoneDateRange,
  ignoredAgents, onToggleIgnored,
}) {
  const [afterCallMid, setAfterCallMid] = useState(WORKLOAD_DEFAULTS.afterCallMid)
  const [ticketMid, setTicketMid] = useState(WORKLOAD_DEFAULTS.ticketMid)

  const capacity = useMemo(() => computeCapacity(TEAM_CONFIG), [])
  const { netMinutesPerDay } = capacity

  // Actual working days in the loaded period (Mon–Fri only)
  const workingDays = useMemo(() => {
    if (phoneDateRange?.start && phoneDateRange?.end) {
      return countWorkingDays(phoneDateRange.start, phoneDateRange.end) || 21
    }
    return 21
  }, [phoneDateRange])

  const periodCapacity = netMinutesPerDay * workingDays
  const fmt = m => formatWorkTime(m, netMinutesPerDay)

  const agentRows = useMemo(() => {
    const phoneMap = {}
    if (phoneData) phoneData.forEach(a => { phoneMap[nameMatchKey(a.agent)] = a })

    const jiraMap = {}
    if (jiraData?.byAssignee) {
      Object.entries(jiraData.byAssignee).forEach(([name, stats]) => {
        jiraMap[nameMatchKey(name)] = { name, stats }
      })
    }

    const allNames = new Set([...Object.keys(phoneMap), ...Object.keys(jiraMap)])
    const settings = { afterCallMid, ticketMid }

    return Array.from(allNames)
      .filter(key => !ignoredAgents?.has(key))
      .map(key => {
        const phone = phoneMap[key] || null
        const jiraEntry = jiraMap[key] || null
        const displayName = phone?.agent || jiraEntry?.name || key
        const wl = calculateAgentWorkload(phone, jiraEntry?.stats, settings)
        return { displayName, phone, jiraStats: jiraEntry?.stats || null, wl, hasPhone: !!phone, hasJira: !!jiraEntry }
      }).sort((a, b) => b.wl.totalMid - a.wl.totalMid)
  }, [phoneData, jiraData, afterCallMid, ticketMid, ignoredAgents])

  // All known agents for the ignore UI
  const allAgentEntries = useMemo(() => {
    const keyToName = {}
    if (phoneData) phoneData.forEach(a => {
      const k = nameMatchKey(a.agent)
      if (!keyToName[k] || a.agent.length > keyToName[k].length) keyToName[k] = a.agent
    })
    if (jiraData?.byAssignee) Object.keys(jiraData.byAssignee).forEach(n => {
      const k = nameMatchKey(n)
      if (!keyToName[k] || n.length > keyToName[k].length) keyToName[k] = n
    })
    return Object.entries(keyToName).sort(([, a], [, b]) => a.localeCompare(b))
  }, [phoneData, jiraData])

  const totalQuickResolved = jiraData?.totalQuickResolved ?? 0
  const avgResolveTime = jiraData?.avgResolveTimeMinutes ?? null

  const chartData = agentRows.map(r => ({
    name: shortenName(r.displayName),
    fullName: r.displayName,
    phoneMid: Math.round(r.wl.phoneTotalMid),
    phoneLow: Math.round(r.wl.phoneTotalLow),
    phoneHigh: Math.round(r.wl.phoneTotalHigh),
    quickMid: Math.round(r.wl.quickTotalMid),
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
  const teamCapacity = periodCapacity * agentCount

  // Remaining capacity chart data
  const capacityChartData = agentRows.map(r => {
    const workload = Math.round(r.wl.totalMid)
    const remaining = Math.max(0, Math.round(periodCapacity - workload))
    return {
      name: shortenName(r.displayName),
      fullName: r.displayName,
      workload,
      remaining,
    }
  })

  // Daily activity
  const dailyChartData = useMemo(() => {
    const map = {}
    if (phoneDailyStats) {
      for (const d of phoneDailyStats) {
        map[d.date] = { date: d.date, calls: d.answeredCalls, tickets: 0 }
      }
    }
    if (jiraData?.jiraDailyStats) {
      for (const d of jiraData.jiraDailyStats) {
        if (!map[d.date]) map[d.date] = { date: d.date, calls: 0, tickets: 0 }
        map[d.date].tickets += d.created || 0
      }
    }
    return Object.values(map).sort((a, b) => a.date.localeCompare(b.date))
  }, [phoneDailyStats, jiraData])

  // On-call stats
  const phoneOfficeHoursCalls = agentRows.reduce((s, r) => s + (r.phone?.officeHoursCalls || 0), 0)
  const phoneOnCallCalls = agentRows.reduce((s, r) => s + (r.phone?.onCallCalls || 0), 0)
  const phoneOfficeHoursDuration = agentRows.reduce((s, r) => s + (r.phone?.officeHoursDurationSeconds || 0), 0)
  const phoneOnCallDuration = agentRows.reduce((s, r) => s + (r.phone?.onCallDurationSeconds || 0), 0)
  const officeHoursStats = jiraData?.officeHoursStats
  const showOnCallSection = phoneHasOfficeHoursData || officeHoursStats?.hasOfficeHoursData

  const periodLabel = phoneDateRange
    ? `${phoneDateRange.start.toLocaleDateString()} – ${phoneDateRange.end.toLocaleDateString()} (${workingDays} working days)`
    : `21 working days (estimate)`

  return (
    <div className="workload-dashboard">

      {/* Team Members — ignore filter */}
      {allAgentEntries.length > 0 && (
        <div className="dashboard-section" style={{ marginTop: 16 }}>
          <div className="section-header">👥 Team Members</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px 14px', padding: '4px 0' }}>
            {allAgentEntries.map(([key, name]) => (
              <label key={key} style={{
                display: 'flex', alignItems: 'center', gap: 6, fontSize: 13,
                cursor: 'pointer', padding: '4px 8px', borderRadius: 4,
                border: '1px solid var(--border)',
                background: ignoredAgents?.has(key) ? 'var(--bg)' : 'white',
                color: ignoredAgents?.has(key) ? 'var(--text-muted)' : 'var(--text-primary)',
                textDecoration: ignoredAgents?.has(key) ? 'line-through' : 'none',
              }}>
                <input
                  type="checkbox"
                  checked={!ignoredAgents?.has(key)}
                  onChange={() => onToggleIgnored?.(key)}
                  style={{ cursor: 'pointer', accentColor: 'var(--primary)' }}
                />
                {name}
              </label>
            ))}
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 6 }}>
            Unchecked agents are excluded from all workload calculations. Setting is remembered.
          </div>
        </div>
      )}

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
            <div className="assumption-note">Quick-resolved tickets (created &amp; resolved &lt;20 min) counted as avg call + after-call time</div>
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
            <div className="assumption-title">Period</div>
            <div className="capacity-breakdown" style={{ flexWrap: 'wrap' }}>
              <span>📅 {periodLabel}</span>
            </div>
            <div className="assumption-note">
              Capacity per person: <strong>{fmt(periodCapacity)}</strong> · Team total: <strong>{fmt(teamCapacity)}</strong>
              <br />Counts Mon–Fri within office hours ({TEAM_CONFIG.workStartHour}:00–{TEAM_CONFIG.workEndHour}:00)
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
            value={fmt(teamTotalMid)}
            subtitle={`Range: ${fmt(teamTotalLow)} – ${fmt(teamTotalHigh)}`}
            color="var(--primary)"
          />
          <StatCard
            title="Avg Workload / Agent"
            value={fmt(avgWorkloadMid)}
            subtitle={`vs ${fmt(periodCapacity)} capacity (${workingDays} working days)`}
            color={scoreColor((avgWorkloadMid / periodCapacity) * 100)}
          />
          <StatCard
            title="Team Remaining Capacity"
            value={fmt(Math.max(0, teamCapacity - teamTotalMid))}
            subtitle={`of ${fmt(teamCapacity)} total (${agentCount} agents × ${workingDays}d)`}
            color="var(--success)"
          />
          <StatCard
            title="Quick-Resolved Tickets"
            value={totalQuickResolved}
            subtitle={`Counted as ≈ avg call + after-call work (created & resolved <20 min)`}
            color="#7c3aed"
          />
          <StatCard
            title="Avg Ticket Resolve Time"
            value={avgResolveTime != null ? formatMinutes(avgResolveTime) : '—'}
            subtitle={avgResolveTime != null ? 'Non-quick tickets with resolution timestamp' : 'Needs resolved timestamps in Jira data'}
            color="#0891b2"
          />
          <StatCard
            title="On-Call Impact / Person / Year"
            value={fmt(capacity.onCallMinutesLostAnnual)}
            subtitle={`~${capacity.onCallTimesPerYear}×/yr × ${formatMinutes(capacity.onCallMinutesLostPerOccurrence)} each`}
            color="var(--warning)"
          />
        </div>
      </div>

      {/* Workload chart */}
      <div className="dashboard-section">
        <div className="section-header">📈 Estimated Workload Per Agent</div>
        <div className="workload-legend">
          <div className="workload-legend-item">
            <div className="workload-legend-dot" style={{ background: '#6366f1' }} />
            Phone time (call duration + {afterCallMid}m after-call)
          </div>
          <div className="workload-legend-item">
            <div className="workload-legend-dot" style={{ background: '#a78bfa' }} />
            Quick tickets (≈ avg call + {afterCallMid}m after-call each)
          </div>
          <div className="workload-legend-item">
            <div className="workload-legend-dot" style={{ background: '#0891b2' }} />
            Qualifying tickets × {ticketMid}m
          </div>
        </div>
        <div className="chart-card">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData} margin={{ top: 4, right: 8, left: 10, bottom: 40 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} angle={-30} textAnchor="end" interval={0} />
              <YAxis tick={{ fontSize: 11 }} tickFormatter={v => fmt(v)} width={56} />
              <Tooltip content={<WorkloadTooltip netMinPerDay={netMinutesPerDay} />} />
              <Bar dataKey="phoneMid" stackId="a" fill="#6366f1" name="Phone" radius={[0, 0, 0, 0]} />
              <Bar dataKey="quickMid" stackId="a" fill="#a78bfa" name="Quick tickets" radius={[0, 0, 0, 0]} />
              <Bar dataKey="ticketMid" stackId="a" fill="#0891b2" name="Tickets" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Remaining Capacity chart */}
      <div className="dashboard-section">
        <div className="section-header">🔋 Remaining Capacity Per Agent</div>
        <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 8 }}>
          Based on {fmt(periodCapacity)} net capacity per agent ({workingDays} working days × {capacity.netMinutesPerDay}m/day, Mon–Fri)
        </div>
        <div className="chart-card">
          <ResponsiveContainer width="100%" height={Math.max(200, agentCount * 48 + 40)}>
            <BarChart data={capacityChartData} layout="vertical" margin={{ top: 4, right: 64, left: 10, bottom: 4 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 11 }} tickFormatter={v => fmt(v)} width={56} />
              <YAxis dataKey="name" type="category" tick={{ fontSize: 12 }} width={72} />
              <Tooltip content={<CapacityTooltip netMinPerDay={netMinutesPerDay} periodCapacity={periodCapacity} />} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar dataKey="workload" stackId="c" fill="#6366f1" name="Workload" radius={[0, 0, 0, 0]} label={{ position: 'insideLeft', fontSize: 10, fill: 'white', formatter: v => v > 60 ? fmt(v) : '' }} />
              <Bar dataKey="remaining" stackId="c" fill="#d1fae5" name="Remaining" radius={[0, 3, 3, 0]} label={{ position: 'right', fontSize: 11, fill: 'var(--success)', formatter: v => v > 0 ? fmt(v) : '' }} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 8, paddingLeft: 4 }}>
          Team remaining: <strong style={{ color: 'var(--success)' }}>{fmt(Math.max(0, teamCapacity - teamTotalMid))}</strong> of <strong>{fmt(teamCapacity)}</strong> total
        </div>
      </div>

      {/* Daily Activity */}
      {dailyChartData.length > 0 && (
        <div className="dashboard-section">
          <div className="section-header">📅 Daily Activity Breakdown</div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 8 }}>
            Calls answered and tickets created per calendar day
          </div>
          <div className="chart-card">
            <ResponsiveContainer width="100%" height={280}>
              <ComposedChart data={dailyChartData} margin={{ top: 4, right: 16, left: -10, bottom: 40 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="date" tick={{ fontSize: 10 }} angle={-45} textAnchor="end" interval={0} tickFormatter={fmtDate} />
                <YAxis yAxisId="left" tick={{ fontSize: 11 }} allowDecimals={false} />
                <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11 }} allowDecimals={false} />
                <Tooltip labelFormatter={fmtDate} formatter={(v, name) => [v, name]} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar yAxisId="left" dataKey="calls" fill="#6366f1" name="Calls answered" radius={[2, 2, 0, 0]} />
                <Bar yAxisId="right" dataKey="tickets" fill="#0891b2" name="Tickets created" radius={[2, 2, 0, 0]} opacity={0.8} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* On-Call vs Office Hours */}
      {showOnCallSection && (
        <div className="dashboard-section">
          <div className="section-header">🌙 On-Call vs Office Hours Workload</div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 12 }}>
            Office hours: {TEAM_CONFIG.workStartHour}:00–{TEAM_CONFIG.workEndHour}:00
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>

            {phoneHasOfficeHoursData && (
              <div className="chart-card" style={{ padding: 16 }}>
                <div className="chart-title" style={{ marginBottom: 12 }}>📞 Phone Calls</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div style={{ textAlign: 'center', padding: 12, background: 'var(--bg)', borderRadius: 6 }}>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>Office Hours</div>
                    <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--primary)' }}>{phoneOfficeHoursCalls}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>calls · {fmt(phoneOfficeHoursDuration / 60)}</div>
                  </div>
                  <div style={{ textAlign: 'center', padding: 12, background: 'var(--bg)', borderRadius: 6 }}>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>On-Call</div>
                    <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--warning)' }}>{phoneOnCallCalls}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>calls · {fmt(phoneOnCallDuration / 60)}</div>
                  </div>
                </div>
                {(phoneOfficeHoursCalls + phoneOnCallCalls) > 0 && (
                  <div style={{ marginTop: 10 }}>
                    <div style={{ height: 8, background: 'var(--border)', borderRadius: 4, overflow: 'hidden', display: 'flex' }}>
                      <div style={{ width: `${Math.round(phoneOfficeHoursCalls / (phoneOfficeHoursCalls + phoneOnCallCalls) * 100)}%`, background: 'var(--primary)', borderRadius: '4px 0 0 4px' }} />
                      <div style={{ flex: 1, background: 'var(--warning)', borderRadius: '0 4px 4px 0' }} />
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
                      <span>{Math.round(phoneOfficeHoursCalls / (phoneOfficeHoursCalls + phoneOnCallCalls) * 100)}% office hours</span>
                      <span>{Math.round(phoneOnCallCalls / (phoneOfficeHoursCalls + phoneOnCallCalls) * 100)}% on-call</span>
                    </div>
                  </div>
                )}
              </div>
            )}

            {officeHoursStats?.hasOfficeHoursData && (
              <div className="chart-card" style={{ padding: 16 }}>
                <div className="chart-title" style={{ marginBottom: 12 }}>🎫 Jira Tickets</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 8 }}>Created</div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                      <div style={{ textAlign: 'center', padding: 8, background: 'var(--bg)', borderRadius: 6 }}>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Office</div>
                        <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--primary)' }}>{officeHoursStats.officeHoursCreated}</div>
                      </div>
                      <div style={{ textAlign: 'center', padding: 8, background: 'var(--bg)', borderRadius: 6 }}>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>On-Call</div>
                        <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--warning)' }}>{officeHoursStats.onCallCreated}</div>
                      </div>
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 8 }}>Resolved</div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                      <div style={{ textAlign: 'center', padding: 8, background: 'var(--bg)', borderRadius: 6 }}>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Office</div>
                        <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--success)' }}>{officeHoursStats.officeHoursResolved}</div>
                      </div>
                      <div style={{ textAlign: 'center', padding: 8, background: 'var(--bg)', borderRadius: 6 }}>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>On-Call</div>
                        <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--warning)' }}>{officeHoursStats.onCallResolved}</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

          </div>
        </div>
      )}

      {/* Per-Agent Table */}
      <div className="dashboard-section">
        <div className="section-header">📋 Agent Workload Breakdown</div>
        <div className="data-table-wrapper" style={{ overflowX: 'auto' }}>
          <table className="data-table workload-table">
            <thead>
              <tr>
                <th>Agent</th>
                <th>Data</th>
                <th className="number">Answered calls</th>
                <th className="number">Phone time</th>
                <th className="number">Quick tickets</th>
                <th className="number">Quick time</th>
                <th className="number">Qualifying tickets</th>
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
                const pct = periodCapacity > 0 ? (wl.totalMid / periodCapacity) * 100 : 0
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
                    <td className="number">{fmt(wl.phoneTotalMid)}</td>
                    <td className="number" style={{ color: '#7c3aed' }}>{jiraStats ? wl.quickCount : '—'}</td>
                    <td className="number" style={{ color: '#7c3aed' }}>{jiraStats ? fmt(wl.quickTotalMid) : '—'}</td>
                    <td className="number">{jiraStats ? wl.ticketCount : '—'}</td>
                    <td className="number">{fmt(wl.ticketTotalMid)}</td>
                    <td className="number">{wl.avgResolveTimeMinutes != null ? formatMinutes(wl.avgResolveTimeMinutes) : '—'}</td>
                    <td className="number" style={{ color: 'var(--text-muted)', fontSize: 12 }}>{fmt(wl.totalLow)}</td>
                    <td className="number" style={{ fontWeight: 600 }}>{fmt(wl.totalMid)}</td>
                    <td className="number" style={{ color: 'var(--text-muted)', fontSize: 12 }}>{fmt(wl.totalHigh)}</td>
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
          % = mid estimate vs {fmt(periodCapacity)} net capacity ({workingDays} Mon–Fri days × {capacity.netMinutesPerDay}m/day)
        </div>
      </div>
    </div>
  )
}
