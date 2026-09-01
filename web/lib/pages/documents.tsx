'use client'
/* ═════════════════════════════════════════════════════════════════════════════
   §7.10 Documents — HC-REP-03.  PR-68 · PR-69 · PR-70 · PR-71
   ═════════════════════════════════════════════════════════════════════════════ */
import { db, go } from '@/lib/store'
import { EntityNote, Head, Ref } from '@/components/primitives'
import { toast } from '@/lib/ui'

/* One row, one document: what it is, then its version and date.
   ⚠ The file type and size came off on owner direction, 17 Aug 2026, within the
   hour of going on. PR-70 — state both before a download — is back to having no
   surface, and AT-P-20 fails again. Recorded in §7.14. */
function DocRow({ name, meta, what }: { name: string; meta?: string; what?: string }) {
  return (
    <div className="prow">
      <span className="t">
        <b>{name}</b>
        {what ? <span>{what}</span> : null}
        {meta ? (
          <span className="sm2" style={{ fontFamily: 'var(--sans)', fontSize: 12, display: 'block', marginTop: 4,
            color: 'var(--dim)' }}>{meta}</span>
        ) : null}
      </span>
      <span className="c">
        {/* PR-68 — free CMR re-issue to the registered email — removed on owner
            direction, 14 Aug 2026; the CMR is download-only now. */}
        <button className="btn sec sm" type="button"
                onClick={() => toast('This would download the document.')}>Download</button>
      </span>
    </div>
  )
}

export function DocumentsPage() {
  const byId = (id: string) => db.docs.filter((d) => d.id === id)[0]
  /* One list, no group headings — owner direction, 17 Aug 2026. What is left is
     short enough that grouping it was organising two rows. The account's own
     forms come first, then anything signed since, newest journey last. */
  return (
    <>
      <Head eyebrow="Account services" title="Account documents" />
      <div className="card">
        {['cmr', 'aof'].map((id) => {
          const d = byId(id)
          if (!d) return null
          return <DocRow key={id} name={d.name} meta={d.gen} what={d.what} />
        })}
        {db.signedForms.map((d) => (
          <DocRow key={d.id} name={d.name} meta={d.on ? 'e-Signed on ' + d.on : 'e-Signed with Aadhaar'} />
        ))}
      </div>

      {/* ⚠ Agreements and consents removed whole on owner direction, 17 Aug 2026 —
          both the per-artefact rows added that day and the combined Consent records
          pack that predated them. PR-69 requires the consent records to be offered
          here; they now cannot be downloaded anywhere. Recorded in §7.14. */}
      {/* ⚠ The Forms you have signed heading and its empty state came off on owner
          direction, 17 Aug 2026. PR-137a has no surface. */}

      {/* The statutory documents are not duplicated here. Contract notes, ledgers,
          P&L and holding statements are a different retrieval problem — periods,
          ranges, segments — and §7.10a is built for it. */}
      <div className="nb info"><span className="ic">◇</span><div>
        {'Contract notes, ledgers, P&L statements and holding statements are available under '}
        <button className="lnk" type="button" onClick={() => go('reports')}>Statements &amp; Reports</button>
        <Ref r="PR-136a" />
      </div></div>

      {/* The nomination opt-out declaration was removed from this list on owner
          direction, 14 Aug 2026. The declaration still exists on the record and the
          Nominee surface still shows it with its date and version (PR-34). */}
      <EntityNote />
    </>
  )
}
