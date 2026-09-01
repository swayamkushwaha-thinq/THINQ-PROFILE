'use client'
/* ═════════════════════════════════════════════════════════════════════════════
   §7.8 Privacy & consents.
   PR-56 · PR-57 · PR-58 · PR-59 · PR-60 · PR-61 · PR-62
   ═════════════════════════════════════════════════════════════════════════════ */
import { commit, db, isLocked } from '@/lib/store'
import { BlockedBox, EntityNote, Head, Kv, Pill, Plain, Ref } from '@/components/primitives'
import { RoBanner } from '@/components/RoBanner'
import { confirmModal } from '@/components/ConfirmModal'
import { closeModal, toast } from '@/lib/ui'
import { flow } from '@/lib/flows/engine'

/* PR-56 / PR-57 — withdrawal effective in under 60 seconds, across all channels,
   with a confirmation that says account communications continue. */
export function marketingOff() {
  confirmModal({
    title: 'Turn marketing messages off?',
    body: (
      <>
        <div className="nb gold"><span className="ic">◇</span><div>
          <b>Messages about your own account are not marketing, and are always sent.</b> Contract notes, statements,
          margin calls, settlement notices, KYC reminders and security alerts all continue exactly as they are. You
          are only switching off offers and product news.
        </div></div>
        <p>This takes effect immediately across email, SMS and WhatsApp. You can switch it back on whenever you like.</p>
      </>
    ),
    ok: 'Turn marketing off', okKind: 'dgr', cancel: 'Keep it on',
    onOk: () => {
      const t0 = Date.now()
      const c = db.consents.filter((x) => x.id === 'C-MKTG')[0] as any
      c.st = 'withdrawn'; c.withdrawnOn = '14 August 2026'
      const secs = (Date.now() - t0) / 1000
      c.effectIn = (secs < 1 ? 'Immediately' : secs.toFixed(1) + ' seconds')
        + ' — across email, SMS and WhatsApp'
      closeModal(); commit()
      toast('Marketing off. Your account messages carry on as before.', 'ok')
    },
  })
}

export function marketingOn() {
  const c = db.consents.filter((x) => x.id === 'C-MKTG')[0] as any
  c.st = 'active'; c.on = '14 August 2026'; delete c.withdrawnOn; delete c.effectIn
  commit(); toast('Marketing messages are on again.')
}

