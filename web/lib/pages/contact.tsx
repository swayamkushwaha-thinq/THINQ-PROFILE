'use client'
/* ═════════════════════════════════════════════════════════════════════════════
   §7.2 Contact details — the flow Registration D-28 hands off and marks Out of
   Scope. Three lifecycle zones; the gate is PAN verification, not KYC completion.
   PR-16 · PR-17 · PR-18 · PR-19 · PR-20 · PR-21 · PR-22
   ═════════════════════════════════════════════════════════════════════════════ */
import { Fragment } from 'react'
import { commit, db, isLocked, isPost, isRO } from '@/lib/store'
import { MASK } from '@/lib/vault'
import { EditIcon, EntityNote, Head, MaskField, Pill, Ref } from '@/components/primitives'
import { RoBanner } from '@/components/RoBanner'
import { StageStepper } from '@/components/StageStepper'
import { Timeline, type TlStep } from '@/components/Timeline'
import { flow } from '@/lib/flows/engine'

/* D-28 — three lifecycle zones. The gate is PAN verification, not KYC
   completion, because that is where the account binds to an identified person
   and the KRA lookup fires. */
export function zone() {
  if (db.state === 'prospect') return 'pre_pan'
  if (db.state === 'in_kyc' || db.state === 'submitted') return 'pan_verified'
  return 'kyc_complete'
}

/* PR-20 — a change that is done at Thinq and pending at CDSL is two facts, and
   is shown as two. PR-19 — the out-of-band notice went to the other channel. */
function ContactStatusCard() {
  const c = db.contactChange as any
  const noun = c.kind === 'mobile' ? 'Mobile' : 'Email'
  /* ⚠ Three steps on owner direction, 14 Aug 2026. PR-20 asked for the Thinq-side
     update and the depository update to be shown as two facts, because a change
     that is live at Thinq and still pending at CDSL is exactly that. They are now
     one line, so the customer cannot tell which half has landed. */
  const steps: TlStep[] = [
    ['Request submitted', 'You asked to change your ' + c.kind, 'CHG_SUBMITTED'],
    ['Identity verified', 'We confirmed it was you, and that you can receive messages at the new address', 'CHG_IDENTITY_VERIFIED'],
    /* After an email change MASK.email already holds the new address, which is
       where PR-96 says the receipt goes — so this reads correctly either way. */
    ['e-Signed with Aadhaar', 'We’ve sent a confirmation email to ' + MASK.email + ' with the e-Signed ' + c.kind
      + ' change form attached', 'CHG_ESIGNED'],
    /* In-progress and completed are different facts, so each carries its own
       label and its own enum value. */
    ['Registering with the KRA', 'CVL KRA is updating your KYC record', 'CHG_KRA_REGISTERING',
      'Registered with the KRA', 'CVL KRA has updated your KYC record', 'CHG_KRA_REGISTERED'],
    ['Updating at the depository', 'CDSL is updating your ' + c.kind + ' on your demat record', 'CHG_DP_UPDATING',
      'Updated at the depository', 'CDSL has your new ' + c.kind + ' on your demat record', 'CHG_DP_UPDATED'],
    [noun + ' update completed', 'Your new ' + (c.kind === 'mobile' ? 'mobile number' : 'email address')
      + ' has been successfully updated across your Thinq and demat records', 'CHG_COMPLETED'],
  ]
  /* Open while the change is in flight, collapsed once it is done — the state
     the customer came to check stays on the summary either way. The row above
     already carries the state, so the accordion is a way in, not a second
     status. */
  return (
    <details className="row col" open={c.stage < 6}>
      <summary><b>Track progress</b><Ref r="PR-20" /><span className="chev" aria-hidden="true"></span></summary>
      <div className="body">
        <div className="quiet" style={{ borderTop: 'none', marginTop: 0, paddingTop: 0 }}>
          Reference <b>{c.reqid}</b> · started {c.on}
        </div>
        <Timeline steps={steps} stage={c.stage} />
        {/* PR-19 — the notice still goes to the channel that did not change, and still
            carries no link. Saying so was removed on owner direction, 14 Aug 2026. */}
        <div className="nb info"><span className="ic">◇</span><div>
          We sent a notice about this change to your {c.kind === 'email' ? 'mobile' : 'email'}<Ref r="PR-19" />
        </div></div>
        {c.stage >= 6 ? (
          <div className="btnrow">
            <button className="btn sec sm" type="button"
                    onClick={() => { db.contactChange = null; commit() }}>Dismiss</button>
          </div>
        ) : null}
      </div>
    </details>
  )
}

