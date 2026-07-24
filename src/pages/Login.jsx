import React, { useState } from 'react'
import { supabase } from '../supabaseClient'

export default function Login({ onLogin }) {
  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState('')

  // Demo quick-login buttons — pre-fill credentials
  const DEMO_USERS = [
    { name: 'Priya Sharma',    email: 'priya.sharma@phi-demo.com',  password: 'Demo@1234', memberId: 'MBR-001234', label: 'All consents granted — ready for demo' },
    { name: 'Rajesh Kumar',    email: 'rajesh.kumar@phi-demo.com',  password: 'Demo@1234', memberId: 'MBR-002567', label: 'Marketing consent revoked' },
    { name: 'Mohammed Irfan',  email: 'm.irfan@phi-demo.com',       password: 'Demo@1234', memberId: 'MBR-004102', label: 'Analytics + TPA consent revoked' },
    { name: 'Ananya Patel',    email: 'ananya.patel@phi-demo.com',  password: 'Demo@1234', memberId: 'MBR-003891', label: 'All consents granted' },
  ]

  async function handleLogin(e) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { data, error: authError } = await supabase.auth.signInWithPassword({ email, password })

    if (authError) {
      setError(authError.message)
      setLoading(false)
      return
    }

    onLogin(data.user)
  }

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #1B3A6B 0%, #0F6E56 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ width: '100%', maxWidth: 460 }}>

        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
            <div style={{ width: 48, height: 48, background: '#C9993F', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24 }}>🏥</div>
            <div>
              <div style={{ color: '#fff', fontSize: 24, fontWeight: 700, letterSpacing: -0.5 }}>PHI Health</div>
              <div style={{ color: '#C9993F', fontSize: 12, fontWeight: 500 }}>DPDP Act 2023 Compliant</div>
            </div>
          </div>
          <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 14 }}>Customer Portal — EagleDrift Technologies Demo</p>
        </div>

        {/* Login Card */}
        <div style={{ background: '#fff', borderRadius: 16, padding: 32, boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: '#1B3A6B', marginBottom: 24 }}>Sign In</h2>

          {error && (
            <div style={{ background: '#fdf0f0', border: '1px solid #f5c6cb', borderRadius: 8, padding: '10px 14px', marginBottom: 16, color: '#c0392b', fontSize: 13 }}>
              {error}
            </div>
          )}

          <form onSubmit={handleLogin}>
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#555', marginBottom: 6 }}>Email</label>
              <input
                type="email" value={email} onChange={e => setEmail(e.target.value)}
                placeholder="your@email.com" required
                style={{ width: '100%', padding: '10px 14px', border: '1px solid #ddd', borderRadius: 8, fontSize: 14, outline: 'none' }}
              />
            </div>
            <div style={{ marginBottom: 24 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#555', marginBottom: 6 }}>Password</label>
              <input
                type="password" value={password} onChange={e => setPassword(e.target.value)}
                placeholder="••••••••" required
                style={{ width: '100%', padding: '10px 14px', border: '1px solid #ddd', borderRadius: 8, fontSize: 14, outline: 'none' }}
              />
            </div>
            <button type="submit" disabled={loading} style={{
              width: '100%', padding: '12px', background: '#1B3A6B', color: '#fff',
              border: 'none', borderRadius: 8, fontSize: 15, fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.7 : 1,
            }}>
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          {/* Demo quick-login */}
          <div style={{ marginTop: 28, paddingTop: 24, borderTop: '1px solid #eee' }}>
            <p style={{ fontSize: 12, fontWeight: 600, color: '#999', marginBottom: 12, textTransform: 'uppercase', letterSpacing: 0.5 }}>Demo Quick Login</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {DEMO_USERS.map(u => (
                <button key={u.memberId} onClick={() => { setEmail(u.email); setPassword(u.password) }}
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', background: '#f8f9fa', border: '1px solid #eee', borderRadius: 8, cursor: 'pointer', textAlign: 'left' }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#1B3A6B' }}>{u.name}</div>
                    <div style={{ fontSize: 11, color: '#999' }}>{u.label}</div>
                  </div>
                  <span style={{ fontSize: 18 }}>→</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        <p style={{ textAlign: 'center', color: 'rgba(255,255,255,0.5)', fontSize: 12, marginTop: 20 }}>
          PHI General Insurance Co. Ltd. · IRDAI Reg. No. 156 · DPDP Act 2023 Compliant
        </p>
      </div>
    </div>
  )
}
