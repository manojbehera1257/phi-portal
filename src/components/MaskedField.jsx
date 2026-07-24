// =============================================================================
// MaskedField — The core DPDP enforcement component
// Shows real data when consent is granted, masked value when revoked
// Animates the transition so the masking is visually obvious in the demo
// =============================================================================

import React, { useState, useEffect } from 'react'

const MASK_PATTERNS = {
  T4: '[REDACTED — Consent Required]',
  T3: '[MASKED]',
  T2: '***',
}

export function MaskedField({ value, purposeId, tier = 'T4', hasConsent, label }) {
  const [prevConsent, setPrevConsent] = useState(hasConsent)
  const [flash, setFlash] = useState(null)  // 'masking' | 'unmasking' | null

  // Detect consent change and flash the field
  useEffect(() => {
    if (prevConsent !== hasConsent) {
      setFlash(hasConsent ? 'unmasking' : 'masking')
      setTimeout(() => setFlash(null), 1500)
      setPrevConsent(hasConsent)
    }
  }, [hasConsent, prevConsent])

  const displayValue = hasConsent ? value : (MASK_PATTERNS[tier] || '[REDACTED]')
  const isEmpty = !value || value === '' || value === null

  if (isEmpty) return <span style={{ color: '#999' }}>—</span>

  return (
    <span style={{
      display:        'inline-block',
      padding:        '2px 8px',
      borderRadius:   4,
      fontSize:       13,
      fontWeight:     hasConsent ? 400 : 500,
      background:     flash === 'masking'   ? '#fff3cd' :
                      flash === 'unmasking' ? '#d4edda' :
                      hasConsent            ? 'transparent' : '#fff0f0',
      color:          hasConsent ? '#1a1a1a' : '#c0392b',
      border:         hasConsent ? 'none' : '1px solid #f5c6cb',
      transition:     'all 0.4s ease',
      fontFamily:     hasConsent ? 'inherit' : 'monospace',
    }}>
      {displayValue}
      {!hasConsent && (
        <span style={{ marginLeft: 6, fontSize: 10, opacity: 0.7 }}>
          🔒
        </span>
      )}
    </span>
  )
}
