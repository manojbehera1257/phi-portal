// =============================================================================
// useConsent — Real-time consent state hook
// Subscribes to phi_consent.consent_records via Supabase Realtime
// When consent changes in the DB, this hook updates immediately,
// causing all MaskedField components to re-render with correct data
// =============================================================================

import { useState, useEffect } from 'react'
import { supabase } from '../supabaseClient'

export function useConsent(memberId) {
  const [consent, setConsent]   = useState({})   // { purpose_001: 'granted', purpose_002: 'granted', ... }
  const [loading, setLoading]   = useState(true)
  const [lastChanged, setLastChanged] = useState(null)

  // Load initial consent state
  useEffect(() => {
    if (!memberId) return

    async function loadConsent() {
      const { data, error } = await supabase
        .schema('phi_consent')
        .from('consent_records')
        .select('purpose_id, status')
        .eq('member_id', memberId)

      if (!error && data) {
        const map = {}
        data.forEach(r => { map[r.purpose_id] = r.status })
        setConsent(map)
      }
      setLoading(false)
    }

    loadConsent()
  }, [memberId])

  // Subscribe to real-time changes on consent_records
  useEffect(() => {
    if (!memberId) return

    const channel = supabase
      .channel(`consent_${memberId}`)
      .on(
        'postgres_changes',
        {
          event:  'UPDATE',
          schema: 'phi_consent',
          table:  'consent_records',
          filter: `member_id=eq.${memberId}`,
        },
        (payload) => {
          const { purpose_id, status } = payload.new
          console.log(`[Realtime] consent changed: ${purpose_id} → ${status}`)

          // Update consent map — triggers re-render of all MaskedField components
          setConsent(prev => ({ ...prev, [purpose_id]: status }))
          setLastChanged({ purpose_id, status, at: new Date() })
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [memberId])

  // Helper: is a given purpose currently granted?
  const hasConsent = (purposeId) => consent[purposeId] === 'granted'

  return { consent, hasConsent, loading, lastChanged }
}
