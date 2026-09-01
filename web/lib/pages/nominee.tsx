'use client'
/* ═════════════════════════════════════════════════════════════════════════════
   §7.5 Nominee — the destination the onboarding §8 opt-out promised.
   PR-34 · PR-35 · PR-36 · PR-37 · PR-13a · PR-14 · PR-15 · AT-P-14
   ═════════════════════════════════════════════════════════════════════════════ */
import { commit, db, isLocked, totalShare } from '@/lib/store'
import { MASK, revealed } from '@/lib/vault'
import { NOMINEE_LIMIT } from '@/lib/db'
import { nomMax } from '@/lib/dates'
import { EntityNote, EyeIcon, Head, Kv, Pill, Plain, Ref } from '@/components/primitives'
import { RoBanner } from '@/components/RoBanner'
import { StageStepper } from '@/components/StageStepper'
import { Timeline, type TlStep } from '@/components/Timeline'
import { flow } from '@/lib/flows/engine'

/* Shown on the way in and again on the review step, whatever the nominee count —
   it is the one thing a customer cannot undo afterwards. */
export const NOM_ONCE = 'Online nomination can be submitted only once. Please review all details carefully before you submit, '
  + 'as they cannot be changed later'

export function pendingNomReq() {
  const r = db.nomineeRequest as any
  return r && r.stage < nomMax()
}

function maskMobile(v: string) { return v.slice(0, 2) + '•••••' + v.slice(-3) }
function maskEmail(v: string) { const p = v.split('@'); return p[0].slice(0, 2) + '•••@' + p[1] }
function maskAddr(v: string) { return v.slice(0, 6) + '••••••••, ' + v.slice(-6) }

/* PR-20's pattern applied to nominations: once a request is signed and sent,
   the customer can see where it has got to without contacting anyone. */
function NomineeStatusCard() {
  const r = db.nomineeRequest as any
  /* A nomination has a depository leg too, so it carries the same in-progress
     and completed pair as a contact change (PR-97a). */
  const steps: TlStep[] = r.type === 'add'
    ? [['Request submitted', 'You added ' + r.name + ' as a nominee', 'NOM_SUBMITTED'],
       ['e-Signed with Aadhaar', 'We’ve sent a confirmation email to ' + MASK.email + ' with the e-Signed nomination '
         + 'form attached', 'NOM_ESIGNED'],
       ['Registering with the depository', 'CDSL is registering the nomination on your demat record', 'NOM_DP_REGISTERING',
         'Registered with the depository', 'CDSL has the nomination on your demat record', 'NOM_DP_REGISTERED'],
       ['Nomination completed', r.name + ' is on your account as a nominee', 'NOM_COMPLETED']]
    /* A registered nomination lives at the depository, so correcting one has to
       reach CDSL as well — the same leg the addition carries. */
    : [['Request submitted', 'You told us what needs correcting on ' + r.name + '’s record', 'NOMEDIT_SUBMITTED'],
       ['Under review', 'Our team is reviewing the details', 'NOMEDIT_UNDER_REVIEW',
         'Reviewed', 'Our team has reviewed the details', 'NOMEDIT_REVIEWED'],
       ['Updating at the depository', 'CDSL is updating the nomination on your demat record', 'NOMEDIT_DP_UPDATING',
         'Updated at the depository', 'CDSL has the corrected nomination on your demat record', 'NOMEDIT_DP_UPDATED'],
       ['Record corrected', r.name + '’s details are corrected on your account', 'NOMEDIT_COMPLETED']]
  const maxN = 4
  return (
    <details className="cardc">
      <summary>
        <h3>Your nominee {r.type === 'add' ? 'addition request' : 'update request'}<Ref r="PR-20" /></h3>
        {r.stage >= maxN ? <Pill kind="ok" label="Complete" /> : <Pill kind="warn" label="In progress" />}
        <span className="chev" aria-hidden="true"></span>
      </summary>
      <div className="body">
        <div className="quiet" style={{ borderTop: 'none', marginTop: 0, paddingTop: 0 }}>
          Reference <b>{r.ref}</b> · started {r.on}
        </div>
        <Timeline steps={steps} stage={r.stage} />
        {r.stage >= maxN ? (
          <div className="btnrow">
            <button className="btn sec sm" type="button"
                    onClick={() => { db.nomineeRequest = null; commit() }}>Dismiss</button>
          </div>
        ) : null}
        <StageStepper which="nom" stage={r.stage} max={maxN} />
      </div>
    </details>
  )
}

