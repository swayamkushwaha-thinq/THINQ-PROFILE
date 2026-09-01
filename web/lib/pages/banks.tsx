'use client'
/* ═════════════════════════════════════════════════════════════════════════════
   §7.4 Bank accounts — HC-ACC-02.  PR-27 · PR-28 · PR-29 · PR-33
   ═════════════════════════════════════════════════════════════════════════════ */
import { commit, db, isLocked } from '@/lib/store'
import { MASK } from '@/lib/vault'
import { BANK_LIMIT, BANK_PENDING_NOTE } from '@/lib/db'
import { EntityNote, Head, Kv, MaskField, Pill, Plain, Ref } from '@/components/primitives'
import { RoBanner } from '@/components/RoBanner'
import { confirmModal } from '@/components/ConfirmModal'
import { closeModal, toast } from '@/lib/ui'
import { flow } from '@/lib/flows/engine'
import type { Bank } from '@/lib/types'

export const NEW_UPI_LINE = 'We debit ₹1 from your account and automatically reverse it back to your account within '
  + '1–3 business days'

export const BANK_NAME_CHECK = 'Bank account holder name must match {name}.'
  + 'We check it in both cases before the account is added.'

/* ⚠ The name-match rule came off this block on owner direction, 17 Aug 2026.
   It is now stated only on the scan screen inside the journey (PR-28), so a
   customer reading the Bank accounts page is not told what the check is
   against. BANK_NAME_CHECK is retained in source. */
export function BankVerifyBlock() {
  return (
    <>
      <div className="prow"><span className="t"><b>UPI — faster</b><span>{NEW_UPI_LINE}</span></span></div>
      <div className="prow"><span className="t"><b>Manual</b>
        <span>We credit ₹1 to your account after you provide your bank details.</span></span></div>
    </>
  )
}

function removeBank(b: Bank) {
  confirmModal({
    title: 'Remove ' + b.bank + '?',
    body: <p>You will not be able to withdraw to this account any more. Your primary account is unaffected.</p>,
    ok: 'Remove', okKind: 'dgr',
    onOk: () => {
      db.banks = db.banks.filter((x) => x.id !== b.id)
      closeModal(); commit(); toast('Account removed.')
    },
  })
}

export function BanksPage() {
  /* An account being verified occupies a slot. It has to — the customer asked
     for it, ₹1 is already moving, and letting a fourth start while a third is
     mid-verification would put the account over the limit the moment it lands. */
  const pendingBanks = db.banks.filter((b) => b.status === 'pending').length
  const full = db.banks.length >= BANK_LIMIT

  return (
    <>
      <Head eyebrow="Account" title="Bank accounts" />
      <RoBanner />
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
        <h2 style={{ fontSize: '16px', fontWeight: 600, margin: 0, color: 'var(--ink)' }}>Linked accounts</h2>
        {isLocked() ? null : (
          <div>
            {full
              ? <span className="pill mute">{BANK_LIMIT} of {BANK_LIMIT} linked</span>
              : <button className="btn pri sm" type="button" onClick={() => flow('bank')}>Add an account</button>}
          </div>
        )}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '14px' }}>
        {/* Every row collapsed by default, owner direction 14 Aug 2026. The summary
            still carries the bank, whether it is primary, and its verification state,
            so PR-27 and PR-29 hold without any row being open. */}
        {db.banks.map((b) => (
          <div className="card" key={b.id} style={{ margin: 0 }}>
            <details className={'row col' + (b.primary ? ' pri' : '')}>
              <summary>
                <b>{b.bank}</b>
                {b.primary ? <Pill kind="gold" label="Primary" /> : null}
                {b.status === 'verified' ? <Pill kind="ok" label="Verified" />
                  : b.status === 'pending' ? <Pill kind="warn" label="Being verified" />
                  : <Pill kind="bad" label="Verification failed" />}
                <span className="chev" aria-hidden="true"></span>
                <span className="sm2">{MASK[b.f] || ''} · {b.ifsc}</span>
              </summary>
              <div className="body">
                <dl>
                  <Kv label="Account number"><MaskField field={b.f} copy="Account number" /></Kv>
                  <Kv label="IFSC"><Plain value={b.ifsc} copyWhat="IFSC" /></Kv>
                  <Kv label="Type"><Plain value={b.type} /></Kv>
                  <Kv label="Branch"><Plain value={b.branch} /></Kv>
                  {b.status === 'pending' ? (
                    <Kv label="Verification method"><Plain value={b.method + ' · ' + b.on} /></Kv>
                  ) : null}
                </dl>
                {/* PR-29 — a pending or failed verification carries its reason and next step.
                    No half-added account sits in the list with no state. */}
                {b.status === 'pending' ? (
                  <div className="note"><b>What is happening:</b> {b.note || BANK_PENDING_NOTE}<Ref r="PR-29" /></div>
                ) : null}
                {b.status === 'failed' ? (
                  <div className="note"><b>Why it failed:</b> {b.note || ''}{' '}
                    <button className="mini" type="button" onClick={() => flow('bank')}>Try again</button>
                  </div>
                ) : null}
                {/* With a single account there is nothing to switch to and no account to
                    fall back on, so neither control is offered — rather than offered and
                    then refused. Removing the primary is likewise not offered: make
                    another one primary first. */}
                {isLocked() || b.status !== 'verified' || b.primary || db.banks.length < 2 ? null : (
                  <div className="btnrow" style={{ marginTop: 13 }}>
                    <button className="btn sec sm" type="button" onClick={() => flow('primary:' + b.id)}>Make primary</button>
                    <button className="btn dgr sm" type="button" onClick={() => removeBank(b)}>Remove</button>
                  </div>
                )}
              </div>
            </details>
          </div>
        ))}
      </div>
      {/* PR-28 — the same verification the onboarding journey runs, including the
          PAN ↔ holder-name match. An unverified account is never accepted.
          Collapsed by default, and it carries everything about adding an account —
          the two verification routes, the name check, and how many you may link — so
          the reference material sits in one place rather than trailing down the page. */}
      <details className="cardc" style={{ marginTop: '14px' }}>
        <summary><h3 style={{ fontWeight: 400 }}>How we verify your bank account<Ref r="PR-28" /></h3>
          <span className="chev" aria-hidden="true"></span></summary>
        <div className="body">
          <BankVerifyBlock />
          <div className="quiet">
            {full
              ? <>You have reached the limit of {BANK_LIMIT} bank accounts
                  {pendingBanks ? ', counting ' + pendingBanks + ' still being verified' : ''}
                  . To add a different one, remove an account you no longer use first</>
              : <>You can link up to {BANK_LIMIT} bank accounts — you currently have {db.banks.length}
                  {pendingBanks ? ', including ' + pendingBanks + ' being verified' : ''}</>}
          </div>
        </div>
      </details>
      <EntityNote />
    </>
  )
}
