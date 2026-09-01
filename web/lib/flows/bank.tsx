'use client'
/* ═════════════════════════════════════════════════════════════════════════════
   §7.4 Bank accounts.  PR-28 · PR-29 · PR-33
   ═════════════════════════════════════════════════════════════════════════════ */
import { useEffect } from 'react'
import { db, go } from '@/lib/store'
import { MASK, TIER, VAULT } from '@/lib/vault'
import { BANK_LIMIT } from '@/lib/db'
import { toast } from '@/lib/ui'
import { Ref } from '@/components/primitives'
import { ReviewRows } from '@/components/ReviewRows'
import { DoneScreen } from '@/components/flowbits'
import { QrBlock, TqLoader } from '@/components/QrBlock'
import { registerFlow, type FlowCtx, type FlowRun, type FlowStep } from './engine'

/* Ported from the KYC journey's bank step so the two behave alike: the same
   loader and escalating message, the same demo failure rule (an account number
   ending in an odd digit comes back as a name mismatch), and the same
   three-attempt ceiling on typed entry. `bankTries` lives outside the flow
   because the ceiling is per customer, not per attempt at opening the journey. */
export let bankTries = 0
const BANK_LOAD_1 = 'Verifying your bank account…'
const BANK_LOAD_2 = 'Confirming details with your bank…'
const BANK_TRY_MAX = 3

/* An IFSC identifies a branch, not just a bank, and the customer cannot check
   eleven characters by eye. Echoing back what the code resolves to is the only
   check available before the ₹1 goes out.
   ⚠ Prototype directory. The real lookup is the RBI/NPCI IFSC master. */
const IFSC_DIR: Record<string, string> = {
  HDFC0001204: 'Satellite, Ahmedabad', ICIC0000281: 'Prahladnagar, Ahmedabad',
  INDB0000588: 'Andheri West, Mumbai', UTIB0000123: 'Fort, Mumbai',
  KKBK0001234: 'Koramangala, Bengaluru', SBIN0011513: 'Nariman Point, Mumbai',
  PUNB0123456: 'Connaught Place, New Delhi',
}

function bankFromIfsc(i: string) {
  return ({ HDFC: 'HDFC Bank', ICIC: 'ICICI Bank', SBIN: 'State Bank of India', UTIB: 'Axis Bank',
    KKBK: 'Kotak Mahindra Bank', PUNB: 'Punjab National Bank', INDB: 'IndusInd Bank',
    YESB: 'Yes Bank', IDFB: 'IDFC First Bank', BARB: 'Bank of Baroda',
    CNRB: 'Canara Bank', UBIN: 'Union Bank of India' } as Record<string, string>)[i.slice(0, 4)] || 'Your bank'
}

function IfscBranch({ code }: { code: string }) {
  const c = String(code || '').toUpperCase()
  if (!/^[A-Z]{4}0[A-Z0-9]{6}$/.test(c)) return null
  const bank = bankFromIfsc(c), br = IFSC_DIR[c]
  /* An unrecognised code is not an error — the directory here is seven entries
     long — but it is not a confirmation either, and it must not read like one. */
  return br
    ? <div className="hint" style={{ color: 'var(--ok)' }}>{bank + ' · ' + br}</div>
    : <div className="hint">We will confirm the branch when the ₹1 clears</div>
}

/* The demo failure: odd last digit. Kept identical to KYC so the same test
   account behaves the same way in both journeys. */
function bankWillMismatch(acc: string) { return parseInt(String(acc).slice(-1), 10) % 2 === 1 }

/* The scanned route never asks for the two fields, so the values come back from
   the payment. Fixed here because the prototype has no UPI to ask. */
function bankFromRoute(F: FlowRun) {
  return F.d.route === 'qr'
    ? { acc: '50100247884417', ifsc: 'UTIB0000123', method: 'upi' }
    : { acc: F.d.acc, ifsc: F.d.ifsc, method: 'manual' }
}

/* ⚠ The CTA came off the scan screen on owner direction, 17 Aug 2026. Nothing
   there for the customer to press is right — the approval happens on their
   phone. The screen waits for the payment and moves itself; the guard is the
   same one the unfreeze progress step uses, so a timer cannot fire into a flow
   that has been closed or stepped away from. */
function ScanStep({ F, ctx }: { F: FlowRun; ctx: FlowCtx }) {
  useEffect(() => {
    const t = setTimeout(() => { if (F.i === 0) { F.d.route = 'qr'; ctx.done() } }, 10000)
    return () => clearTimeout(t)
  }, [])
  return (
    <>
      <h3>Approve request in your UPI app</h3>
      <p className="lede">Approve the ₹1 request in your UPI app. ₹1 will be temporarily debited and refunded within 1–3 business days</p>
      <QrBlock seed={db.ucc + '-bank-' + db.banks.length} />
      <div className="nb info" style={{ textAlign: 'center', justifyContent: 'center' }}><span className="ic">◇</span><div>
        Bank account holder name must match <b>{db.name}</b><Ref r="PR-28" />
      </div></div>
      <div className="quiet" style={{ textAlign: 'center' }}>
        <span className="spin"></span> Waiting for you to approve it in your UPI app
      </div>
      <div className="quiet" style={{ textAlign: 'center', borderTop: 'none', paddingTop: 0 }}>
        {'Cannot scan? '}
        <button className="lnk" type="button"
                onClick={() => { F.d.route = 'details'; ctx.goStep(1) }}>Enter your account number and IFSC</button>
      </div>
    </>
  )
}

