/* Grouped by what the customer came to do, not by which system produces it
   (DP-15). Ordered by relevance — owner direction, 16 Aug 2026.
     d    one line on what it is for
     from the earliest period it reaches (PR-109)
     act  which of view / download / email apply (PR-113)
     seg  breaks down by segment, in §7.6's vocabulary (PR-122)
     adv  offers the advance-tax instalment windows (PR-108)
     sta  a statutory document, with the basis for the obligation (DP-16)
   Copied from the reference; the HTML entities it carried are plain characters
   here because JSX escapes text for you. */

export interface Report {
  n: string; d: string; from: string; act: string[]
  seg?: boolean; adv?: boolean; sta?: string; bulk?: string; noview?: string; noemail?: string; note?: string
}
export type ReportGroup = [string, string, Report[]]

export const REPORTS: ReportGroup[] = [
  ['Most asked for', 'The four people come here for', [
    { n:'Tax P&L', d:'Realised and unrealised profit and loss', from:'FY 2022–23',
      act:['view','download','email'], seg:true, adv:true },
    { n:'Ledger', d:'Money in and out of your trading account', from:'22 April 2026, when the account opened',
      act:['view','download','email'] },
    { n:'Contract notes', d:'The legal record of each day’s trades', from:'22 April 2026',
      act:['view','download','email'], seg:true,
      sta:'SEBI Rights and Obligations, clause 32 — sent within one working day of the trade',
      bulk:'A financial year is around 120 documents. Download the range as one file' },
    /* "Statement of holding" was the same document under the depository's name
       and was removed 16 Aug 2026 as a duplicate. Its obligation moves here so
       it is not lost with the row. */
    { n:'Holdings statement', d:'What you hold, with quantity and value', from:'22 April 2026',
      act:['view','download','email'],
      sta:'SEBI Depositories Master Circular 1.8.6 — sent annually. Free by email; a physical copy costs ₹25' }
  ]],

  ['Tax and filing', 'The rest of what a return needs', [
    { n:'Capital gains statement', d:'Short-term and long-term gains, in the format your return needs',
      from:'FY 2022–23', act:['view','download','email'], adv:true },
    { n:'STT certificate', d:'Securities Transaction Tax paid', from:'FY 2022–23',
      act:['download','email'], noview:'This is a signed certificate, so it is issued as a PDF rather than a table' },
    { n:'Dividends and corporate actions', d:'Dividends, bonuses, splits and buybacks',
      from:'FY 2022–23', act:['view','download','email'] }
  ]],

  ['Money and charges', 'What you paid, and what moved', [
    /* PR-120 — the customer's own charges, not the published tariff. INDmoney
       labels a link "View Charges & Brokerage" and opens the public rate card;
       Thinq keeps the two apart.
       ⚠ The line saying which is which went on owner direction, 16 Aug 2026.
       The description still says "what you were charged", which is the load-
       bearing word, but nothing now points at Pricing for the published rates.
       The `note` field survives on the report shape, so restoring it is one
       edit. */
    { n:'Brokerage and charges', d:'What you were charged, per trade',
      from:'22 April 2026', act:['view','download','email'], seg:true },
    { n:'Funds statement', d:'Pay-ins and pay-outs, with the bank account each went to',
      from:'22 April 2026', act:['view','download','email'] }
  ]],

  ['Trades and positions', 'What you bought and sold', [
    { n:'Trade book', d:'Every trade, with date, price and quantity', from:'22 April 2026',
      act:['view','download','email'], seg:true },
    { n:'P&L calendar', d:'Day-by-day profit and loss, with charges broken out',
      from:'22 April 2026', act:['view','download'], seg:true,
      noemail:'This one is interactive, so there is nothing useful to post you' }
  ]],

  /* ⚠ Three rows removed on owner direction, 16 Aug 2026:
       · Statement of holding — a duplicate of Holdings statement above, which
         now carries its depository obligation. Correct call.
       · Daily margin statement (SEBI R&O cl. 35, sent daily)
       · Statement of accounts (SEBI R&O cl. 34)
     The last two are not duplicates. They are obliged documents with no other
     home in Profile, so a customer who loses the email that carried one can no
     longer retrieve it here. Of the five statutory documents §7.10a started
     with, two remain. Recorded in the build notes; the row definitions are gone
     rather than commented, so restoring them means re-adding from the PRD. */
  ['Other reports', 'We are obliged to send you these too', [
    { n:'Transaction statement', d:'Shares credited to and debited from your demat account',
      from:'22 April 2026', act:['view','download','email'],
      sta:'SEBI Depositories Master Circular 1.8.5 — sent quarterly' },
    { n:'Annual Global Statement', d:'The annual summary in the exchange’s prescribed format',
      from:'FY 2026–27', act:['download','email'],
      noview:'Issued as a signed PDF in NSE’s prescribed format',
      sta:'Exchange rules — sent annually' }
  ]]
]

export function reportByName(n: string): Report | null {
  let f: Report | null = null
  REPORTS.forEach((g) => { g[2].forEach((r) => { if (r.n === n) f = r }) })
  return f
}
