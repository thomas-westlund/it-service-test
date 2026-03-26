import React, { useMemo } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { calculateAgentWorkload, computeCapacity, TEAM_CONFIG, WORKLOAD_DEFAULTS, formatMinutes } from '../utils/workloadCalc'
import { formatPeriodLabel } from '../utils/historyStorage'
import './MonthComparison.css'

function shortenName(name) {
  const parts = name.split(' ')
  return parts.length >= 2 ? `${parts[0]} ${parts[1][0]}.` : name
}

function delta(a, b) {
  if (a == null || b == null) return null
  return a - b
}

function DeltaBadge({ value, unit = '', invert = false }) {
  if (value == null) return <span style={{ color: 'var(--text-muted)' }}>—</span>
  const positive = invert ? value < 0 : value > 0
  const color = positive ? 'var(--danger)' : 'var(--success)'
  const sign = value > 0 ? '+' : ''
  if (value === 0) return <span style={{ color: 'var(--text-muted)' }}>±0{unit}</span>
  return <span style={{ color, fontWeight: 600, fontSize: 11 }}>{sign}{Math.round(value)}{unit}</span>
}

function buildAgentWorkloads(phoneData, jiraData) {
  const phoneMap = {}
  if (phoneData) phoneData.forEach(a => { phoneMap[a.agent.toLowerCase()] = a })

  const jiraMap = {}
  if (jiraData?.byAssignee) {
    Object.entries(jiraData.byAssignee).forEach(([name, stats]) => {
      jiraMap[name.toLowerCase()] = { name, stats }
    })
  }

  const allNames = new Set([...Object.keys(phoneMap), ...Object.keys(jiraMap)])
  const result = {}
  Array.from(allNames).forEach(key => {
    const phone = phoneMap[key] || null
    const jiraEntry = jiraMap[key] || null
    const displayName = phone?.agent || jiraEntry?.name || key
    const wl = calculateAgentWorkload(phone, jiraEntry?.stats, WORKLOAD_DEFAULTS)
    result[displayName.toLowerCase()] = { displayName, phone, jiraStats: jiraEntry?.stats || null, wl }
  })
  return result
}

