import React, { useState, useEffect } from 'react'
import { Routes, Route, useNavigate, useLocation, Navigate } from 'react-router-dom'
import { supabase } from './supabaseClient'
import { useConsent } from './hooks/useConsent'
import Login from './pages/Login.jsx'
import Dashboard from './pages/Dashboard.jsx'
import MyClaims from './pages/MyClaims.jsx'
import ConsentCentre from './pages/ConsentCentre.jsx'

// ── Navigation sidebar ────────────────────────────────────────────────────────
function Sidebar({ member, consent, active, onNavigate, onLogout }) {
  const revokedCount = Object.values(consent).filter(v => v === 'revoked').length

  const NAV = [
    { path: '/dashboard',       label: 'Dashboard',       icon: '🏠' },
    { path: '/claims',          label: 'My Claims',       icon: '📋' },
    { path: '/consent',         label: 'Consent Centre',  icon: '🔐', badge: revokedCount > 0 ? revokedCount : null },
  ]

  return (
    <div style={{ width: 240, background: '#1B3A6B', display: 'flex', flexDirection: 'column', minHeight: '100vh', flexShrink: 0 }}>

      {/* Logo */}
      <div style={{ padding: '24px 20px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 36, height: 36, background: '#C9993F', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>🏥</div>
          <div>
            <div style={{ color: '#fff', fontWeight: 700, fontSize: 15 }}>PHI Health</div>
            <div style={{ color: '#C9993F', fontSize: 10, fontWeight: 500 }}>DPDP Compliant Portal</div>
          </div>
        </div>
      </div>

      {/* Member info */}
      <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
        <div style={{ width: 40, height: 40, background: '#C9993F', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, marginBottom: 8, color: '#fff', fontWeight: 700 }}>
          {member?.full_name?.[0]}
        </div>
        <div style={{ color: '#fff', fontWeight: 600, fontSize: 14 }}>{member?.full_name}</div>
        <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12, marginTop: 2 }}>{member?.member_id}</div>
      </div>

      {/* Navigation */}
      <nav style={{ flex: 1, padding: '12px 0' }}>
        {NAV.map(n => (
          <button key={n.path}
            onClick={() => onNavigate(n.path)}
            style={{
              width:       '100%',
              display:     'flex',
              alignItems:  'center',
              gap:         10,
              padding:     '12px 20px',
              background:  active === n.path ? 'rgba(255,255,255,0.15)' : 'transparent',
              border:      'none',
              borderLeft:  active === n.path ? '3px solid #C9993F' : '3px solid transparent',
              cursor:      'pointer',
              color:       active === n.path ? '#fff' : 'rgba(255,255,255,0.6)',
              fontWeight:  active === n.path ? 600 : 400,
              fontSize:    14,
              textAlign:   'left',
              transition:  'all 0.15s',
            }}
          >
            <span style={{ fontSize: 16 }}>{n.icon}</span>
            <span style={{ flex: 1 }}>{n.label}</span>
            {n.badge && (
              <span style={{ background: '#e74c3c', color: '#fff', fontSize: 10, fontWeight: 700, padding: '1px 6px', borderRadius: 10 }}>
                {n.badge}
              </span>
            )}
          </button>
        ))}
      </nav>

      {/* Realtime indicator */}
      <div style={{ padding: '12px 20px', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12 }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#27ae60', display: 'inline-block', animation: 'pulse 2s infinite' }} />
          <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11 }}>Realtime connected</span>
        </div>
        <button onClick={onLogout}
          style={{ width: '100%', padding: '8px', background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: 6, color: 'rgba(255,255,255,0.6)', cursor: 'pointer', fontSize: 12 }}>
          Sign Out
        </button>
      </div>
    </div>
  )
}

// ── Main App ──────────────────────────────────────────────────────────────────
export default function App() {
  const [user,        setUser]        = useState(null)
  const [member,      setMember]      = useState(null)
  const [authLoading, setAuthLoading] = useState(true)
  const navigate  = useNavigate()
  const location  = useLocation()

  // Real-time consent hook — drives masking across entire app
  const { consent, hasConsent, lastChanged } = useConsent(member?.member_id)

  // Check existing session on mount
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUser(session.user)
        loadMember(session.user)
      } else {
        setAuthLoading(false)
      }
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser(session.user)
        loadMember(session.user)
      } else {
        setUser(null)
        setMember(null)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  async function loadMember(authUser) {
    // Find member record by auth UID or email
    const { data } = await supabase
      .schema('phi_insurance')
      .from('members')
      .select('member_id, full_name, email_address, kyc_status, member_since')
      .eq('email_address', authUser.email)
      .single()

    setMember(data)
    setAuthLoading(false)
    if (location.pathname === '/' || location.pathname === '/login') {
      navigate('/dashboard')
    }
  }

  async function handleLogout() {
    await supabase.auth.signOut()
    setUser(null)
    setMember(null)
    navigate('/login')
  }

  function handleConsentChange(purposeId, newStatus) {
    // The Realtime subscription in useConsent will pick this up automatically
    // This is just for immediate UI feedback if needed
    console.log(`[App] Consent changed: ${purposeId} → ${newStatus}`)
  }

  if (authLoading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f0f4f8' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 36, marginBottom: 12 }}>🏥</div>
          <div style={{ color: '#888' }}>Loading PHI Portal...</div>
        </div>
      </div>
    )
  }

  if (!user || !member) {
    return (
      <Routes>
        <Route path="/login" element={<Login onLogin={u => { setUser(u); loadMember(u) }} />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    )
  }

  const sharedProps = { member, consent, hasConsent, lastChanged }

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>

      {/* Sidebar */}
      <Sidebar
        member={member}
        consent={consent}
        active={location.pathname}
        onNavigate={navigate}
        onLogout={handleLogout}
      />

      {/* Main content */}
      <div style={{ flex: 1, background: '#f0f4f8', overflowY: 'auto' }}>
        <Routes>
          <Route path="/dashboard" element={<Dashboard {...sharedProps} />} />
          <Route path="/claims"    element={<MyClaims  {...sharedProps} />} />
          <Route path="/consent"   element={<ConsentCentre {...sharedProps} onConsentChange={handleConsentChange} />} />
          <Route path="*"          element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0.3; }
        }
        * { box-sizing: border-box; }
        button:hover { filter: brightness(0.95); }
      `}</style>
    </div>
  )
}
