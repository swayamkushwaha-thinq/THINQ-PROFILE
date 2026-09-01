'use client'
/* ═════════════════════════════════════════════════════════════════════════════
   Freeze · unfreeze — rebuilt 16 Aug 2026 from six teardowns (Groww, Angel One,
   Dhan, Sahi, Fyers, DreamStreet) against SEBI/HO/MIRSD/POD-1/P/CIR/2024/4 as
   operationalised by NSE/INSP/61529 and BSE 20240408-12, w.e.f. 1 Jul 2024.
   Every requirement below exists because a named product got it wrong.
   ═════════════════════════════════════════════════════════════════════════════ */
import { useEffect } from 'react'
import { commit, db, go } from '@/lib/store'
import { MASK, VAULT, remaskAll } from '@/lib/vault'
import { isoOf, TODAY_ISO } from '@/lib/dates'
import { setStateSel, toast } from '@/lib/ui'
import { Ref } from '@/components/primitives'
import { ReviewRows } from '@/components/ReviewRows'
import { DoneScreen, OtpBlock, PinBlock } from '@/components/flowbits'
import { openFnoPositions } from '@/lib/pages/security'
import { registerFlow, flow, closeFlowInternal, type FlowCtx, type FlowRun } from './engine'
import { DEMO_BAD_PIN } from './shared'

/* The dedicated freeze channel. On the customer-facing domain on purpose: Sahi
   publishes stoptrade@aaritya.com while every surface a client has ever seen
   says sahi.com, so in an emergency they must guess a domain that does not
   publish the policy. C2 is technically arguable there and practically broken. */
export const STOPTRADE = 'stoptrade@thinq.in'

registerFlow('freeze', {
  title: 'Freeze account',
  init: (F) => { F.d = {} },
  steps: [
    /* 1 — the quicker fixes, on the way in. DreamStreet does this and gets it
       wrong in one specific way: it labels the requested action "Freeze Account
       Anyway" in a pale button beneath three full-contrast alternatives, so the
       layout argues with the customer. Here the alternatives are offered and the
       freeze keeps the primary button — PR-112a. */
    {
      nofocus: true,
      render: (F, ctx) => (
        <>
          <h3>Suspect unauthorised access?</h3>
          <p className="lede">Take these quick security steps to secure your account without stopping trading</p>
          <div className="card" style={{ margin: 0 }}>
            {/* Three labels, no sub-lines — each row says what it does. */}
            <div className="prow" style={{ paddingTop: 2 }}>
              <span className="t"><b>Change your PIN</b></span>
              <span className="c"><button className="btn sec sm" type="button"
                onClick={() => { closeFlowInternal(true); flow('pin') }}>Change PIN</button></span>
            </div>
            <div className="prow">
              <span className="t"><b>Disable biometric</b></span>
              <span className="c"><label className="tgl">
                <input type="checkbox" id="bioTgl" checked={db.prefs.biometric}
                       onChange={(e) => { db.prefs.biometric = e.target.checked; commit() }} /><i></i>
              </label></span>
            </div>
            <div className="prow">
              <span className="t"><b>Log out of everywhere</b></span>
              <span className="c"><button className="btn sec sm" type="button"
                onClick={() => { closeFlowInternal(true); go('security') }}>Logout</button></span>
            </div>
            {/* ⚠ The "Freeze the demat account too" row was removed on owner
                direction, 16 Aug 2026. It was the last surface for PR-111a's second
                half — the framework's online-access carve-out and the teardown's
                biggest cross-cutting finding. There is no longer a route to freeze
                the demat account too. */}
          </div>
        </>
      ),
      cta: 'Continue to freeze',
    },

    /* 2 — open positions. Fyers refuses to freeze a client who holds them, which
       "defeats the facility in the exact scenario it exists for". We freeze
       anyway and commit to C3(c): position details with contract expiry within
       one hour. Only Angel One states both, of five. */
    {
      nofocus: true,
      skipIf: () => !openFnoPositions().length,
      render: () => {
        const pos = openFnoPositions()
        return (
          <>
            <h3>You have open positions</h3>
            <p className="lede">We will still freeze the account. You should know what stays open, because you will
              not be able to act on it until you lift the freeze</p>
            <ReviewRows rows={(pos.map((p) => [p, 'Stays open']) as [string, string][])
              .concat([['Pending orders', 'Cancelled when the freeze takes effect'],
                ['Positions at expiry', 'Settled by the exchange as normal']] as [string, string][])} />
            <div className="nb warn"><span className="ic">◇</span><div>
              Within an hour of the freeze we will email and text you the full list with each contract’s expiry date,
              so you can decide whether to lift it before then
            </div></div>
          </>
        )
      },
      cta: 'I understand',
    },

    /* 3 — confirm. ⚠ The "What happens when the freeze takes effect" step went on
       owner direction, 16 Aug 2026. Its list is still on Security as the scope
       accordion; the three commitments it carried moved onto this step, which is
       where the customer actually commits. */
    {
      render: (F, ctx) => (
        <>
          <h3>Confirm it’s you</h3>
          <PinBlock id="fpin" label="Enter your Thinq PIN" value={F.d.pin || ''} onChange={(v) => ctx.set({ pin: v })} />
          {/* The timing and the way back are on the scope accordion; what we send
              is on the closing screen, where it describes something that has just
              happened rather than something that might. */}
          <div id="pinErr">
            {F.d.pin === DEMO_BAD_PIN ? (
              <div className="nb bad"><span className="ic">!</span><div>That PIN is not right</div></div>
            ) : null}
          </div>
        </>
      ),
      valid: (F) => (F.d.pin || '').length === 4 && F.d.pin !== DEMO_BAD_PIN,
      foot: (F, ok, ctx) => (
        <button className="btn dgr" type="button" disabled={!ok} onClick={ctx.next}>Freeze my account</button>
      ),
    },

    /* ⚠ The reference number, the effect time and the demat/devices rows went on
       owner direction, 16 Aug 2026, and the acknowledgement line went with them.
       Nothing in the journey now states that an email and an SMS are sent —
       PR-109a and C3(b) are specified in §18.3 as ACCOUNT_FROZEN but have no
       surface. What remains is the way back (C7, PR-113a). */
    {
      bare: true, nofocus: true, noback: true,
      render: () => (
        <DoneScreen title="Your account is frozen"
          lede="No one can place an order, including you. Your holdings and your money are untouched">
          <div className="nb info"><span className="ic">◇</span><div>
            <b>How to unfreeze.</b> Log in to your account and follow the prompt to unfreeze your account
            <Ref r="PR-113a" />
          </div></div>
        </DoneScreen>
      ),
      foot: (F, ok, ctx) => <button className="btn pri" type="button" onClick={ctx.next}>OK</button>,
    },
  ],
  finish: () => {
    db.state = 'frozen'; db.unfreezeReq = false; setStateSel('frozen')
    /* Ending every session is the point, so this one goes too. */
    remaskAll(); go('freeze')
    toast('Account frozen and every device logged out.', 'ok')
  },
})

