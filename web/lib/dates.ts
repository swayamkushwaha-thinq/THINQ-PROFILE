/* PR-118 — the account is the lower bound. Nothing before it exists to report,
   and Dhan's picker offering 2003 while rendering ₹0.00 for it is the defect
   this closes. */
import { db } from './store'
import { NEXT } from './seed'

export const TODAY_ISO = '2026-08-15'

/* Read from the account rather than hard-coded, so the whole surface follows the
   profile it is rendering rather than one seeded customer. */
export function isoOf(longDate: string) {
  const M = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August',
    'September', 'October', 'November', 'December']
  const p = String(longDate || '').trim().split(/\s+/)
  const i = M.indexOf(p[1])
  if (p.length < 3 || i < 0) return '2026-04-22'
  return p[2] + '-' + String(i + 1).padStart(2, '0') + '-' + String(Number(p[0])).padStart(2, '0')
}

export function acctOpenIso() { return isoOf(db.openedOn) }

export function stamp(d: Date) {
  const p = (n: number) => String(n).padStart(2, '0')
  const M = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  return d.getDate() + ' ' + M[d.getMonth()] + ' ' + d.getFullYear() + ', '
    + p(d.getHours()) + ':' + p(d.getMinutes()) + ':' + p(d.getSeconds())
}

export function cycLabel(c: string) { return c === 'monthly' ? 'Monthly' : 'Quarterly' }
export function cycGap(c: string) { return c === 'monthly' ? 'every 30 days' : 'every 90 days' }

/* PR-138a — a cycle change cannot land on top of a settlement that is about to
   run. Both cycles are checked, not just the one being left: if the customer is
   on quarterly and the next monthly date is two days away, switching would
   create a payout inside the window the back office has already frozen. Three
   business days, counted from today, weekends excluded. No holiday calendar
   here — the exchange list is published (CAL) and the real rule should count
   against it. */
export const SETTLE_LOCK_DAYS = 3

/* NEXT holds a Friday/Saturday pair — "4 / 5 September 2026". The first date is
   the one the clock runs to. */
export function nextSettleISO(cycle: string) {
  const m = String((NEXT as Record<string, string>)[cycle] || '').match(/^\s*(\d+)\s*\/\s*\d+\s+(.+?)\s*$/)
  return m ? isoOf(m[1] + ' ' + m[2]) : ''
}

export function bizDaysTo(iso: string) {
  if (!iso) return 99
  const d = new Date(TODAY_ISO + 'T00:00:00'), e = new Date(iso + 'T00:00:00')
  let n = 0
  if (!(e > d)) return 0
  while (d < e) { d.setDate(d.getDate() + 1); const w = d.getDay(); if (w !== 0 && w !== 6) n++ }
  return n
}

export function settleLocked(cycle: string) { return bizDaysTo(nextSettleISO(cycle)) <= SETTLE_LOCK_DAYS }

/* The reason names the date the customer is waiting on, because "not available"
   without a date is the defect PR-05 exists for. */
export function settleLockReason() {
  const cur = db.prefs.settlement, other = (cur === 'monthly' ? 'quarterly' : 'monthly')
  if (settleLocked(cur))
    return 'Your next settlement is on ' + (NEXT as Record<string, string>)[cur]
      + '. You can change your settlement cycle after this cycle is completed'
  if (settleLocked(other))
    return 'The next ' + other + ' settlement is on ' + (NEXT as Record<string, string>)[other]
      + '. You can change your settlement cycle after that cycle is completed'
  return ''
}

export function nomMax() { return 4 }

export function openRequests() {
  const out: { t: string; ref: string; go: string }[] = []
  const c = db.contactChange as any, n = db.nomineeRequest as any,
    g = db.segmentRequest as any, d = db.ddpiRequest as any
  if (c && c.stage < 6)
    out.push({ t: (c.kind === 'email' ? 'Email address' : 'Mobile number') + ' change', ref: c.reqid, go: 'contact' })
  if (n && n.stage < nomMax())
    out.push({ t: n.type === 'edit' ? 'Nominee correction' : 'Nominee request', ref: n.ref, go: 'nominee' })
  if (g && g.stage < 6)
    out.push({ t: g.name + ' activation', ref: g.ref, go: 'segments' })
  if (d && d.stage < 3)
    out.push({ t: 'DDPI (Instant Sell) activation', ref: d.ref, go: 'prefs' })
  /* A bank verification in flight counts too — it is the account the closure
     would pay the balance into. */
  db.banks.forEach((b) => {
    if (b.status === 'pending') out.push({ t: b.bank + ' account verification', ref: '', go: 'banks' })
  })
  return out
}

export function inr(n: number | string) { return Number(n).toLocaleString('en-IN') }
