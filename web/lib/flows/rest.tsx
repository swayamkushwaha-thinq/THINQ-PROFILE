'use client'
/* Nominee correction, the in-product report viewer, the settlement-cycle
   change, the UPI top-up, assisted support, and the two KYC hand-offs. */
import { commit, db, go, isFrozen } from '@/lib/store'
import { MASK } from '@/lib/vault'
import { cycLabel, inr } from '@/lib/dates'
import { NEXT } from '@/lib/seed'
import { periodIsThin, periodLabel, rp } from '@/lib/reports'
import { toast } from '@/lib/ui'
import { Pill, Ref } from '@/components/primitives'
import { ReviewRows } from '@/components/ReviewRows'
import { DoneScreen, OtpBlock } from '@/components/flowbits'
import { primaryBank } from '@/lib/pages/closure'
import { MSG_MAX, MSG_MIN, msgCount, msgCountClass } from './close'
import { registerFlow, flow, goStep, type FlowRun } from './engine'

/* A nominee correction follows the same shape as a contact change — stages
   named up front, identity verified, handed to the team, state shown — because
   it is the same kind of thing: a signed instruction that only a person can
   amend. It is not an inline edit (PR-36) and it is not a generic support note. */
registerFlow('nomchange', {
  title: 'Correct a nominee',
  init: (F) => { F.n = db.nominees[Number(F.arg)] || db.nominees[0]; F.d = { what: '', msg: '' } },
  steps: [
    /* The field picker was removed on owner direction, 14 Aug 2026 — the customer
       says what is wrong in their own words instead of choosing from a list. The
       walkthrough page went on 15 Aug 2026: one message box is not a journey to
       prepare for, so the link lands straight on it. */
    {
      render: (F, ctx) => (
        <>
          <h3>What needs correcting about the nominee?</h3>
          <p className="lede">
            {'A nomination is a signed instruction, so it cannot be edited online. Tell us what is wrong with '
              + (F.n as any).name + '’s record, and our team will verify your request and guide you through the '
              + 'correction process'}
          </p>
          <div className="f">
            <label className="sr" htmlFor="nmsg">What needs correcting about the nominee?</label>
            <textarea id="nmsg" rows={4} maxLength={MSG_MAX} value={F.d.msg}
                      placeholder="The correct detail, and anything we should know"
                      onChange={(e) => ctx.set({ msg: e.target.value })} />
            <div className="foot">
              <span className="hint">Please don’t share your PAN, passwords, or OTPs. Our team will verify your
                identity separately</span>
              <span className={msgCountClass(F.d.msg)} id="nmsgCnt" aria-live="polite">{msgCount(F.d.msg)}</span>
            </div>
          </div>
          <div className="nb info"><span className="ic">◇</span><div>{'We will email you at ' + MASK.email}</div></div>
        </>
      ),
      valid: (F) => (F.d.msg || '').trim().length >= MSG_MIN,
      cta: 'Submit',
    },
    {
      bare: true, nofocus: true, noback: true,
      render: (F) => (
        <DoneScreen title="Nominee update received"
          lede={'We’ve received your nominee modification request and created a ticket with our team. We’ll review '
            + 'the nominee’s details and let you know once the update is complete'}>
          <div className="rev">
            <div className="rk"><span>Reference</span><b>{'NOM-' + db.ucc + '-0814'}</b></div>
            <div className="rk"><span>Nominee</span><b>{(F.n as any).name}</b></div>
            {/* PR-10 — a pending state names what is pending, not just "in progress". */}
            <div className="rk"><span>Status</span><b><Pill kind="warn" label="Under review" /></b></div>
          </div>
          <div className="nb info"><span className="ic">◇</span><div>{'We will email you at ' + MASK.email}</div></div>
        </DoneScreen>
      ),
      foot: (F, ok, ctx) => <button className="btn pri" type="button" onClick={ctx.next}>Done</button>,
    },
  ],
  finish: (F) => {
    db.nomineeRequest = { type: 'edit', name: (F.n as any).name, ref: 'NOM-' + db.ucc + '-0814',
      on: '14 August 2026', stage: 1 }
    go('nominee'); toast('Sent. Reference NOM-' + db.ucc + '-0814', 'ok')
  },
})

/* §7.10a — PR-112. The report renders in the product. Paytm ships eleven
   statement types that render nothing at all. PR-107 is the other half: a
   contract note and a daily margin statement have legally defined contents, so
   the two below carry theirs. */
