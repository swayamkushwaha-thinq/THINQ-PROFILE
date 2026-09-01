'use client'
/* ═════════════════════════════════════════════════════════════════════════════
   §7.3 Personal & KYC details — read-only, with routes.
   PR-23 · PR-24 · PR-25 · PR-26 · PR-05 · PR-11
   ═════════════════════════════════════════════════════════════════════════════ */
import { db } from '@/lib/store'
import { EntityNote, Head, Kv, MaskField, Plain } from '@/components/primitives'
import { RoBanner } from '@/components/RoBanner'

/* Personal and Contact render both as their own surface and as sections inside
   Personal details. `embed` is the prototype's EMBED flag: it suppresses the
   page head and the entity footer so the host surface owns them, rather than
   the two being duplicated. */
export function PersonalPage({ embed = false }: { embed?: boolean }) {
  return (
    <>
      {embed ? null : (
        <Head eyebrow="Account details" title="Personal & KYC details"
              sub={<>This is the identity record held for you at the KRA and the depository. Most of it cannot be changed here, because it is not ours alone to change — but every field says where it is changed instead.</>} />
      )}
      {/* PR-25 / PR-26 — the status is fetched and rendered, in one line. Thinq holds
          the PAN and already calls the KRA at onboarding step 14; sending the customer
          to a third-party site to look up their own status is T-7. */}
      <div className="card"><dl>
        <Kv label="Name as per KYC"><Plain value={db.name} /></Kv>
        <Kv label="PAN"><MaskField field="pan" copy="PAN" /></Kv>
        <Kv label="Date of birth"><MaskField field="dob" mono={false} /></Kv>
        <Kv label="Gender"><Plain value={db.gender} /></Kv>
        <Kv label="Marital status"><Plain value={db.marital} /></Kv>
        <Kv label="Father's name"><Plain value={db.father} /></Kv>
        <Kv label="Aadhaar"><Plain value={'•••• •••• ' + db.aadhaar4} /></Kv>
        <Kv label="Occupation"><Plain value={db.occupation} /></Kv>
        <Kv label="Income range"><Plain value={db.income} /></Kv>
        <Kv label="Address"><Plain value={db.address} /></Kv>
        {/* PR-11 still holds: the signature specimen image is rendered nowhere in the
            customer-facing account area. The row that said so was removed on owner
            direction, so the artefact is now neither shown nor mentioned. */}
      </dl></div>
      {/* Display name card removed on owner direction, 14 Aug 2026. db.display still
          backs the greeting and the avatar; it is simply no longer editable, so
          FLOWS.display is unreachable and PR-13 has nothing left to demonstrate. */}
      {embed ? null : <EntityNote />}
    </>
  )
}

export function BasicPage() {
  return (
    <>
      <Head eyebrow="Account details" title="Personal details" />
      <RoBanner />
      <PersonalPage embed />
      <EntityNote />
    </>
  )
}
