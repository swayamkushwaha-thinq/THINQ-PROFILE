'use client'
/* ═════════════════════════════════════════════════════════════════════════════
   §7.9 Security. Profile presents; the auth engine owns every mechanism.
   PR-63 · PR-64 · PR-65 · PR-66 · PR-67
   ═════════════════════════════════════════════════════════════════════════════ */
import { commit, db, go, isFrozen, isLocked, isPost, isRO } from '@/lib/store'
import { MASK, remaskAll } from '@/lib/vault'
import { BlockedBox, EditIcon, EntityNote, Head, Pill, Ref } from '@/components/primitives'
import { RoBanner } from '@/components/RoBanner'
import { ReviewRows } from '@/components/ReviewRows'
import { confirmModal } from '@/components/ConfirmModal'
import { closeModal, toast } from '@/lib/ui'
import { flow } from '@/lib/flows/engine'
import { signOut } from '@/components/Rail'
import type { Device } from '@/lib/types'

export function fieldName(f: string) {
  return ({ pan: 'PAN', dob: 'Date of birth', ckyc: 'CKYC number', boid: 'Demat account (BO ID)',
    bank1: 'Bank account — HDFC', bank2: 'Bank account — ICICI',
    mobile: 'Mobile', email: 'Email' } as Record<string, string>)[f] || f
}
/* the same fields said mid-sentence, so the re-auth prompt reads like English */
export function fieldPhrase(f: string) {
  if (f.indexOf('bank') === 0) return 'bank account number'
  return ({ pan: 'PAN', dob: 'date of birth', ckyc: 'CKYC number', boid: 'demat account number',
    mobile: 'mobile number', email: 'email address' } as Record<string, string>)[f] || 'detail'
}

export function openFnoPositions() {
  return (!isFrozen() && db.positions.FNO
    && db.segments.filter((s) => s.code === 'FNO' && s.status === 'active').length)
    ? db.positions.FNO : []
}

/* One list, in one place. It was two — a scope list on the page and an effects
   list in the journey — which overlapped on money and disagreed on nothing, so
   it read as the same thing said twice. */
export function FreezeScopeRows() {
  return <ReviewRows rows={[
    ['Online access to trading', 'Blocked — no one, including you, can place an order'],
    ['Pending orders', 'Cancelled'],
    ['Open positions', 'Stay open'],
    ['SIPs and mandates', 'Paused'],
    ['Every device you are signed in on', 'Logged out, including this one'],
    ['Your holdings', 'Stay where they are, in your demat account'],
    ['Your money', 'Stays yours. Withdrawing is still available, through our team'],
    /* ⚠ The demat-account and UCC rows were removed on owner direction,
       16 Aug 2026. They carried PR-111a — the framework's online-access carve-out
       (C8) and the single biggest cross-cutting finding of the five-broker
       teardown: every broker freezes trading access only, every one is also a
       depository, and none says so. */
    ['Statements and contract notes', 'Keep coming'],
    ['This section', 'Stays readable']]} />
}

function logoutDevice(d: Device) {
  confirmModal({
    title: 'Log out ' + d.name + '?',
    body: <p>That device is logged out immediately and cannot sign in again without setting itself up afresh.</p>,
    ok: 'Logout', okKind: 'dgr',
    onOk: () => { db.devices = db.devices.filter((x) => x.id !== d.id); closeModal(); commit() },
  })
}

function logoutAll() {
  confirmModal({
    title: 'Log out of all devices?',
    body: <p>Every device, including this one, is logged out immediately. Each has to sign in again with your PIN or passkey.</p>,
    ok: 'Log out everywhere', okKind: 'dgr',
    onOk: () => {
      db.devices = []; closeModal(); remaskAll(); commit()
      /* Same out-of-band notice as a single revocation (PR-64) — more so,
         since this is the control someone reaches for when they think another
         person is in the account. */
      toast('Logged out of every device. We have sent a security notice to your registered email.', 'ok')
    },
  })
}

/* PR-72 — a freeze blocks trading, leaves holdings and history intact, needs
   open positions closed first, and is reversible from this same page. */
