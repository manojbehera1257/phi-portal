import React, { useState, useEffect } from 'react'
import { supabase } from '../supabaseClient'
import { ConsentBadge } from '../components/ConsentBadge'

export default function Dashboard({ member, consent, hasConsent }) {
  const [policy,    setPolicy]    = useState(null)
  const [loading,   setLoading]   = useState(true)

  useEffect(() => {
    if (!member?.member_id) return
    async function load() {
      const { data } = await supabase
        .schema('phi_insurance')
        .from('v_member_dashboard')
        .select('*')
        .eq('member_id', member.member_id)
        .single()
      setPolicy(data)
      setLoading(false)
    }
    load()
  }, [member])

  if (loading) return <div style={{ padding: 40, color: '#999' }}>Loading...</div>

  const revokedPurposes = Object.entries(consent).filter(([, v]) => v === 'revoked')

  return (
    <div style={{ padding: '28px 32px', maxWidth: 900 }}>

      {/* Welcome */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 26, fontWeight: 700, color: '#1B3A6B' }}>
          Welcome back, {member?.full_name?.split(' ')[0]} 👋
        </h1>
        <p style={{ color: '#666', marginTop: 4 }}>Member since {policy?.member_since ? new Date(policy.member_since).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' }) : '—'}</p>
      </div>

      {/* Consent alert banner */}
      {revokedPurposes.length > 0 && (
        <div style={{ background: '#fff3cd', border: '1px solid #ffc107', borderRadius: 10, padding: '14px 18px', marginBottom: 24, display: 'flex', alignItems: 'flex-start', gap: 12 }}>
          <span style={{ fontSize: 20 }}>⚠️</span>
          <div>
            <div style={{ fontWeight: 600, color: '#856404', fontSize: 14 }}>Some data is restricted</div>
            <div style={{ color: '#856404', fontSize: 13, marginTop: 2 }}>
              You have revoked consent for {revokedPurposes.length} purpose(s). Some fields are masked. Go to{' '}
              <span style={{ textDecoration: 'underline', cursor: 'pointer' }}>Consent Centre</span> to manage.
            </div>
          </div>
        </div>
      )}

      {/* Stats row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 28 }}>
        {[
          { label: 'Sum Insured', value: policy?.sum_insured ? `₹${(policy.sum_insured/100000).toFixed(0)} Lakhs` : '—', icon: '🛡️', color: '#1B3A6B' },
          { label: 'Total Claims', value: policy?.total_claims ?? 0, icon: '📋', color: '#0F6E56' },
          { label: 'Amount Claimed', value: policy?.total_claimed_amount ? `₹${(policy.total_claimed_amount/1000).toFixed(0)}K` : '₹0', icon: '💰', color: '#C9993F' },
        ].map(s => (
          <div key={s.label} style={{ background: '#fff', borderRadius: 12, padding: '20px 24px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
            <div style={{ fontSize: 28, marginBottom: 8 }}>{s.icon}</div>
            <div style={{ fontSize: 22, fontWeight: 700, color: s.color }}>{s.value}</div>
            <div style={{ fontSize: 13, color: '#888', marginTop: 2 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Policy card */}
      {policy && (
        <div style={{ background: 'linear-gradient(135deg, #1B3A6B, #2E5C9E)', borderRadius: 16, padding: '24px 28px', color: '#fff', marginBottom: 24, position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', right: -20, top: -20, width: 120, height: 120, background: 'rgba(255,255,255,0.05)', borderRadius: '50%' }} />
          <div style={{ position: 'absolute', right: 20, top: 20, opacity: 0.2, fontSize: 60 }}>🏥</div>
          <div style={{ fontSize: 12, opacity: 0.7, marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 }}>Active Policy</div>
          <div style={{ fontSize: 20, fontWeight: 700, marginBottom: 4 }}>{policy.plan_name}</div>
          <div style={{ fontSize: 13, opacity: 0.8, marginBottom: 16 }}>{policy.policy_number}</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
            {[
              { label: 'Start Date', value: policy.policy_start_date ? new Date(policy.policy_start_date).toLocaleDateString('en-IN') : '—' },
              { label: 'Renewal Date', value: policy.policy_end_date ? new Date(policy.policy_end_date).toLocaleDateString('en-IN') : '—' },
              { label: 'No Claim Bonus', value: `${policy.no_claim_bonus_pct || 0}%` },
            ].map(f => (
              <div key={f.label}>
                <div style={{ fontSize: 11, opacity: 0.6, marginBottom: 2 }}>{f.label}</div>
                <div style={{ fontSize: 14, fontWeight: 600 }}>{f.value}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Consent summary */}
      <div style={{ background: '#fff', borderRadius: 12, padding: '20px 24px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, color: '#1B3A6B' }}>Consent Status</h3>
          <span style={{ fontSize: 12, color: '#0F6E56', fontWeight: 600 }}>● Live</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {[
            { id: 'purpose_001', name: 'Claims & Policy Admin',         mandatory: true  },
            { id: 'purpose_002', name: 'Medical Data Sharing',          mandatory: false },
            { id: 'purpose_003', name: 'Marketing Communications',      mandatory: false },
            { id: 'purpose_004', name: 'Analytics & Actuarial',         mandatory: false },
            { id: 'purpose_005', name: 'TPA Data Sharing',              mandatory: false },
          ].map(p => (
            <div key={p.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #f0f0f0' }}>
              <div>
                <span style={{ fontSize: 13, color: '#333' }}>{p.name}</span>
                {p.mandatory && <span style={{ marginLeft: 6, fontSize: 10, background: '#e8f4fd', color: '#1B3A6B', padding: '1px 6px', borderRadius: 4, fontWeight: 600 }}>MANDATORY</span>}
              </div>
              <ConsentBadge status={consent[p.id] || 'pending'} />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
