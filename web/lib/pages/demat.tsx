'use client'
/* ═════════════════════════════════════════════════════════════════════════════
   §5.3 Demat & trading IDs.  PR-12 — copy on every identifier.
   §0.2 — CDSL only. No depository choice, and no "CDSL/NSDL" string.
   ═════════════════════════════════════════════════════════════════════════════ */
import { useState } from 'react'
import { commit, db } from '@/lib/store'
import { ArrowRightIcon, EntityNote, Head, Kv, MaskField, Pill, Plain, Ref } from '@/components/primitives'
import { toast } from '@/lib/ui'

function KraCheckButton() {
  const [busy, setBusy] = useState(false)
  return (
    <button className="mini" type="button" disabled={busy}
            onClick={() => {
              setBusy(true)
              setTimeout(() => {
                db.kraCheckedAt = 'Just now'
                setBusy(false)
                commit()
                toast('Your KYC status is verified with the KRA', 'ok')
              }, 900)
            }}>
      {busy ? <>Checking status...</> : <>Check status <ArrowRightIcon size={12} style={{ marginLeft: 3 }} /></>}
    </button>
  )
}

export function DematPage() {
  return (
    <>
      <Head eyebrow="Account details" title="Demat details" />
      <div className="card"><dl>
        <Kv label="Client code (UCC)"><Plain value={db.ucc} copyWhat="UCC" /></Kv>
        <Kv label="Demat account (BO ID)"><MaskField field="boid" copy="BO ID" /></Kv>
        <Kv label="DP ID"><Plain value={db.dpId} copyWhat="DP ID" /></Kv>
        <Kv label="Depository"><Plain value="CDSL" /></Kv>
        <Kv label="Account opened"><Plain value={db.openedOn} /></Kv>
        <Kv label="Segments active">
          <span className="val">{db.segments.filter((s) => s.status === 'active').map((s) => s.name).join(', ')}</span>
        </Kv>
      </dl></div>

      {/* PR-25 / PR-26 — the KRA status is fetched and rendered here, in one line,
          rather than sending the customer to a third-party site to look up their own
          status (T-7). Compact card, on Demat details, owner direction 14 Aug 2026.
          Collapsed by default. The status pill stays on the summary, so the answer
          to "am I validated?" is visible without opening anything. */}
      <details className="cardc" open>
        <summary>
          <h3>KYC status<Ref r="PR-25" /></h3>
          <Pill kind="ok" label={'KRA ' + db.kraStatus} />
          <span className="chev" aria-hidden="true"></span>
        </summary>
        <div className="body">
          <div className="btnrow" style={{ marginBottom: 6 }}><KraCheckButton /></div>
          <dl>
            <Kv label="Validated on"><Plain value={db.kraOn} /></Kv>
            <Kv label="Last checked"><Plain value={db.kraCheckedAt} /></Kv>
            <Kv label="Held at"><Plain value="CVL KRA" /></Kv>
          </dl>
          {/* PR-26 — one line. Dhan's KRA block runs three lines of explanation longer
              than everything it explains, and still does not give the answer.
              ⚠ Owner-supplied copy, 14 Aug 2026. Two points to settle: PR-26 asks for
              one line and this is two sentences; and it names mutual funds, which
              Onboarding §7 does not offer in this release. */}
          <div className="quiet">
            A KRA (KYC Registration Agency) is a SEBI-registered agency that maintains your KYC records.
            Your KYC status must be “Validated” or “Registered” to trade and invest in stocks and mutual funds
            <Ref r="PR-26" />
          </div>
          {/* Next re-KYC due removed on owner direction, 14 Aug 2026. PR-24 — surface
              periodic re-KYC when it falls due, with the period and what completing it
              requires — now has no surface anywhere in Profile. Recorded in the build notes. */}
        </div>
      </details>
      <EntityNote />
    </>
  )
}