/* The check itself, on the same loader the KYC journey uses. The customer is
   not asked how to verify any more — the typed route is a ₹1 credit, the
   scanned route is the payment they just approved. */
function VerifyStep({ F, ctx }: { F: FlowRun; ctx: FlowCtx }) {
  useEffect(() => {
    const t2 = setTimeout(() => {
      const el = document.getElementById('loadMsg')
      if (!el) return
      el.style.opacity = '0'
      setTimeout(() => { el.textContent = BANK_LOAD_2; el.style.opacity = '1' }, 200)
    }, 1400)
    const t = setTimeout(() => {
      if (F.i !== 2) return
      if (F.d.force || bankWillMismatch(F.d.acc)) { F.d.force = false; bankTries++; F.d.fail = true; ctx.goStep(3) }
      else { bankTries = 0; F.d.fail = false; ctx.goStep(4) }
    }, 2600)
    return () => { clearTimeout(t); clearTimeout(t2) }
  }, [])
  return <TqLoader msg={BANK_LOAD_1} />
}

const atLimit: FlowStep[] = [{
  bare: true, nofocus: true,
  render: () => (
    <>
      <h3>You have reached the limit</h3>
      <p className="lede">
        {'You can link up to ' + BANK_LIMIT + ' bank accounts, and you already have ' + BANK_LIMIT
          + ' — an account still being verified counts as one of them. '
          + 'Remove one you no longer use and you can add a different account in its place.'}
      </p>
    </>
  ),
  foot: (F, ok, ctx) => <button className="btn sec" type="button" onClick={ctx.cancel}>Back to my accounts</button>,
}]

const steps: FlowStep[] = [
  /* PR-153a — no route question, owner direction 17 Aug 2026. The account number
     and IFSC are the two things a customer least reliably has to hand, and
     mistyping either is the one error in this journey that validation cannot
     catch. So the code is the screen, and typing is a line underneath it. */
  {
    nofocus: true,
    render: (F, ctx) => <ScanStep F={F} ctx={ctx} />,
    foot: () => null,
  },

  {
    skipIf: (F) => F.d.route !== 'details',
    /* ⚠ The lede came off on owner direction, 17 Aug 2026. The own-name rule
       survives on the scan screen only; the running count against the limit
       (PR-29a) now appears only on the Bank accounts surface. */
    render: (F, ctx) => (
      <>
        <h3>Your account details</h3>
        <div className="f"><label htmlFor="ba">Account number</label>
          <input type="text" id="ba" inputMode="numeric" autoComplete="off" value={F.d.acc || ''}
                 onChange={(e) => ctx.set({ acc: e.target.value })} /></div>
        <div className="f"><label htmlFor="bi">IFSC</label>
          {/* ⚠ The hint came off on owner direction, 17 Aug 2026. The placeholder is
              the only thing left telling a customer what an IFSC looks like. */}
          <input type="text" id="bi" autoComplete="off" placeholder="HDFC0001204" value={F.d.ifsc || ''}
                 onChange={(e) => ctx.set({ ifsc: e.target.value.toUpperCase() })} />
          <div id="bifsc"><IfscBranch code={F.d.ifsc || ''} /></div></div>
      </>
    ),
    valid: (F) => (F.d.acc || '').length >= 8 && /^[A-Z]{4}0[A-Z0-9]{6}$/.test(F.d.ifsc || ''),
    cta: 'Continue',
  },

  {
    bare: true, nofocus: true, noback: true,
    skipIf: (F) => F.d.route !== 'details',
    render: (F, ctx) => <VerifyStep F={F} ctx={ctx} />,
    foot: () => null,
  },

  /* The mismatch, and the ceiling. Both are the KYC screens, said the same way:
     the two names side by side, because "verification failed" without them
     leaves the customer guessing which of the two is wrong. */
  {
    bare: true, nofocus: true, noback: true,
    skipIf: (F) => !F.d.fail,
    /* The only ways off this screen are the two controls below it. Without this,
       Enter — or any stale call to fnext() — walks straight past a failed name
       check onto the receipt. */
    valid: () => false,
    render: (F) => {
      if (bankTries >= BANK_TRY_MAX) {
        /* Word for word the KYC journey's limit sheet, so a customer who hit this
           during onboarding meets the same sentence here.
           ⚠ The reassurance came off on owner direction, 17 Aug 2026. */
        return (
          <>
            <h3>Limit reached</h3>
            <p className="lede">
              {'You’ve reached the maximum of ' + BANK_TRY_MAX + ' attempts to verify manually. Please verify '
                + 'instantly with UPI.'}
            </p>
          </>
        )
      }
      /* PR-77 — Name on PAN reads from the record, not from the KYC prototype's
         demo customer. A screen labelled "Name on PAN" that says otherwise is a
         false value, not a copy choice. */
      const viaQr = F.d.route === 'qr'
      return (
        <>
          <h3>Name doesn’t match</h3>
          <ReviewRows rows={[['Bank account holder', 'Rajesh Sharma'], ['Name on PAN', db.name]]} />
          <div className="nb bad"><span className="ic">!</span><div>
            {viaQr ? 'Use a bank account in your own name'
              : 'We can only add a bank account in your own name. Check the details or verify it using UPI'}
            <Ref r="PR-28" />
          </div></div>
          {viaQr ? null : <div className="quiet">{'Attempt ' + bankTries + ' of ' + BANK_TRY_MAX}</div>}
        </>
      )
    },
    foot: (F, ok, ctx) => {
      const toUpi = () => { F.d.fail = false; F.d.route = 'qr'; ctx.goStep(0) }
      if (F.d.route === 'qr')
        return <button className="btn pri" type="button" onClick={toUpi}>Scan again</button>
      return bankTries >= BANK_TRY_MAX
        ? <button className="btn pri" type="button" onClick={toUpi}>Verify with UPI</button>
        /* The typed values survive a failed attempt — retyping eleven characters
           to fix one of them is friction we added, not verification we need. */
        : <button className="btn pri" type="button"
                  onClick={() => { F.d.fail = false; ctx.goStep(1) }}>Edit account details</button>
    },
  },

  {
    bare: true, nofocus: true, noback: true,
    render: (F) => {
      const d = bankFromRoute(F)
      return (
        <DoneScreen title="Bank account added successfully"
          lede="The account is on your list. It cannot be used for withdrawals until both checks clear.">
          <ReviewRows rows={[['Account', '•••••••••' + d.acc.slice(-4)], ['IFSC', d.ifsc],
            ['Method', d.method === 'upi' ? 'UPI — ₹1 debited and reversed' : 'Manual — ₹1 credited to the account'],
            ['Name check', 'Against your KYC/PAN name, when the ₹1 clears']]} />
          {/* PR-29 — a pending account carries its reason and its next step. */}
          <div className="nb info"><span className="ic">◇</span><div>
            You will see it on your Bank accounts screen marked <b>Being verified</b> until the checks clear. It will
            not sit there with no state.<Ref r="PR-29" />
          </div></div>
        </DoneScreen>
      )
    },
    foot: (F, ok, ctx) => <button className="btn pri" type="button" onClick={ctx.next}>Done</button>,
  },
]

