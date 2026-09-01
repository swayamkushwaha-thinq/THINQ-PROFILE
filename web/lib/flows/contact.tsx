'use client'
/* ═════════════════════════════════════════════════════════════════════════════
   §7.2 Contact change — the flow Registration D-28 hands off.
   PR-16 · PR-17 · PR-18 · PR-19 · PR-20 · PR-22 · D-29
   ═════════════════════════════════════════════════════════════════════════════ */
import { commit, db, go } from '@/lib/store'
import { MASK, VAULT } from '@/lib/vault'
import { toast } from '@/lib/ui'
import { Pill, Ref } from '@/components/primitives'
import { DoneScreen, Ferr, OtpBlock, PinBlock, StagesList } from '@/components/flowbits'
import { ReviewRows } from '@/components/ReviewRows'
import { zone } from '@/lib/pages/contact'
import { registerFlow, type FlowStep } from './engine'
import { chgAsk, DEMO_BAD_PIN, EMAIL_RE, maskEmail, maskMobile } from './shared'

const prePan: FlowStep[] = [{
  bare: true, nofocus: true,
  render: (F) => (
    <DoneScreen title="This one is in sign-in settings"
      lede={'You have not started KYC, so your ' + F.kind + ' is still just how you sign in. It is not part of a KYC '
        + 'record yet, so you can change it yourself and it takes effect straight away.'}>
      <div className="nb info"><span className="ic">◇</span><div>
        Profile changes nothing here. It only takes you to the place that does — which is why this screen is a
        hand-off rather than a form.
      </div></div>
    </DoneScreen>
  ),
  foot: (F, ok, ctx) => <button className="btn pri" type="button" onClick={ctx.next}>Open sign-in settings</button>,
}]

const assisted: FlowStep[] = [{
  bare: true, nofocus: true,
  render: (F) => (
    <DoneScreen title="Our team will make this change"
      lede={'Because your PAN is verified, your ' + F.kind + ' is tied to an identified person and a KYC record that '
        + 'is no longer ours alone to set. We will make the change after a quick identity check.'}>
      <div className="nb info"><span className="ic">◇</span><div>
        {'We have started that for you. Someone will get in touch on your existing '
          + (F.kind === 'email' ? 'mobile' : 'email') + ' to confirm it is you. Your sign-in is not affected in the '
          + 'meantime.'}
      </div></div>
      <div className="nb info"><span className="ic">◇</span><div>
        We are not quoting how long this takes.<Ref r="PR-22" />
      </div></div>
    </DoneScreen>
  ),
  foot: (F, ok, ctx) => <button className="btn pri" type="button" onClick={ctx.next}>Got it</button>,
}]

