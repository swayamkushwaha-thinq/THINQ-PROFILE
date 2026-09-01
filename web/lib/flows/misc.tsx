'use client'
/* DDPI, re-consent, and the required-consent withdrawal that routes to closure. */
import { db, go } from '@/lib/store'
import { MASK } from '@/lib/vault'
import { toast } from '@/lib/ui'
import { Pill, Ref } from '@/components/primitives'
import { ReviewRows } from '@/components/ReviewRows'
import { DoneScreen, OtpBlock } from '@/components/flowbits'
import { registerFlow, flow } from './engine'

/* PR-52 — the charge is disclosed before the customer commits. */
registerFlow('ddpi', {
  title: 'Activate DDPI (Instant Sell)',
  steps: [
    {
      render: (F, ctx) => (
        <>
          <h3>e-Sign the DDPI</h3>
          <p className="lede">A code has gone to the mobile linked to your Aadhaar.</p>
          <OtpBlock id="ddpi" label="Aadhaar OTP" value={F.d.otp || ''} onChange={(v) => ctx.set({ otp: v })} />
        </>
      ),
      valid: (F) => !!F.d.otp && F.d.otp.length === 6,
      cta: 'Sign and pay ₹150',
    },
    {
      bare: true, nofocus: true, noback: true,
      render: () => (
        <DoneScreen title="DDPI request signed and submitted"
          lede="It takes 1–3 business days to register. You can track the progress from Profile → Preferences">
          <div className="rev">
            <div className="rk"><span>Document</span><b>DDPI form</b></div>
            <div className="rk"><span>Reference</span><b>{'DDPI-' + db.ucc + '-0814'}</b></div>
            <div className="rk"><span>Charged</span><b>₹150, GST included</b></div>
            <div className="rk"><span>Status</span><b><Pill kind="warn" label="Registering with the depository" /></b></div>
          </div>
          <div className="nb info"><span className="ic">◇</span><div>
            {'We have emailed the signed DDPI form to ' + MASK.email + '. It is also in Profile → Account documents'}
          </div></div>
        </DoneScreen>
      ),
      foot: (F, ok, ctx) => <button className="btn pri" type="button" onClick={ctx.next}>Done</button>,
    },
  ],
  finish: () => {
    db.ddpiRequest = { ref: 'DDPI-' + db.ucc + '-0814', on: '14 August 2026', stage: 2 }
    db.signedForms.push({ id: 'ddpiform', name: 'DDPI (Instant Sell) form', on: '14 August 2026' })
    go('prefs')
    toast('DDPI form signed. CDSL is registering it.', 'ok')
  },
})

/* PR-59 — a materially changed version needs its own acceptance. */
registerFlow('reconsent', {
  title: 'Terms & Conditions v3.1',
  init: (F) => { F.c = db.consents.filter((c) => c.st === 'restated')[0] },
  steps: [
    {
      nofocus: true,
      render: (F) => (
        <>
          <h3>What changed</h3>
          <p className="lede">
            {F.c.why + ' We are asking you to accept the new version rather than assuming your acceptance of '
              + F.c.v + ' covers it, because it does not.'}
          </p>
          <ReviewRows rows={[['You accepted', F.c.v + ' on ' + F.c.on], ['New version', F.c.newV],
            ['Material change', 'Yes']]} />
          <div className="nb info"><span className="ic">◇</span><div>
            Both versions stay on your consent record. We do not overwrite what you agreed to before.<Ref r="PR-58" />
          </div></div>
          <div className="nb info"><span className="ic">◇</span><div>
            The words themselves are owned by Legal. This screen shows you which version applies and when you accepted
            it — it does not rewrite the terms.
          </div></div>
        </>
      ),
      cta: 'Read and accept',
    },
    {
      bare: true, nofocus: true,
      render: (F) => <DoneScreen title="Accepted" lede={'You are now on ' + F.c.newV + '.'} />,
      foot: (F, ok, ctx) => <button className="btn pri" type="button" onClick={ctx.next}>Done</button>,
    },
  ],
  finish: (F) => {
    F.c.v = F.c.newV; F.c.st = 'active'; F.c.on = '14 August 2026'; delete F.c.newV
    go('privacy'); toast('Accepted.', 'ok')
  },
})

/* PR-60 — withdrawing a required consent means closing the account, and the
   customer is routed to closure rather than silently continued. */
registerFlow('cproc', {
  title: 'Withdraw a required consent',
  init: (F) => { F.c = db.consents.filter((c) => c.id === F.arg)[0] },
  steps: [{
    bare: true, nofocus: true,
    render: (F) => (
      <>
        <h3>This one cannot be withdrawn on its own</h3>
        <p className="lede">
          <b>{F.c.name}</b> is what makes it lawful for us to hold your account. Without it we cannot keep your
          records, send your contract notes, or report your trades to the exchange — all of which we are required to
          do while the account exists.
        </p>
        <div className="nb warn"><span className="ic">◇</span><div>
          <b>Withdrawing it means closing the account.</b> That is not us being awkward — there is no version of this
          account that runs without it. If that is what you want, we will take you to the closure flow and you can see
          what is outstanding before deciding.<Ref r="PR-60" />
        </div></div>
      </>
    ),
    foot: (F, ok, ctx) => <button className="btn dgr" type="button" onClick={ctx.next}>Take me to closure</button>,
  }],
  finish: () => { flow('close') },
})
