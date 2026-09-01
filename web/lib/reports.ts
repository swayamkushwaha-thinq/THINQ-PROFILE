/* ═════════════════════════════════════════════════════════════════════════════
   §7.10a Statements & reports.  PR-107 … PR-124.
   Period state and the window arithmetic behind it. PR-117 — the period belongs
   to the question the customer is asking, not to the report they happen to be
   looking at, so it lives here and survives every switch between reports.
   ═════════════════════════════════════════════════════════════════════════════ */
import { acctOpenIso, TODAY_ISO } from './dates'

export const FY_LIST = ['2026–27', '2025–26', '2024–25', '2023–24', '2022–23']

/* PR-108 — financial-year first, because that is the calendar Indian retail
   actually keeps, plus the presets each job implies. */
export const PERIODS: [string, string, string][] = [
  ['thisfy', 'This FY', 'FY 2026–27'],
  ['lastfy', 'Last FY', 'FY 2025–26'],
  ['thisq', 'This quarter', '1 Jul – 15 Aug 2026'],
  ['last30', 'Last 30 days', '16 Jul – 15 Aug 2026'],
  ['custom', 'Custom dates', 'Custom dates'],
]

/* Stolen wholesale from INDmoney's Tax Centre, the one piece of genuine
   tax-domain design across all three teardowns: these are the advance-tax
   instalment windows, not arbitrary quarters. PR-108. */
export const ADVANCE_TAX: [string, string][] = [
  ['at1', '1 Apr – 15 Jun'], ['at2', '16 Jun – 15 Sep'], ['at3', '16 Sep – 15 Dec'],
  ['at4', '16 Dec – 15 Mar'], ['at5', '16 Mar – 31 Mar'],
]

export const rp = { sel: '', period: 'thisfy', from: '', to: '', adv: '', seg: 'all' }

/* PR-115 — an async report is a job with a state the customer can see, not an
   email into the dark. Seeded with one of each so all three states are visible. */
export const REPORT_JOBS = [
  { id: 'RPT-8842', name: 'Contract notes', period: 'FY 2025–26', at: '15 Aug 2026, 11:04', state: 'ready' },
  { id: 'RPT-8839', name: 'Tax P&L', period: 'FY 2025–26', at: '15 Aug 2026, 10:58', state: 'working' },
  { id: 'RPT-8831', name: 'Trade book', period: 'FY 2022–23', at: '14 Aug 2026, 19:20', state: 'failed' },
]

export function fmtISO(v: string) {
  if (!v) return ''
  const p = v.split('-'), M = ['January', 'February', 'March', 'April', 'May', 'June', 'July',
    'August', 'September', 'October', 'November', 'December']
  return Number(p[2]) + ' ' + M[Number(p[1]) - 1] + ' ' + p[0]
}

export function periodLabel() {
  if (rp.period === 'custom')
    return (rp.from && rp.to) ? fmtISO(rp.from) + ' → ' + fmtISO(rp.to) : 'Custom dates'
  const m = PERIODS.filter((p) => p[0] === rp.period)[0]
  return m ? m[2] : 'This FY'
}

/* PR-110 / PR-111 — a short window on a young account is genuinely empty, and
   the honest thing is to say which window rather than to imply no history. */
export function periodIsThin() { return rp.period === 'last30' || rp.period === 'thisq' }

/* Demo only — the seeded account has nothing after this, which is what makes
   "Last 30 days" and "This quarter" empty. A custom range has to answer to the
   same fact rather than silently producing a blank file. */
export const ACTIVITY_END = '2026-06-30'

/* One place that decides whether the chosen window can produce a file, and says
   why when it cannot. Every message names the dates, so it reads as "this
   window is empty" rather than "you have no history" — the failure mode Dhan's
   illustrated "No Traded History" creates. */
export function rangeProblem(): string | null {
  const ACCT_OPEN_ISO = acctOpenIso()
  if (rp.period !== 'custom')
    return periodIsThin() ? 'Nothing between ' + periodLabel() : null
  if (!(rp.from && rp.to)) return 'Pick both dates'
  if (rp.from < ACCT_OPEN_ISO)
    return 'Your account did not exist on ' + fmtISO(rp.from)
      + '. The earliest we can report from is ' + fmtISO(ACCT_OPEN_ISO)
  if (rp.to > TODAY_ISO) return 'The end date is in the future'
  if (rp.from > rp.to) return 'The end date is before the start date'
  if (rp.from > ACTIVITY_END || rp.to < ACCT_OPEN_ISO)
    return 'Nothing between ' + fmtISO(rp.from) + ' and ' + fmtISO(rp.to)
  return null
}

/* Custom dates open on the last calendar month — owner direction, 16 Aug 2026.
   Trading days are deliberately not consulted: the range is the customer's
   question, and the report answers it with whatever days the market was open. */
export function defaultCustomRange(): [string, string] {
  const ACCT_OPEN_ISO = acctOpenIso()
  const to = TODAY_ISO
  const d = new Date(to + 'T00:00:00Z'); d.setUTCMonth(d.getUTCMonth() - 1)
  let from = d.toISOString().slice(0, 10)
  if (from < ACCT_OPEN_ISO) from = ACCT_OPEN_ISO
  if (from > to) from = to
  return [from, to]
}

/* The window each preset asks for, so it can be tested against the life of the
   account rather than offered on faith. Fixed dates because the prototype's
   "today" is fixed. */
export function periodWindow(key: string): [string, string] | null {
  const y = Number(TODAY_ISO.slice(0, 4)), m = Number(TODAY_ISO.slice(5, 7))
  const fyStart = (m >= 4 ? y : y - 1)
  if (key === 'thisfy') return [fyStart + '-04-01', TODAY_ISO]
  if (key === 'lastfy') return [(fyStart - 1) + '-04-01', fyStart + '-03-31']
  if (key === 'thisq') {
    const qs = m >= 10 ? y + '-10-01' : m >= 7 ? y + '-07-01' : m >= 4 ? y + '-04-01' : y + '-01-01'
    return [qs, TODAY_ISO]
  }
  if (key === 'last30') {
    const d = new Date(TODAY_ISO + 'T00:00:00Z'); d.setUTCDate(d.getUTCDate() - 29)
    return [d.toISOString().slice(0, 10), TODAY_ISO]
  }
  return null
}

/* A preset whose whole window falls before the account existed is not a choice,
   it is a dead end — an account opened in April 2026 has no "Last FY". Offering
   it and returning nothing is how Dhan renders ₹0.00 for periods in which the
   account did not exist (PR-118). So the presets follow the account. */
export function periodOpts() {
  const ACCT_OPEN_ISO = acctOpenIso()
  return PERIODS.filter((p) => {
    if (p[0] === 'custom') return true
    const w = periodWindow(p[0])
    return !w || w[1] >= ACCT_OPEN_ISO
  })
}

/* If the current choice is not on offer for this account, fall to the first
   that is, so nothing renders against a window the account never had. */
export function periodGuard() {
  const ok = periodOpts().some((p) => p[0] === rp.period)
  if (!ok) rp.period = (periodOpts()[0] || PERIODS[0])[0]
}
