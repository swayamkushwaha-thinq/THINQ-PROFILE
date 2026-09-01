/* The prototype keeps one mutable record and calls render() after every change.
   That model is preserved here rather than reinterpreted as immutable React
   state: the flows mutate DB in place at ~40 call sites and reproducing their
   behaviour exactly is the requirement. Mutation is confined to this module's
   `db` export plus commit(); components never hold their own copy. */
import { makeDb } from './db'
import { remaskAll } from './vault'
import { MASK } from './vault'
import type { AccountState, Db } from './types'

export let db: Db = makeDb()

let version = 0
const listeners = new Set<() => void>()

export function subscribe(fn: () => void) {
  listeners.add(fn)
  return () => { listeners.delete(fn) }
}
export function getSnapshot() { return version }
export function getServerSnapshot() { return 0 }

/* The prototype's render(). Every mutation ends in one of these. */
export function commit() {
  version++
  listeners.forEach((fn) => fn())
}

export function resetDb(next?: Partial<Db>) {
  db = Object.assign(makeDb(), next || {})
  commit()
}

/* ── state predicates ───────────────────────────────────────────────────────── */
export const STATES: Record<AccountState, { label: string; note: string }> = {
  prospect:  { label: 'Prospect',          note: 'Registered — mobile and email verified. KYC not started.' },
  in_kyc:    { label: 'In KYC',            note: 'Application in flight. PAN verified.' },
  submitted: { label: 'Submitted',         note: 'e-Signed on 14 August 2026. Awaiting activation.' },
  active:    { label: 'Activated',         note: 'Account opened ' + '22 April 2026' + '.' },
  frozen:    { label: 'Frozen',            note: 'Trading is blocked. Holdings and history are intact.' },
  closing:   { label: 'Closure requested', note: 'Closure is in progress.' },
}

export function isPost() { return ['active', 'frozen', 'closing'].indexOf(db.state) >= 0 }  /* KYC complete */
export function isActive() { return db.state === 'active' }
export function isFrozen() { return db.state === 'frozen' }
export function isClosing() { return db.state === 'closing' }
export function isRO() { return ['submitted', 'closing'].indexOf(db.state) >= 0 }

/* PR-139a — while a mobile or email change is in flight, nothing else about the
   account may be changed. A contact change is the takeover vector: whoever
   controls the registered mobile receives every OTP that authorises everything
   else, so the window between asking and the depository confirming is exactly
   when a bank account, a nominee or a segment must not move. The one exception
   is the **freeze** — the control that makes the account safer, never less, and
   the one a customer who has spotted the takeover needs most. */
export function contactLockReason() {
  const c = db.contactChange
  if (!c || c.stage >= 6) return ''
  return 'Your ' + (c.kind === 'email' ? 'email address' : 'mobile number') + ' change is in progress. You can’t make other '
    + 'changes until it’s complete'
}
/* Every gate that used isRO() for "may this be changed" asks this instead. The
   freeze control, and Security, deliberately do not. */
export function isLocked() { return isRO() || !!contactLockReason() }

/* ── summaries ──────────────────────────────────────────────────────────────── */
export function totalShare() { return db.nominees.reduce((n, x) => n + Number(x.share), 0) }

export function bankSummary() {
  const p = db.banks.filter((b) => b.primary)[0]
  const pend = db.banks.filter((b) => b.status === 'pending').length
  return (p ? p.bank + ' is primary' : 'No primary account') + (pend ? ' · ' + pend + ' being verified' : '')
}
export function segSummary() {
  const on = db.segments.filter((s) => s.status === 'active').map((s) => s.name)
  const prog = db.segments.filter((s) => s.status === 'pending' || s.status === 'approved').length
  const off = db.segments.filter((s) => s.status === 'descoped').length
  return on.join(', ') + (prog ? ' · ' + prog + ' in progress' : '') + (off ? ' · ' + off + ' left off at opening' : '')
}
export function prefSummary() {
  return 'Settlement ' + db.prefs.settlement + ' · contract notes by ' + (db.prefs.ecn === 'email' ? 'email' : 'post')
    + ' · DDPI (Instant Sell) ' + (db.prefs.ddpi ? 'on' : 'not active')
}
export function privacySummary() {
  const m = db.consents.filter((c) => c.id === 'C-MKTG')[0]
  return 'Marketing ' + (m.st === 'withdrawn' ? 'off' : 'on') + ' · ' + db.consents.length + ' consent records'
}

