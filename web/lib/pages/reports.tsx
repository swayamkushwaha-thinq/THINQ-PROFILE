'use client'
/* ═════════════════════════════════════════════════════════════════════════════
   §7.10a Statements & reports.  PR-107 … PR-124.
   Rebuilt 15 Aug 2026 from three teardowns — Dhan, Paytm Money and INDmoney
   (PRD §2.4). Five of these documents are not product decisions: SEBI's Rights
   and Obligations (cl. 32, 34, 35) and the Depositories Master Circular
   (1.8.5, 1.8.6) oblige Thinq to produce them.
   ═════════════════════════════════════════════════════════════════════════════ */
import { useState, useRef, useEffect } from 'react'
import { commit, db } from '@/lib/store'
import { acctOpenIso, TODAY_ISO } from '@/lib/dates'
import { REPORTS, reportByName, type Report } from '@/lib/content/reports'
import { defaultCustomRange, periodGuard, periodLabel, periodOpts, rangeProblem, rp } from '@/lib/reports'
import { EntityNote, Head, Ref } from '@/components/primitives'
import { toast } from '@/lib/ui'

function ReportPicker() {
  const [open, setOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const r = rp.sel ? reportByName(rp.sel) : null

  return (
    <div className="card per" style={{ position: 'relative', overflow: 'visible', zIndex: 100 }} ref={dropdownRef}>
      <div className="prow" style={{ padding: '2px 0', borderBottom: 'none' }}>
        <button
          type="button"
          id="repSel"
          className="custom-select-trigger"
          onClick={() => setOpen(!open)}
          aria-expanded={open}
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '11px 16px',
            background: '#ffffff',
            border: '1.5px solid #d1d5db',
            borderRadius: '12px',
            color: rp.sel ? '#111827' : '#6b7280',
            fontSize: '14px',
            fontWeight: 500,
            cursor: 'pointer',
            textAlign: 'left',
            fontFamily: 'var(--sans)',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
            transition: 'all 0.2s ease',
          }}
        >
          <span style={{ fontWeight: rp.sel ? 600 : 400 }}>{rp.sel || 'Choose a report or statement'}</span>
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{
              transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
              transition: 'transform 0.2s ease',
              flex: '0 0 auto',
              marginLeft: '8px',
              color: '#6b7280',
            }}
          >
            <path d="M6 9l6 6 6-6" />
          </svg>
        </button>
      </div>

      {open && (
        <div
          className="custom-dropdown-menu"
          style={{
            position: 'absolute',
            top: 'calc(100% + 6px)',
            left: 0,
            right: 0,
            zIndex: 1000,
            maxHeight: '260px',
            overflowY: 'auto',
            background: '#ffffff',
            border: '1px solid #d1d5db',
            borderRadius: '12px',
            boxShadow: '0 12px 36px rgba(0, 0, 0, 0.18)',
            padding: '8px 0',
          }}
        >
          {REPORTS.map((grp) => (
            <div key={grp[0]} style={{ padding: '4px 0' }}>
              <div
                style={{
                  padding: '8px 16px 4px',
                  fontSize: '10.5px',
                  fontWeight: 700,
                  color: '#6b7280',
                  letterSpacing: '0.12em',
                  textTransform: 'uppercase',
                  fontFamily: 'var(--mono)',
                }}
              >
                {grp[0]}
              </div>
              {grp[2].map((r2) => {
                const isSelected = rp.sel === r2.n
                return (
                  <div
                    key={r2.n}
                    onClick={() => {
                      rp.sel = r2.n
                      setOpen(false)
                      commit()
                    }}
                    style={{
                      padding: '9px 16px 9px 24px',
                      fontSize: '13.5px',
                      color: isSelected ? '#082830' : '#1f2937',
                      fontWeight: isSelected ? 600 : 400,
                      background: isSelected ? '#f3f4f6' : 'transparent',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      transition: 'background 0.15s ease',
                    }}
                    onMouseEnter={(e) => {
                      if (!isSelected) e.currentTarget.style.background = '#f9fafb'
                    }}
                    onMouseLeave={(e) => {
                      if (!isSelected) e.currentTarget.style.background = 'transparent'
                    }}
                  >
                    <span>{r2.n}</span>
                    {isSelected && (
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#082830" strokeWidth="2.5">
                        <path d="M20 6L9 17l-5-5" />
                      </svg>
                    )}
                  </div>
                )
              })}
            </div>
          ))}
        </div>
      )}

      {r ? <div className="quiet" style={{ borderTop: 'none', margin: '10px 0 2px', paddingTop: 0 }}>{r.d}</div> : null}
    </div>
  )
}

/* ⚠ "What are you here to do?" removed on owner direction, 17 Aug 2026. It was
   the by-job route into the reports — filing your return, reconciling your
   bank, proof of a trade, what you paid us — which is the shape Paytm's own
   teardown proposes for its empty state and never built. The dropdown is now
   the only way in. Recorded in §7.14. */
function ReportLanding() { return null }

function DField({ id, lab, val, onChange }:
  { id: string; lab: string; val: string; onChange: (v: string) => void }) {
  return (
    <>
      <label htmlFor={id} style={{ fontSize: 13, color: 'var(--soft)', flex: '0 0 auto' }}>{lab}</label>
      <input type="date" id={id} value={val} min={acctOpenIso()} max={TODAY_ISO}
             onChange={(e) => onChange(e.target.value)}
             style={{ flex: '1 1 150px', minWidth: 0, padding: '9px 12px', fontSize: 14, fontFamily: 'var(--sans)',
               border: '1px solid var(--line2)', background: 'var(--bg2)', color: 'var(--ink)',
               borderRadius: 10, outline: 'none' }} />
    </>
  )
}