registerFlow('bank', {
  title: 'Add a bank account',
  init: (F) => {
    F.d = { route: 'qr', acc: '', acc2: '', ifsc: '', method: 'upi' }
    /* the limit is enforced here too, not only by hiding the button */
    if (db.banks.length >= BANK_LIMIT) F.steps = atLimit
  },
  steps,
  finish: (F) => {
    if (F.steps === atLimit) return
    const d = bankFromRoute(F)
    db.banks.push({
      id: 'b' + (db.banks.length + 1), bank: bankFromIfsc(d.ifsc), branch: '—', ifsc: d.ifsc,
      type: 'Savings', f: ('bankN' + db.banks.length) as any, primary: false, status: 'pending',
      method: d.method === 'upi' ? 'UPI (₹1 debit, reversed)' : 'Manual (₹1 credit)', on: '14 August 2026',
      note: undefined,
    })
    const k = ('bankN' + (db.banks.length - 1)) as any
    VAULT[k] = d.acc; MASK[k] = '•••••••••' + d.acc.slice(-4); TIER[k] = 'A'
    /* One sentence for both routes — the scanned one has no receipt screen, so
       this is its whole confirmation, and two different words for one outcome is
       two outcomes to a customer. */
    go('banks')
    toast('Bank account added successfully', 'ok')
  },
})

/* PR-33 — changing the primary account states the effect on in-flight settlements. */
registerFlow('primary', {
  title: 'Change your primary account',
  init: (F) => {
    F.b = db.banks.filter((b) => b.id === F.arg)[0]
    F.old = db.banks.filter((b) => b.primary)[0]
  },
  steps: [{
    bare: true, nofocus: true,
    render: (F) => (
      <>
        <h3>{'Make ' + F.b.bank + ' your primary account?'}</h3>
        <ReviewRows rows={[['Currently', F.old.bank + ' ' + MASK[F.old.f as keyof typeof MASK]],
          ['Changing to', F.b.bank + ' ' + MASK[F.b.f as keyof typeof MASK]]]} />
        <div className="nb warn"><span className="ic">◇</span><div>
          {'Ongoing payouts arrive in ' + F.old.bank + '; future settlements go to ' + F.b.bank + '.'}<Ref r="PR-27" />
        </div></div>
      </>
    ),
    foot: (F, ok, ctx) => (
      <button className="btn pri" type="button" onClick={ctx.next}>Make this my primary account</button>
    ),
  }],
  finish: (F) => {
    db.banks.forEach((b) => { b.primary = false })
    F.b.primary = true
    go('banks'); toast(F.b.bank + ' is now your primary account.', 'ok')
  },
})