const full: FlowStep[] = [
  /* 1 — PR-17: state plainly, before the customer starts, what this is. */
  {
    nofocus: true,
    render: (F) => {
      const isM = F.kind === 'mobile'
      const cur = isM ? 'current mobile number' : 'current email address'
      const noun = isM ? 'mobile' : 'email'
      const give = isM ? 'Enter your new number and confirm it with an OTP'
        : 'Enter your new address and confirm it with an OTP'
      const upd = isM ? 'Your mobile number is updated within 1–3 business days'
        : 'Your email address is updated within 1–3 business days'
      return (
        <>
          <h3>Before you start</h3>
          <p className="lede">
            {'Your registered ' + F.kind + ' is part of your KYC record, so changing it is a verified modification '
              + 'rather than a simple edit'}
          </p>
          <StagesList items={[
            ['Verify your identity', 'Enter your Thinq PIN and verify the OTP sent to your ' + cur],
            ['Verify your new ' + noun, give],
            ['e-Sign with Aadhaar', 'Verify with an OTP sent to your Aadhaar-linked mobile number'],
            ['We update your records', upd + '. You can track the progress from Profile → Contact details']]} />
        </>
      )
    },
    /* The charge is asked in a pop-up on the way out of this page, so the
       customer reads what the journey involves first and is told the price at
       the moment they commit to it. */
    foot: (F) => (
      <button className="btn pri" type="button" onClick={() => chgAsk(F.kind)}>
        Continue
      </button>
    ),
  },

  /* 2 — PR-18: two factors. */
  {
    render: (F, ctx) => (
      <>
        <h3>Verify your identity</h3>
        <PinBlock id="pin" label="Enter your Thinq PIN" value={F.d.pin || ''}
                  onChange={(v) => ctx.set({ pin: v })} />
        <div id="pinErr">
          {F.d.pin === DEMO_BAD_PIN ? (
            <div className="nb bad"><span className="ic">!</span><div>That PIN is not right. Try again</div></div>
          ) : null}
        </div>
        <OtpBlock id="old" value={F.d.old || ''} onChange={(v) => ctx.set({ old: v })}
                  label={'Enter OTP sent to your current ' + F.kind + ' ('
                    + (F.kind === 'email' ? MASK.email : MASK.mobile) + ')'} />
        {/* PR-18 — still two factors; the explanation of why is what went. */}
      </>
    ),
    valid: (F) => (F.d.pin || '').length === 4 && F.d.pin !== DEMO_BAD_PIN && (F.d.old || '').length === 6,
    cta: 'Verify',
  },

  /* 3 — the new value.
     Single entry — the confirm field went on owner direction, 14 Aug 2026. The
     new address is still verified by an OTP sent to it at the next step, so a
     typo cannot complete the change; it just fails later rather than being
     caught here. */
  {
    render: (F, ctx) => {
      const isE = F.kind === 'email'
      return (
        <>
          {isE ? (
            <div className="ff">
              <input type="email" id="nv1" autoComplete="off" placeholder=" " value={F.d.n1 || ''}
                     onChange={(e) => ctx.set({ n1: e.target.value, enNew: '' })} />
              <label htmlFor="nv1">Your new email</label>
            </div>
          ) : (
            <div className="ff pfx">
              <input type="tel" id="nv1" inputMode="numeric" maxLength={10} autoComplete="off" placeholder=" "
                     value={F.d.n1 || ''}
                     onChange={(e) => ctx.set({ n1: e.target.value.replace(/\D/g, ''), enNew: '' })} />
              <label htmlFor="nv1">Your new mobile</label>
              <span className="cc">+91</span>
            </div>
          )}
          <Ferr msg={F.d.enNew} />
        </>
      )
    },
    /* Send OTP CTA is enabled when 10 digits are entered for mobile (or valid email). */
    valid: (F) => (F.kind === 'email' ? EMAIL_RE.test((F.d.n1 || '').trim()) : /^\d{10}$/.test((F.d.n1 || '').trim())),
    onNext: (F) => {
      const v = (F.d.n1 || '').trim()
      const ok = F.kind === 'email' ? EMAIL_RE.test(v) : /^[6-9]\d{9}$/.test(v)
      if (!ok && v) F.d.enNew = F.kind === 'email'
        ? 'Enter a valid email address.' : 'Enter a valid 10-digit mobile number.'
      else F.d.enNew = ''
      return ok
    },
    cta: 'Send OTP',
  },

  /* 4 — D-29: the OTP to the new address is address verification, NOT a factor.
     The explanation of that went on owner direction, 14 Aug 2026; the behaviour
     is unchanged. */
  {
    render: (F, ctx) => {
      const shown = F.kind === 'email' ? maskEmail(F.d.n1) : maskMobile(F.d.n1)
      return (
        <>
          <h3>{'Confirm the new ' + F.kind}</h3>
          <p className="lede">{'Enter the OTP sent to your new ' + (F.kind === 'mobile' ? 'mobile number' : 'email address') + ' (' + shown + ')'}</p>
          <OtpBlock id="nw" label="" value={F.d.nw || ''} onChange={(v) => ctx.set({ nw: v })} />
        </>
      )
    },
    valid: (F) => (F.d.nw || '').length === 6,
    cta: 'Submit the change',
  },

  /* 5 — PR-19 / PR-20. A registered contact detail sits on the KYC record, so
     the change is e-Signed the same way a nomination is. */
  {
    render: (F, ctx) => (
      <>
        <h3>e-Sign with Aadhaar</h3>
        <p className="lede">Enter the OTP sent to your Aadhaar-linked mobile number</p>
        <OtpBlock id="cesign" label="" value={F.d.esign || ''} onChange={(v) => ctx.set({ esign: v })} />
      </>
    ),
    valid: (F) => (F.d.esign || '').length === 6,
    cta: 'Sign',
  },

  {
    bare: true, nofocus: true, noback: true,
    render: (F) => {
      const isM = F.kind === 'mobile'
      return (
        <DoneScreen
          title={(isM ? 'Mobile number' : 'Email address') + ' change request signed and submitted'}
          /* The heading already says it was signed and submitted, so the lede
             starts at the part the customer does not know yet. */
          lede={'It may take 1–3 business days to reflect on your account. You can track the status from '
            + 'Profile → Contact details'}>
          <ReviewRows rows={[
            ['New ' + (isM ? 'mobile' : 'email'), isM ? maskMobile(F.d.n1) : maskEmail(F.d.n1)],
            ['Reference', 'CHG-' + db.ucc + '-0814'],
            ['Status', <Pill key="st" kind="warn" label="Being updated" />],
          ]} />
          <div className="nb info"><span className="ic">◇</span><div>
            {'We’ve sent a confirmation email with the e-Signed ' + (isM ? 'mobile' : 'email')
              + ' change form attached. It is also in Profile → Account documents'}
          </div></div>
          {/* PR-19 still fires — the out-of-band security notice goes to the
              channel that did not change. Saying so on this screen was removed
              on owner direction, 14 Aug 2026. */}
        </DoneScreen>
      )
    },
    foot: (F, ok, ctx) => <button className="btn pri" type="button" onClick={ctx.next}>Done</button>,
  },
]

registerFlow('contact', {
  title: (F) => 'Change your ' + (F.arg || 'contact detail'),
  init: (F) => {
    F.zone = zone(); F.kind = F.arg || 'email'
    /* PR-16 — the zone is resolved before any control is presented. */
    if (F.zone === 'pre_pan') F.steps = prePan
    else if (F.zone === 'pan_verified') F.steps = assisted
    else F.steps = full
  },
  steps: full,
  finish: (F) => {
    if (F.zone === 'pre_pan') { toast('Sign-in settings would open here. Profile changes nothing in this zone.'); return }
    if (F.zone === 'pan_verified') { toast('Request handed to our team. Nothing has changed yet.'); return }
    /* PR-20 — done at Thinq, pending at the depository: two facts, shown as two. */
    db.contactChange = { kind: F.kind, value: F.d.n1, on: '14 August 2026',
      reqid: 'CHG-' + db.ucc + '-0814', stage: 3 } as any
    db.signedForms.push({ id: 'chgform', name: (F.kind === 'mobile' ? 'Mobile number' : 'Email address') + ' change form',
      on: '14 August 2026' })
    if (F.d.n1) {
      VAULT[F.kind as 'mobile' | 'email'] = F.d.n1
      MASK[F.kind as 'mobile' | 'email'] = F.kind === 'email' ? maskEmail(F.d.n1) : maskMobile(F.d.n1)
    }
    go('contact')
    toast('Updated at Thinq. The depository record is still being updated.', 'ok')
  },
})
