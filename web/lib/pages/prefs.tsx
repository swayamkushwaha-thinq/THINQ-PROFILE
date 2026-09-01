'use client'
/* ═════════════════════════════════════════════════════════════════════════════
   Settlement cycle — merged in from thinq-account.html, 16 Aug 2026.
   Source: NSE circular 4/2026 (NSE/INSP/72413), 20 Jan 2026, issued jointly
   with BSE under SEBI/HO/MIRSD/MIRSD-PoD1/P/CIR/2023/197.
   ⚠ These are not first Fridays. 17 Apr, 15 May and 16 Oct are mid-month. This
   is what corrects Profile's old hardcoded "2 October 2026". See P-5 on screen.
   ═════════════════════════════════════════════════════════════════════════════ */
import { commit, contactLockReason, db, isClosing, isLocked, isRO } from '@/lib/store'
import { MASK } from '@/lib/vault'
import { NEXT } from '@/lib/seed'
import { cycLabel, settleLockReason } from '@/lib/dates'
import { BlockedBox, EditIcon, EntityNote, Head, Pill, Ref } from '@/components/primitives'
import { RoBanner } from '@/components/RoBanner'
import { StageStepper } from '@/components/StageStepper'
import { Timeline, type TlStep } from '@/components/Timeline'
import { ReviewRows } from '@/components/ReviewRows'
import { confirmModal } from '@/components/ConfirmModal'
import { closeModal } from '@/lib/ui'
import { flow } from '@/lib/flows/engine'

export const CAL = {
  quarterly: ['17 / 18 Apr 2026', '3 / 4 Jul 2026', '16 / 17 Oct 2026', '1 / 2 Jan 2027'],
  monthly: ['17 / 18 Apr 2026', '15 / 16 May 2026', '5 / 6 Jun 2026', '3 / 4 Jul 2026',
    '7 / 8 Aug 2026', '4 / 5 Sep 2026', '16 / 17 Oct 2026', '6 / 7 Nov 2026',
    '4 / 5 Dec 2026', '1 / 2 Jan 2027', '5 / 6 Feb 2027', '5 / 6 Mar 2027'],
}

/* PR-52 — DDPI is registered at the depository, so it carries the same
   in-progress / completed step pair as a nomination or a contact change. */
function DdpiStatusCard() {
  const r = db.ddpiRequest as any
  const steps: TlStep[] = [
    ['Request submitted', 'You asked to activate DDPI', 'DDPI_SUBMITTED'],
    ['e-Signed with Aadhaar', 'We’ve sent a confirmation email to ' + MASK.email + ' with the e-Signed DDPI form '
      + 'attached', 'DDPI_ESIGNED'],
    ['Registering with the depository', 'CDSL is registering the DDPI against your demat account',
      'DDPI_DP_REGISTERING',
      'Registered with the depository', 'CDSL has the DDPI on your demat record', 'DDPI_DP_REGISTERED'],
    ['DDPI active', 'Selling no longer needs a separate CDSL OTP', 'DDPI_ACTIVE'],
  ]
  /* Same shape as the contact-change tracker (PR-97a): the row above already
     says Activation in progress, so this is a way in rather than a second
     status, and it closes itself once there is nothing left to follow. */
  return (
    <details className="row col" open={r.stage < 3}>
      <summary><b>Track progress</b><Ref r="PR-52" /><span className="chev" aria-hidden="true"></span></summary>
      <div className="body">
        <div className="quiet" style={{ borderTop: 'none', marginTop: 0, paddingTop: 0 }}>
          Reference <b>{r.ref}</b> · started {r.on}
        </div>
        <Timeline steps={steps} stage={r.stage} />
        {r.stage >= 3 ? (
          <div className="btnrow">
            <button className="btn sec sm" type="button"
                    onClick={() => { db.ddpiRequest = null; commit() }}>Dismiss</button>
          </div>
        ) : null}
        <StageStepper which="ddpi" stage={r.stage} max={3} />
      </div>
    </details>
  )
}

export function ddpiAsk() {
  confirmModal({
    title: 'DDPI (Instant Sell) charges',
    body: <ReviewRows rows={[['One-time fee', '₹150, GST included'],
      ['Recurring cost', 'None'],
      ['Charged to', 'Your Thinq account']]} />,
    ok: 'Continue',
    onOk: () => { closeModal(); flow('ddpi') },
  })
}