const RVIEW: Record<string, { lede: string; rows: [string, string][]; foot: string }> = {
  'Contract notes': {
    lede: 'Trades on 14 August 2026, with everything the contract note is required to carry',
    rows: [['Contract note number', 'TQ/2026-27/0000418'],
      ['Trade number · Order number', '5512841 · 1100022994'],
      ['Trade time', '14 Aug 2026, 10:14:22'],
      ['Security · ISIN', 'RELIANCE · INE002A01018'],
      ['Buy or sell · Quantity · Price', 'Buy · 15 · ₹1,412.60'],
      ['Gross amount', '₹21,189.00'],
      ['Brokerage', '₹0.00'],
      ['STT', '₹22.00'],
      ['Exchange transaction charges', '₹0.64'],
      ['SEBI turnover fee', '₹0.02'],
      ['Stamp duty', '₹0.32'],
      ['GST', '₹0.12'],
      ['Net amount payable', '₹21,212.10']],
    foot: 'Every field above is required by SEBI. A trade list with none of them is not a contract note',
  },
  'Daily margin statement': {
    lede: 'Margin position at the close of 14 August 2026',
    rows: [['Segment', 'Equity'],
      ['Margin required', '₹18,400.00'],
      ['Margin available', '₹21,212.10'],
      ['Shortfall', 'Nil'],
      ['Peak margin used', '₹19,880.00'],
      ['Funds available at end of day', '₹2,812.10']],
    foot: 'Required, available, shortfall and peak margin. These are the four the statement exists to state',
  },
}

function RviewBody({ name }: { name: string }) {
  const d = RVIEW[name]
  if (d) return (
    <>
      <p className="lede">{d.lede}</p>
      <ReviewRows rows={d.rows} />
      <div className="nb info"><span className="ic">◇</span><div>{d.foot}<Ref r="PR-107" /></div></div>
    </>
  )
  return (
    <>
      <p className="lede">
        {name + ' for ' + periodLabel()
          + (rp.seg !== 'all' ? ', ' + (rp.seg === 'FNO' ? 'F&O' : rp.seg === 'COMM' ? 'Commodity' : 'Equity') : '')}
      </p>
      <ReviewRows rows={[['Opening', '₹0.00'], ['Credits', '₹1,20,000.00'], ['Debits', '₹1,17,187.90'],
        ['Closing', '₹2,812.10'], ['Entries', '48']]} />
      <div className="nb info"><span className="ic">◇</span><div>
        Rendered here rather than mailed to you. You can still download it or have it emailed<Ref r="PR-112" />
      </div></div>
    </>
  )
}

registerFlow('rview', {
  title: (F) => F.arg || '',
  steps: [{
    bare: true, nofocus: true, noback: true,
    render: (F) => {
      /* PR-111 — an empty result names its window and offers to widen it. The
         worst version of this is Dhan's: a confident illustrated "No Traded
         History" that reads as though the customer has no records at all. */
      if (periodIsThin()) return (
        <>
          <h3>Nothing in this window</h3>
          <p className="lede">{F.arg + ' has no entries for ' + periodLabel()
            + '. Your account has activity from 22 April 2026'}</p>
          <div className="nb warn"><span className="ic">◇</span><div>
            This is an empty window, not an empty account<Ref r="PR-111" />
          </div></div>
        </>
      )
      return <><h3>{F.arg}</h3><RviewBody name={F.arg as string} /></>
    },
    foot: (F, ok, ctx) => {
      if (periodIsThin()) return (
        <button className="btn pri" type="button"
                onClick={() => { rp.period = 'thisfy'; ctx.redraw(); commit(); toast('Showing FY 2026–27', 'ok') }}>
          Show this financial year
        </button>
      )
      return (
        <>
          <button className="btn sec" type="button"
                  onClick={() => toast(F.arg + ' · ' + periodLabel() + ' — downloading', 'ok')}>Download</button>
          <span className="sp"></span>
          <button className="btn pri" type="button" onClick={ctx.cancel}>Done</button>
        </>
      )
    },
  }],
})

/* ── settlement cycle, merged from thinq-account.html ────────────────────────
   Three steps: choose, see exactly what changes, confirm.
   Deliberately absent, because the regulations impose none of it: no lock-in,
   no notice period, no cut-off before a settlement date, no cap on how often you
   may switch, no fee, and no "takes effect next quarter" rule. */
