'use client'
/* ═════════════════════════════════════════════════════════════════════════════
   §7.5 Add a nominee. PR-35 (same fields, relations, 100% rule, guardian ≥ 18
   as onboarding §8) · PR-36 (its own Aadhaar e-Sign, said before they begin)
   ═════════════════════════════════════════════════════════════════════════════ */
import { db, go, totalShare } from '@/lib/store'
import { MASK } from '@/lib/vault'
import { toast } from '@/lib/ui'
import { BlockedBox, Pill, Ref } from '@/components/primitives'
import { ReviewRows } from '@/components/ReviewRows'
import { DoneScreen, Ferr, OtpBlock, StagesList } from '@/components/flowbits'
import { AddrBlock, IdField, MobField, RelTrigger } from '@/components/formfields'
import { NOM_ONCE } from '@/lib/pages/nominee'
import { age, addrText, fmtDate, sanId, validateNominee } from '@/lib/validation'
import { registerFlow, type FlowCtx, type FlowRun } from './engine'

/* The same guardian fields the KYC journey collects (thinq-journey-v3.html
   kycNomineeAdd): name, relationship, identity proof, mobile, email, date of
   birth and address. Anything less and the two surfaces diverge — PR-35. */
function GuardianBlock({ F, ctx }: { F: FlowRun; ctx: FlowCtx }) {
  const d = F.d
  if (!d.minor) return null
  const err = d.err || {}
  return (
    <div id="gwrap" data-on="1">
      <div className="nb warn"><span className="ic">◇</span><div>
        They are under 18, so a guardian has to be named. The guardian must be at least 18
      </div></div>
      <div className="f"><label htmlFor="ng">Guardian’s full name</label>
        <input type="text" id="ng" autoComplete="off" value={d.guardian || ''}
               onChange={(e) => ctx.set({ guardian: e.target.value })} /></div>
      <Ferr msg={err.enGName} />
      <span className="lab">Guardian relationship</span>
      <RelTrigger label="Guardian relationship" value={d.guardianRel}
                  onPick={(v) => ctx.set({ guardianRel: v })} />
      <Ferr msg={err.enGRel} />
      <fieldset><legend>Guardian’s identity proof</legend><div className="pills">
        {['Aadhaar', 'PAN', 'Driving Licence'].map((t) => (
          <label key={t}>
            <input type="radio" name="gidt" value={t} checked={(d.gIdType || 'Aadhaar') === t}
                   onChange={() => ctx.set({ gIdType: t, gId4: '' })} />
            <span>{t}</span>
          </label>
        ))}
      </div></fieldset>
      <IdField id="ngid4" type={d.gIdType || 'Aadhaar'} value={d.gId4 || ''}
               onChange={(v) => ctx.set({ gId4: sanId(v, d.gIdType || 'Aadhaar') })} />
      <Ferr msg={err.engId} />
      <MobField id="ngmob" label="Guardian mobile" value={d.gMobile || ''}
                onChange={(v) => ctx.set({ gMobile: v })} />
      <Ferr msg={err.enGMob} />
      <div className="f"><label htmlFor="ngem">Guardian email</label>
        <input type="email" id="ngem" autoComplete="off" value={d.gEmail || ''}
               onChange={(e) => ctx.set({ gEmail: e.target.value })} /></div>
      <Ferr msg={err.enGEmail} />
      <div className="f"><label htmlFor="ngdob">Guardian date of birth</label>
        <input type="date" id="ngdob" value={d.gdob || ''}
               onChange={(e) => ctx.set({ gdob: e.target.value })} /></div>
      <Ferr msg={err.enGDob} />
      <div className="sw">
        <span className="t"><b>Guardian’s address is same as mine</b><span>{db.address}</span></span>
        <span className="ctl"><label className="tgl">
          <input type="checkbox" checked={d.gSame !== false} aria-label="Guardian’s address is same as mine"
                 onChange={(e) => ctx.set({ gSame: e.target.checked })} /><i></i>
        </label></span>
      </div>
      {d.gSame === false ? (
        <AddrBlock p="ng" d={d.gAddrObj} err={err}
                   onChange={(patch) => ctx.set({ gAddrObj: { ...(d.gAddrObj || {}), ...patch } })} />
      ) : null}
    </div>
  )
}

