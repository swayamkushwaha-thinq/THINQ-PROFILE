/* ═════════════════════════════════════════════════════════════════════════════
   A settings surface is a list of things you already know the name of, so the
   fastest route to one is typing it. What people arrive knowing is the name of
   the setting, not which group we filed it under.

   The index is harvested from the surfaces as they actually render, not written
   out by hand, so it cannot drift out of step with the pages. It is rebuilt on
   every focus, which also means it carries exactly what this account state is
   allowed to see: a prospect cannot search their way to a surface the rail does
   not give them, because railDef() is what it walks.
   ═════════════════════════════════════════════════════════════════════════════ */
import { renderToStaticMarkup } from 'react-dom/server'
import { railDef } from './store'
import { PAGES } from './pages/registry'

/* Words people search that the surface itself never says out loud. Each one is
   a term a customer has been handed somewhere else — by us, by the depository,
   or by their bank — and would reasonably type here. */
export const SEARCH_ALSO: Record<string, string> = {
  basic:    'pan permanent account number date of birth dob address kyc identity personal details',
  contact:  'email address mobile number phone change contact communication',
  demat:    'boid bo id dp id ckyc demat depository client master beneficiary owner',
  banks:    'bank account ifsc upi penny drop primary settlement account add bank',
  segments: 'segment fno f&o futures options equity derivatives currency commodity income proof activate ddpi',
  nominee:  'nominee nomination beneficiary opt out declaration inherit',
  reports:  'statement statements report tax p&l pnl profit loss ledger contract note holdings capital gains',
  pricing:  'pricing charges fees tariff brokerage dp charges amc',
  margin:   'margin calculator span exposure requirement',
  brokerage:'brokerage calculator cost per trade',
  prefs:    'preferences notification notifications marketing whatsapp sms email language settlement quarterly running account',
  privacy:  'privacy consent consents data rights grievance complaint',
  security: 'security pin passcode two factor 2fa authenticator totp passkey device sign out freeze unfreeze block',
  documents:'documents download aof account opening form cmr signed forms',
  closure:  'close closure deactivate delete account exit terminate',
}

export interface IndexEntry {
  label: string
  hint: string
  page: string
  pageLabel: string
  group: string
  isPage: boolean
  hay: string
}

let SEARCH_IX: IndexEntry[] | null = null

/* A heading's text is not only its words: PRD refs and status pills ride along
   inside it. Both are chrome, so neither belongs in a label or in the string
   flashRow matches against. */
export function nodeLabel(n: Element) {
  const c = n.cloneNode(true) as Element
  c.querySelectorAll('.pr, .pill, .mini, button').forEach((x) => { x.remove() })
  return (c.textContent || '').replace(/\s+/g, ' ').trim()
}

export function buildIndex(): IndexEntry[] {
  const ix: IndexEntry[] = []
  const seen: Record<string, number> = {}
  const host = document.createElement('div')

  railDef().forEach((grp) => {
    grp.items.forEach((it) => {
      const id = it[0], pageLabel = it[1]
      if (id === 'signout' || !PAGES[id]) return
      const add = (label: string, hint: string, isPage?: boolean) => {
        label = String(label || '').replace(/\s+/g, ' ').trim()
        if (label.length < 2 || label.length > 72) return
        const k = id + '|' + label.toLowerCase()
        if (seen[k]) return
        seen[k] = 1
        hint = String(hint || '').replace(/\s+/g, ' ').trim()
        ix.push({
          label, hint, page: id, pageLabel, group: grp.g, isPage: !!isPage,
          hay: (label + ' ' + hint + ' ' + (isPage ? (SEARCH_ALSO[id] || '') : '')).toLowerCase(),
        })
      }
      add(pageLabel, '', true)
      /* A surface that cannot render outside its own page is still findable by
         its name — it just contributes no rows. */
      try {
        /* Rendered un-embedded, so a surface contributes the rows it shows on
           its own page — the reference's `EMBED = false` around this call. */
        const Page = PAGES[id]
        host.innerHTML = renderToStaticMarkup(<Page />)
        host.querySelectorAll('.prow .t b, .seg .t b').forEach((b) => {
          const s = b.parentNode ? (b.parentNode as Element).querySelector('span') : null
          add(nodeLabel(b), s ? nodeLabel(s) : '')
        })
        host.querySelectorAll('details.cardc > summary h3, .chead h2, .card > h2, .card > h3')
          .forEach((n) => { add(nodeLabel(n), '') })
      } catch (err) { /* a surface that throws simply contributes no rows */ }
    })
  })
  host.innerHTML = ''
  SEARCH_IX = ix
  return ix
}

/* Matching is anchored to word starts. Plain substring matching is what makes
   a search feel broken in a small index — "pan" finding "span exposure" once
   put the margin calculator above Personal details. */
function scoreEntry(e: IndexEntry, q: string, rx: RegExp) {
  if (!rx.test(e.hay)) return -1
  const l = e.label.toLowerCase()
  let s: number
  if (l === q) s = 100
  else if (l.indexOf(q) === 0) s = 80
  else if (rx.test(l)) s = 64
  else s = 32                           /* reached through a hint or a synonym */
  if (e.isPage) s += 14                 /* a whole surface outranks one row on it */
  return s - Math.min(9, e.label.length / 12)
}

export function searchProfile(q: string): IndexEntry[] {
  q = String(q || '').toLowerCase().trim().replace(/\s+/g, ' ')
  if (!q) return []
  const rx = new RegExp('\\b' + q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
  const out: { e: IndexEntry; s: number }[] = []
  ;(SEARCH_IX || buildIndex()).forEach((e) => {
    const s = scoreEntry(e, q, rx)
    if (s >= 0) out.push({ e, s })
  })
  out.sort((a, b) => b.s - a.s || a.e.label.length - b.e.label.length)
  return out.slice(0, 8).map((o) => o.e)
}

/* Landing on a surface with fourteen rows, having just named the one you came
   for, you should not have to find it a second time. */
export function flashRow(label: string) {
  const want = String(label).replace(/\s+/g, ' ').trim().toLowerCase()
  const nodes = document.querySelectorAll('#main .prow .t b, #main .seg .t b, '
    + '#main details.cardc > summary h3, #main .chead h2, #main .card > h2, #main .card > h3')
  for (let i = 0; i < nodes.length; i++) {
    if (nodeLabel(nodes[i]).toLowerCase() !== want) continue
    const row = (nodes[i].closest('.prow, .seg, details.cardc, .card') || nodes[i]) as HTMLElement
    const det = nodes[i].closest('details.cardc') as HTMLDetailsElement | null
    if (det && !det.open) det.open = true
    row.classList.add('pflash')
    setTimeout(() => { row.classList.remove('pflash') }, 2100)
    try { row.scrollIntoView({ block: 'center', behavior: 'smooth' }) } catch (err) { row.scrollIntoView() }
    return
  }
}
