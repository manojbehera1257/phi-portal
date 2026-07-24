import React, { useState, useEffect } from 'react'
import { supabase } from '../supabaseClient'
import { MaskedField } from '../components/MaskedField'

const STATUS_COLOR = {
  paid:               { bg: '#eafaf1', color: '#27ae60', label: 'Paid' },
  approved:           { bg: '#eaf4fb', color: '#2980b9', label: 'Approved' },
  under_review:       { bg: '#fef9e7', color: '#f39c12', label: 'Under Review' },
  rejected:           { bg: '#fdf0f0', color: '#e74c3c', label: 'Rejected' },
  registered:         { bg: '#f8f9fa', color: '#6c757d', label: 'Registered' },
  documents_pending:  { bg: '#fff3e0', color: '#e67e22', label: 'Docs Pending' },
}

export default function MyClaims({ member, hasConsent, lastChanged }) {
  const [claims,     setClaims]     = useState([])
  const [diagnoses,  setDiagnoses]  = useState({})   // claim_id → [diagnoses]
  const [services,   setServices]   = useState({})   // claim_id → [services]
  const [expanded,   setExpanded]   = useState(null)
  const [loading,    setLoading]    = useState(true)

  // Medical data consent
  const medicalConsent = hasConsent('purpose_002')

  useEffect(() => {
    if (!member?.member_id) return
    async function load() {
      // Load claims via RPC
      const { data: claimsData, error: claimsError } = await supabase
        .rpc('phi_get_member_claims', { p_member_id: member.member_id })
      if (claimsError) console.error('Claims load error:', claimsError.message)

      if (claimsData) {
        setClaims(claimsData)

        const ids = claimsData.map(c => c.claim_id)

        const { data: diagData } = await supabase
          .rpc('phi_get_claim_diagnoses', { p_member_id: member.member_id })

        const { data: svcData } = await supabase
          .rpc('phi_get_claim_services', { p_member_id: member.member_id })

        // Group by claim_id
        const diagMap = {}
        const svcMap  = {}
        diagData?.forEach(d => {
          if (!diagMap[d.claim_id]) diagMap[d.claim_id] = []
          diagMap[d.claim_id].push(d)
        })
        svcData?.forEach(s => {
          if (!svcMap[s.claim_id]) svcMap[s.claim_id] = []
          svcMap[s.claim_id].push(s)
        })

        setDiagnoses(diagMap)
        setServices(svcMap)
      }
      setLoading(false)
    }
    load()
  }, [member])

  if (loading) return <div style={{ padding: 40, color: '#999' }}>Loading claims...</div>

  return (
    <div style={{ padding: '28px 32px', maxWidth: 900 }}>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: '#1B3A6B' }}>My Claims</h1>
          <p style={{ color: '#888', fontSize: 13, marginTop: 2 }}>{claims.length} claim{claims.length !== 1 ? 's' : ''} found</p>
        </div>

        {/* Live consent indicator for medical data */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8,
          padding: '8px 14px', borderRadius: 20,
          background: medicalConsent ? '#eafaf1' : '#fdf0f0',
          border: `1px solid ${medicalConsent ? '#27ae6044' : '#e74c3c44'}`,
        }}>
          <span style={{ fontSize: 10, color: medicalConsent ? '#27ae60' : '#e74c3c' }}>●</span>
          <span style={{ fontSize: 12, fontWeight: 600, color: medicalConsent ? '#27ae60' : '#e74c3c' }}>
            Medical Data: {medicalConsent ? 'Visible' : 'Masked'}
          </span>
          {lastChanged?.purpose_id === 'purpose_002' && (
            <span style={{ fontSize: 11, color: '#888', marginLeft: 4 }}>
              · just changed
            </span>
          )}
        </div>
      </div>

      {!medicalConsent && (
        <div style={{ background: '#fdf0f0', border: '1px solid #f5c6cb', borderRadius: 10, padding: '14px 18px', marginBottom: 20, display: 'flex', gap: 10 }}>
          <span style={{ fontSize: 18 }}>🔒</span>
          <div>
            <div style={{ fontWeight: 600, color: '#c0392b', fontSize: 14 }}>Medical data is restricted</div>
            <div style={{ color: '#c0392b', fontSize: 13, marginTop: 2 }}>
              You have revoked consent for Medical Data Sharing (purpose_002). Diagnosis codes, treatment summaries and procedure details are masked. Go to Consent Centre to restore access.
            </div>
          </div>
        </div>
      )}

      {claims.length === 0 && (
        <div style={{ textAlign: 'center', padding: '60px 0', color: '#999' }}>No claims found</div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {claims.map(claim => {
          const status = STATUS_COLOR[claim.claim_status] || STATUS_COLOR.registered
          const isOpen = expanded === claim.claim_id
          const claimDiags = diagnoses[claim.claim_id] || []
          const claimSvcs  = services[claim.claim_id]  || []

          return (
            <div key={claim.claim_id} style={{ background: '#fff', borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.06)', overflow: 'hidden' }}>

              {/* Claim header */}
              <div
                onClick={() => setExpanded(isOpen ? null : claim.claim_id)}
                style={{ padding: '18px 24px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                  <div style={{ width: 44, height: 44, background: '#f0f4f8', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>
                    {claim.claim_type === 'maternity' ? '🤱' : claim.claim_type === 'cashless' ? '🏥' : '📋'}
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, color: '#1B3A6B', fontSize: 15 }}>{claim.claim_number}</div>
                    <div style={{ fontSize: 12, color: '#888', marginTop: 2 }}>
                      {claim.network_hospitals?.hospital_name || 'Hospital'} · {claim.claim_type}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontWeight: 700, color: '#1B3A6B', fontSize: 16 }}>
                      {claim.approved_amount ? `₹${claim.approved_amount.toLocaleString('en-IN')}` : '—'}
                    </div>
                    <div style={{ fontSize: 11, color: '#888' }}>Approved</div>
                  </div>
                  <span style={{ padding: '4px 12px', borderRadius: 12, fontSize: 12, fontWeight: 600, background: status.bg, color: status.color }}>
                    {status.label}
                  </span>
                  <span style={{ color: '#999', fontSize: 14 }}>{isOpen ? '▲' : '▼'}</span>
                </div>
              </div>

              {/* Claim detail — expanded */}
              {isOpen && (
                <div style={{ borderTop: '1px solid #f0f0f0', padding: '20px 24px', background: '#fafafa' }}>

                  {/* Key dates and amounts */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
                    {[
                      { label: 'Admission',     value: <MaskedField value={claim.admission_date ? new Date(claim.admission_date).toLocaleDateString('en-IN') : null} purposeId="purpose_002" tier="T3" hasConsent={medicalConsent} /> },
                      { label: 'Discharge',     value: <MaskedField value={claim.discharge_date ? new Date(claim.discharge_date).toLocaleDateString('en-IN') : null} purposeId="purpose_002" tier="T3" hasConsent={medicalConsent} /> },
                      { label: 'Claim Amount',  value: claim.claim_amount ? `₹${claim.claim_amount.toLocaleString('en-IN')}` : '—' },
                      { label: 'Doctor',        value: <MaskedField value={claim.treating_doctor_name} purposeId="purpose_002" tier="T2" hasConsent={medicalConsent} /> },
                    ].map(f => (
                      <div key={f.label}>
                        <div style={{ fontSize: 11, color: '#888', marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.3 }}>{f.label}</div>
                        <div style={{ fontSize: 13, fontWeight: 500, color: '#333' }}>{f.value}</div>
                      </div>
                    ))}
                  </div>

                  {/* Chief complaint */}
                  <div style={{ marginBottom: 20 }}>
                    <div style={{ fontSize: 12, color: '#888', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.3 }}>Chief Complaint / Reason for Admission</div>
                    <div style={{ background: '#fff', border: '1px solid #eee', borderRadius: 8, padding: '12px 16px', fontSize: 13, color: '#333', lineHeight: 1.6 }}>
                      <MaskedField value={claim.chief_complaint} purposeId="purpose_002" tier="T4" hasConsent={medicalConsent} />
                    </div>
                  </div>

                  {/* Treatment summary */}
                  <div style={{ marginBottom: 20 }}>
                    <div style={{ fontSize: 12, color: '#888', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.3 }}>Treatment Summary</div>
                    <div style={{ background: '#fff', border: '1px solid #eee', borderRadius: 8, padding: '12px 16px', fontSize: 13, color: '#333', lineHeight: 1.6 }}>
                      <MaskedField value={claim.treatment_summary} purposeId="purpose_002" tier="T4" hasConsent={medicalConsent} />
                    </div>
                  </div>

                  {/* Diagnoses — T4 columns */}
                  {claimDiags.length > 0 && (
                    <div style={{ marginBottom: 20 }}>
                      <div style={{ fontSize: 12, color: '#888', marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.3 }}>
                        Diagnoses (ICD-10) {!medicalConsent && <span style={{ color: '#e74c3c' }}>🔒 Masked</span>}
                      </div>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                        <thead>
                          <tr style={{ background: '#f0f4f8' }}>
                            {['ICD-10 Code', 'Description', 'Type', 'Pre-existing'].map(h => (
                              <th key={h} style={{ padding: '8px 12px', textAlign: 'left', fontWeight: 600, color: '#555', fontSize: 12 }}>{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {claimDiags.map((d, i) => (
                            <tr key={d.diagnosis_id} style={{ background: i % 2 === 0 ? '#fff' : '#fafafa', borderBottom: '1px solid #f0f0f0' }}>
                              <td style={{ padding: '10px 12px' }}>
                                <MaskedField value={d.icd10_code} purposeId="purpose_002" tier="T4" hasConsent={medicalConsent} />
                              </td>
                              <td style={{ padding: '10px 12px' }}>
                                <MaskedField value={d.diagnosis_description} purposeId="purpose_002" tier="T4" hasConsent={medicalConsent} />
                              </td>
                              <td style={{ padding: '10px 12px', color: '#666' }}>{d.diagnosis_type}</td>
                              <td style={{ padding: '10px 12px' }}>
                                {medicalConsent ? (
                                  <span style={{ padding: '2px 8px', borderRadius: 4, fontSize: 11, fontWeight: 600, background: d.is_pre_existing ? '#fff3cd' : '#eafaf1', color: d.is_pre_existing ? '#856404' : '#27ae60' }}>
                                    {d.is_pre_existing ? 'Yes' : 'No'}
                                  </span>
                                ) : (
                                  <MaskedField value="—" purposeId="purpose_002" tier="T4" hasConsent={false} />
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {/* Services */}
                  {claimSvcs.length > 0 && (
                    <div>
                      <div style={{ fontSize: 12, color: '#888', marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.3 }}>Procedures & Services</div>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                        <thead>
                          <tr style={{ background: '#f0f4f8' }}>
                            {['Code', 'Description', 'Category', 'Amount'].map(h => (
                              <th key={h} style={{ padding: '8px 12px', textAlign: 'left', fontWeight: 600, color: '#555', fontSize: 12 }}>{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {claimSvcs.map((s, i) => (
                            <tr key={s.service_id} style={{ background: i % 2 === 0 ? '#fff' : '#fafafa', borderBottom: '1px solid #f0f0f0' }}>
                              <td style={{ padding: '10px 12px' }}>
                                <MaskedField value={s.procedure_code} purposeId="purpose_002" tier="T4" hasConsent={medicalConsent} />
                              </td>
                              <td style={{ padding: '10px 12px' }}>
                                <MaskedField value={s.procedure_description} purposeId="purpose_002" tier="T4" hasConsent={medicalConsent} />
                              </td>
                              <td style={{ padding: '10px 12px', color: '#666' }}>{s.service_category}</td>
                              <td style={{ padding: '10px 12px', fontWeight: 600, color: '#1B3A6B' }}>
                                ₹{s.service_amount?.toLocaleString('en-IN')}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