registerFlow('settle', {
  title: 'Change your settlement cycle',
  init: (F) => { F.d = { cycle: db.prefs.settlement } },
  steps: [
    {
      nofocus: true,
      /* ⚠ The lede came off on owner direction, 17 Aug 2026. It was where the
         journey said the absences out loud — no lock-in, no notice period, no
         limit on switching. The step still behaves that way; it no longer says so. */
      render: (F, ctx) => {
        const Opt = ({ v, head, body }: { v: string; head: string; body: React.ReactNode }) => {
          const isCurr = db.prefs.settlement === v
          return (
            <label className="opt">
              <input type="radio" name="cyc" value={v} checked={F.d.cycle === v}
                     onChange={() => ctx.set({ cycle: v })} />
              <span className="ot" style={{ flex: 1 }}>
                <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <b>{head}</b>
                  {isCurr ? <span className="pill ok" style={{ fontSize: 11, padding: '2px 8px', textTransform: 'uppercase', letterSpacing: '.05em' }}>Active</span> : null}
                </span>
                <span>{body}</span>
              </span>
            </label>
          )
        }
        return (
          <>
            <h3>How often should we send your money back?</h3>
            <fieldset><legend className="sr">Settlement cycle</legend>
              <div className="opts">
                {/* <strong>, not <b> — `.opt .ot b` is display:block, which would
                    throw the date onto its own line and orphan the sentence after it. */}
                <Opt v="monthly" head="Monthly"
                     body={<>Twelve dates a year. Your next would be <strong>{NEXT.monthly}</strong></>} />
                {/* ⚠ "the longest gap the rules allow" came off on owner direction,
                    17 Aug 2026. Quarterly is the regulatory floor, not a Thinq choice,
                    and nothing on either surface says so now. */}
                <Opt v="quarterly" head="Quarterly"
                     body={<>Four dates a year. Your next would be <strong>{NEXT.quarterly}</strong></>} />
              </div>
            </fieldset>
            {/* Said in the same words as the row on Preferences, so the journey and
                the surface it came from cannot drift. */}
            <div className="nb info"><span className="ic">◇</span><div>
              Either way, if you don’t trade for 30 days, your entire balance is settled to your bank account on the
              next monthly settlement date
            </div></div>
          </>
        )
      },
      valid: (F) => F.d.cycle !== db.prefs.settlement,
      cta: 'Continue',
    },
    {
      nofocus: true,
      render: (F) => {
        const n = F.d.cycle
        return (
          <>
            <h3>What changes</h3>
            <p className="lede">Only the dates. Nothing about your holdings, your positions or your trading changes</p>
            <ReviewRows rows={[
              ['Now', cycLabel(db.prefs.settlement) + ' — next ' + (NEXT as Record<string, string>)[db.prefs.settlement]],
              ['After this change', cycLabel(n) + ' — next ' + (NEXT as Record<string, string>)[n]],
              ['Takes effect', 'Straight away'],
              /* ⚠ "Changing back — Any time, from the same page" removed on owner
                 direction, 17 Aug 2026. The journey no longer states anywhere that
                 the choice is reversible without cost or notice. */
              ['Paid to', primaryBank()]]} />
            {/* ⚠ Two rights went with the trim, 17 Aug 2026: the retention statement
                within five working days, and the 30-working-day window to dispute what
                it shows. Both are R&O obligations. Recorded in §7.14. */}
            <div className="nb info"><span className="ic">◇</span><div>
              On each settlement date, we’ll text and email you the transfer reference
            </div></div>
            <div className="nb warn"><span className="ic">◇</span><div>
              We may retain what’s needed for your open trades — your pay-in obligation plus up to 225% of your
              end-of-day margin. This applies to both settlement cycles
            </div></div>
          </>
        )
      },
      cta: 'Confirm the change',
    },
    {
      bare: true, nofocus: true, noback: true,
      /* ⚠ The confirmation note came off on owner direction, 17 Aug 2026 — with
         it, the last statement that the change is reversible. */
      render: (F) => (
        <DoneScreen title={'Your settlement cycle is now ' + cycLabel(F.d.cycle).toLowerCase()}
          lede={'Next settlement ' + (NEXT as Record<string, string>)[F.d.cycle] + ', paid to ' + primaryBank()} />
      ),
      foot: (F, ok, ctx) => <button className="btn pri" type="button" onClick={ctx.next}>Done</button>,
    },
  ],
  finish: (F) => {
    db.prefs.settlement = F.d.cycle
    go('prefs')
    toast('Settlement cycle set to ' + cycLabel(F.d.cycle).toLowerCase(), 'ok')
  },
})

/* Adding funds over UPI. Reached from any journey that needs a charge covered
   before it can run. */
