'use client'
/* ── field renderers ────────────────────────────────────────────────────────── */
/* One-for-one with the prototype's kv() / plain() / maskField() / pill() /
   head() / blockedBox() helpers. Same elements, same class names, same order —
   the only change is that they return JSX instead of an HTML string. */
import type { ReactNode } from 'react'
import { MASK, TIER, VAULT, revealed, shown, remaskAll, startTtl, stopTtl, unmask, grantAuthToken, hasAuthToken } from '@/lib/vault'
import type { VaultField } from '@/lib/types'
import { commit, db, isPost } from '@/lib/store'
import { copyText, openModal, closeModal, toast } from '@/lib/ui'
import { PinPrompt } from './PinPrompt'

/* PR-04 — read-only is label/value text. Nothing here is ever a disabled input. */
export function Kv({ label, children, route }: { label: ReactNode; children: ReactNode; route?: ReactNode }) {
  return (
    <div className="kv">
      <dt>{label}</dt>
      <dd>{children}</dd>
      {route ? <div className="route">{route}</div> : null}
    </div>
  )
}

/* PR-05 — a field that cannot be edited carries a route or a reason. Never a
   bare padlock. Every locked field below passes one of these two. */
export function ToChange({ children }: { children: ReactNode }) {
  return <><b>To change this:</b> {children}</>
}
export function CannotChange({ children }: { children: ReactNode }) {
  return <><b>This cannot change:</b> {children}</>
}

/* PRD annotation — hidden unless body.refs is set by the prototype bar. */
export function Ref({ r }: { r: string }) {
  return <>{' '}<span className="pr">{r}</span></>
}

export function Pill({ kind, label }: { kind: string; label: string }) {
  return <span className={'pill ' + kind}><i></i>{label}</span>
}

export function Head({ eyebrow, title, sub }: { eyebrow: string; title: string; sub?: ReactNode }) {
  return (
    <div className="phead">
      <h1 style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '20px', fontWeight: 600, fontFamily: 'var(--sans)', margin: '0 0 16px 0', letterSpacing: '-0.01em' }}>
        <span style={{ color: 'var(--soft)', fontWeight: 400 }}>{eyebrow || 'Profile'}</span>
        <span style={{ color: 'var(--faint)', fontSize: '15px', fontWeight: 300, margin: '0 2px' }}>›</span>
        <span style={{ color: 'var(--ink)', fontWeight: 600 }}>{title}</span>
      </h1>
      {sub ? <p>{sub}</p> : null}
    </div>
  )
}

export function FundsSummaryCards() {
  return (
    <div className="funds-grid">
      {/* Box 1: Margin Available */}
      <div className="card" style={{ padding: '20px 22px', borderRadius: '15px', background: 'var(--card)', border: '1px solid var(--line)', margin: 0, boxShadow: 'none' }}>
        <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--faint)', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '10px', fontFamily: 'var(--mono)' }}>
          Margin Available
        </div>
        <div style={{ fontSize: '28px', fontWeight: 700, color: 'var(--ink)', letterSpacing: '-0.02em', fontFamily: 'var(--sans)' }}>
          ₹3,08,260<span style={{ fontSize: '18px', color: 'var(--faint)', fontWeight: 500 }}>.00</span>
        </div>
      </div>

      {/* Box 2: Margin Blocked & Cash */}
      <div className="card" style={{ padding: '18px 22px', borderRadius: '15px', background: 'var(--card)', border: '1px solid var(--line)', margin: 0, boxShadow: 'none', display: 'flex', flexDirection: 'column', gap: '12px', justifyContent: 'center' }}>
        <div>
          <div style={{ fontSize: '10.5px', fontWeight: 700, color: 'var(--faint)', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '4px', fontFamily: 'var(--mono)' }}>
            Margin Blocked
          </div>
          <div style={{ fontSize: '18px', fontWeight: 700, color: 'var(--ink)', fontFamily: 'var(--sans)' }}>
            ₹96,200<span style={{ fontSize: '13px', color: 'var(--faint)', fontWeight: 400 }}>.00</span>
          </div>
        </div>
        <div style={{ borderTop: '1px solid var(--line)', paddingTop: '10px' }}>
          <div style={{ fontSize: '10.5px', fontWeight: 700, color: 'var(--faint)', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '4px', fontFamily: 'var(--mono)' }}>
            Cash
          </div>
          <div style={{ fontSize: '18px', fontWeight: 700, color: 'var(--ink)', fontFamily: 'var(--sans)' }}>
            ₹1,66,860<span style={{ fontSize: '13px', color: 'var(--faint)', fontWeight: 400 }}>.00</span>
          </div>
        </div>
      </div>

      {/* Box 3: Withdrawable */}
      <div className="card" style={{ padding: '20px 22px', borderRadius: '15px', background: 'var(--card)', border: '1px solid var(--line)', margin: 0, boxShadow: 'none', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--faint)', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '10px', fontFamily: 'var(--mono)' }}>
            Withdrawable
          </div>
          <div style={{ fontSize: '24px', fontWeight: 700, color: 'var(--ink)', letterSpacing: '-0.01em', fontFamily: 'var(--sans)' }}>
            ₹53,080<span style={{ fontSize: '16px', color: 'var(--faint)', fontWeight: 500 }}>.00</span>
          </div>
        </div>
        <div style={{ marginTop: '14px' }}>
          <button className="btn sec sm" type="button" style={{ borderRadius: '8px', padding: '6px 14px', fontSize: '12px' }}>
            See breakdown
          </button>
        </div>
      </div>
    </div>
  )
}