/* PR-14 — the nominee never saw this interface and consented to nothing in it,
   so their contact details are masked to the same standard as the account
   holder's. PR-15 — identity proof is type + last 4, labelled self-declared. */
function NomineeRow({ n, i }: { n: any; i: number }) {
  const k = 'nom' + i
  const M = ({ field, full, mask }: { field: string; full: string; mask: string }) => {
    const key = (k + field) as any
    const on = !!(revealed as any)[key]
    return (
      <>
        <span className="val">{on ? full : mask}</span>
        <button className={'mini icon-only' + (on ? ' on' : '')} type="button" aria-label={on ? 'Hide value' : 'Reveal value'} title={on ? 'Hide value' : 'Reveal value'}
                onClick={() => { (revealed as any)[key] = !on; commit() }}><EyeIcon off={on} size={14} /></button>
      </>
    )
  }
  return (
    <details className="row col" open={i === 0}>
      <summary>
        <b>{n.name}</b>
        <Pill kind="mute" label={n.relation} />
        <Pill kind="gold" label={n.share + '%'} />
        {n.minor ? <Pill kind="warn" label="Minor" /> : null}
        <span className="chev" aria-hidden="true"></span>
      </summary>
      <div className="body">
        <dl>
          <Kv label="Date of birth"><Plain value={n.dob} /></Kv>
          <Kv label="Identity proof">
            <span className="val">{n.idType} •••• {n.id4}</span>
            <span className="pill mute">Self-declared<Ref r="PR-15" /></span>
          </Kv>
          <Kv label="Mobile"><M field="Mobile" full={n.mobile} mask={maskMobile(n.mobile)} /></Kv>
          <Kv label="Email"><M field="Email" full={n.email} mask={maskEmail(n.email)} /></Kv>
          <Kv label="Address"><M field="Addr" full={n.addr} mask={maskAddr(n.addr)} /></Kv>
        </dl>
        {/* Onboarding §8 collects a full guardian block for a minor nominee — name,
            relationship, identity proof, mobile, email, date of birth and address.
            All of it is shown, and the guardian is a third party too, so PR-14's
            masking applies to them exactly as it does to the nominee. */}
        {n.minor ? (
          <>
            <div className="sect" style={{ margin: '20px 0 10px' }}>Guardian</div>
            <dl>
              <Kv label="Name"><Plain value={n.guardian} /></Kv>
              <Kv label="Relationship to the nominee"><Plain value={n.guardianRel} /></Kv>
              <Kv label="Date of birth"><Plain value={n.gdob || '—'} /></Kv>
              <Kv label="Identity proof">
                <span className="val">{n.gIdType || 'Aadhaar'} •••• {n.gId4 || '••••'}</span>
                <span className="pill mute">Self-declared</span>
              </Kv>
              <Kv label="Mobile">{n.gMobile ? <M field="GMob" full={n.gMobile} mask={maskMobile(n.gMobile)} /> : <Plain value="—" />}</Kv>
              <Kv label="Email">{n.gEmail ? <M field="GEml" full={n.gEmail} mask={maskEmail(n.gEmail)} /> : <Plain value="—" />}</Kv>
              <Kv label="Address">{n.gAddr ? <M field="GAdr" full={n.gAddr} mask={maskAddr(n.gAddr)} /> : <Plain value="—" />}</Kv>
            </dl>
          </>
        ) : null}
        {/* Online nomination is one-time, so the card offers no edit or removal —
            a control that contradicts the warning is the PR-09 defect. PR-05 still
            applies, so the reason and the route are stated in the same place.
            While a request is already in flight the route is withheld, because
            offering it again would invite a duplicate of something already queued. */}
        {pendingNomReq() ? (
          <div className="quiet">A request on this nominee is already with our team</div>
        ) : (
          <div className="quiet">These details cannot be changed online.{' '}
            <button className="lnk" type="button" onClick={() => flow('nomchange:' + i)}>Contact us</button> if something here is wrong
          </div>
        )}
      </div>
    </details>
  )
}