function FreezeSection() {
  const openPos = openFnoPositions()
  return (
    <>
      <div className="card">
        {/* ⚠ The two sub-lines were removed from the unfrozen state on owner
            direction, 16 Aug 2026. The scope is in the accordion directly beneath,
            but the second unfreeze channel — write to us — is now unstated until
            the account is already frozen. */}
        <div className="prow">
          <span className="t"><b>{isFrozen() ? 'Unfreeze account' : 'Freeze account'}</b>
            {isFrozen() ? (
              <>
                {/* ⚠ The 30-minute turnaround came off here on owner direction,
                    16 Aug 2026, as it did on the assisted route. */}
                <span>Trading is blocked. Unfreeze with your PIN and OTP. Keep your PAN handy</span>
                <span className="sm2" style={{ fontFamily: 'var(--sans)', fontSize: 12, display: 'block', marginTop: 4 }}>
                  {/* Contact us raises the unfreeze request itself rather than opening a
                      form. Someone locked out of trading has already said what they want
                      by being here; asking them to type it again is friction. */}
                  {db.unfreezeReq
                    ? <>Unfreeze request received. We’ll contact you on {MASK.mobile} and {MASK.email}</>
                    : <>Facing an issue? <button className="lnk" type="button" onClick={unfreezeReq}>Contact us</button></>}
                </span>
              </>
            ) : null}
          </span>
          <span className="c">
            {/* Fyers refuses to freeze a client holding open positions, which the
                teardown calls defeating the facility in the exact scenario it exists
                for. We freeze anyway and say what stays open (C3(c)). */}
            {isRO() ? <Pill kind="mute" label="Not available" />
              : isFrozen()
              ? <button className="btn pri sm" type="button" onClick={() => flow('unfreeze')}>Unfreeze</button>
              : <button className="btn sec sm" type="button" onClick={() => flow('freeze')}>Freeze</button>}
          </span>
        </div>
        {/* PR-111a, attached to the row it explains — and only while there is a
            decision left to make. */}
        {isFrozen() ? null : (
          <details className="row col">
            <summary><b>What a freeze stops, and what it does not</b><Ref r="PR-111a" />
              <span className="chev" aria-hidden="true"></span></summary>
            <div className="body">
              <p className="quiet" style={{ borderTop: 'none', margin: '0 0 12px', padding: 0 }}>
                A freeze blocks online trading activity. It does not close your account or affect your demat account,
                holdings, or funds
              </p>
              <FreezeScopeRows />
              {/* ⚠ The 15-minute figure came off here on owner direction, 16 Aug 2026.
                  No surface in the prototype now states how long a freeze takes during
                  trading hours. */}
              <div className="nb info"><span className="ic">◇</span><div>
                <b>When it takes effect.</b> During trading hours, or before the start of the next trading session if
                requested outside trading hours<Ref r="PR-108a" />
              </div></div>
              {/* C7 asymmetry, disclosed as ours rather than the regulator's. */}
              <div className="nb info"><span className="ic">◇</span><div>
                <b>How to unfreeze.</b> Log in to your account and follow the prompt to unfreeze your account<Ref r="PR-113a" />
              </div></div>
              {/* C1 — the second request channel, said in the same words the frozen
                  state uses for the way back, so both directions read alike. */}
              <div className="quiet">Facing an issue?{' '}
                <button className="lnk" type="button" onClick={() => flow('support:freeze')}>Contact us</button>{' '}
                to freeze your account<Ref r="PR-107a" />
              </div>
            </div>
          </details>
        )}
      </div>
      {openPos.length && !isFrozen() ? (
        <div className="nb info"><span className="ic">◇</span><div>
          You have open positions — {openPos.join(' · ')}. A freeze leaves them open, and we will send you their
          expiry dates within the hour. It does not block the freeze
        </div></div>
      ) : null}
      {/* ⚠ The stoptrade@ note was removed on owner direction, 16 Aug 2026. With it
          go three requirements' only surface on this page: PR-107a / C1, C2 and
          PR-108a / C3(a) / C9. STOPTRADE is retained in the source. */}
      <BlockedBox id="P-6 · P0" owner="Compliance + Operations">
        <p><b>What a freeze actually is has not been decided.</b> <code>HC-DMT-08</code> promises a customer-initiated
          freeze, but whether that is a trading-account suspension, a CDSL demat freeze, or both — and which a customer
          can reverse themselves — is asserted nowhere. The row above is built against the trading-suspension reading</p>
      </BlockedBox>
    </>
  )
}

