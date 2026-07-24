import React, { useState } from 'react'
import { ConsentBadge } from '../components/ConsentBadge'

const SUPABASE_URL      = import.meta.env.VITE_SUPABASE_URL
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY

const PURPOSES = [
  {
    id:          'purpose_001',
    name:        'Claims & Policy Administration',
    description: 'Processing your insurance claims, managing your policy, premium collection and regulatory compliance. This is required to provide you insurance services.',
    legal_basis: 'Legal obligation — DPDP Act 2023 S.4(1)',
    mandatory:   true,
    icon:        '🏛️',
    affects:     ['Policy documents', 'Premium receipts', 'Claim processing'],
  },
  {
    id:          'purpose_002',
    name:        'Medical Data Sharing with Providers',
    description: 'Sharing your diagnosis, treatment history and medical records with empanelled hospitals, clinics and specialist providers for cashless treatment.',
    legal_basis: 'Consent — DPDP Act 2023 S.6(1)',
    mandatory:   false,
    icon:        '🩺',
    affects:     ['ICD-10 diagnosis codes', 'Treatment summaries', 'Procedure codes', 'Visit notes', 'Hospital FHIR feeds'],
    warning:     'Revoking this will mask your medical data from all healthcare providers and TPA systems.',
  },
  {
    id:          'purpose_003',
    name:        'Marketing & Personalised Communications',
    description: 'Sending policy renewal reminders, health tips, new product offers and cross-sell communications via email, SMS and WhatsApp.',
    legal_basis: 'Consent — DPDP Act 2023 S.6(1)',
    mandatory:   false,
    icon:        '📣',
    affects:     ['Email communications', 'SMS alerts', 'WhatsApp messages', 'Product recommendations'],
  },
  {
    id:          'purpose_004',
    name:        'Analytics & Actuarial Profiling',
    description: 'Using anonymised or pseudonymised data for risk modelling, pricing analysis, fraud detection and improving our products.',
    legal_basis: 'Consent — DPDP Act 2023 S.6(1)',
    mandatory:   false,
    icon:        '📊',
    affects:     ['Risk scoring', 'Premium calculations', 'Fraud detection models', 'Product improvement'],
  },
  {
    id:          'purpose_005',
    name:        'Third Party Administrator (TPA) Data Sharing',
    description: 'Sharing your health data with our authorised TPA partners for claims processing, pre-authorisation and network hospital coordination.',
    legal_basis: 'Consent — DPDP Act 2023 S.6(1)',
    mandatory:   false,
    icon:        '🤝',
    affects:     ['Vidal Health TPA', 'Medi Assist TPA', 'Cashless pre-authorisation', 'Claims settlement'],
    warning:     'Revoking this will prevent cashless treatment at network hospitals.',
  },
]