registerFlow('upi', {
  title: 'Add funds',
  init: (F) => { F.d = { amt: F.arg ? Number(F.arg) : 0 } },
  steps: [
    {
      nofocus: true,
      render: (F) => (
        <>
          <h3>{'Add ₹' + inr(F.d.amt) + ' over UPI'}</h3>
          <p className="lede">Approve the request in your UPI app. The money reaches your Thinq account in seconds</p>
          <ReviewRows rows={[['Amount', '₹' + inr(F.d.amt)],
            ['From', (db.banks.filter((b) => b.primary)[0] || { bank: '' }).bank + ' ' + MASK.bank1],
            ['Method', 'UPI']]} />
        </>
      ),
      foot: (F, ok, ctx) => (
        <button className="btn pri" type="button" onClick={ctx.next}>{'Pay ₹' + inr(F.d.amt)}</button>
      ),
    },
    {
      bare: true, nofocus: true, noback: true,
      render: (F) => <DoneScreen title={'₹' + inr(F.d.amt) + ' added'} lede="Your Thinq account has been credited" />,
      foot: (F, ok, ctx) => <button className="btn pri" type="button" onClick={ctx.next}>Done</button>,
    },
  ],
  finish: (F) => {
    db.funds += F.d.amt; commit(); toast('₹' + inr(F.d.amt) + ' added to your account', 'ok')
    if (!F.after) return
    const at = F.afterStep
    flow(F.after)
    if (at) goStep(at)
  },
})

/* PR-21 — lost access routes to assisted support, not to an invented path. The
   customer writes to us rather than being shown a ticket they did not raise. */
const SUPPORT_TOPICS = ['I cannot access my old number', 'I cannot access my old email',
  'Something else related to contact']

/* C1's second channel, in the customer's words. Arriving from the freeze
   surface, the topics are about the freeze rather than about contact details. */
const FREEZE_TOPICS = ['I want to freeze my account', 'I want to unfreeze my account',
  'I think someone else has access', 'Something else']

/* Reach them on whatever they still have. If they have not told us a channel is
   gone, we say we will try both rather than picking one for them. */
function replyChannel(F: FlowRun) {
  const t = F.d.topic || ''
  if (/old number/.test(t)) return MASK.email
  if (/old email/.test(t)) return MASK.mobile
  return MASK.mobile + ' and ' + MASK.email
}
function replyLabel(F: FlowRun) {
  const t = F.d.topic || ''
  if (/old number/.test(t)) return 'We will email you at'
  if (/old email/.test(t)) return 'We will call you on'
  return 'We will try to reach you on'
}