export function unfreezeReq() {
  db.unfreezeReq = true
  commit()
  toast('Unfreeze request received. We will contact you.', 'ok')
}

export function SecurityPage() {
  const pre = (db.state === 'prospect')
  /* PR-63 — HC-SEC-03 publishes this exact path, so it exists and routes into
     the auth engine's flow. D-24: no PIN exists before activation. Owner
     direction, 17 Aug 2026: this covers in-KYC as well as prospect. */
  const noPin = !isPost()
  return (
    <>
      <Head eyebrow="Account services" title="Security & PIN" />
      <RoBanner />
      <div className="card"><div className="prow">
        <span className="t"><b>PIN</b><span>
          {noPin ? 'You will set one the first time you sign in after your account is activated.'
            : 'Change your 4-digit Thinq PIN.'}
        </span></span>
        <span className="c">
          {noPin ? <Pill kind="mute" label="Not set yet" />
            : isLocked() ? null
            : <button className="mini icon-only" type="button" aria-label="Change" title="Change" onClick={() => flow('pin')}><EditIcon size={14} /></button>}
        </span>
      </div></div>

      {!pre ? (
        <>
          {/* Authenticator-app second factor. Profile presents it; the auth engine
              owns the mechanism (§7.9 — nothing here re-specifies a factor). */}
          <div className="card"><div className="prow">
            <span className="t"><b>Authenticator app</b><span>
              {db.totp ? 'A six-digit code from your authenticator app is required when you sign in'
                : 'Add a six-digit code from an authenticator app on top of your PIN'}
            </span></span>
            {/* A second factor sits on top of a PIN, so it cannot be set up before
                one exists either. */}
            <span className="c">
              {noPin || isLocked() ? null
                : db.totp
                ? <button className="mini" type="button" onClick={() => flow('totpoff')}>Turn off</button>
                : <button className="btn sec sm" type="button" onClick={() => flow('totp')}>Set up</button>}
            </span>
          </div></div>

          {/* PR-64 — enrolled passkeys and devices, with last used, revocable. Folded
              into an accordion, closed by default (owner direction, 17 Aug 2026). */}
          <details className="cardc" open>
            <summary><h3>Passkeys &amp; devices</h3>
              <Pill kind="mute" label={db.devices.length + ' signed in'} />
              <span className="chev" aria-hidden="true"></span></summary>
            <div className="body">
              {db.devices.map((d) => (
                <div className="prow" key={d.id}>
                  <span className="t"><b>{d.name}</b><span>{d.kind} · last used {d.last}</span></span>
                  <span className="c">
                    {d.here ? <Pill kind="ok" label="This device" />
                      : <button className="mini" type="button" onClick={() => logoutDevice(d)}>Logout</button>}
                  </span>
                </div>
              ))}
              {/* The per-row control cannot answer the case this one exists for — a
                  device you no longer have, or one you do not recognise at all. It
                  stays live during a contact-change lock (PR-139a) for the same
                  reason the freeze does. */}
              {db.devices.length ? (
                <div className="btnrow" style={{ marginTop: 14 }}>
                  <button className="btn dgr sm" type="button" onClick={logoutAll}>Log out of all devices</button>
                </div>
              ) : null}
            </div>
          </details>

          {/* Connected apps, sign-in activity and reveal activity all removed on owner
              direction, 14 Aug 2026. PR-66, PR-65 and the customer-facing view of the
              PR-31 audit trail now have no surface. REVEAL_LOG still records every
              unmask. Recorded in the build notes. */}
        </>
      ) : null}

      {/* There is no trading to freeze until the account is open, so the section
          that offers it does not appear before then. */}
      {isPost() ? <FreezeSection /> : null}

      <div className="btnrow" style={{ marginTop: 20 }}>
        <button className="btn dgr" type="button" onClick={signOut}>Log out</button>
      </div>
      <EntityNote />
    </>
  )
}