export function PrivacyPage() {
  const mk = db.consents.filter((c) => c.id === 'C-MKTG')[0] as any
  const locked = isLocked()
  return (
    <>
      <Head eyebrow="Privacy" title="Privacy & consents"
            sub={<>What you have agreed to, what you can take back, and what happens if you do.</>} />
      <RoBanner />

      {/* PR-56 — the marketing withdrawal control is the first thing on this page,
          one step from Profile home. It is the whole of the TnC T21 mitigation;
          burying it removes the mitigation. */}
      <div className="sect">Marketing preference</div>
      <div className="card">
        <div className="chead">
          <div>
            <h2>Marketing messages<Ref r="PR-56" /></h2>
            <div className="sub">Offers, product news and campaigns. Nothing to do with your own account.</div>
          </div>
          <div className="act">{mk.st === 'withdrawn' ? <Pill kind="mute" label="Off" /> : <Pill kind="ok" label="On" />}</div>
        </div>
        <div className="sw">
          <span className="t"><b>Send me marketing messages</b>
            <span>Takes effect immediately, across email, SMS and WhatsApp.</span></span>
          <span className="ctl">
            <label className="tgl">
              <input type="checkbox" id="mktTgl" checked={mk.st !== 'withdrawn'} disabled={locked}
                     aria-label="Send me marketing messages"
                     onChange={(e) => { if (e.target.checked) marketingOn(); else marketingOff() }} />
              <i></i>
            </label>
          </span>
        </div>
        {/* PR-57 — a customer who fears losing their contract notes will not withdraw,
            which defeats the control. So say it here, not only in the confirmation. */}
        <div className="nb gold"><span className="ic">◇</span><div>
          <b>Messages about your own account are not marketing, and are always sent.</b> Contract notes, statements,
          margin calls, settlement notices, KYC and security alerts all continue exactly as before. Turning this off
          costs you nothing you need.<Ref r="PR-57" />
        </div></div>
        {mk.st === 'withdrawn' ? (
          <dl>
            <Kv label="Withdrawn on"><Plain value={mk.withdrawnOn || '—'} /></Kv>
            <Kv label="Took effect"><Plain value={mk.effectIn || '—'} /></Kv>
          </dl>
        ) : null}
      </div>

      {/* PR-58 / PR-59 — the consent history, exposed to the customer. TnC §6 requires
          this view "to Compliance and to the user on request"; this is that surface. */}
      <div className="sect">Consent history</div>
      <div className="card">
        <div className="chead"><div>
          <h2>What you have agreed to<Ref r="PR-58" /></h2>
          <div className="sub">Every consent artefact on your record, with the version you accepted and when.</div>
        </div></div>
        <div className="tw"><table className="t">
          <caption>Consents on your account. Required consents cannot be withdrawn while the account is open — see below.</caption>
          <thead><tr>
            <th scope="col">Artefact</th><th scope="col">Version</th><th scope="col">Accepted</th>
            <th scope="col">Status</th><th scope="col"></th>
          </tr></thead>
          <tbody>
            {db.consents.map((c) => {
              const st = c.st === 'restated'
                ? <span className="pill warn"><i></i>{c.newV} awaiting acceptance</span>
                : c.st === 'withdrawn' ? <Pill kind="mute" label="Withdrawn" /> : <Pill kind="ok" label="Active" />
              let act: React.ReactNode = null
              if (!locked) {
                if (c.st === 'restated') act = <button className="mini" type="button" onClick={() => flow('reconsent')}>Review</button>
                else if (c.id === 'C-MKTG' && c.st === 'active') act = <button className="mini" type="button" onClick={marketingOff}>Withdraw</button>
                else if (c.req) act = <button className="mini" type="button" onClick={() => flow('cproc:' + c.id)}>Withdraw</button>
              }
              return (
                <tr key={c.id}>
                  <td>{c.name}<br />
                    <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--faint)' }}>{c.id}</span></td>
                  <td>{c.v}</td><td>{c.on}</td><td>{st}</td><td>{act}</td>
                </tr>
              )
            })}
          </tbody>
        </table></div>
        {/* PR-60 — withdrawing a consent required to hold the account means closing it,
            and the customer is told so rather than being silently continued. */}
        <div className="nb info"><span className="ic">◇</span><div>
          Some of these are what makes it lawful for us to hold your account at all. You can withdraw them — but
          withdrawing one means closing the account, and we will take you to the closure flow and say so, rather than
          quietly carrying on.<Ref r="PR-60" />
        </div></div>
      </div>

      {/* PR-61 — blocked on TnC T14. Profile cannot invent the policy; it can only be
          where the rights are exercised once it exists. */}
      <div className="sect">Your data</div>
      <div className="card">
        <div className="chead"><div>
          <h2>Your rights over your data<Ref r="PR-61" /></h2>
          <div className="sub">Under the Digital Personal Data Protection Act you can ask to see the personal data we
            hold, have it corrected, ask for it to be erased where we are not required to keep it, raise a grievance,
            and nominate someone to exercise these rights for you.</div>
        </div></div>
        <div className="btnrow">
          <button className="btn sec" disabled type="button">See my data</button>
          <button className="btn sec" disabled type="button">Request a correction</button>
          <button className="btn sec" disabled type="button">Request erasure</button>
          <button className="btn sec" disabled type="button">Consent manager</button>
        </div>
        <BlockedBox id="P-2 · P0 — inherited from TnC T14" owner="Legal + Product">
          <p>These four controls have nothing behind them. <b>The Privacy Policy does not exist</b>, and it is the document
            that owns the DPDP rights — access, correction, erasure, grievance and the consent manager. None of them appears
            in any Thinq document today.</p>
          <p>PR-61 is <b>blocked, not deferred</b>. Profile is where a customer would come to exercise these rights and
            cannot invent them; the controls are shown inert rather than hidden, so the gap is visible to whoever reviews this.</p>
        </BlockedBox>
      </div>

      {/* PR-62 — the prescribed-format artefacts Support H35 found missing from all
          158 published answers. */}
      <div className="sect">Complaints &amp; escalation</div>
      <div className="card">
        <div className="chead"><div><h2>If something goes wrong<Ref r="PR-62" /></h2></div></div>
        <dl>
          <Kv label="Grievance Officer"><Plain value="Ms. Priya Nair · grievance@thinq.in · 079 4000 1200" /></Kv>
          <Kv label="If we do not resolve it">
            <span className="val">Escalate to SEBI through SCORES, or to the exchange’s Online Dispute Resolution portal. Both are free.</span>
          </Kv>
          <Kv label="Investor Charter">
            <span className="val">Your rights and our obligations, in SEBI’s prescribed format</span>
            <button className="mini" type="button" onClick={() => toast('This would download the document.')}>Open</button>
          </Kv>
          <Kv label="Monthly complaints data">
            <span className="val">Complaints received and resolved, published every month</span>
            <button className="mini" type="button" onClick={() => toast('This would download the document.')}>Open</button>
          </Kv>
        </dl>
      </div>
      <EntityNote />
    </>
  )
}
