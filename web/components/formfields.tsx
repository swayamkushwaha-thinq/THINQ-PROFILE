'use client'
/* The KYC journey's field shapes, matched here so the two surfaces feel the
   same — PR-35. idField, mobField, addrBlock, and the relationship trigger that
   opens a pill sheet rather than an always-open grid. */
import { IDCFG, IN_STATES, RELATIONS, type AddrObj } from '@/lib/validation'
import { openModal, closeModal } from '@/lib/ui'
import { Ferr } from './flowbits'

export function IdField({ id, type, value, onChange }:
  { id: string; type: string; value: string; onChange: (v: string) => void }) {
  const c = IDCFG[type] || IDCFG.Aadhaar
  return (
    <div className="f">
      <label htmlFor={id}>{c.lbl}</label>
      <input type="text" id={id} maxLength={c.max} autoComplete="off"
             {...(c.max === 4 ? { inputMode: 'numeric' as const } : {})}
             {...(c.mono ? { className: 'mono' } : {})}
             value={value || ''} onChange={(e) => onChange(e.target.value)} />
    </div>
  )
}

export function MobField({ id, label, value, onChange }:
  { id: string; label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div className="f">
      <label htmlFor={id}>{label}</label>
      <div className="mobin">
        <span className="cc">+91</span>
        <input type="tel" id={id} inputMode="numeric" maxLength={10} autoComplete="off"
               value={value || ''} onChange={(e) => onChange(e.target.value.replace(/\D/g, ''))} />
      </div>
    </div>
  )
}

export function AddrBlock({ p, d, err, onChange }:
  { p: string; d?: AddrObj; err: Record<string, string>; onChange: (patch: AddrObj) => void }) {
  const v = d || {}
  return (
    <>
      <div className="f"><label htmlFor={p + 'A1'}>Address line 1</label>
        <input type="text" id={p + 'A1'} autoComplete="off" value={v.a1 || ''}
               onChange={(e) => onChange({ a1: e.target.value })} /></div>
      <Ferr msg={err['e' + p + 'A1']} />
      <div className="f"><label htmlFor={p + 'A2'}>Address line 2 (optional)</label>
        <input type="text" id={p + 'A2'} autoComplete="off" value={v.a2 || ''}
               onChange={(e) => onChange({ a2: e.target.value })} /></div>
      <div className="f2">
        <div className="f"><label htmlFor={p + 'City'}>City</label>
          <input type="text" id={p + 'City'} autoComplete="off" value={v.city || ''}
                 onChange={(e) => onChange({ city: e.target.value })} /></div>
        <div className="f"><label htmlFor={p + 'Pin'}>Pincode</label>
          <input type="text" id={p + 'Pin'} className="mono" inputMode="numeric" maxLength={6} value={v.pin || ''}
                 onChange={(e) => onChange({ pin: e.target.value.replace(/\D/g, '') })} /></div>
      </div>
      <Ferr msg={err['e' + p + 'City']} />
      <div className="f"><label htmlFor={p + 'State'}>State</label>
        <select id={p + 'State'} value={v.state || ''} onChange={(e) => onChange({ state: e.target.value })}>
          <option value="">Select state</option>
          {IN_STATES.map((x) => <option key={x}>{x}</option>)}
        </select></div>
      <Ferr msg={err['e' + p + 'State']} />
    </>
  )
}

/* The KYC journey shows relationship as a trigger that opens a pill sheet, not
   as an always-open grid — matched here so the two screens feel the same. */
export function RelTrigger({ label, value, onPick }:
  { label: string; value?: string; onPick: (v: string) => void }) {
  return (
    <button type="button" className={'pilldd' + (value ? ' on' : '')}
            onClick={() => openRelSheet(label, value, onPick)}>
      <span>{value || label}</span><span className="cv">▼</span>
    </button>
  )
}

export function openRelSheet(title: string, current: string | undefined, onPick: (v: string) => void) {
  openModal(
    <>
      <h3 id="modalTitle">{title}</h3>
      <div className="pills" style={{ marginBottom: 16 }}>
        {RELATIONS.map((r) => (
          <button type="button" className="relopt" key={r}
                  onClick={() => { closeModal(); onPick(r) }}>
            <span className={current === r ? 'sel' : undefined}>{r}</span>
          </button>
        ))}
      </div>
      <div className="btnrow" style={{ justifyContent: 'flex-end' }}>
        <button className="btn sec" type="button" onClick={() => closeModal()}>Cancel</button>
      </div>
    </>,
  )
}