/* ═════════════════════════════════════════════════════════════════════════════
   §3.3 Attention band — zero or more items needing the customer's action, each
   with one verb. PR-09: the status and the CTA name the same actor.
   ═════════════════════════════════════════════════════════════════════════════ */
export interface AttentionItem {
  quiet?: boolean
  page: string
  t: string
  s: string
  cta?: string
  go?: string
  flow?: string
}

export function attention(): AttentionItem[] {
  const a: AttentionItem[] = []
  if (!isPost() && db.state !== 'submitted') return a
  if (isClosing()) {
    a.push({ page: 'closure', t: 'Closure is in progress',
      s: 'We are closing your trading and demat accounts. You can follow it here.',
      cta: 'View closure', go: 'closure' })
    return a
  }
  /* A contact change waiting on the depository is deliberately NOT here. The
     attention band is for things needing the customer's action; that one is
     waiting on us, and putting it here would make the band disagree with the
     status about who the actor is — PR-09 from the other direction. */
  if (db.nominees.length === 0 && db.nomineeOptOut) {
    /* PR-34 — the record says a declaration was signed, not that a field is blank.
       quiet:true — owner direction (14 Aug 2026): kept off the Profile home band.
       §3.3 lists this as a band item, so this is a recorded deviation, not an
       oversight. The rail dot and the Nominee surface still carry it. */
    a.push({ quiet: true, page: 'nominee', t: 'No nominee on record',
      s: 'You signed an opt-out declaration on ' + db.nomineeOptOut.on + '. You can add a nominee at any time.',
      cta: 'Add a nominee', flow: 'nominee' })
  }
  const fno = db.segments.filter((s) => s.code === 'FNO')[0]
  if (fno && fno.status === 'descoped') {
    a.push({ page: 'segments', t: 'Futures & Options was left off when the account was opened',
      s: 'You chose to open with equity only. Activating F&O now is a separate journey with its own income proof and its own e-Sign.',
      cta: 'See what it takes', flow: 'segment:FNO' })
  }
  const pend = db.banks.filter((b) => b.status === 'pending')[0]
  if (pend) a.push({ page: 'banks', t: 'A bank account is still being verified',
    s: pend.bank + ' ' + MASK[pend.f] + ' — nothing is needed from you.',
    cta: 'View', go: 'banks' })
  const rest = null   /* Privacy & consents surface removed — nothing to route to */
  /* PR-59 — the prior acceptance is not treated as covering the new version.
     quiet:true — owner direction (14 Aug 2026): kept off the Profile home band.
     PR-59 requires it *in the band* and AT-P-19 tests for it, so this is a
     recorded deviation from the PRD that needs the PRD updated or the decision
     reversed. The rail dot and the Privacy surface still carry it. */
  if (rest) a.push({ quiet: true, page: 'privacy', t: '', s: '', cta: 'Review', flow: 'reconsent' })
  return a
}
/* The band shows only items the customer must act on now. Quiet items stay in
   the rail as a dot and on their own surface. */
export function bandItems() { return attention().filter((a) => !a.quiet) }

/* ═════════════════════════════════════════════════════════════════════════════
   §3 Information architecture.
   §3.2 lists 22 items in six groups; §7 specifies eleven surfaces. The items
   inside PREFERENCES / PRIVACY / SECURITY / DOCUMENTS are rendered as sections
   within their surface — see build notes.
   ═════════════════════════════════════════════════════════════════════════════ */
