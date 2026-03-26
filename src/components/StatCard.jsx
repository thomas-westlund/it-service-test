import React from 'react'

const styles = {
  card: {
    background: '#ffffff',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius)',
    padding: '20px',
    boxShadow: 'var(--shadow)',
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  title: {
    fontSize: '12px',
    fontWeight: '600',
    color: 'var(--text-secondary)',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  },
  value: {
    fontSize: '28px',
    fontWeight: '700',
    lineHeight: '1.1',
    marginTop: '4px',
  },
  subtitle: {
    fontSize: '12px',
    color: 'var(--text-muted)',
    marginTop: '2px',
  },
  indicator: {
    width: '4px',
    borderRadius: '4px',
    alignSelf: 'stretch',
    minHeight: '40px',
    flexShrink: 0,
  },
}

export default function StatCard({ title, value, subtitle, color = 'var(--primary)' }) {
  return (
    <div style={styles.card}>
      <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
        <div style={{ ...styles.indicator, background: color }} />
        <div style={{ flex: 1 }}>
          <div style={styles.title}>{title}</div>
          <div style={{ ...styles.value, color }}>{value}</div>
          {subtitle && <div style={styles.subtitle}>{subtitle}</div>}
        </div>
      </div>
    </div>
  )
}
