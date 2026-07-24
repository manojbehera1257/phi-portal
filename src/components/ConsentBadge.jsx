import React from 'react'

export function ConsentBadge({ status }) {
  const config = {
    granted:  { color: '#27ae60', bg: '#eafaf1', label: 'Granted',  dot: '●' },
    revoked:  { color: '#e74c3c', bg: '#fdf0f0', label: 'Revoked',  dot: '●' },
    pending:  { color: '#f39c12', bg: '#fef9e7', label: 'Pending',  dot: '●' },
    withdrawn:{ color: '#95a5a6', bg: '#f8f9fa', label: 'Withdrawn',dot: '●' },
  }
  const c = config[status] || config.pending

  return (
    <span style={{
      display:      'inline-flex',
      alignItems:   'center',
      gap:          4,
      padding:      '2px 10px',
      borderRadius: 12,
      fontSize:     12,
      fontWeight:   600,
      color:        c.color,
      background:   c.bg,
      border:       `1px solid ${c.color}33`,
    }}>
      <span style={{ fontSize: 8 }}>{c.dot}</span>
      {c.label}
    </span>
  )
}
