'use client'
/* PR-73 / PR-76 — what is outstanding, the state of each, and a named point of
   no return with the request withdrawable until it. */
import { commit, contactLockReason, db, go, isClosing, isRO } from '@/lib/store'
import { MASK } from '@/lib/vault'
import { openRequests } from '@/lib/dates'
import { BlockedBox, EntityNote, Head, Pill, Ref } from '@/components/primitives'
import { RoBanner } from '@/components/RoBanner'
import { ReviewRows } from '@/components/ReviewRows'
import { StageStepper } from '@/components/StageStepper'
import { Timeline, type TlStep } from '@/components/Timeline'
import { flow } from '@/lib/flows/engine'

export function primaryBank() {
  const b: any = db.banks.filter((x) => x.primary)[0] || db.banks[0] || {}
  return (b.bank || 'your primary account') + ' ' + (MASK.bank1 || '')
}

/* The closure counterpart of freezeScopeRows — same shape, same place in the
   card, so the two decisions are described the same way and can be compared. */
export function CloseScopeRows() {
  return <ReviewRows rows={[
    ['Your trading and demat accounts', 'Both will be permanently closed'],
    ['Your holdings', 'Must be sold or transferred to another demat account before closure'],
    /* The balance goes to the primary account because that is where settlements
       go (§7.4). primaryBank() resolves whichever account is flagged primary,
       so this follows a change made on Bank accounts. */
    ['Your money', 'Withdraw your balance to ' + primaryBank() + ' before you close'],
    ['Statements and contract notes', 'You won’t be able to download them here after closure'],
    ['Opening an account again', 'You can open a new account later. Your KYC record remains with the KRA'],
    ['What it costs', 'There’s no charge to close your account']]} />
}

function ClosureCard() {
  const c: any = db.closure = (db.closure as any) || { on: '16 August 2026', ref: 'CLO-TQ004217-0816' }
  if (typeof c.stage !== 'number') c.stage = 2

  /* Everything at account level — holdings, balance, dues, positions, pledges —
     had to clear before the request could be raised, so there is nothing left to
     chase here. What remains is the part the customer cannot see and cannot
     influence: us deregistering the client code at the exchanges and closing the
     demat account at the depository.
     Both legs are named, and named separately, for the reason PR-45 gives on
     segments and PR-20 gives on a contact change. */
  const steps: TlStep[] = [
    ['Request submitted', 'You asked to close your account', 'CLO_SUBMITTED'],
    ['e-Signed with Aadhaar', 'We’ve emailed the signed closure form to ' + MASK.email, 'CLO_ESIGNED'],
    ['Submitting to the exchanges', 'We are deregistering your client code with NSE and BSE',
      'CLO_EXCH_SUBMITTING',
      'Deregistered at the exchanges', 'NSE and BSE have removed your client code', 'CLO_EXCH_DONE'],
    ['Submitting to the depository', 'CDSL is closing your demat account ' + MASK.boid, 'CLO_DP_SUBMITTING',
      'Closed at the depository', 'CDSL has closed your demat account', 'CLO_DP_DONE'],
    ['Account closed', 'Both your trading and demat accounts are closed', 'CLO_COMPLETED'],
  ]

  const pnr = c.stage >= 3   /* the depository submission is the point of no return */

  return (
    <div className="card">
      <div className="prow">
        <span className="t"><b>Closure in progress</b><Ref r="PR-73" /><span>Requested {c.on}</span></span>
        <span className="c">{c.stage >= 4 ? <Pill kind="ok" label="Closed" /> : <Pill kind="warn" label="In progress" />}</span>
      </div>
      <details className="row col" open>
        <summary><b>Track progress</b><span className="chev" aria-hidden="true"></span></summary>
        <div className="body">
          <div className="quiet" style={{ borderTop: 'none', marginTop: 0, paddingTop: 0 }}>
            Reference <b>{c.ref}</b> · started {c.on}
          </div>
          <Timeline steps={steps} stage={c.stage} />
          {/* One line, not two. The mandated clocks differ — 3 working days for the
              trading account (NSE/INSP/49055), 2 for the demat account (CDSL, eff.
              14 Jul 2025) — but the customer is waiting for both to finish, so the
              outer bound is the number that answers their question. */}
          <ReviewRows rows={[['Accounts closing', 'TQ' + db.ucc.replace(/^TQ/, '') + ' and ' + MASK.boid],
            ['How long', '1–3 business days']]} />
          {/* PR-76 — before the depository leg the Withdraw button is the whole message,
              so it carries it alone. Only the irreversible state needs words. */}
          {pnr ? (
            <div className="nb warn"><span className="ic">◇</span><div>
              This has passed the point of no return — the closure is with the depository and can no longer be
              withdrawn<Ref r="PR-76" />
            </div></div>
          ) : null}
          <StageStepper which="clo" stage={c.stage} max={4} />
        </div>
      </details>
      {/* ⚠ The Withdraw control was removed on owner direction, 17 Aug 2026. With it
          goes the last surface for PR-76 — the request can no longer be withdrawn
          from the product at any stage. Recorded in §7.14. */}
      <BlockedBox id="P-7 · P1" owner="Operations + Compliance">
        <p>The steps above, their order and the placement of the point of no return are illustrative. No document
          specifies the closure process, the dues calculation or the transfer route.</p>
      </BlockedBox>
    </div>
  )
}