/* C7 — "necessary due diligence" and nothing more. Groww's video KYC and Dhan's
   24 hours are their own choices, not the regulator's, and neither says so.
   A one-screen acknowledgement: the request is already raised by the time this
   renders — the screen reports it rather than collecting it. */
registerFlow('unfreezereq', {
  title: 'Unfreeze account',
  steps: [{
    bare: true, nofocus: true, noback: true,
    /* ⚠ The lede went on owner direction, 16 Aug 2026, after the turnaround had
       already gone. The assisted route now states neither what happens next nor
       when — the reference and the contact line carry the whole screen. */
    render: () => (
      <DoneScreen title="Account unfreeze request received"
        lede={'We’ll contact you on ' + MASK.mobile + ' and ' + MASK.email + '. Please keep your PAN handy'}>
        {/* A reference the customer can quote. The assisted route has no other
            handle on the request, and UNFREEZE_REQUESTED carries the same details
            to them by email and SMS. */}
        <ReviewRows rows={[['Reference', 'UNF-' + db.ucc + '-0816'],
          ['Request', 'Unfreeze trading account'],
          ['Raised', '16 August 2026']]} />
      </DoneScreen>
    ),
    foot: (F, ok, ctx) => <button className="btn pri" type="button" onClick={ctx.next}>OK</button>,
  }],
  finish: () => { go('freeze') },
})

/* Checked against the vault, never against anything the render layer holds —
   the same rule §6.1 applies to reveals. */
function uvOk(F: FlowRun) {
  if (F.d.vmethod === 'pan') return F.d.pan === VAULT.pan.toUpperCase()
  return F.d.dob === isoOf(VAULT.dob)
}

/* Unfreezing is not instant on the exchange side, so the screen says so rather
   than flashing a success the moment the form is submitted. The step advances
   itself; there is nothing here for the customer to press. */
function UnfreezingStep({ F, ctx }: { F: FlowRun; ctx: FlowCtx }) {
  useEffect(() => {
    const t = setTimeout(() => { if (F.i === 2) ctx.goStep(3) }, 2200)
    return () => clearTimeout(t)
  }, [])
  return (
    <>
      <h3><span className="spin"></span> Unfreezing your account</h3>
      <p className="lede">This takes a moment. Do not close this screen</p>
    </>
  )
}