registerFlow('support', {
  /* One name for this destination across the product — "Contact us" —
     16 Aug 2026. It was "Write to our team", "Write to us" and "Get help from
     our team" in three places, which is the same defect PR-81 names for status
     labels: one thing wearing several names. */
  title: (F) => F.arg === 'freeze' ? 'Contact us about a freeze'
    : F.arg === 'close' ? 'Contact us about closing'
    : 'Contact us',
  init: (F) => {
    F.frz = (F.arg === 'freeze')
    F.clo = (F.arg === 'close')
    F.lean = F.frz || F.clo              /* no topic pills — the route names it */
    F.topics = F.frz ? FREEZE_TOPICS : SUPPORT_TOPICS
    /* Opens on the thing the customer is most likely here for. */
    F.d = {
      topic: F.frz ? (isFrozen() ? FREEZE_TOPICS[1] : FREEZE_TOPICS[0])
        : F.clo ? 'I want to close my account'
        : SUPPORT_TOPICS[0],
      msg: '',
    }
  },
  steps: [
    {
      render: (F, ctx) => (
        <>
          <h3>Tell us what happened</h3>
          {/* The timings match the ones committed on the Security surface, so a
              request raised this way is not quietly slower than one raised in the
              app — which would make C1's second channel a second channel in name only. */}
          {F.frz ? (
            isFrozen()
              ? <p className="lede">We’ll verify your identity and unfreeze your trading account, usually within 30 minutes</p>
              /* ⚠ The 15-minute figure came off this route on owner direction,
                 16 Aug 2026. The matrix's first limb now has no number here. */
              : <p className="lede">We’ll verify your identity and freeze your trading account during trading hours, or
                  before the start of the next trading session if requested outside trading hours</p>
          ) : F.clo ? (
            <p className="lede">We’ll verify your identity and guide you through anything that needs to be settled
              before your account can be closed</p>
          ) : null}
          {/* PR-82 / AT-P-10 — the group keeps its accessible name; it is only hidden
              visually, so a screen-reader user still hears what the choices are for.
              ⚠ The topic pills were removed from the freeze variant on owner direction,
              16 Aug 2026 — F.d.topic still carries the routing value. */}
          {F.lean ? null : (
            <div style={{ marginBottom: 20, position: 'relative' }}>
              <label htmlFor="stopic" style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink-2)', marginBottom: 8, display: 'block' }}>
                What is this regarding?
              </label>
              <div style={{ position: 'relative' }}>
                <select
                  id="stopic"
                  value={F.d.topic}
                  onChange={(e) => ctx.set({ topic: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '12px 40px 12px 16px',
                    borderRadius: 12,
                    border: '1px solid var(--line2)',
                    background: '#ffffff',
                    color: 'var(--ink)',
                    fontSize: '14px',
                    fontWeight: 500,
                    cursor: 'pointer',
                    outline: 'none',
                    appearance: 'none',
                    WebkitAppearance: 'none',
                    boxShadow: '0 1px 2px rgba(0,0,0,0.03)'
                  }}
                >
                  {(F.topics as string[]).map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
                <div style={{
                  position: 'absolute',
                  right: 16,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  pointerEvents: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  color: 'var(--soft)'
                }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </div>
              </div>
            </div>
          )}
          <div className="f">
            <textarea id="smsg" rows={5} maxLength={MSG_MAX} value={F.d.msg}
                      placeholder={F.lean ? 'What has happened, and what you need us to do'
                        : 'What has happened, and what you need changed'}
                      onChange={(e) => ctx.set({ msg: e.target.value })} />
            <div className="foot">
              <span className="hint">Please don’t share your PAN, passwords, or OTPs. Our team will verify your
                identity separately</span>
              <span className={msgCountClass(F.d.msg)} id="smsgCnt" aria-live="polite">{msgCount(F.d.msg)}</span>
            </div>
          </div>
          {/* Reach them on the channel they still have. Offering to call a number
              they have just told us they cannot access is the same class of defect
              as PR-21 — a route that cannot work. */}
          <div className="rev"><div className="rk"><span>{replyLabel(F)}</span><b>{replyChannel(F)}</b></div></div>
        </>
      ),
      valid: (F) => (F.d.msg || '').trim().length >= MSG_MIN,
      cta: 'Send',
    },
    {
      bare: true, nofocus: true, noback: true,
      /* The heading names the request the route raised, so a closure enquiry does
         not confirm itself as a generic "request". */
      render: (F) => (
        <DoneScreen
          title={F.clo ? 'Account closing request received'
            : F.frz ? (isFrozen() ? 'Account unfreeze request received' : 'Account freeze request received')
            : 'Request received'}
          lede={'We’ll contact you on ' + replyChannel(F)}>
          <ReviewRows rows={[['Reference', 'SUP-' + db.ucc + '-0814'], ['About', F.d.topic],
            ['Sent', '14 August 2026']]} />
          <div className="nb info"><span className="ic">◇</span><div>
            Please keep your PAN handy when we call. Our team will verify your identity and guide you through the process
          </div></div>
        </DoneScreen>
      ),
      foot: (F, ok, ctx) => <button className="btn pri" type="button" onClick={ctx.next}>Done</button>,
    },
  ],
  finish: () => { toast('Sent. Reference SUP-' + db.ucc + '-0814', 'ok') },
})

/* PR-08 — the resume point comes from the same stage code the §18 comms use. */
registerFlow('resume', {
  title: 'Resume your application',
  steps: [{
    bare: true, nofocus: true,
    render: () => (
      <>
        <h3>Back to income proof</h3>
        <p className="lede">You stopped at income proof for Futures &amp; Options. That is the step this takes you
          back to — the same one the reminder we sent you points at, and the same one the assistant would tell you.</p>
        <ReviewRows rows={[['Stage', db.kycStage], ['Step', 'Income proof for derivatives'],
          ['Everything before it', 'Saved']]} />
      </>
    ),
    foot: (F, ok, ctx) => <button className="btn pri" type="button" onClick={ctx.next}>Take me there</button>,
  }],
  finish: () => { toast('The KYC journey would open at step 9. Profile only points at it.') },
})

registerFlow('descope', {
  title: 'Open with equity only',
  steps: [{
    bare: true, nofocus: true,
    render: () => (
      <>
        <h3>Open with equity only?</h3>
        <p className="lede">Futures &amp; Options will be left off this application and your account will open with
          equity. You can start trading straight away.</p>
        <div className="nb warn"><span className="ic">◇</span><div>
          <b>This removes the segment from this application — it does not park it.</b> Adding F&amp;O later is a
          separate journey with its own income proof, its own form and its own signature. Nothing from today carries over.
        </div></div>
      </>
    ),
    foot: (F, ok, ctx) => (
      <button className="btn dgr" type="button" onClick={ctx.next}>Open with equity only</button>
    ),
  }],
  finish: () => { toast('F&O removed from this application. It is obtainable later from Segments.') },
})
