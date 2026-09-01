'use client'
/* ── shared step fragments ───────────────────────────────────────────────────
   The prototype's stagesList / otpBlock / pinBlock / doneScreen, one for one. */
import type { ReactNode } from 'react'
import { OtpGroup } from './Otp'

/* PR-39 — a journey names its stages before it starts. */
export function StagesList({ items }: { items: [ReactNode, ReactNode][] }) {
  return (
    <ul className="stages">
      {items.map((i, k) => <li key={k}><span><b>{i[0]}</b><span>{i[1]}</span></span></li>)}
    </ul>
  )
}

export function OtpBlock({ id, label, hint, value, onChange, onFull }: {
  id: string; label: ReactNode; hint?: ReactNode
  value: string; onChange: (v: string) => void; onFull?: () => void
}) {
  return (
    <div className="f">
      <span className="lab">{label}</span>
      <OtpGroup id={id} length={6} value={value} onChange={onChange} onFull={onFull} />
      {hint ? <div className="hint">{hint}</div> : null}
    </div>
  )
}

export function PinBlock({ id, label, hint, value, onChange, onFull }: {
  id: string; label: ReactNode; hint?: ReactNode
  value: string; onChange: (v: string) => void; onFull?: () => void
}) {
  return (
    <div className="f">
      <span className="lab">{label}</span>
      <OtpGroup id={id} length={4} value={value} onChange={onChange} onFull={onFull} masked />
      {hint ? <div className="hint">{hint}</div> : null}
    </div>
  )
}

/* An empty lede renders nothing rather than an empty paragraph, which would
   otherwise leave a gap where a sentence used to be. */
export function DoneScreen({ title, lede, children }: { title: ReactNode; lede?: ReactNode; children?: ReactNode }) {
  return (
    <div className="card" style={{ padding: '20px 22px', border: '1px solid var(--line2)', borderRadius: 15, background: 'var(--card)' }}>
      <h3 style={{ margin: 0, fontSize: 16.5, fontWeight: 600, fontFamily: 'var(--head)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{title}</h3>
      {lede ? <p className="lede" style={{ margin: '8px 0 0', fontSize: 13.5, color: 'var(--soft)' }}>{lede}</p> : null}
      {children}
    </div>
  )
}

/* The per-field error the KYC journey uses: the CTA stays enabled and pressing
   it surfaces a message under each field that needs one, rather than the button
   silently refusing to light up. */
export function Ferr({ msg }: { msg?: string }) {
  return <div className={'ferr' + (msg ? ' show' : '')}>{msg ? <span>{msg}</span> : null}</div>
}