registerFlow('nominee', {
  title: 'Add a nominee',
  init: (F) => {
    F.d = {
      name: '', relation: '', dob: '', idType: 'Aadhaar', id4: '', mobile: '', email: '', sameAddr: true, addr: '',
      share: db.nominees.length ? Math.max(0, 100 - totalShare()) : 100,
      guardian: '', guardianRel: '', gdob: '', err: {},
    }
  },
  steps: [
    /* PR-36 — the e-Sign requirement is stated before they begin, not discovered
       at the end, and nomination is never presented as an inline edit. */
    {
      nofocus: true,
      render: () => (
        <>
          <h3>Before you start</h3>
          <p className="lede">
            Adding a nominee is a legal instruction about who should receive your investments if something happens to
            you. You’ll need to e-Sign the nomination using Aadhaar OTP
          </p>
          <StagesList items={[
            ['Nominee details', 'Name, relationship, date of birth, ID and contact details'],
            ['Review', 'Check all details before signing'],
            ['e-Sign with Aadhaar',
              'Verify with an OTP sent to your Aadhaar-linked mobile number. This completes the nomination']]} />
          <div className="nb warn"><span className="ic">◇</span><div>{NOM_ONCE}</div></div>
        </>
      ),
      cta: 'Start',
    },

    /* Single page to enter all nominee details */
    {
      render: (F, ctx) => {
        const d = F.d
        const err = d.err || {}
        const msgs: string[] = []
        if (d.topErr) msgs.push(d.topErr)
        if (d.minor && d.gdob && age(d.gdob) < 18) msgs.push('Guardian must be at least 18 years old.')
        if (d.share && (Number(d.share) < 1 || Number(d.share) > 100)) msgs.push('Share must be between 1 and 100.')
        return (
          <>
            <h3>Enter nominee details</h3>
            <p className="lede">Provide nominee details below</p>
            <div className="f"><label htmlFor="nn">Nominee name</label>
              <input type="text" id="nn" autoComplete="name" value={d.name || ''}
                     onChange={(e) => ctx.set({ name: e.target.value })} /></div>
            <Ferr msg={err.enName} />
            <span className="lab">Nominee relationship</span>
            <RelTrigger label="Nominee relationship" value={d.relation} onPick={(v) => ctx.set({ relation: v })} />
            <Ferr msg={err.enRel} />

            <div className="f"><label htmlFor="ndob">Nominee date of birth</label>
              <input type="date" id="ndob" value={d.dob || ''}
                     onChange={(e) => ctx.set({ dob: e.target.value, minor: e.target.value ? age(e.target.value) < 18 : false })} /></div>
            <Ferr msg={err.enDob} />

            <div className="f"><label htmlFor="nsh">Share of holdings (%)</label>
              <input type="number" id="nsh" min={1} max={100} value={d.share}
                     {...(db.nominees.length === 0 ? { readOnly: true, style: { opacity: .7 } } : {})}
                     onChange={(e) => ctx.set({ share: e.target.value })} />
              {db.nominees.length === 0 ? <div className="hint">A single nominee always receives 100%</div> : null}
            </div>
            <Ferr msg={err.enShare} />

            <fieldset><legend>Nominee ID proof</legend><div className="pills">
              {['Aadhaar', 'PAN', 'Driving Licence'].map((t) => (
                <label key={t}>
                  <input type="radio" name="idt" value={t} checked={d.idType === t}
                         onChange={() => ctx.set({ idType: t, id4: '' })} />
                  <span>{t}</span>
                </label>
              ))}
            </div></fieldset>
            <IdField id="nid4" type={d.idType} value={d.id4 || ''}
                     onChange={(v) => ctx.set({ id4: sanId(v, d.idType) })} />
            <Ferr msg={err.enId} />

            <MobField id="nmob" label="Nominee mobile" value={d.mobile || ''} onChange={(v) => ctx.set({ mobile: v })} />
            <Ferr msg={err.enMob} />

            <div className="f"><label htmlFor="nem">Nominee email</label>
              <input type="email" id="nem" autoComplete="off" value={d.email || ''}
                     onChange={(e) => ctx.set({ email: e.target.value })} /></div>
            <Ferr msg={err.enEmail} />

            <div className="sw">
              <span className="t"><b>Nominee’s address is same as mine</b><span>{db.address}</span></span>
              <span className="ctl"><label className="tgl">
                <input type="checkbox" checked={!!d.sameAddr} aria-label="Nominee address is same as mine"
                       onChange={(e) => ctx.set({ sameAddr: e.target.checked })} /><i></i>
              </label></span>
            </div>
            {d.sameAddr ? null : (
              <AddrBlock p="nn" d={d.addrObj} err={err}
                         onChange={(patch) => {
                           const next = { ...(d.addrObj || {}), ...patch }
                           ctx.set({ addrObj: next, addr: addrText(next) })
                         }} />
            )}

            <GuardianBlock F={F} ctx={ctx} />

            <div id="nerr">
              {msgs.length ? (
                <div className="nb bad" style={{ marginTop: 14 }}><span className="ic">!</span><div>
                  {msgs.map((m, i) => <span key={i}>{i ? <br /> : null}{m}</span>)}
                </div></div>
              ) : null}
            </div>
          </>
        )
      },
      onNext: (F) => {
        const err = (F.d.err = F.d.err || {})
        if (!validateNominee(F.d, err)) {
          F.d.topErr = 'Please fill in all required nominee fields correctly.'
          return false
        }
        const tot = totalShare() + Number(F.d.share)
        if (tot !== 100) {
          const m = 'Shares across all nominees must add up to exactly 100%. Yours add up to ' + tot + '%.'
          err.enShare = m
          F.d.topErr = m
          return false
        }
        F.d.topErr = null
        return true
      },
      cta: 'Continue',
    },

    {
      nofocus: true,
      render: (F) => {
        const d = F.d
        return (
          <>
            <h3>Review your nominee details</h3>
            <p className="lede">Nothing has been signed yet. Go back and correct any details that are wrong</p>
            <ReviewRows rows={[['Name', d.name], ['Relationship', d.relation], ['Date of birth', fmtDate(d.dob)],
              ['Identity proof', d.idType + ' ending ' + d.id4 + ' (self-declared)'],
              ['Mobile', '+91 ' + d.mobile], ['Email', d.email],
              ['Address', d.sameAddr ? 'Same as yours' : d.addr], ['Share', d.share + '%']]} />
            {/* A minor nominee's guardian is a full record in its own right, so it is
                reviewed in full rather than collapsed to a name (Onboarding §8). */}
            {d.minor ? (
              <>
                <div className="sect" style={{ margin: '18px 0 9px' }}>Guardian</div>
                <ReviewRows rows={[['Name', d.guardian], ['Relationship to the nominee', d.guardianRel],
                  ['Date of birth', fmtDate(d.gdob)],
                  ['Identity proof', (d.gIdType || 'Aadhaar') + ' ending ' + (d.gId4 || '') + ' (self-declared)'],
                  ['Mobile', '+91 ' + (d.gMobile || '')], ['Email', d.gEmail || ''],
                  ['Address', d.gSame === false ? (d.gAddr || addrText(d.gAddrObj)) : 'Same as yours']]} />
              </>
            ) : null}
            <div className="nb warn"><span className="ic">◇</span><div>{NOM_ONCE}</div></div>
            <div className="nb info"><span className="ic">◇</span><div>
              Their mobile, email and address will be hidden by default on your nominee card, the same way your own
              details are<Ref r="PR-14" />
            </div></div>
          </>
        )
      },
      cta: 'e-Sign this nomination',
    },

    /* PR-36 — its own Aadhaar e-Sign, distinct from the AOF signature. */
    {
      render: (F, ctx) => (
        <>
          <h3>e-Sign with Aadhaar</h3>
          <p className="lede">A code has gone to the mobile linked to your Aadhaar. Entering it signs the nomination.</p>
          <OtpBlock id="esign" label="Aadhaar OTP" value={F.d.esign || ''} onChange={(v) => ctx.set({ esign: v })} />
          <BlockedBox id="P-8 · P1" owner="Product + Eng">
            <p>Onboarding §8 states that a nominee added after activation requires its own Aadhaar e-Sign, and stops
              there. <b>No provider is named.</b> Whether this reuses the onboarding e-Sign chain — Digio → Signzy → Setu,
              with the §18 failover-exhaust behaviour — is unstated.</p>
          </BlockedBox>
        </>
      ),
      valid: (F) => (F.d.esign || '').length === 6,
      cta: 'Sign',
    },

    {
      bare: true, nofocus: true, noback: true,
      render: (F) => (
        <DoneScreen title="Nominee request signed and submitted"
          /* The heading already says it was signed and submitted, so the lede
             starts at the part the customer does not know yet. */
          lede={'It may take 1–3 business days to reflect on your account. You can track the status from '
            + 'Profile → Nominee'}>
          {/* PR-10 — a pending state names what is pending. */}
          <div className="rev">
            <div className="rk"><span>Nominee</span><b>{F.d.name}</b></div>
            <div className="rk"><span>Share</span><b>{F.d.share + '%'}</b></div>
            <div className="rk"><span>Status</span><b><Pill kind="warn" label="Being registered" /></b></div>
          </div>
          <div className="nb info"><span className="ic">◇</span><div>
            {'We have emailed the signed nomination form to ' + MASK.email
              + '. It is also in Profile → Account documents'}
          </div></div>
        </DoneScreen>
      ),
      foot: (F, ok, ctx) => <button className="btn pri" type="button" onClick={ctx.next}>Done</button>,
    },
  ],
  finish: (F) => {
    const d = F.d
    db.signedForms.push({ id: 'nomform', name: 'Nomination form — ' + d.name, on: '14 August 2026' })
    db.nomineeRequest = { type: 'add', name: d.name, ref: 'NOM-' + db.ucc + '-0814', on: '14 August 2026', stage: 2 }
    db.nominees.push({
      name: d.name, relation: d.relation, dob: fmtDate(d.dob), share: Number(d.share),
      idType: d.idType, id4: d.id4, mobile: d.mobile, email: d.email,
      addr: d.sameAddr ? db.address : d.addr, minor: d.minor,
      guardian: d.guardian, guardianRel: d.guardianRel, gdob: d.gdob ? fmtDate(d.gdob) : '',
      gIdType: d.gIdType, gId4: d.gId4, gMobile: d.gMobile, gEmail: d.gEmail,
      gAddr: (d.gSame === false ? (d.gAddr || addrText(d.gAddrObj)) : db.address),
    } as any)
    go('nominee')
    toast('Nominee added and signed.', 'ok')
  },
})
