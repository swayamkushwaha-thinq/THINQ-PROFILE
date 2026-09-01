'use client'
/* PR-05 / T-3 — where a state disables controls, the reason is stated in the
   same place. A greyed-out switch with no explanation is the defect, not the
   greying-out.
   A lock only speaks where it actually takes something away. Personal details and
   Demat details hold no self-service control at all — a banner there tells a
   customer they cannot do a thing they were never able to do. Both the closure
   lock and the contact lock use this list. */
import { contactLockReason, db, getCur, go, isClosing, isRO } from '@/lib/store'
import { Ref } from './primitives'

export const LOCKABLE_PAGES = ['contact', 'banks', 'nominee', 'segments', 'prefs', 'privacy', 'security', 'closure']

export function RoBanner() {
  const cur = getCur()
  /* The submitted state is the exception: nothing anywhere is editable then,
     including the fields on Personal details, so its banner belongs on every
     surface that renders one. */
  if (isClosing() && LOCKABLE_PAGES.indexOf(cur) < 0) return null
  if (!isRO()) {
    const cl = (LOCKABLE_PAGES.indexOf(cur) >= 0 && cur !== 'contact') ? contactLockReason() : ''
    if (!cl) return null
    const i = cl.indexOf('. ')
    return (
      <div className="nb warn"><span className="ic">◇</span><div>
        <b>{cl.slice(0, i)}.</b> {cl.slice(i + 2)}.<Ref r="PR-139a" />{' '}
        <button className="mini" type="button" onClick={() => go('contact')}>Track progress</button>
      </div></div>
    )
  }
  const why = db.state === 'submitted'
    ? <><b>These settings are locked for now.</b> Your application has been e-Signed and is being processed. These
        details can’t be changed until your account is live because they are part of your signed application record</>
    : <>Settings are locked while account closure is in progress</>
  return <div className="nb warn"><span className="ic">◇</span><div>{why}</div></div>
}