export function ContactPage({ embed = false }: { embed?: boolean }) {
  const z = zone()
  /* One card. The value, the reveal and the way to change it sit on the same
     row, so nothing has to be explained twice. PR-16 — the zone is resolved
     before any control is drawn, so a self-service edit is never offered where
     it is not permitted.
     Owner direction, 17 Aug 2026 — a contact detail cannot be changed until the
     account is open. Before that it is part of an application in flight: the
     number and address are what the KRA, the e-Sign and the OTPs are running
     against, and moving either mid-application is what the journey cannot
     absorb. ⚠ This overrides Registration D-28 / REC-M12, which routes a
     pre-PAN contact change here as self-service. Recorded as a conflict. */
  const canChange = !isLocked() && isPost()
  /* A request in flight locks both rows; once it completes the row says so and
     the control comes back — PR-09, the row's state and its action must agree. */
  const req = db.contactChange as any
  const pending = req && req.stage < 6 ? req : null
  const completed = req && req.stage >= 6 ? req : null

  const act = (kind: string) => {
    /* PR-05 — a withdrawn control still states its reason. Before the account
       is open that reason is the application, not a lock. */
    if (!isPost() && !isRO()) return <Pill kind="mute" label="Locked during onboarding" />
    if (!canChange) return null
    if (pending) return <Pill kind="warn" label={pending.kind === kind ? 'Change in progress' : 'Locked'} />
    const btn = <button className="mini icon-only" type="button" aria-label="Change" title="Change" onClick={() => flow('contact:' + kind)}><EditIcon size={14} /></button>
    if (completed && completed.kind === kind) return <><Pill kind="ok" label="Updated" />{' '}{btn}</>
    return btn
  }

  /* The tracker belongs to the row whose change is in flight, so it hangs off
     that row rather than sitting as a card at the foot of the page — the same
     treatment the freeze and closure explanations get on Freeze or close. */
  const track = (kind: string) =>
    (z === 'kyc_complete' && req && req.kind === kind) ? <ContactStatusCard /> : null

  return (
    <>
      {embed ? null : <Head eyebrow="Account details" title="Contact details" />}
      <RoBanner />
      {!isPost() && !isRO() ? (
        <div className="nb info"><span className="ic">◇</span><div>
          Your mobile number and email address can’t be changed until your account is opened — they are what your
          application is running against<Ref r="PR-16" />
        </div></div>
      ) : null}
      <div className="card">
        <div className="contact-grid">
          {/* Left Column - Mobile */}
          <div className="contact-col">
            <div className="contact-label">
              <b>Mobile</b>
            </div>
            <div className="contact-val">
              <MaskField field="mobile" mono={false} />
              {act('mobile')}
            </div>
          </div>

          {/* Vertical Divider */}
          <div className="contact-divider" />

          {/* Right Column - Email */}
          <div className="contact-col">
            <div className="contact-label">
              <b>Email</b>
            </div>
            <div className="contact-val">
              <MaskField field="email" mono={false} />
              {act('email')}
            </div>
          </div>
        </div>

        {/* Full-width Track Progress Panel */}
        {track('mobile') || track('email') ? (
          <div style={{ marginTop: 20, paddingTop: 16, borderTop: '1px solid var(--line)' }}>
            {track('mobile')}
            {track('email')}
          </div>
        ) : null}

        {z === 'kyc_complete' && canChange ? (
          <div className="quiet" style={{ marginTop: 22 }}>Lost access to your old number or email?{' '}
            <button className="lnk" type="button" onClick={() => flow('support')}>Contact us</button>
          </div>
        ) : null}
      </div>
      {embed ? null : <EntityNote />}
    </>
  )
}
