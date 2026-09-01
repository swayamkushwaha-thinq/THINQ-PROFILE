'use client'
/* ═════════════════════════════════════════════════════════════════════════════
   §7.6 Segments — HC-ACC-04, HC-ACC-06.
   ═════════════════════════════════════════════════════════════════════════════ */
import { commit, db, isFrozen, isLocked } from '@/lib/store'
import { MASK } from '@/lib/vault'
import { segPick } from '@/lib/seed'
import { EntityNote, Head, Pill, Ref } from '@/components/primitives'
import { RoBanner } from '@/components/RoBanner'
import { StageStepper } from '@/components/StageStepper'
import { Timeline, type TlStep } from '@/components/Timeline'
import { flow } from '@/lib/flows/engine'
import type { Segment } from '@/lib/types'

/* Short forms for controls and headings — onboarding §18's {segments} token
   renders "F&O & Commodity", not "Futures & Options & Commodity". */
export const SEG_SHORT: Record<string, string> = { EQ: 'Equity', FNO: 'F&O', COMM: 'Commodity' }
export function segShort(code: string) { return SEG_SHORT[code] || code }

export function segCtaLabel(picked: Segment[]) {
  if (!picked.length || picked.length === 2) return 'Activate both'
  if (picked.length === 1) return 'Activate ' + segShort(picked[0].code)
  return 'Activate ' + picked.length + ' segments'
}

/* PR-81 — the drop_reason is rendered as a sentence, never as the raw enum. */
export function dropLine(r: string) {
  return ({
    descoped: 'You opened the account with equity only, so this was left off.',
    proof_rejected: 'The income proof you gave us did not clear, so this was left off.',
    proof_pending: 'The income proof was never finished, so this was left off.',
  } as Record<string, string>)[r] || 'This was left off when the account was opened.'
}

/* PR-40 — the four states are carried by the tick and one line each.
   PR-45 — Thinq approving a segment and the exchange enabling it are different
   things, so a segment in that gap gets its own mark rather than a green tick. */
function SegRow({ s, single }: { s: Segment; single: boolean }) {
  const live = s.status === 'active' && s.exch === 'enabled'
  const waiting = (s.status === 'active' && s.exch !== 'enabled') || s.status === 'approved' || s.status === 'pending'

  const tk = live ? <span className="tk on" aria-hidden="true">&#10003;</span>
    : waiting ? <span className="tk wait" aria-hidden="true">&#8226;</span>
    : <span className="tk off" aria-hidden="true"></span>

  /* Only the in-between state still carries a line: PR-45 — a segment Thinq has
     approved but the exchange has not enabled is not tradeable, and saying
     nothing there would leave the customer to discover it by failing a trade. */
  const line = waiting ? 'Approved by Thinq. Waiting for the exchange to switch it on — you cannot trade it yet.' : ''

  let act: React.ReactNode = null
  if (!isLocked() && !isFrozen()) {
    /* A segment that can be added is a choice, so it is a checkbox — pick one or
       both and activate them in one journey. */
    if (!live && !waiting) {
      act = single
        ? <button className="btn sec sm" type="button" onClick={() => flow('segment:' + s.code)}>Activate</button>
        : (
          <label className="tgl">
            <input type="checkbox" checked={!!segPick[s.code]} aria-label={'Activate ' + s.name}
                   onChange={(e) => { segPick[s.code] = e.target.checked; commit() }} />
            <i></i>
          </label>
        )
    }
    /* Deactivation removed on owner direction, 14 Aug 2026. PR-44 — a segment
       may only be switched off with its open positions closed first, and the
       positions named — now has no surface, and neither does AT-P-17.
       PR-43 (Equity is not deselectable) holds trivially: nothing is. */
  }
  /* An active segment with no control still needs its state named on the right,
     so the row is not just a tick with nothing opposite it. */
  if (!act && live) act = <Pill kind="ok" label="Active" />
  else if (!act && waiting) act = <Pill kind="warn" label="Activation in progress" />

  return (
    <div className="seg">
      {tk}
      <span className="t"><b>{s.name}</b>{line ? <span>{line}</span> : null}</span>
      <span className="sr">{live ? 'Enabled' : waiting ? 'Activation in progress' : 'Not enabled'}</span>
      {act ? <span className="a">{act}</span> : null}
    </div>
  )
}

