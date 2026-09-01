'use client'
/* ── closure ─────────────────────────────────────────────────────────────────
   The teardowns' four worst closure findings, each answered:
     Paytm #1  — records lost at closure, no export checkpoint. Answered by the
                 records checkpoint, which is a step rather than a hint.
     Dhan  #2  — demat closure entirely absent from a dual-role broker-DP.
                 Answered by naming the BO ID and both clocks.
     Dhan  #3  — no eligibility state shown at any point. Answered by step 3.
     IND   #1  — "you will not be able to … create a new account with us".
   ─────────────────────────────────────────────────────────────────────────── */
import { commit, db, go } from '@/lib/store'
import { MASK } from '@/lib/vault'
import { inr, openRequests } from '@/lib/dates'
import { setStateSel, toast } from '@/lib/ui'
import { Pill, Ref } from '@/components/primitives'
import { ReviewRows } from '@/components/ReviewRows'
import { DoneScreen, OtpBlock } from '@/components/flowbits'
import { openFnoPositions } from '@/lib/pages/security'
import { primaryBank } from '@/lib/pages/closure'
import { registerFlow, flow, closeFlowInternal, type FlowRun } from './engine'

export const CLOSE_REASONS = [
  'Not trading anymore / need the funds',
  'Moving to another broker',
  'Charges are too high',
  'App is missing features I need',
  'Unhappy with customer support',
  'Prefer not to say',
]

export const MSG_MAX = 500, MSG_MIN = 10
export function msgCount(v: string) {
  const n = (v || '').length
  return n ? n + ' / ' + MSG_MAX : '0 / ' + MSG_MAX
}
export function msgCountClass(v: string) {
  const n = (v || '').length
  return n >= MSG_MAX ? 'cnt full' : (n > MSG_MAX - 50 ? 'cnt warn' : 'cnt')
}

export function andList(a: string[]) {
  if (a.length < 2) return a[0] || ''
  return a.slice(0, -1).join(', ') + ' and ' + a[a.length - 1]
}

export function closeBlockers() {
  const o = db.outstanding, out: string[] = []
  if (o.holdings) out.push('your holdings')
  /* A balance has to be withdrawn first — a closure cannot be raised online
     over money still sitting in the trading account. */
  if (o.money) out.push('the money in your account')
  if (o.dues) out.push('what you owe')
  if (openFnoPositions().length) out.push('your open positions')
  if (db.pledged.length) out.push('your pledged securities')
  return out
}

/* A settled item does not need a word. Once it is clear the row shows a tick,
   so the customer can see at a glance which lines still need them. */
function OkTick() {
  return <span style={{ color: 'var(--ok)', fontSize: 16, lineHeight: 1 }} role="img" aria-label="Settled">✓</span>
}

/* Prototype affordance only — the real journey clears these by selling,
   transferring or settling, none of which lives in Profile (P-7). Without it the
   closure flow could not be walked at all. */
function ProtoClear({ onClear }: { onClear: () => void }) {
  return (
    <div className="stepper">
      <span className="tag">Prototype</span>
      <span>nothing here settles these for real</span>
      <button className="mini" type="button" onClick={onClear}>Clear them</button>
    </div>
  )
}

/* What the customer typed on the way in, echoed back so the receipt shows we
   actually read it. */
export let ESC_NOTE = ''
export function setEscNote(v: string) { ESC_NOTE = v }

interface Retention {
  h: string; p: string
  rows?: [string, string][]
  field?: { id: string; label: string; ph: string; val: string; multiline?: boolean; srLabel?: boolean }
  note?: React.ReactNode
}

/* One screen per reason, answering the thing the customer actually said.
   ⚠ This is the pattern §2.4 criticises and DP-6 rules out — INDmoney's
   "You will miss out on.." card, Dhan's three retention screens. Built here on
   owner direction, 16 Aug 2026, with the three things that separate a fair
   offer from a dark pattern:
     · every claim is a fact about the account, not a feeling about leaving;
     · **Continue closing** is a full, legible button, never pale or shamed;
     · it appears once, and never for a customer who declined to give a reason.
   PR-120a still forbids confirmshaming; this is the boundary it draws. */