export default function MonthComparison({ currentPeriod, currentPhone, currentJira, comparePeriod, comparePhone, compareJira }) {
  const capacity = useMemo(() => computeCapacity(TEAM_CONFIG), [])
  const monthlyNetMinutes = capacity.netMinutesPerDay * 21

  const currentWls = useMemo(() => buildAgentWorkloads(currentPhone, currentJira), [currentPhone, currentJira])
  const compareWls = useMemo(() => buildAgentWorkloads(comparePhone, compareJira), [comparePhone, compareJira])

  // All agent names from both periods
  const allAgents = useMemo(() => {
    const names = new Set([...Object.keys(currentWls), ...Object.keys(compareWls)])
    return Array.from(names).map(key => {
      const cur = currentWls[key]
      const cmp = compareWls[key]
      const displayName = cur?.displayName || cmp?.displayName || key
      return { key, displayName, cur, cmp }
    }).sort((a, b) => {
      const aTotal = (a.cur?.wl.totalMid || 0) + (a.cmp?.wl.totalMid || 0)
      const bTotal = (b.cur?.wl.totalMid || 0) + (b.cmp?.wl.totalMid || 0)
      return bTotal - aTotal
    })
  }, [currentWls, compareWls])

  // Summary metrics
  const curTotalCalls = currentPhone?.reduce((s, a) => s + a.totalCalls, 0) ?? 0
  const cmpTotalCalls = comparePhone?.reduce((s, a) => s + a.totalCalls, 0) ?? 0

  const curTotalTickets = currentJira
    ? Object.values(currentJira.byAssignee).reduce((s, a) => s + a.totalTickets, 0)
    : null
  const cmpTotalTickets = compareJira
    ? Object.values(compareJira.byAssignee).reduce((s, a) => s + a.totalTickets, 0)
    : null

  const curQuick = currentJira?.totalQuickResolved ?? null
  const cmpQuick = compareJira?.totalQuickResolved ?? null

  const curWorkloadMid = Object.values(currentWls).reduce((s, r) => s + r.wl.totalMid, 0)
  const cmpWorkloadMid = Object.values(compareWls).reduce((s, r) => s + r.wl.totalMid, 0)

  const curAvgResolve = currentJira?.avgResolveTimeMinutes ?? null
  const cmpAvgResolve = compareJira?.avgResolveTimeMinutes ?? null

  // Chart data: per-agent workload comparison
  const chartData = allAgents.map(({ displayName, cur, cmp }) => ({
    name: shortenName(displayName),
    [formatPeriodLabel(currentPeriod)]: Math.round(cur?.wl.totalMid || 0),
    [formatPeriodLabel(comparePeriod)]: Math.round(cmp?.wl.totalMid || 0),
  }))

  const curLabel = formatPeriodLabel(currentPeriod)
  const cmpLabel = formatPeriodLabel(comparePeriod)

  return (
    <div className="month-comparison">

      {/* Period header */}
      <div className="comparison-header">
        <div className="comparison-period current">
          <div className="period-badge current">Current</div>
          <div className="period-name">{curLabel}</div>
        </div>
        <div className="comparison-vs">vs</div>
        <div className="comparison-period compare">
          <div className="period-badge compare">Historical</div>
          <div className="period-name">{cmpLabel}</div>
        </div>
      </div>

      {/* Summary comparison cards */}
      <div className="dashboard-section" style={{ marginTop: 0 }}>
        <div className="section-header">📊 Period Overview</div>
        <div className="comparison-cards">
          <div className="comparison-card">
            <div className="cc-label">Total Calls</div>
            <div className="cc-row">
              <div className="cc-value current">{curTotalCalls.toLocaleString()}</div>
              <DeltaBadge value={delta(curTotalCalls, cmpTotalCalls)} unit="" invert={false} />
              <div className="cc-value compare">{cmpTotalCalls.toLocaleString()}</div>
            </div>
          </div>
          <div className="comparison-card">
            <div className="cc-label">Total Tickets</div>
            <div className="cc-row">
              <div className="cc-value current">{curTotalTickets ?? '—'}</div>
              <DeltaBadge value={delta(curTotalTickets, cmpTotalTickets)} unit="" invert={false} />
              <div className="cc-value compare">{cmpTotalTickets ?? '—'}</div>
            </div>
          </div>
          <div className="comparison-card">
            <div className="cc-label">Quick-Resolved (excl.)</div>
            <div className="cc-row">
              <div className="cc-value current">{curQuick ?? '—'}</div>
              <DeltaBadge value={delta(curQuick, cmpQuick)} unit="" invert={false} />
              <div className="cc-value compare">{cmpQuick ?? '—'}</div>
            </div>
          </div>
          <div className="comparison-card">
            <div className="cc-label">Avg Resolve Time</div>
            <div className="cc-row">
              <div className="cc-value current">{curAvgResolve != null ? formatMinutes(curAvgResolve) : '—'}</div>
              <DeltaBadge value={curAvgResolve != null && cmpAvgResolve != null ? Math.round(delta(curAvgResolve, cmpAvgResolve)) : null} unit="m" invert={true} />
              <div className="cc-value compare">{cmpAvgResolve != null ? formatMinutes(cmpAvgResolve) : '—'}</div>
            </div>
          </div>
          <div className="comparison-card">
            <div className="cc-label">Team Workload (mid)</div>
            <div className="cc-row">
              <div className="cc-value current">{formatMinutes(curWorkloadMid)}</div>
              <DeltaBadge value={Math.round(delta(curWorkloadMid, cmpWorkloadMid))} unit="m" invert={true} />
              <div className="cc-value compare">{formatMinutes(cmpWorkloadMid)}</div>
            </div>
          </div>
          <div className="comparison-card">
            <div className="cc-label">Net Capacity/month</div>
            <div className="cc-row">
              <div className="cc-value neutral">{formatMinutes(monthlyNetMinutes)}</div>
              <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>same</span>
              <div className="cc-value neutral">{formatMinutes(monthlyNetMinutes)}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Workload chart */}
      <div className="dashboard-section">
        <div className="section-header">📈 Workload Per Agent — Side by Side</div>
        <div className="chart-card">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData} margin={{ top: 4, right: 8, left: -10, bottom: 40 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} angle={-30} textAnchor="end" interval={0} />
              <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `${v}m`} />
              <Tooltip formatter={(v, name) => [`${v}m`, name]} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar dataKey={curLabel} fill="#1a56db" radius={[3, 3, 0, 0]} />
              <Bar dataKey={cmpLabel} fill="#9ca3af" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Per-agent comparison table */}
      <div className="dashboard-section">
        <div className="section-header">📋 Agent Comparison</div>
        <div className="data-table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th rowSpan={2}>Agent</th>
                <th colSpan={3} className="col-group current-group">Calls</th>
                <th colSpan={3} className="col-group compare-group">Calls</th>
                <th colSpan={3} className="col-group current-group">Tickets</th>
                <th colSpan={3} className="col-group compare-group">Tickets</th>
                <th colSpan={2} className="col-group workload-group">Workload (mid)</th>
              </tr>
              <tr>
                <th className="number sub current-group">{curLabel.split(' ')[0]}</th>
                <th className="number sub current-group">Phone</th>
                <th className="number sub current-group">Tkt wk</th>
                <th className="number sub compare-group">{cmpLabel.split(' ')[0]}</th>
                <th className="number sub compare-group">Phone</th>
                <th className="number sub compare-group">Tkt wk</th>
                <th className="number sub current-group">Qualifying</th>
                <th className="number sub current-group">Quick excl.</th>
                <th className="number sub current-group">Avg resolve</th>
                <th className="number sub compare-group">Qualifying</th>
                <th className="number sub compare-group">Quick excl.</th>
                <th className="number sub compare-group">Avg resolve</th>
                <th className="number sub current-group">{curLabel.split(' ')[0]}</th>
                <th className="number sub compare-group">{cmpLabel.split(' ')[0]}</th>
              </tr>
            </thead>
            <tbody>
              {allAgents.map(({ displayName, cur, cmp }) => {
                const wlDelta = delta(
                  cur?.wl.totalMid ?? null,
                  cmp?.wl.totalMid ?? null
                )
                return (
                  <tr key={displayName}>
                    <td className="agent-name">{displayName}</td>
                    {/* Current calls */}
                    <td className="number">{cur?.phone?.totalCalls ?? '—'}</td>
                    <td className="number">{cur ? formatMinutes(cur.wl.phoneTotalMid) : '—'}</td>
                    <td className="number">{cur ? formatMinutes(cur.wl.ticketTotalMid) : '—'}</td>
                    {/* Compare calls */}
                    <td className="number" style={{ color: 'var(--text-secondary)' }}>{cmp?.phone?.totalCalls ?? '—'}</td>
                    <td className="number" style={{ color: 'var(--text-secondary)' }}>{cmp ? formatMinutes(cmp.wl.phoneTotalMid) : '—'}</td>
                    <td className="number" style={{ color: 'var(--text-secondary)' }}>{cmp ? formatMinutes(cmp.wl.ticketTotalMid) : '—'}</td>
                    {/* Current tickets */}
                    <td className="number">{cur?.jiraStats?.qualifyingTickets ?? '—'}</td>
                    <td className="number" style={{ color: 'var(--text-muted)' }}>{cur?.wl.quickCount ?? '—'}</td>
                    <td className="number">{cur?.wl.avgResolveTimeMinutes != null ? formatMinutes(cur.wl.avgResolveTimeMinutes) : '—'}</td>
                    {/* Compare tickets */}
                    <td className="number" style={{ color: 'var(--text-secondary)' }}>{cmp?.jiraStats?.qualifyingTickets ?? '—'}</td>
                    <td className="number" style={{ color: 'var(--text-muted)' }}>{cmp?.wl.quickCount ?? '—'}</td>
                    <td className="number" style={{ color: 'var(--text-secondary)' }}>{cmp?.wl.avgResolveTimeMinutes != null ? formatMinutes(cmp.wl.avgResolveTimeMinutes) : '—'}</td>
                    {/* Workload */}
                    <td className="number" style={{ fontWeight: 600 }}>{cur ? formatMinutes(cur.wl.totalMid) : '—'}</td>
                    <td className="number" style={{ color: 'var(--text-secondary)' }}>
                      {cmp ? formatMinutes(cmp.wl.totalMid) : '—'}
                      {wlDelta != null && (
                        <span style={{ marginLeft: 4 }}>
                          <DeltaBadge value={Math.round(wlDelta)} unit="m" invert={true} />
                        </span>
                      )}
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