export function ClosurePage() {
  if (isClosing()) {
    return <><Head eyebrow="Account services" title="Account closure" /><ClosureCard /><EntityNote /></>
  }
  /* PR-74 — closure is reachable from the product at all, which neither
     competitor offers; the Dhan teardown calls its absence "dark-pattern-ish". */
  const pend = openRequests()
  return (
    <>
      <Head eyebrow="Account services" title="Account closure" />
      <RoBanner />
      <div className="card">
        <div className="prow">
          <span className="t"><b>Permanently close account</b></span>
          <span className="c">
            {isRO() ? <Pill kind="mute" label="Not available" />
              : pend.length ? null
              : <button className="btn dgr sm" type="button" onClick={() => flow('close')}>Close account</button>}
          </span>
        </div>
        {/* Named, not just refused. A greyed control with no reason is the defect
            PR-05 exists for, so the request is named, its reference quoted, and the
            tracker is one tap away. If the page banner is already saying a change is
            in flight (PR-139a), this would be the same refusal twice on one screen. */}
        {pend.length && !isRO() && !contactLockReason() ? (
          <div className="nb warn"><span className="ic">◇</span><div>
            Some requests are still being processed. Please wait for them to complete before closing your account
            <Ref r="PR-133a" />
            <div className="btnrow" style={{ marginTop: 10 }}>
              {/* The notice no longer names the requests, so the controls have to. The
                  label is quoted as written — lower-casing the first letter turns DDPI
                  into dDPI. */}
              {pend.map((r, i) => (
                <button className="btn sec sm" type="button" key={i} onClick={() => go(r.go)}>Track {r.t}</button>
              ))}
            </div>
          </div></div>
        ) : null}
        {/* Same treatment as the freeze: what the action reaches, attached to the row
            that offers it, and a second channel for anyone who cannot use the first. */}
        <details className="row col">
          <summary><b>What closing your account means</b><Ref r="PR-73" />
            <span className="chev" aria-hidden="true"></span></summary>
          <div className="body">
            <p className="quiet" style={{ borderTop: 'none', margin: '0 0 12px', padding: 0 }}>
              Closing your account is a permanent action. Please ensure you have downloaded any necessary statements,
              as they will no longer be available afterward
            </p>
            <CloseScopeRows />
            {pend.length ? null : (
              <div className="quiet">Facing an issue?{' '}
                <button className="lnk" type="button" onClick={() => flow('support:close')}>Contact us</button>{' '}
                to close your account<Ref r="PR-74" />
              </div>
            )}
          </div>
        </details>
      </div>

      {/* PR-75 — dormancy: inactivity disables trading pending a short
          re-verification, and holdings and money remain safe and withdrawable. */}
      <details className="cardc" open>
        <summary><h3 style={{ fontWeight: 400 }}>If you don’t trade for a long time<Ref r="PR-75" /></h3>
          <span className="chev" aria-hidden="true"></span></summary>
        <div className="body">
          <div className="prow" style={{ paddingTop: 2 }}>
            <span className="t"><b>Your account becomes dormant</b>
              <span>Trading is switched off until you complete the re-KYC required under SEBI regulations to
                reactivate your account</span></span>
          </div>
          <div className="prow">
            <span className="t"><b>Your money and holdings are safe</b>
              <span>Your funds and investments remain yours and can still be withdrawn. Trading will resume after you
                complete the required re-KYC</span></span>
            <span className="c"><Pill kind="ok" label="Always" /></span>
          </div>
        </div>
      </details>

      <BlockedBox id="P-7 · P1" owner="Operations + Compliance">
        <p><b>No document specifies the closure process.</b> <code>HC-ACC-08</code> publishes the path and the
          outstanding-items behaviour, but not the process, the dues calculation, the holdings-transfer route or where
          the point of no return sits. TnC §8 also routes a C-PROC consent withdrawal into this flow</p>
      </BlockedBox>
      <EntityNote />
    </>
  )
}
