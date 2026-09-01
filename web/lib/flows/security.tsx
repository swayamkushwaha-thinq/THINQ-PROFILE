'use client'
/* PIN, authenticator app, the CMR re-issue, and the KRA modification. */
import { commit, db, go } from '@/lib/store'
import { MASK } from '@/lib/vault'
import { toast } from '@/lib/ui'
import { Ref } from '@/components/primitives'
import { ReviewRows } from '@/components/ReviewRows'
import { DoneScreen, OtpBlock, PinBlock, StagesList } from '@/components/flowbits'
import { registerFlow } from './engine'

registerFlow('pin', {
  title: 'Change your 4-digit Thinq PIN',
  steps: [
    {
      render: (F, ctx) => (
        <>
          <h3>Your current PIN</h3>
          <p className="lede">This screen belongs to sign-in. Profile takes you to it rather than building a second one.</p>
          <PinBlock id="cp" label="Current PIN" value={F.d.cp || ''} onChange={(v) => ctx.set({ cp: v })} />
        </>
      ),
      valid: (F) => (F.d.cp || '').length === 4,
      cta: 'Continue',
    },
    {
      render: (F, ctx) => (
        <>
          <h3>Choose a new PIN</h3>
          <p className="lede">Four digits. Avoid your date of birth.</p>
          <PinBlock id="np" label="New PIN" value={F.d.np || ''} onChange={(v) => ctx.set({ np: v })} />
          <PinBlock id="np2" label="Confirm new PIN" value={F.d.np2 || ''} onChange={(v) => ctx.set({ np2: v })} />
        </>
      ),
      valid: (F) => (F.d.np || '').length === 4 && F.d.np === F.d.np2,
      cta: 'Save PIN',
    },
    {
      bare: true, nofocus: true, noback: true,
      render: () => (
        <DoneScreen title="PIN changed" lede="We have sent a notice to your registered email. It has no link in it." />
      ),
      foot: (F, ok, ctx) => <button className="btn pri" type="button" onClick={ctx.next}>Done</button>,
    },
  ],
  finish: () => { go('security'); toast('PIN changed.', 'ok') },
})

registerFlow('totp', {
  title: 'Set up your authenticator app',
  steps: [
    {
      nofocus: true,
      render: () => (
        <>
          <h3>Add an authenticator app</h3>
          <p className="lede">Scan this in Google Authenticator, Authy or any app that generates six-digit codes.
            From then on you will be asked for a code when you sign in.</p>
          <div className="drop" style={{ cursor: 'default' }}><b>▦ ▦ ▦</b><span>QR code</span></div>
          <ReviewRows rows={[['Or enter this key', 'KZXW 6YTB OI5D 2QRS'], ['Account', 'Thinq · ' + db.ucc]]} />
          <div className="nb info"><span className="ic">◇</span><div>
            Keep the key somewhere safe. If you lose the app and the key, only our team can get you back in
          </div></div>
        </>
      ),
      cta: 'I have added it',
    },
    {
      render: (F, ctx) => (
        <>
          <h3>Enter a code from the app</h3>
          <p className="lede">This confirms the app and Thinq agree</p>
          <OtpBlock id="totp" label="Six-digit code" value={F.d.code || ''} onChange={(v) => ctx.set({ code: v })} />
        </>
      ),
      valid: (F) => !!F.d.code && F.d.code.length === 6,
      cta: 'Turn it on',
    },
    {
      bare: true, nofocus: true, noback: true,
      render: () => (
        <DoneScreen title="Authenticator app is on"
                    lede="You will be asked for a code the next time you sign in" />
      ),
      foot: (F, ok, ctx) => <button className="btn pri" type="button" onClick={ctx.next}>Done</button>,
    },
  ],
  finish: () => { db.totp = true; go('security'); toast('Authenticator app turned on', 'ok') },
})

registerFlow('totpoff', {
  title: 'Turn off your authenticator app',
  steps: [{
    bare: true, nofocus: true,
    render: () => (
      <>
        <h3>Turn off the authenticator app?</h3>
        <p className="lede">Your account goes back to your PIN and passkeys alone. We will tell you separately when
          you do this</p>
      </>
    ),
    foot: (F, ok, ctx) => <button className="btn dgr" type="button" onClick={ctx.next}>Turn it off</button>,
  }],
  finish: () => {
    db.totp = false; go('security')
    toast('Authenticator app turned off. We have sent a security notice to your registered email')
  },
})

/* PR-68 — CMR re-issue, free, to the registered email. */
registerFlow('cmr', {
  title: 'Email me a fresh Client master report',
  steps: [{
    bare: true, nofocus: true,
    render: () => (
      <>
        <h3>Send a fresh copy?</h3>
        <p className="lede">We will generate a current Client master report and email it to your registered address.
          There is no charge for this.</p>
        <ReviewRows rows={[['Sending to', MASK.email], ['Format', 'PDF'], ['Charge', 'None']]} />
        <div className="nb info"><span className="ic">◇</span><div>
          It goes to your registered email, not to an address you type here — that is deliberate. If your email has
          changed, change it first.
        </div></div>
      </>
    ),
    foot: (F, ok, ctx) => <button className="btn pri" type="button" onClick={ctx.next}>Email it to me</button>,
  }],
  finish: () => { toast('On its way to ' + MASK.email + '.', 'ok') },
})

