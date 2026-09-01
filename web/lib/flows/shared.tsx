'use client'
/* Helpers the journeys share: masking for third-party values, the validation
   wording lifted from the KYC journey, and the charge pop-up that fronts a
   contact change. */
import { db, commit } from '@/lib/store'
import { feeTotal } from '@/lib/db'
import { inr } from '@/lib/dates'
import { ReviewRows } from '@/components/ReviewRows'
import { confirmModal } from '@/components/ConfirmModal'
import { closeModal } from '@/lib/ui'
import { F, flow, fnext, closeFlowInternal } from './engine'

export const DEMO_BAD_PIN = '1111'
export const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/

export function maskMobile(v: string) { return v.slice(0, 2) + '•••••' + v.slice(-3) }
export function maskEmail(v: string) { const p = v.split('@'); return p[0].slice(0, 2) + '•••@' + p[1] }
export function maskAddr(v: string) { return v.slice(0, 6) + '••••••••, ' + v.slice(-6) }

/* PR-52 — the charge is disclosed before the customer commits. One charge and
   no choices is a confirmation, not a page, so it is asked in the pop-up. */
export function chgAsk(kind: string) {
  const need = Math.max(feeTotal() - db.funds, 0)
  confirmModal({
    title: (kind === 'mobile' ? 'Mobile number' : 'Email address') + ' update charges',
    /* The balance and the way to top it up only appear when the charge cannot
       be met. With the money already there, adding funds is not a decision the
       customer has to make here. */
    body: (
      <>
        <ReviewRows rows={([['One-time fee', '₹' + feeTotal() + ', GST included'],
          ['Recurring cost', 'None'],
          ['Charged to', 'Your Thinq account']] as [string, string][])
          .concat(need ? ([['Available in your account', '₹' + inr(db.funds)]] as [string, string][]) : [])} />
        {need ? (
          <div className="nb bad"><span className="ic">!</span><div>
            {'You need ₹' + feeTotal() + ', but your account balance is ₹' + inr(db.funds)
              + '. Please add funds to continue'}
          </div></div>
        ) : null}
      </>
    ),
    ok: need ? 'Add funds' : 'Continue',
    onOk: () => {
      closeModal()
      if (need) {
        /* Top up over UPI, then come straight back to the change that needed it. */
        const back = 'contact:' + kind, at = F ? F.i + 1 : 0
        const keep = F
        closeFlowInternal(true)
        flow('upi:' + need)
        /* Come back past the page they have already read and agreed to, not
           onto it again. */
        if (F) { (F as any).after = back; (F as any).afterStep = at }
        void keep
      } else fnext()
    },
  })
}
