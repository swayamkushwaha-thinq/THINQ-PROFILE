'use client'
/* ─────────────────────────────────────────────────────────────────────────
   Share gate, added at deploy time only — it is NOT in the source file.
   ⚠ This is a soft gate. The password lives in this file, so anyone who
   opens the page source can read it. It keeps a link from being casually
   opened; it is not access control. Vercel's real password protection
   needs Advanced Deployment Protection, which this team does not have.
   ───────────────────────────────────────────────────────────────────── */
import { useEffect, useRef, useState } from 'react'

const KEY = 'tq-profile-gate'
const PASS = 'Thinq@2019'

export function ShareGate({ children }: { children: React.ReactNode }) {
  const [passed, setPassed] = useState<boolean | null>(null)
  const [err, setErr] = useState('')
  const [value, setValue] = useState('')
  const input = useRef<HTMLInputElement>(null)

  useEffect(() => {
    let ok = false
    try { ok = sessionStorage.getItem(KEY) === '1' } catch (e) { /* private mode */ }
    setPassed(ok)
  }, [])

  useEffect(() => {
    if (passed === false) {
      document.documentElement.style.overflow = 'hidden'
      const t = setTimeout(() => { if (input.current) input.current.focus() }, 60)
      return () => clearTimeout(t)
    }
    document.documentElement.style.overflow = ''
  }, [passed])

  /* Nothing renders until sessionStorage has been read, so the gate never
     flashes over a session that already passed it. */
  if (passed === null) return null
  if (passed) return <>{children}</>

  return (
    <div id="tqGate" style={{ position: 'fixed', inset: 0, zIndex: 99999, background: '#f6f8f8', display: 'flex',
      alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <form id="tqGateForm" style={{ width: '100%', maxWidth: 340, textAlign: 'center' }}
            onSubmit={(e) => {
              e.preventDefault()
              if (value === PASS) {
                try { sessionStorage.setItem(KEY, '1') } catch (e2) { /* private mode */ }
                document.documentElement.style.overflow = ''
                setPassed(true)
              } else {
                setErr('That password is not right.')
                setValue('')
                if (input.current) input.current.focus()
              }
            }}>
        <div style={{ fontFamily: 'var(--sans)', fontSize: 30, color: '#032129', letterSpacing: '-.01em' }}>Thinq</div>
        <div style={{ fontFamily: 'var(--sans)', fontSize: 12.5, color: '#5b6467',
          margin: '8px 0 26px' }}>Profile &amp; account management — prototype</div>
        <input id="tqGateIn" type="password" autoComplete="current-password" placeholder="Password"
          aria-label="Password" ref={input} value={value} onChange={(e) => setValue(e.target.value)}
          style={{ width: '100%', boxSizing: 'border-box', padding: '13px 15px', borderRadius: 12, background: '#ffffff',
            border: '1px solid #d3dadb', color: '#1b1f22', fontFamily: 'var(--sans)',
            fontSize: 15, outline: 'none' }} />
        <div id="tqGateErr" style={{ minHeight: 18, marginTop: 9, fontFamily: 'var(--sans)',
          fontSize: 12, color: '#b03521' }}>{err}</div>
        <button type="submit"
          style={{ width: '100%', marginTop: 6, padding: '13px 15px', border: 0, borderRadius: 999, background: '#032129',
            color: '#ffffff', fontFamily: 'var(--sans)', fontSize: 15, fontWeight: 600,
            cursor: 'pointer' }}>Open the prototype</button>
      </form>
    </div>
  )
}