/* §7.3 — a KRA/depository modification follows the §7.2 pattern: explain,
   verify, hand off, show state. */
registerFlow('kra', {
  title: (F) => 'Change your ' + (F.arg === 'name' ? 'name' : 'address'),
  init: (F) => { F.what = F.arg === 'name' ? 'name' : 'address'; F.d = {} },
  steps: [
    {
      nofocus: true,
      render: (F) => (
        <>
          <h3>This is a KRA modification</h3>
          <p className="lede">
            {'Your ' + F.what + ' is part of the KYC record held at the KRA and passed to the depository. Changing it '
              + 'means updating that record, which needs a document proving the new ' + F.what + ' and an identity '
              + 'check. It is not something either of us can just edit.'}
          </p>
          <StagesList items={[
            ['Upload proof', 'A document showing your new ' + F.what + '.'],
            ['We check it is you', 'Aadhaar OTP.'],
            ['We submit it to the KRA', 'And show you where it has got to.'],
            ['It reflects at the depository', 'Separately, after the KRA accepts it.']]} />
          <div className="nb info"><span className="ic">◇</span><div>
            We will not quote a completion date. The KRA’s part is not ours to promise.<Ref r="PR-22" />
          </div></div>
        </>
      ),
      cta: 'Start',
    },
    {
      nofocus: true,
      render: (F, ctx) => (
        <>
          <h3>Upload your proof</h3>
          <p className="lede">{F.what === 'address'
            ? 'Aadhaar, passport, driving licence, a utility bill under three months old, or a bank statement.'
            : 'A gazette notification, a marriage certificate, or your updated PAN card.'}</p>
          <div className="drop" id="drop2" onClick={() => ctx.set({ doc: 'statement_jan-jun_2026.pdf' })}>
            <b>{F.d.doc ? F.d.doc : 'Choose a file'}</b>
            <span>{F.d.doc ? 'Tap to choose a different one' : 'PDF, JPG or PNG · up to 10 MB'}</span>
          </div>
        </>
      ),
      valid: (F) => !!F.d.doc,
      cta: 'Continue',
    },
    {
      render: (F, ctx) => (
        <>
          <h3>Verify your identity</h3>
          <p className="lede">A code has gone to the mobile linked to your Aadhaar.</p>
          <OtpBlock id="kra" label="Aadhaar OTP" value={F.d.otp || ''} onChange={(v) => ctx.set({ otp: v })} />
        </>
      ),
      valid: (F) => (F.d.otp || '').length === 6,
      cta: 'Submit to the KRA',
    },
    {
      bare: true, nofocus: true, noback: true,
      render: (F) => (
        <DoneScreen title="Submitted to the KRA"
          lede={'Your ' + F.what + ' change is with the KRA. We will show you its state on your Personal & KYC '
            + 'details screen.'}>
          <ul className="tl">
            <li className="done"><span className="d"></span><span><span className="tt">Submitted to the KRA</span></span></li>
            <li className="now"><span className="d"></span><span><span className="tt">Being processed at the KRA</span></span></li>
            <li className="todo"><span className="d"></span><span>
              <span className="tt">Reflected at the depository</span>
              <span className="ts">After the KRA accepts it.</span>
            </span></li>
          </ul>
        </DoneScreen>
      ),
      foot: (F, ok, ctx) => <button className="btn pri" type="button" onClick={ctx.next}>Done</button>,
    },
  ],
  finish: () => { go('personal'); toast('Submitted to the KRA.', 'ok') },
})

/* PR-13 — Save reads Save, is disabled until dirty, and has explicit outcomes. */
registerFlow('display', {
  title: 'Edit display name',
  init: (F) => { F.d = { v: db.display } },
  steps: [{
    bare: true,
    render: (F, ctx) => (
      <>
        <h3>Display name</h3>
        <p className="lede">What we call you inside the app.</p>
        <div className="f">
          <label htmlFor="dn">Display name</label>
          <input type="text" id="dn" maxLength={32} autoComplete="off" value={F.d.v}
                 onChange={(e) => ctx.set({ v: e.target.value })} />
          <div className="hint">
            {'This does not appear on contract notes, statements or your Client master report. Those carry '
              + db.name + ', your name as per KYC.'}
          </div>
        </div>
      </>
    ),
    valid: (F) => (F.d.v || '').trim().length > 0 && (F.d.v || '').trim() !== db.display,
    foot: (F, ok, ctx) => (
      <button className="btn pri" type="button" disabled={!ok} onClick={ctx.next}>Save</button>
    ),
  }],
  finish: (F) => { db.display = (F.d.v || '').trim(); go('personal'); toast('Display name saved.', 'ok') },
})