function SegmentStatusCard() {
  const r = db.segmentRequest as any
  const steps: TlStep[] = [
    ['Request submitted', 'You asked to activate ' + r.name, 'SEG_SUBMITTED'],
    ['Verifying your income proof', 'We are checking the amount and that the document is in your own name',
      'SEG_PROOF_VERIFYING',
      'Income proof verified', 'Both the amount and the name check passed', 'SEG_PROOF_VERIFIED'],
    ['e-Signed', 'We’ve sent a confirmation email to ' + MASK.email + ' with the e-Signed ' + r.name
      + ' activation form attached', 'SEG_ESIGNED'],
    ['Under review by Thinq', 'We are reviewing your proof and your signed form', 'SEG_THINQ_REVIEWING',
      'Approved by Thinq', 'We have accepted your income proof and your signed form', 'SEG_THINQ_APPROVED'],
    ['Enabling at the exchange', 'The exchange has to switch the segment on for your client code. Until it does, you '
      + 'will see the segment on your account but cannot trade it', 'SEG_EXCH_ENABLING',
      'Enabled at the exchange', 'The exchange has switched the segment on for your client code', 'SEG_EXCH_ENABLED'],
    [r.name + ' is active', 'You can trade ' + r.name + ' now', 'SEG_ACTIVE'],
  ]
  return (
    <details className="cardc" open>
      <summary>
        <h3>Your {r.name} activation request<Ref r="PR-45" /></h3>
        {r.stage >= 6 ? <Pill kind="ok" label="Complete" /> : <Pill kind="warn" label="In progress" />}
        <span className="chev" aria-hidden="true"></span>
      </summary>
      <div className="body">
        <div className="quiet" style={{ borderTop: 'none', marginTop: 0, paddingTop: 0 }}>
          Reference <b>{r.ref}</b> · started {r.on}
        </div>
        <Timeline steps={steps} stage={r.stage} />
        {r.stage >= 6 ? (
          <div className="btnrow">
            <button className="btn sec sm" type="button"
                    onClick={() => { db.segmentRequest = null; commit() }}>Dismiss</button>
          </div>
        ) : null}
        <StageStepper which="seg" stage={r.stage} max={6} />
      </div>
    </details>
  )
}

export function SegmentsPage() {
  /* What you already have, then what is on its way, then what you can add —
     so the list reads as a state rather than a fixed catalogue order. */
  const rank = (x: Segment) => {
    if (x.status === 'active' && x.exch === 'enabled') return 0
    if (x.status === 'active' || x.status === 'approved' || x.status === 'pending') return 1
    return 2
  }
  const ordered = db.segments.slice().sort((a, b) => rank(a) - rank(b))
  const picked = db.segments.filter((x) => segPick[x.code])
  const addable = db.segments.filter((x) =>
    (x.status === 'inactive' || x.status === 'descoped') && !isLocked() && !isFrozen())
  /* With one segment left to add there is nothing to combine, so the row carries
     a plain Activate. A toggle only earns its place when there is a choice to
     make across more than one row. */
  const single = addable.length === 1

  return (
    <>
      <Head eyebrow="Account" title="Segments" />
      <RoBanner />
      <div className="card">
        {ordered.map((x) => <SegRow s={x} single={single} key={x.code} />)}
        {addable.length > 1 ? (
          <div className="btnrow" style={{ marginTop: 16, justifyContent: 'flex-end' }}>
            <button className="btn pri" type="button"
                    onClick={() => {
                      const target = picked.length ? picked : addable
                      flow('segment:' + target.map((x) => x.code).join('+'))
                    }}>
              {segCtaLabel(picked)}
            </button>
          </div>
        ) : null}
      </div>
      {db.segmentRequest ? <SegmentStatusCard /> : null}
      <EntityNote />
    </>
  )
}