function retentionFor(reason: string, F: FlowRun): Retention | null {
  const R: Record<string, Retention> = {}

  R[CLOSE_REASONS[0]] = {           /* not trading anymore / need the funds */
    h: 'You don’t have to close your account to stop trading',
    p: 'If you’re not trading, keeping your account open costs you nothing. You can always come back when you’re ready',
    rows: [['Keeping the account open', 'Free for the next 6 months'],
      ['Trading nothing', 'No brokerage, no platform fee, nothing'],
      ['Your KYC', 'Stays active, so you can trade again without re-doing it'],
      ['Withdrawing your money', 'You can take it all out and keep the account']],
    note: (
      <>
        {'If you’ve simply stopped trading, you can '}
        <button className="lnk" type="button"
                onClick={() => { closeFlowInternal(true); flow('freeze') }}>freeze trading</button>
        {' instead. Your account stays open, and you can unfreeze it yourself anytime'}
      </>
    ),
  }

  R[CLOSE_REASONS[1]] = {           /* moving to another broker */
    h: 'Before you move',
    p: 'You can have accounts with more than one broker. You don’t need to close your Thinq account to try another '
      + 'broker',
    rows: [['Your holdings', 'Stay where they are, and can be moved any time'],
      ['Coming back', 'No re-KYC if the account is still open']],
    field: { id: 'xbroker', label: 'Which broker are you moving to? (optional)',
      ph: 'It helps us understand what we are missing', val: F.d.broker },
  }

  R[CLOSE_REASONS[2]] = {           /* charges are too high */
    h: 'Let’s look at your charges',
    p: 'Before you close, let’s see if we can address what’s costing you. Our team may be able to offer a better '
      + 'pricing option based on your needs',
    rows: [['What you paid last year', 'See Statements & reports → Brokerage and charges'],
      ['What we can look at', 'Brokerage slabs, and waiving fees where the usage justifies it']],
    note: (
      <>
        <button className="lnk" type="button"
                onClick={() => { setEscNote(''); closeFlowInternal(true); flow('pricingtalk') }}>
          Talk to us about pricing
        </button>
        {' — we’ll contact you on ' + MASK.mobile + ' or ' + MASK.email}
      </>
    ),
  }

  R[CLOSE_REASONS[3]] = {           /* app is missing features */
    h: 'Which feature is missing?',
    p: 'Tell us what you were looking for but couldn’t find or use. Your feedback helps us decide what to build next',
    /* The heading already asks the question, so the field carries its label for
       screen readers only (§9.2 keeps it; PR-82 forbids dropping it outright). */
    field: { id: 'xmissing', label: 'What feature were you looking for?', multiline: true, srLabel: true,
      ph: 'The feature, or the thing you were trying to do', val: F.d.missing },
  }

  R[CLOSE_REASONS[4]] = {           /* unhappy with customer support */
    h: 'We’d like to make it right',
    p: 'If something went wrong with our support, tell us what happened. We’d like the chance to fix it before you '
      + 'close your account',
    /* A complaint needs room. A single line invites "bad service" and loses the
       detail the senior team actually needs to act on. */
    field: { id: 'xsupport', label: 'What happened?', multiline: true,
      ph: 'What you asked for, what you got, and when', val: F.d.support },
    note: (
      <>
        <button className="lnk" type="button"
                onClick={() => { setEscNote(F.d.support || ''); closeFlowInternal(true); flow('escalated') }}>
          Talk to a senior team member
        </button>
        {' — this is separate from your closure request, which will continue as usual'}
      </>
    ),
  }

  return R[reason] || null
}

/* Keeping the account open is not always a no-op. Where the customer told us
   the charges were the problem, staying is conditional on us doing something
   about it — so the decision raises a pricing review and routes it, rather than
   closing the screen and losing what they said. */
function keepOpen(F: FlowRun) {
  const why = F ? F.d.reason : ''
  closeFlowInternal(true)
  if (why === CLOSE_REASONS[2]) { flow('keptpricing'); return }
  go('closure')
  toast('Your account stays open. Nothing has changed.', 'ok')
}