function SettlementCard() {
  const c = db.prefs.settlement
  /* Two different reasons the control can be withdrawn, and only one of them
     belongs on this row. The settlement lock is specific to this card, so it
     replaces the date. The contact lock is stated once in the page banner
     already (PR-139a), so the row stays as it was and only the control goes. */
  const lock = (!isRO() && !isClosing()) ? settleLockReason() : ''
  const noEdit = isRO() || isClosing() || !!lock || !!contactLockReason()
  return (
    <div className="card">
      <div className="chead">
        <div>
          <h2>Settlement cycle<Ref r="PR-38" /></h2>
          <div className="sub">How often unused money in your trading account is sent back to your bank</div>
        </div>
        <div className="act"><Pill kind={c === 'monthly' ? 'ok' : 'mute'} label={cycLabel(c)} /></div>
      </div>
      <div className="prow">
        <span className="t"><b>Your cycle</b>
          {/* Amber, the same token the Not available pill beside it uses — a sentence
              that withdraws a control should not read like the ordinary sub-line. */}
          {lock
            ? <span style={{ color: 'var(--warn)' }}>{lock}<Ref r="PR-138a" /></span>
            : <span>Next settlement <strong>{(NEXT as Record<string, string>)[c]}</strong></span>}
        </span>
        <span className="c">
          {noEdit ? null
            : <button className="mini icon-only" type="button" aria-label="Change" title="Change" onClick={() => flow('settle')}><EditIcon size={14} /></button>}
        </span>
      </div>
      {/* One row and one accordion — owner direction, 17 Aug 2026. <strong>, not
          <b>, mid-sentence: `.prow .t b` is display:block and would throw the word
          onto its own line. */}
      <details className="row col" open>
        <summary><b>Every settlement date this financial year</b><span className="chev" aria-hidden="true"></span></summary>
        <div className="body">
          <div className="prow" style={{ paddingTop: 2 }}>
            <span className="t"><b>Quarterly</b><span>{CAL.quarterly.join(' · ')}</span></span>
            <span className="c">{c === 'quarterly' ? <Pill kind="ok" label="Yours" /> : null}</span>
          </div>
          <div className="prow">
            <span className="t"><b>Monthly</b><span>{CAL.monthly.join(' · ')}</span></span>
            <span className="c">{c === 'monthly' ? <Pill kind="ok" label="Yours" /> : null}</span>
          </div>
          <div className="prow">
            <span className="t"><b>If you do not trade for 30 days</b>
              <span>Your entire balance is settled to your bank account on the next <strong>monthly</strong> settlement date</span>
            </span>
            <span className="c"><Pill kind="warn" label="Overrides your cycle" /></span>
          </div>
          {/* ⚠ The running-account authorisation row was removed on owner direction,
              17 Aug 2026. It was the only place Profile named the authorisation that
              makes holding a balance lawful at all. Recorded in §7.14.
              ⚠ The circular reference — FY 2026-27, NSE circular 4/2026 — came off the
              same day; P-5 turns on exactly that citation. */}
          <div className="quiet">The exchanges publish these dates jointly at the start of each financial year; we don’t
            choose them. Each settlement date falls on a Friday and Saturday</div>
          <div className="nb info"><span className="ic">◇</span><div>
            <b>This is different from T+1.</b> T+1 is the normal settlement of a trade, when money from a sale becomes
            withdrawable on the next trading day. The monthly cycle above applies only to idle funds being settled to
            your bank account
          </div></div>
        </div>
      </details>
      {/* ⚠ "Why a settlement rarely returns everything" removed on owner direction,
          17 Aug 2026. With it goes the only surface that says a settlement may
          return less than the balance. Recorded in §7.14. */}
    </div>
  )
}

export function PrefsPage() {
  const p = db.prefs
  const disabled = isLocked()
  return (
    <>
      <Head eyebrow="Preferences" title="Preferences" />
      <RoBanner />
      <div className="card">
        {/* PR-52 — the one-time charge is disclosed before the customer commits. */}
        <div className="prow">
          <span className="t"><b>DDPI (Instant Sell)</b><span>
            {p.ddpi ? 'Selling does not need a separate CDSL OTP'
              : db.ddpiRequest ? ''
              /* ⚠ The ₹150 came off this line on owner direction, 17 Aug 2026. The
                 charge is now disclosed only in the pop-up that opens on Activate. */
              : 'Activate it once, and you won’t need a separate CDSL OTP for each sale'}
          </span></span>
          <span className="c">
            {p.ddpi ? <Pill kind="ok" label="Active" />
              : db.ddpiRequest ? <Pill kind="warn" label="Activation in progress" />
              : (disabled ? <Pill kind="mute" label="Not active" />
                : <button className="btn sec sm" type="button" onClick={ddpiAsk}>Activate</button>)}
          </span>
        </div>
        {db.ddpiRequest ? <DdpiStatusCard /> : null}
      </div>

      {/* PR-38 — merged in from the account sandbox, 16 Aug 2026. Two bare radio
          pills with no flow behind them became a real journey. */}
      <SettlementCard />

      <div className="card">
        {/* Contract-note delivery removed from Preferences on owner direction,
            14 Aug 2026. PR-51 now has no surface. Recorded in the build notes. */}
        {/* PR-54 — the English/Hindi choice, persisted across surfaces. */}
        <div className="prow">
          <span className="t"><b>Language</b><span>Applies across Thinq, including the help centre</span></span>
          <span className="c">
            <fieldset><legend className="sr">Language</legend>
              <div className="pills">
                <label><input type="radio" name="lang" value="en" checked={p.lang === 'en'} disabled={disabled}
                              onChange={() => { p.lang = 'en'; commit() }} /><span>English</span></label>
                <label><input type="radio" name="lang" value="hi" checked={p.lang === 'hi'} disabled={disabled}
                              onChange={() => { p.lang = 'hi'; commit() }} /><span>हिन्दी</span></label>
              </div>
            </fieldset>
          </span>
        </div>
      </div>

      {/* Notifications removed from Preferences on owner direction, 14 Aug 2026.
          PR-53 and PR-55 now have no surface at all. Recorded in the build notes. */}

      <BlockedBox id="P-5 · P0 — answerable now, from the exchange calendar"
                  owner="Compliance — but the date source is now identified">
        <p>This build previously showed the next quarterly settlement as <b>2 October 2026</b> — the <i>first Friday of
          the quarter</i>. That rule was replaced in December 2023 by a joint exchange calendar, and the published
          FY 2026-27 quarterly dates are 17/18 Apr, 3/4 Jul, <b>16/17 Oct</b> and 1/2 Jan. <code>HC-FUND-10</code>’s
          rolling 90 / 30-day clock is wrong for the same reason. Neither a rolling clock nor a first-Friday rule — the
          dates are pre-published and must be read from the circular. The dates above now are</p>
      </BlockedBox>
      <EntityNote />
    </>
  )
}