registerFlow('unfreeze', {
  title: 'Unfreeze account',
  init: (F) => { F.d = { vmethod: 'pan', pan: '', dob: '' } },
  steps: [
    /* ⚠ The lede went on owner direction, 16 Aug 2026 — with it, the last
       turnaround stated on the self-service unfreeze route. */
    {
      render: (F, ctx) => (
        <>
          <h3>Unfreeze your account?</h3>
          <PinBlock id="upin" label="Enter your Thinq PIN" value={F.d.pin || ''} onChange={(v) => ctx.set({ pin: v })} />
          <div id="pinErr">
            {F.d.pin === DEMO_BAD_PIN ? (
              <div className="nb bad"><span className="ic">!</span><div>That PIN is not right</div></div>
            ) : null}
          </div>
          {/* ⚠ The note explaining the two factors, and that no video call or
              branch visit is required, was removed on owner direction, 16 Aug 2026.
              PR-113a's point — that a lighter unfreeze is our own choice rather than
              a regulatory minimum — is now made nowhere. */}
          <OtpBlock id="uotp" label={'OTP sent to ' + MASK.mobile} value={F.d.otp || ''}
                    onChange={(v) => ctx.set({ otp: v })} />
        </>
      ),
      valid: (F) => (F.d.pin || '').length === 4 && F.d.pin !== DEMO_BAD_PIN && (F.d.otp || '').length === 6,
      cta: 'Continue',
    },

    /* PIN and OTP get the customer into the account; they do not prove the person
       lifting a freeze is the account holder rather than whoever prompted the
       freeze in the first place. One more thing only the holder knows — added on
       owner direction, 16 Aug 2026. */
    {
      render: (F, ctx) => {
        const isPan = F.d.vmethod === 'pan'
        /* Only complain once they have entered a whole value — telling someone
           their half-typed PAN is wrong is not help. */
        const fullV = isPan ? (F.d.pan || '').length === 10 : !!F.d.dob
        return (
          <>
            <h3>Verify it’s you</h3>
            {/* The chip already names what is being entered, so the field label is
                carried for screen readers only — as is the group legend. */}
            <fieldset><legend className="sr">How would you like to verify?</legend>
              <div className="pills">
                <label><input type="radio" name="uvm" value="pan" checked={isPan}
                              onChange={() => ctx.set({ vmethod: 'pan' })} /><span>PAN</span></label>
                <label><input type="radio" name="uvm" value="dob" checked={!isPan}
                              onChange={() => ctx.set({ vmethod: 'dob' })} /><span>Date of birth</span></label>
              </div>
            </fieldset>
            {isPan ? (
              <div className="f"><label className="sr" htmlFor="uPan">PAN</label>
                <input type="text" id="uPan" maxLength={10} autoComplete="off" spellCheck="false"
                       placeholder="ABCDE1234F" style={{ textTransform: 'uppercase' }} value={F.d.pan || ''}
                       onChange={(e) => ctx.set({ pan: e.target.value.toUpperCase().trim() })} /></div>
            ) : (
              <div className="f"><label className="sr" htmlFor="uDob">Date of birth</label>
                <input type="date" id="uDob" max={TODAY_ISO} value={F.d.dob || ''}
                       onChange={(e) => ctx.set({ dob: e.target.value })} /></div>
            )}
            <div id="uvErr">
              {fullV && !uvOk(F) ? (
                <div className="nb bad"><span className="ic">!</span><div>That does not match what we have on record</div></div>
              ) : null}
            </div>
          </>
        )
      },
      valid: (F) => uvOk(F),
      cta: 'Unfreeze',
    },

    {
      bare: true, nofocus: true, noback: true,
      render: (F, ctx) => <UnfreezingStep F={F} ctx={ctx} />,
      foot: () => null,
    },

    {
      bare: true, nofocus: true, noback: true,
      render: () => (
        <DoneScreen title="Your account is unfrozen" lede="Trading is enabled again">
          <div className="nb info"><span className="ic">◇</span><div>
            {'We’ve emailed the details to ' + MASK.email}
          </div></div>
        </DoneScreen>
      ),
      /* The button names what happens next rather than acknowledging the screen —
         the account is live again, so it points at trading. */
      foot: (F, ok, ctx) => <button className="btn pri" type="button" onClick={ctx.next}>Start trading</button>,
    },
  ],
  finish: () => {
    db.state = 'active'; db.unfreezeReq = false; setStateSel('active'); go('freeze')
    toast('Trading is enabled again', 'ok')
  },
})
