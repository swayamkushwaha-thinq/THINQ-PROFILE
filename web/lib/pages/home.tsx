'use client'
/* ═════════════════════════════════════════════════════════════════════════════
   §7.1 Profile home — a summary, not a dashboard.
   PR-46: no trading, market, portfolio or funds data.  PR-47: no ticker.
   Removed on owner direction, 14 Aug 2026 — the landing surface is Personal
   details, or Contact details in the states that have no Personal details.
   Kept only so old references resolve rather than dead-end.
   ═════════════════════════════════════════════════════════════════════════════ */
import { bandItems, bankSummary, db, go, isActive, isFrozen, isPost, prefSummary, segSummary, STATES, totalShare } from '@/lib/store'
import { MASK } from '@/lib/vault'
import { EntityNote, Kv, Pill, Plain, Ref } from '@/components/primitives'
import { flow } from '@/lib/flows/engine'

export function StatePill() {
  const m: Record<string, [string, string]> = {
    prospect: ['mute', 'Prospect'], in_kyc: ['gold', 'In KYC'], submitted: ['gold', 'Submitted'],
    active: ['ok', 'Activated'], frozen: ['warn', 'Frozen'], closing: ['bad', 'Closure requested'],
  }
  const [kind, label] = m[db.state]
  return <Pill kind={kind} label={label} />
}

export function HomePage() {
  const s = db.state, st = STATES[s]
  const att = bandItems()

  /* Group entries, each with a one-line current state rather than a bare chevron. */
  const tiles: [string, string, string, string][] = []
  if (isPost() || s === 'submitted') {
    tiles.push(['Account details', 'basic', 'Personal details', db.name + ' · KRA ' + db.kraStatus])
    tiles.push(['You', 'contact', 'Contact details', db.contactChange ? 'A change is in progress' : MASK.mobile + ' · ' + MASK.email])
    tiles.push(['Account', 'nominee', 'Nominee', db.nominees.length
      ? db.nominees.length + ' on record · ' + totalShare() + '% allocated'
      : 'Opt-out declaration on record'])
    tiles.push(['Account', 'banks', 'Bank accounts', bankSummary()])
    tiles.push(['Account', 'segments', 'Segments', segSummary()])
  }
  if (isPost()) {
    tiles.push(['You', 'demat', 'Demat details', 'UCC ' + db.ucc])
    tiles.push(['Preferences', 'prefs', 'Preferences', prefSummary()])
  }
  tiles.push(['Security', 'security', 'Security', db.devices.length + ' passkeys and devices'])
  if (isPost()) {
    tiles.push(['Account services', 'documents', 'Account documents', 'Client master report · opening form · consents'])
    tiles.push(['Account services', 'closure', 'Account closure',
      s === 'closing' ? 'Closure in progress' : 'Close your trading and demat accounts'])
  }

  return (
    <>
      <div className="card">
        <div className="idc">
          <span className="av" aria-hidden="true">{db.display.charAt(0)}</span>
          {/* PR-83 — Profile home's h1. Every surface starts at exactly one h1; on this
              one the customer's own name is the honest heading for the page. */}
          <span className="n"><h1>{(isPost() || s === 'submitted') ? db.name : 'Arvind'}</h1><span>{st.note}</span></span>
          <span className="r"><StatePill /></span>
        </div>
        {isPost() ? (
          <dl style={{ marginTop: 18 }}>
            <Kv label="Name as per KYC"><Plain value={db.name} /></Kv>
            <Kv label="Client code (UCC)"><Plain value={db.ucc} copyWhat="UCC" /></Kv>
          </dl>
        ) : null}
      </div>

      {s === 'in_kyc' ? (
        <div className="card">
          <div className="chead"><div>
            <h2>Your application is part-finished<Ref r="PR-08" /></h2>
            <div className="sub">You stopped at <b>income proof for Futures &amp; Options</b>. Picking it up takes you
              back to that step — the same place the reminder we sent you points at.</div>
          </div></div>
          <div className="btnrow">
            <button className="btn pri" type="button" onClick={() => flow('resume')}>Resume application</button>
            <button className="btn sec" type="button" onClick={() => flow('descope')}>Open with equity only instead</button>
          </div>
          <div className="nb info"><span className="ic">◇</span><div>
            Stage <b>{db.kycStage}</b>. Profile reads this from the record the drop-off messages and the assistant
            read, so the three cannot disagree about where you got to.
          </div></div>
        </div>
      ) : null}

      {s === 'submitted' ? (
        <div className="card">
          <div className="chead"><div>
            <h2>Your application is with us</h2>
            <div className="sub">You e-Signed on 14 August 2026. Everything below is what you submitted, and it is
              read-only — the form you signed is a closed record of what was declared at that time.</div>
          </div></div>
          <div className="nb info"><span className="ic">◇</span><div>
            We will tell you the moment the account is live. We are not quoting a date, because we would be guessing
            at one.<Ref r="PR-22" />
          </div></div>
        </div>
      ) : null}

      {isFrozen() ? (
        <div className="card">
          <div className="chead">
            <div>
              <h2>Your account is frozen</h2>
              <div className="sub">You froze it on 12 August 2026. Trading is blocked. Your holdings, your money and
                your history are untouched, and everything in this section is still readable.</div>
            </div>
            <div className="act">
              <button className="btn pri sm" type="button" onClick={() => flow('unfreeze')}>Unfreeze</button>
            </div>
          </div>
        </div>
      ) : null}

      {att.length ? (
        <div className="att">
          <div className="h">Needs your attention</div>
          <ul>
            {att.map((a, i) => (
              <li key={i}>
                <span className="t"><b>{a.t}</b><span>{a.s}</span></span>
                <button className="btn sec sm" type="button"
                        onClick={() => { if (a.flow) flow(a.flow); else if (a.go) go(a.go) }}>{a.cta}</button>
              </li>
            ))}
          </ul>
        </div>
      ) : isActive() ? (
        <div className="att clear">
          <div className="h">Nothing needs your attention</div>
          <ul><li><span className="t"><span>Your record is complete and nothing is waiting on you.</span></span></li></ul>
        </div>
      ) : null}

      <div className="sect">Your account</div>
      <div className="tiles">
        {tiles.map((t, i) => (
          <button className="tile" type="button" key={i} onClick={() => go(t[1])}>
            <span className="g">{t[0]}</span>
            <b>{t[2]}</b>
            <span>{t[3]}</span>
          </button>
        ))}
      </div>

      {s === 'prospect' ? (
        <div className="nb info"><span className="ic">◇</span><div>
          You have not started KYC, so most of this section is not here — rather than here and greyed out. There is
          nothing to show until there is an account.
        </div></div>
      ) : null}
      <EntityNote />
    </>
  )
}