export default function ConsentCentre({ member, consent, hasConsent, onConsentChange }) {
  const [toggling,      setToggling]      = useState(null)   // purpose_id being toggled
  const [lastResult,    setLastResult]    = useState(null)   // last enforcement result
  const [confirmRevoke, setConfirmRevoke] = useState(null)   // purpose to confirm revoke

  async function handleToggle(purposeId, currentStatus) {
    const newStatus = currentStatus === 'granted' ? 'revoked' : 'granted'

    // Show confirmation for revocations with warnings
    const purpose = PURPOSES.find(p => p.id === purposeId)
    if (newStatus === 'revoked' && purpose?.warning && !confirmRevoke) {
      setConfirmRevoke({ purposeId, purpose, newStatus })
      return
    }

    setConfirmRevoke(null)
    setToggling(purposeId)
    setLastResult(null)

    try {
      const res = await fetch(
        `${SUPABASE_URL}/functions/v1/consent-enforcement`,
        {
          method:  'POST',
          headers: {
            'Content-Type':  'application/json',
            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          },
          body: JSON.stringify({
            event_type:   newStatus === 'revoked' ? 'consent_revoke' : 'consent_grant',
            member_id:    member.member_id,
            purpose_id:   purposeId,
            new_status:   newStatus,
            triggered_by: 'customer_portal',
            change_reason:`Customer portal toggle — ${newStatus}`,
          }),
        }
      )

      const data = await res.json()
      setLastResult(data)

      if (data.success) {
        // Notify parent to refresh consent state
        if (onConsentChange) onConsentChange(purposeId, newStatus)
      }
    } catch (err) {
      setLastResult({ success: false, error: err.message })
    } finally {
      setToggling(null)
    }
  }

  return (
    <div style={{ padding: '28px 32px', maxWidth: 800 }}>

      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: '#1B3A6B' }}>Consent Centre</h1>
        <p style={{ color: '#666', fontSize: 13, marginTop: 4 }}>
          Manage how PHI Health Insurance uses your personal data. Changes take effect immediately.
          All actions are logged under DPDP Act 2023.
        </p>
      </div>

      {/* Live enforcement result banner */}
      {lastResult && (
        <div style={{
          background: lastResult.success ? '#eafaf1' : '#fdf0f0',
          border:     `1px solid ${lastResult.success ? '#27ae60' : '#e74c3c'}44`,
          borderRadius: 10, padding: '14px 18px', marginBottom: 24,
        }}>
          {lastResult.success ? (
            <div>
              <div style={{ fontWeight: 700, color: '#1B3A6B', fontSize: 14, marginBottom: 6 }}>
                ✅ Consent updated — {lastResult.enforcement_summary?.total_actions} enforcement actions fired in {lastResult.execution_ms}ms
              </div>
              <div style={{ fontSize: 13, color: '#555' }}>
                {lastResult.enforcement_summary?.t4_columns_affected} special category columns enforced across {lastResult.enforcement_summary?.systems_affected?.length} system(s).
              </div>
              <div style={{ fontSize: 12, color: '#888', marginTop: 6, fontStyle: 'italic' }}>
                {lastResult.dpdp_note}
              </div>
            </div>
          ) : (
            <div style={{ color: '#e74c3c', fontWeight: 600, fontSize: 13 }}>
              ❌ Error: {lastResult.error}
            </div>
          )}
        </div>
      )}

      {/* Confirmation modal */}
      {confirmRevoke && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: '#fff', borderRadius: 16, padding: 32, maxWidth: 440, margin: 24, boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>
            <div style={{ fontSize: 36, marginBottom: 12 }}>⚠️</div>
            <h3 style={{ fontSize: 18, fontWeight: 700, color: '#1B3A6B', marginBottom: 8 }}>Revoke consent?</h3>
            <p style={{ fontSize: 14, color: '#555', marginBottom: 12, lineHeight: 1.6 }}>
              <strong>{confirmRevoke.purpose.name}</strong>
            </p>
            <p style={{ fontSize: 13, color: '#e74c3c', background: '#fdf0f0', padding: '10px 14px', borderRadius: 8, marginBottom: 20, lineHeight: 1.5 }}>
              {confirmRevoke.purpose.warning}
            </p>
            <div style={{ display: 'flex', gap: 12 }}>
              <button onClick={() => setConfirmRevoke(null)}
                style={{ flex: 1, padding: '10px', border: '1px solid #ddd', borderRadius: 8, background: '#fff', cursor: 'pointer', fontWeight: 600, color: '#555' }}>
                Cancel
              </button>
              <button onClick={() => handleToggle(confirmRevoke.purposeId, 'granted')}
                style={{ flex: 1, padding: '10px', border: 'none', borderRadius: 8, background: '#e74c3c', cursor: 'pointer', fontWeight: 600, color: '#fff' }}>
                Yes, Revoke
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Purpose cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {PURPOSES.map(purpose => {
          const status    = consent[purpose.id] || 'pending'
          const granted   = status === 'granted'
          const isLoading = toggling === purpose.id

          return (
            <div key={purpose.id} style={{
              background:   '#fff',
              borderRadius: 12,
              padding:      '20px 24px',
              boxShadow:    '0 2px 8px rgba(0,0,0,0.06)',
              border:       `1px solid ${granted ? '#27ae6022' : purpose.mandatory ? '#1B3A6B22' : '#e74c3c22'}`,
              transition:   'all 0.3s ease',
            }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>

                {/* Icon */}
                <div style={{ fontSize: 28, width: 48, height: 48, background: '#f0f4f8', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  {purpose.icon}
                </div>

                {/* Content */}
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                    <span style={{ fontSize: 15, fontWeight: 700, color: '#1B3A6B' }}>{purpose.name}</span>
                    {purpose.mandatory && (
                      <span style={{ fontSize: 10, background: '#e8f4fd', color: '#1B3A6B', padding: '2px 8px', borderRadius: 4, fontWeight: 700, textTransform: 'uppercase' }}>
                        Mandatory
                      </span>
                    )}
                    <ConsentBadge status={status} />
                  </div>

                  <p style={{ fontSize: 13, color: '#555', lineHeight: 1.6, marginBottom: 10 }}>{purpose.description}</p>

                  <div style={{ fontSize: 11, color: '#888', marginBottom: 12 }}>
                    <span style={{ fontWeight: 600 }}>Legal basis: </span>{purpose.legal_basis}
                  </div>

                  {/* What this covers */}
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 12 }}>
                    {purpose.affects.map(a => (
                      <span key={a} style={{ fontSize: 11, padding: '3px 8px', borderRadius: 4, background: '#f0f4f8', color: '#555' }}>{a}</span>
                    ))}
                  </div>

                  {/* Toggle */}
                  {!purpose.mandatory ? (
                    <button
                      onClick={() => handleToggle(purpose.id, status)}
                      disabled={isLoading}
                      style={{
                        display:       'flex',
                        alignItems:    'center',
                        gap:           8,
                        padding:       '8px 18px',
                        borderRadius:  8,
                        border:        'none',
                        cursor:        isLoading ? 'wait' : 'pointer',
                        fontWeight:    600,
                        fontSize:      13,
                        background:    granted ? '#fdf0f0' : '#eafaf1',
                        color:         granted ? '#e74c3c'  : '#27ae60',
                        transition:    'all 0.2s',
                        opacity:       isLoading ? 0.7 : 1,
                      }}
                    >
                      {isLoading ? (
                        <>⏳ Processing...</>
                      ) : granted ? (
                        <>🔓 Revoke Consent</>
                      ) : (
                        <>✅ Grant Consent</>
                      )}
                    </button>
                  ) : (
                    <div style={{ fontSize: 12, color: '#888', fontStyle: 'italic' }}>
                      🔒 This consent cannot be revoked — it is required for your insurance policy to function.
                    </div>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* DPDP footer */}
      <div style={{ marginTop: 32, padding: '16px 20px', background: '#f8f9fa', borderRadius: 10, fontSize: 12, color: '#888', lineHeight: 1.6 }}>
        <strong style={{ color: '#555' }}>Your rights under DPDP Act 2023:</strong> You have the right to access your data (S.11),
        correct inaccurate data (S.12), erase your data (S.12), and withdraw consent at any time (S.6).
        All consent changes are logged and audited. Contact our Data Protection Officer at dpo@phi-health.in
      </div>
    </div>
  )
}