export function NomineePage() {
  const tot = totalShare()
  const nomReq = db.nomineeRequest as any
  const pendingNom = nomReq && nomReq.stage < nomMax() ? nomReq : null
  const doneNom = nomReq && nomReq.stage >= nomMax() ? nomReq : null

  return (
    <>
      <Head eyebrow="Account" title="Nominee" />
      <RoBanner />
      {!db.nominees.length ? (
        <>
          <div className="card">
            <div className="chead">
              <div>
                <h2>Add nominee to your account</h2>
                <div className="sub">Designate beneficiaries to securely protect and transfer your trading and demat assets</div>
              </div>
              <div className="act">
                {isLocked()
                  ? <Pill kind="mute" label="No nominee" />
                  : <button className="btn pri sm" type="button" onClick={() => flow('nominee')}>Add a nominee</button>}
              </div>
            </div>
            
            <div className="nb info" style={{ margin: '14px 0 0' }}>
              <span className="ic">◇</span>
              <div>
                <b>Online nomination rule:</b> {NOM_ONCE}. You can name up to {NOMINEE_LIMIT} nominees, and their shares must add up to exactly 100%. All nominees must be submitted in one request.
              </div>
            </div>
          </div>

          <details className="cardc" open>
            <summary>
              <h3 style={{ fontWeight: 400 }}>Why add a nominee to your account?</h3>
              <span className="chev" aria-hidden="true"></span>
            </summary>
            <div className="body">
              <div className="prow" style={{ paddingTop: 2 }}>
                <span className="t">
                  <b>Smooth transfer of securities</b>
                  <span>In the event of an unfortunate incident, securities and funds in your account can be seamlessly transferred to your designated nominee(s) without legal delays.</span>
                </span>
              </div>
              <div className="prow">
                <span className="t">
                  <b>Multiple beneficiaries & share allocation</b>
                  <span>You can nominate up to 3 individuals and specify exact percentage shares (e.g. 50% / 50%) for each beneficiary.</span>
                </span>
              </div>

            </div>
          </details>

          {nomReq ? <NomineeStatusCard /> : null}
          <EntityNote />
        </>
      ) : (
        <>
          {/* Onboarding §8 fields, one collapsible card per nominee. */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
            <h2 style={{ fontSize: '16px', fontWeight: 600, margin: 0, color: 'var(--ink)' }}>Nominees on record</h2>
            <div className="act">
              {tot === 100 ? <Pill kind="ok" label="100% allocated" /> : <Pill kind="bad" label={tot + '% allocated'} />}
              {pendingNom ? <>{' '}<Pill kind="warn" label="Request in progress" /></>
                : doneNom ? <>{' '}<Pill kind="ok" label={doneNom.type === 'add' ? 'Registered' : 'Updated'} /></> : null}
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '14px' }}>
            {db.nominees.map((n, i) => (
              <div className="card" key={i} style={{ margin: 0 }}>
                <NomineeRow n={n} i={i} />
              </div>
            ))}
          </div>
          {nomReq ? <NomineeStatusCard /> : null}
          <EntityNote />
        </>
      )}
    </>
  )
}