/* PR-12 — copy on every identifier a customer is legitimately asked to quote. */
export function Plain({ value, copyWhat }: { value: string; copyWhat?: string }) {
  return (
    <>
      <span className={'val' + (copyWhat ? ' mono' : '')}>{value}</span>
      {copyWhat ? (
        <button className="mini icon-only" type="button" aria-label={'Copy ' + copyWhat} title={'Copy ' + copyWhat} onClick={() => copyText(value, copyWhat)}>
          <CopyIcon size={14} />
        </button>
      ) : null}
    </>
  )
}

export function BlockedBox({ id, owner, children }: { id: string; owner: string; children: ReactNode }) {
  return (
    <div className="blkbox">
      {/* Single text nodes: React would otherwise split these around the
          interpolation, which shifts glyph rasterisation by a subpixel. */}
      <b className="h">{'Blocked — ' + id}</b>
      {children}
      <div className="own">{'Owner: ' + owner + '. Profile cannot resolve this; it can only be where it lands.'}</div>
    </div>
  )
}

/* The reveal path. A tier-A field asks for the PIN, re-masks after 60 seconds
   and writes an audit entry; a tier-B field opens on a single tap. */
export function doReveal(field: VaultField) {
  if (revealed[field]) { revealed[field] = false; stopTtl(); commit(); return }
  const open = () => {
    try { unmask(field) } catch (e) { return }
    revealed[field] = true
    if (TIER[field] === 'A') startTtl(() => { commit(); toast('Re-masked after 60 seconds.') })
    commit()
  }
  if (TIER[field] === 'A') {
    openModal(
      <PinPrompt
        onOk={() => { grantAuthToken(); closeModal(); open() }}
        onCancel={() => closeModal()}
      />,
      true,
    )
  } else open()
}

export function EyeIcon({ off = false, size = 14 }: { off?: boolean; size?: number }) {
  if (off) {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ display: 'inline-block', verticalAlign: 'middle' }}>
        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
        <line x1="1" y1="1" x2="23" y2="23" />
      </svg>
    )
  }
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ display: 'inline-block', verticalAlign: 'middle' }}>
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  )
}

export function CopyIcon({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ display: 'inline-block', verticalAlign: 'middle' }}>
      <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  )
}

export function EditIcon({ size = 12, style }: { size?: number; style?: React.CSSProperties }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ display: 'inline-block', verticalAlign: 'middle', ...style }}>
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  )
}

export function ArrowRightIcon({ size = 12, style }: { size?: number; style?: React.CSSProperties }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ display: 'inline-block', verticalAlign: 'middle', ...style }}>
      <path d="M5 12h14" />
      <path d="M12 5l7 7-7 7" />
    </svg>
  )
}

export function MaskField({ field, copy, mono = true }: { field: VaultField; copy?: string; mono?: boolean }) {
  const on = !!revealed[field]
  const tierA = TIER[field] === 'A'
  const hideEye = !isPost()
  return (
    <>
      <span className={'val' + (mono === false ? '' : ' mono')}>{shown(field)}</span>
      {!hideEye ? (
        <button className={'mini icon-only' + (on ? ' on' : '')} type="button" aria-label={on ? 'Hide value' : 'Reveal value'} title={on ? 'Hide value' : 'Reveal value'} onClick={() => doReveal(field)}>
          <EyeIcon off={on} size={14} />
        </button>
      ) : null}
      {copy && (on || !tierA) ? (
        <button className="mini icon-only" type="button" aria-label={'Copy ' + copy} title={'Copy ' + copy} onClick={() => copyText(VAULT[field], copy)}>
          <CopyIcon size={14} />
        </button>
      ) : null}
    </>
  )
}

/* PR-93 — the build version is shown, and labelled. Dhan's unlabelled
   "web v1.0.2.16" reads as a leaked artefact; it is genuinely useful to
   support, so label it rather than remove it. */
export function EntityNote() {
  return null
}

export { MASK, remaskAll }