export type RailItem = [string, string, (boolean | 'out')?]
export interface RailGroup { g: string; items: RailItem[]; badge?: string }

export function railDef(): RailGroup[] {
  const att = attention()
  const has = (id: string) => att.some((a) => a.page === id)
  if (db.state === 'prospect' || db.state === 'in_kyc') return [
    { g: 'Account details', items: [['contact', 'Contact details']] },
    { g: 'Security',        items: [['security', 'Security'], ['signout', 'Log out', 'out']] },
  ]
  if (db.state === 'submitted') return [
    { g: 'Account details', items: [['basic', 'Personal details'], ['contact', 'Contact details']] },
    { g: 'Account',         items: [['banks', 'Bank accounts'], ['segments', 'Segments'], ['nominee', 'Nominee']] },
    { g: 'Security',        items: [['security', 'Security'], ['signout', 'Log out', 'out']] },
  ]
  return [
    { g: 'Account details', items: [['basic', 'Personal details', has('basic')],
                                    ['contact', 'Contact details', has('contact')],
                                    ['demat', 'Demat details']] },
    { g: 'Account',     items: [['banks', 'Bank accounts', has('banks')],
                                ['segments', 'Segments', has('segments')],
                                ['nominee', 'Nominee', has('nominee')]] },
    { g: 'Reports',     items: [['reports', 'Statements & reports']] },
    /* ⚠ Trading calculators, owner direction 14 Aug 2026. This is the one thing
       §1.4 and PR-50 rule out outright — "Profile is not a growth surface. No
       upsell tiles, no badges on products, no cross-sell in the rail" (DP-6) —
       and PR-67 names Paytm burying Security "below the Brokerage and SIP
       calculators" as the defect to avoid. Recorded in the build notes. */
    { g: 'Pricing & calculators',
                        items: [['pricing', 'Pricing'], ['margin', 'Margin calculator'],
                                ['brokerage', 'Brokerage calculator']] },
    { g: 'Preferences', items: [['prefs', 'Preferences']] },
    { g: 'Account services',
                        items: [['documents', 'Account documents'],
                                ['closure', 'Account closure', has('closure')]] },
    /* PR-67 — Security stays a named top-level group; it sits last by owner
       direction. The requirement is against burying it inside another group
       (Paytm puts it under Settings, below the calculators), not against order. */
    { g: 'Security',    items: [['security', 'Security'], ['signout', 'Log out', 'out']] },
  ]
}

/* Profile home was removed on owner direction, 14 Aug 2026. The landing surface
   is Personal details, or Contact details in the states that have no Personal details.
   PAGES.home is kept only so old references resolve rather than dead-end. */
export function landing() { return railDef()[0].items[0][0] }

export const GO_ALIAS: Record<string, string | null> = {
  personal: 'basic', ids: 'demat', account: 'closure', freeze: 'security', home: null,
}

export let cur = 'basic'
export function setCur(id: string) { cur = id }
export function getCur() { return cur }

/* Kept in sync with the prototype's render(): the current surface must always be
   one the rail actually offers in this account state. */
export function normaliseCur() {
  const allowed: string[] = []
  railDef().forEach((g) => g.items.forEach((i) => allowed.push(i[0])))
  if (allowed.indexOf(cur) < 0) cur = landing()
}

export function go(id: string) {
  if (id === 'home') id = landing()
  else if (GO_ALIAS[id]) id = GO_ALIAS[id] as string
  remaskAll()
  cur = id
  commit()
  /* Name the surface in the URL so a refresh comes back to it rather than to
     the landing page — and so a link to a Profile surface is a link to that
     surface. replaceState keeps the Back button meaning "leave Profile". */
  try { history.replaceState(null, '', '#' + id) } catch (e) { /* ignore */ }
  window.scrollTo(0, 0)
  const main = document.getElementById('main')
  if (main) main.focus()
}