function ReportPanel({ r }: { r: Report }) {
  periodGuard()
  /* ⚠ Two lines removed on owner direction, 16 Aug 2026: the per-report depth
     (PR-109, AT-P-30 fails) and the statutory basis (DP-16). */
  const problem = rangeProblem()
  const isErr = !!problem && /did not exist|before the start|in the future|Pick both/.test(problem)
  /* Download only when the window can actually produce a file — otherwise the
     button says so by being unavailable rather than by returning a blank PDF. */
  const ready = !problem

  const live = db.segments.filter((s) => s.status === 'active')
  let segOpts: [string, string][] | null = null
  if (r.seg && live.length > 1) {
    segOpts = ([['all', 'All segments']] as [string, string][]).concat(live.map((s) => [s.code, s.name] as [string, string]))
  }

  return (
    <>
      <div className="card">
        {r.note ? (
          <div className="prow"><span className="t">
            <span style={{ display: 'block', fontSize: 12.5, color: 'var(--soft)', lineHeight: 1.6 }}>{r.note}</span>
          </span></div>
        ) : null}

        {/* PR-108 — financial-year first. PR-117 — the period survives every switch.
            The label and its explanatory line went on owner direction, 16 Aug 2026;
            the accessible name stays on the fieldset legend. */}
        <div className="prow" style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
          <fieldset style={{ margin: 0 }}>
            <legend className="sr">Period</legend>
            <div className="pills" style={{ display: 'inline-flex' }}>
              {periodOpts().map((p) => (
                <label key={p[0]}>
                  <input type="radio" name="rperiod" value={p[0]} checked={rp.period === p[0]}
                         onChange={() => {
                           rp.period = p[0]
                           /* Opening Custom dates on two empty fields makes the customer do the
                              work twice — pick the mode, then pick both ends. It opens on the
                              last month of trading instead, which they can then change. */
                           if (p[0] === 'custom' && !(rp.from && rp.to)) {
                             const dr = defaultCustomRange(); rp.from = dr[0]; rp.to = dr[1]
                           }
                           commit()
                         }} />
                  <span>{p[1]}</span>
                </label>
              ))}
            </div>
          </fieldset>

          {rp.period === 'custom' ? (
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 9 }}>
              <DField id="rpFrom" lab="From" val={rp.from} onChange={(v) => { rp.from = v; commit() }} />
              <DField id="rpTo" lab="To" val={rp.to} onChange={(v) => { rp.to = v; commit() }} />
            </div>
          ) : null}
        </div>

        {/* ⚠ The advance-tax instalment windows were removed on owner direction,
            16 Aug 2026 — half of PR-108. ADVANCE_TAX, rp.adv and the adv:true flags
            are left in place, so restoring the row is one edit. */}

        {/* PR-119 / PR-122 — every segment Thinq sells, in §7.6's words. */}
        {segOpts ? (
          <div className="prow">
            <fieldset style={{ margin: 0, flex: 1 }}>
              {/* Label removed on owner direction, 16 Aug 2026; "Segment" survives as a
                  visually hidden legend so the group still has an accessible name. */}
              <legend className="sr">Segment</legend>
              <div className="pills">
                {segOpts.map((o) => (
                  <label key={o[0]}>
                    <input type="radio" name="rseg" value={o[0]} checked={rp.seg === o[0]}
                           onChange={() => { rp.seg = o[0]; commit() }} />
                    <span>{o[1]}</span>
                  </label>
                ))}
              </div>
            </fieldset>
          </div>
        ) : null}
      </div>

      {/* PR-111 / PR-118 — the window is validated in one place and answered in one
          place. An out-of-range or reversed range is an error; an empty but valid one
          is a notice. Both name the dates, and both hold the button.
          ⚠ The inline widen went on owner direction, 16 Aug 2026, so the customer is
          told which window is empty and left to find one that is not. AT-P-27 fails. */}
      {problem ? (
        <div className={'nb ' + (isErr ? 'bad' : 'warn')}>
          <span className="ic">{isErr ? '!' : '◇'}</span>
          <div>{problem}<Ref r={isErr ? 'PR-118' : 'PR-111'} /></div>
        </div>
      ) : null}

      <div className="btnrow" style={{ justifyContent: 'flex-end', marginTop: 16 }}>
        <button className="btn pri" type="button" disabled={!ready}
                onClick={() => toast(r.n + ' · ' + periodLabel() + ' — downloading', 'ok')}>
          {r.bulk ? 'Download the range' : 'Download'}
        </button>
      </div>

      {/* ⚠ The rest of the action row and its footnotes were removed on owner
          direction, 16 Aug 2026. With them go the surfaces for PR-112, PR-113,
          PR-114 and PR-116. A customer can now choose a report and a period and has
          no way to obtain either. AT-P-28, AT-P-33 and AT-P-34 fail. The handlers and
          the viewer are left in place so restoring the row is one edit. */}
    </>
  )
}

export function ReportsPage() {
  const r = rp.sel ? reportByName(rp.sel) : null
  return (
    <>
      <Head eyebrow="Reports" title="Statements & reports" />
      <ReportPicker />
      {r ? <ReportPanel r={r} /> : <ReportLanding />}
      {/* ⚠ "Your requests" removed on owner direction, 16 Aug 2026 — with it,
          PR-115's job states (preparing / ready / failed) and PR-123's honest
          attribution of a failure to us rather than to the customer's network.
          ⚠ The account-level floor note was removed the same day; nothing on this
          surface now states a retention floor, and AT-P-30's subject matter has no
          surface at all. Recorded in the build notes. */}
      <EntityNote />
    </>
  )
}