registerFlow('close', {
  title: 'Close your account',
  init: (F) => {
    F.d = { reason: CLOSE_REASONS[0], route: '', dp: '', cid: '', exported: false, broker: '', missing: '', support: '' }
  },
  steps: [
    /* 1 — reason first, on owner direction 16 Aug 2026, with what the account
       gives them beside it. Two things keep this honest: the rows are facts
       about the account, and "Prefer not to say" is a first-class answer.
       PR-121a — where the reason is inactivity, freeze is offered as the
       reversible alternative, which Paytm never does. */
    {
      nofocus: true,
      /* ⚠ The lede went on owner direction, 16 Aug 2026 — with it, the statement
         that the reason is optional. */
      render: (F, ctx) => (
        <>
          <h3>Help us understand why you’re closing</h3>
          <div className="f" style={{ marginBottom: 18 }}>
            <label htmlFor="closureReason">Reason for closing</label>
            <select
              id="closureReason"
              className="pick"
              value={F.d.reason || CLOSE_REASONS[0]}
              onChange={(e) => ctx.set({ reason: e.target.value })}
              style={{ width: '100%', minHeight: 46 }}
            >
              {CLOSE_REASONS.map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </div>
          <div className="quiet" style={{ borderTop: 'none', margin: '4px 0 10px', padding: 0 }}>
            A quick look at what you get with Thinq
          </div>
          <ReviewRows rows={[['Keeping the account open', 'Free for the next 6 months'],
            ['Not trading', 'Costs nothing'],
            ['Closing your account', 'Free, whenever you want'],
            ['Coming back later', 'You can open an account again. Your KYC remains with the KRA']]} />
          {F.d.reason === CLOSE_REASONS[0] ? (
            <div className="nb info"><span className="ic">◇</span><div>
              {'If you’ve simply stopped trading, you can '}
              <button className="lnk" type="button"
                      onClick={() => { closeFlowInternal(true); flow('freeze') }}>freeze trading</button>
              {' instead. Your account stays open, and you can unfreeze it yourself anytime'}<Ref r="PR-121a" />
            </div></div>
          ) : null}
        </>
      ),
      /* A reason is now required — owner direction, 16 Aug 2026. "Prefer not to
         say" remains a first-class answer, so the customer is never made to give
         a reason they do not want to give; they just have to make a choice. */
      valid: (F) => !!F.d.reason,
      cta: 'Continue',
    },

    /* 2 — the retention screen for whatever they said. Skipped entirely when they
       gave no reason or declined to give one: pressing someone who has already
       said "prefer not to say" is the defect, not the offer. */
    {
      nofocus: true,
      skipIf: (F) => !retentionFor(F.d.reason, F),
      render: (F, ctx) => {
        const r = retentionFor(F.d.reason, F)!
        const fld = r.field
        const val = fld ? (F.d[fld.id === 'xbroker' ? 'broker' : fld.id === 'xmissing' ? 'missing' : 'support'] || '') : ''
        const key = fld ? (fld.id === 'xbroker' ? 'broker' : fld.id === 'xmissing' ? 'missing' : 'support') : ''
        return (
          <>
            <h3>{r.h}</h3>
            <p className="lede">{r.p}</p>
            {r.rows ? <ReviewRows rows={r.rows} /> : null}
            {fld ? (
              <div className="f">
                <label {...(fld.srLabel ? { className: 'sr' } : {})} htmlFor={fld.id}>{fld.label}</label>
                {fld.multiline ? (
                  <>
                    <textarea id={fld.id} rows={4} maxLength={MSG_MAX} placeholder={fld.ph} value={val}
                              onChange={(e) => ctx.set({ [key]: e.target.value })} />
                    <div className="foot">
                      <span className="hint">Optional</span>
                      <span className={msgCountClass(val)} id={fld.id + 'Cnt'} aria-live="polite">{msgCount(val)}</span>
                    </div>
                  </>
                ) : (
                  <input type="text" id={fld.id} maxLength={120} autoComplete="off" placeholder={fld.ph} value={val}
                         onChange={(e) => ctx.set({ [key]: e.target.value })} />
                )}
              </div>
            ) : null}
            {r.note ? <div className="nb info"><span className="ic">◇</span><div>{r.note}</div></div> : null}
          </>
        )
      },
      /* Both ways out are real buttons. The keep option leads because the
         customer told us something we can act on; the exit is not diminished. */
      foot: (F, ok, ctx) => (
        <>
          <button className="btn sec" type="button" onClick={ctx.next}>Continue closing</button>
          <span className="sp"></span>
          <button className="btn pri" type="button" onClick={() => keepOpen(F)}>Keep my account open</button>
        </>
      ),
    },

    /* 3 — eligibility as state, not as instruction. INDmoney tells the customer
       to "ensure that you clear your wallet balance" and never shows it. */
    {
      nofocus: true,
      render: (F, ctx) => {
        const o = db.outstanding, pos = openFnoPositions(), blk = closeBlockers()
        return (
          <>
            <h3>What’s still outstanding?</h3>
            <p className="lede">We’re checking your account before submitting the closure request</p>
            <ReviewRows rows={[
              ['Holdings', o.holdings
                ? o.holdings + (o.holdings === 1 ? ' holding' : ' holdings') + ', about ' + o.holdingsVal
                  + ' — to sell or transfer out'
                : <OkTick />],
              ['Money in the account', o.money
                ? '₹' + inr(o.money) + ' — withdraw it to ' + primaryBank() + ' before you continue'
                : <OkTick />],
              ['Dues owed', o.dues ? '₹' + inr(o.dues) + ' to settle' : <OkTick />],
              ['Open positions', pos.length ? pos.length + ' open — close them first' : <OkTick />],
              ['Pledged securities', db.pledged.length
                ? db.pledged.length + (db.pledged.length === 1 ? ' holding' : ' holdings')
                  + ' — must be released before the account can close'
                : <OkTick />],
              ['What closing costs', <OkTick />]]} />
            {/* PR-73 — the list is a statement; this makes it a request, and the
                journey does not advance until it is answered. */}
            {blk.length ? (
              <>
                <div className="nb bad"><span className="ic">!</span><div>
                  {'Settle ' + andList(blk) + ' before you continue. We cannot submit a closure request while any of '
                    + 'it is outstanding'}<Ref r="PR-73" />
                </div></div>
                <ProtoClear onClear={() => {
                  db.outstanding.holdings = 0; db.outstanding.money = 0; db.outstanding.dues = 0
                  db.pledged = []; db.positions.FNO = []
                  ctx.redraw(); commit()
                  toast('Outstanding items cleared', 'ok')
                }} />
              </>
            ) : (
              <div className="nb ok"><span className="ic">◇</span><div>Nothing is outstanding. You can continue</div></div>
            )}
          </>
        )
      },
      valid: () => !closeBlockers().length,
      cta: 'Continue',
    },

    /* 4 — the records checkpoint. Paytm's principal finding, and its own
       recommended remedy: "insert a mandatory step … Make it a checkpoint, not a
       hint." Ledger and P&L are what a client needs months AFTER they stop
       trading, for a return or a notice. */
    {
      nofocus: true,
      render: () => (
        <>
          <h3>Download your statements first</h3>
          <p className="lede">Once your account is closed, you won’t be able to download them here. Save the
            statements you may need for your records or future tax filing before you continue</p>
          {/* One route out, to the surface that already does this properly. The
              in-flow "Download everything" went on owner direction, 16 Aug 2026. */}
          <div className="btnrow" style={{ margin: '2px 0 0' }}>
            <button className="btn pri" type="button"
                    onClick={() => { closeFlowInternal(true); go('reports') }}>Open Statements &amp; reports</button>
          </div>
          {/* ⚠ The post-closure retrieval route went on owner direction, 16 Aug 2026.
              The checkpoint survives; the way to get records afterwards is now named
              only on the closure tracking card. */}
        </>
      ),
      cta: 'Continue',
    },

    /* ⚠ Two steps removed on owner direction, 16 Aug 2026: the sell-or-transfer
       choice, and the transfer-out form. That costs PR-115a and PR-116a their
       only surface — and PR-116a answered the sharpest finding in the INDmoney
       teardown, where a typo sends the holdings to a stranger's demat account.
       ⚠ The "Review and sign" step went the same day. It carried PR-117a's two
       statutory clocks, PR-118a's named demat account and PR-119a's re-opening
       statement at the moment of commitment. */

    /* e-Sign, named. §7.12 treats a signed instruction as an artefact with a
       receipt, which is what Dhan's flow may never produce at all. */
    {
      render: (F, ctx) => (
        <>
          <h3>e-Sign the closure form</h3>
          <p className="lede">A code has gone to the mobile linked to your Aadhaar</p>
          <OtpBlock id="xesign" label="Aadhaar OTP" value={F.d.esign || ''} onChange={(v) => ctx.set({ esign: v })} />
          <ReviewRows rows={[['Document', 'Account closure form'], ['Version', 'CLO v1.0']]} />
        </>
      ),
      valid: (F) => !!F.d.esign && F.d.esign.length === 6,
      cta: 'Sign',
    },

    /* PR-76 — the point of no return, named, and the request withdrawable until it. */
    {
      bare: true, nofocus: true, noback: true,
      render: () => (
        <DoneScreen title="Account closure request signed and submitted">
          <div className="rev">
            <div className="rk"><span>Reference</span><b>{'CLO-' + db.ucc + '-0816'}</b></div>
            <div className="rk"><span>Trading and demat accounts</span><b>Close within 1–3 business days</b></div>
            <div className="rk"><span>Status</span><b><Pill kind="warn" label="Being requested" /></b></div>
          </div>
          {/* Two messages, not one: the receipt with the reference and both clocks
              (CLOSURE_REQUESTED), and the signed form (CLOSURE_ESIGNED). PR-128a. */}
          <div className="nb info"><span className="ic">◇</span><div>
            {'We’ve emailed the details to ' + MASK.email
              + '. You can track the closure status from Profile → Account closure'}<Ref r="PR-128a" />
          </div></div>
        </DoneScreen>
      ),
      foot: (F, ok, ctx) => <button className="btn pri" type="button" onClick={ctx.next}>Done</button>,
    },
  ],
  finish: (F) => {
    db.state = 'closing'
    db.closure = { on: '16 August 2026', ref: 'CLO-' + db.ucc + '-0816', reason: F.d.reason,
      route: F.d.route, dp: F.d.dp, cid: F.d.cid, stage: 2 }
    db.signedForms.push({ id: 'cloform', name: 'Account closure form', on: '16 August 2026' })
    setStateSel('closing'); go('closure')
    toast('Closure request submitted. You can still withdraw it.')
  },
})

/* Raised from the support-unhappy retention screen. The customer stays in the
   closure journey — this is a separate promise, and the screen says so. */
registerFlow('escalated', {
  title: 'Talk to a senior team member',
  steps: [{
    bare: true, nofocus: true, noback: true,
    render: () => (
      <DoneScreen title="Thanks for giving us a chance"
        lede="Your request to talk to a senior team member is registered, and we’ll get back to you soon">
        <ReviewRows rows={([['Reference', 'ESC-' + db.ucc + '-0816'],
          ['Raised', '16 August 2026'],
          ['With', 'Senior support team'],
          ['Your closure request', 'Unchanged. It continues as usual']] as [string, string][])
          .concat(ESC_NOTE
            ? ([['What you told us', ESC_NOTE.length > 60 ? ESC_NOTE.slice(0, 57) + '…' : ESC_NOTE]] as [string, string][])
            : [])} />
        <div className="nb info"><span className="ic">◇</span><div>
          {'We’ll contact you on ' + MASK.mobile + ' or ' + MASK.email}
        </div></div>
      </DoneScreen>
    ),
    foot: (F, ok, ctx) => <button className="btn pri" type="button" onClick={ctx.next}>OK</button>,
  }],
  finish: () => { go('closure'); toast('Registered. Reference ESC-' + db.ucc + '-0816', 'ok') },
})

/* Raised from the charges retention screen, where the customer asked to talk
   about pricing without deciding to stay. */
registerFlow('pricingtalk', {
  title: 'Talk to us about pricing',
  steps: [{
    bare: true, nofocus: true, noback: true,
    render: () => (
      <DoneScreen title="We’ll be in touch about your pricing"
        lede="Your request is with our team, and they’ll review it and get back to you">
        <ReviewRows rows={[['Reference', 'PRC-' + db.ucc + '-0816'],
          ['Raised', '16 August 2026'],
          ['With', 'Pricing and relationship team'],
          ['Your closure request', 'Unchanged. It continues as usual']]} />
        <div className="nb info"><span className="ic">◇</span><div>
          {'We’ll contact you on ' + MASK.mobile + ' or ' + MASK.email}
        </div></div>
      </DoneScreen>
    ),
    foot: (F, ok, ctx) => <button className="btn pri" type="button" onClick={ctx.next}>OK</button>,
  }],
  finish: () => { go('closure'); toast('Registered. Reference PRC-' + db.ucc + '-0816', 'ok') },
})

/* The pricing review a customer earns by telling us charges were the reason. */
registerFlow('keptpricing', {
  title: 'Your account stays open',
  steps: [{
    bare: true, nofocus: true, noback: true,
    render: () => (
      <DoneScreen title="Your account stays open"
        lede="We’ve raised a pricing review and passed it to the team who can act on it">
        <ReviewRows rows={[['Reference', 'PRC-' + db.ucc + '-0816'],
          ['Raised', '16 August 2026'],
          ['With', 'Pricing and relationship team'],
          ['Your closure request', 'Not raised. Nothing has changed on your account']]} />
        <div className="nb info"><span className="ic">◇</span><div>
          {'We’ll contact you on ' + MASK.mobile + ' or ' + MASK.email
            + ' with what we can do. If it does not work out, you can close the account at any time'}
        </div></div>
      </DoneScreen>
    ),
    foot: (F, ok, ctx) => <button className="btn pri" type="button" onClick={ctx.next}>OK</button>,
  }],
  finish: () => { go('closure'); toast('Pricing review raised. Reference PRC-' + db.ucc + '-0816', 'ok') },
})
