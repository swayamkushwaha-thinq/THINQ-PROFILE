/* ═════════════════════════════════════════════════════════════════════════════
   The record. Sources: Onboarding §5 data inventory, §0.9 entity, §7 segments.
   Every value is carried over from prototype/index.html unchanged.
   ═════════════════════════════════════════════════════════════════════════════ */
import type { Db } from './types'

export function makeDb(): Db {
  return {
    state: 'active',
    kycStage: 'K12',                    /* PR-08 — the stage code §18 comms key on */
    name: 'ARVIND YADAV',
    display: 'Arvind',
    father: 'Rameshbhai Kanubhai Sharma',
    aadhaar4: '3121',
    gender: 'Male',
    marital: 'Married',
    occupation: 'Private sector employee',
    income: '₹10–25 lakh',
    address: '402 Sunrise Residency, Satellite Road, Ahmedabad, Gujarat 380015',
    kraStatus: 'Validated',
    kraCheckedAt: 'Today, 09:14',       /* PR-25 — fetched and rendered, never linked out */
    kraOn: '22 April 2026',
    reKycDue: 'April 2036',
    ucc: 'TQ004217',
    dpId: '12063900',
    openedOn: '22 April 2026',
    sebiDp: 'IN-DP-22-2015',
    entity: 'Money Logix Securities Private Limited',

    /* One verified account is the resting state of a four-month-old account, so
       that is what seeds. The second account — being verified, verified, or
       failed — is a scenario off the prototype bar (seedBanks), not a fixture:
       an addition permanently in progress reads as a stuck account rather than
       as the transient state it is. */
    banks: [
      { id: 'b1', bank: 'HDFC Bank', branch: 'Satellite, Ahmedabad', ifsc: 'HDFC0001204', type: 'Savings',
        f: 'bank1', primary: true, status: 'verified', method: 'Manual (₹1 credit)', on: '22 April 2026' },
    ],

    /* Onboarding §8 — nominate or opt out, no third state. Seeded on the opt-out
       branch because that is the population the §7/§8 confirmations promised a
       route to, and the one PR-34 is written for. */
    nomineeOptOut: { on: '22 April 2026', version: 'NOM-OPTOUT v1.2', artefact: 'NOM-OPTOUT-TQ004217-20260422' },
    nominees: [],

    /* §7 — Equity mandatory; F&O and Commodity toggleable. Currency and Mutual
       Funds are not offered in this release, so they appear nowhere. */
    segments: [
      { code: 'EQ',   name: 'Equity',            venue: 'NSE · BSE', mandatory: true,  status: 'active',
        since: '22 April 2026', exch: 'enabled' },
      { code: 'FNO',  name: 'Futures & Options', venue: 'NSE · BSE', mandatory: false, status: 'descoped',
        drop: 'descoped', on: '22 April 2026' },
      { code: 'COMM', name: 'Commodity',         venue: null,        mandatory: false, status: 'inactive' },
    ],
    positions: { FNO: ['NIFTY 28AUG26 24500 CE — 2 lots', 'RELIANCE 28AUG26 FUT — 1 lot'] },

    ddpiRequest: null,
    unfreezeReq: false,
    /* Pledged holdings block a closure until released, so the row states the
       count when there are some and simply "None" when there are not — a rule
       that does not apply to this customer is noise on a screen they are reading
       to find out what applies to them. */
    pledged: [],
    /* What has to clear before a closure can be raised. Money is not a blocker —
       it is paid out by the closure itself. */
    outstanding: { holdings: 3, holdingsVal: '₹1,84,200', money: 12480, dues: 0 },
    /* nextSettlement is gone — the date now comes from the exchange calendar
       (NEXT), not from a first-Friday rule. rasOn/rasVer are the running-account
       authorisation the settlement card cites. */
    prefs: {
      settlement: 'quarterly', rasOn: '22 April 2026', rasVer: 'v1.0', ecn: 'email', ddpi: false, lang: 'en',
      biometric: true,
      notif: { priceAlerts: true, digest: true, wa: true },
    },

    consents: [
      { id: 'C-PROC', name: 'Processing of your personal data',         v: 'v2.1', on: '22 April 2026', st: 'active',   req: true },
      { id: 'C-TNC',  name: 'Terms & Conditions',                       v: 'v3.0', on: '22 April 2026', st: 'restated', req: true, newV: 'v3.1', why: 'The tariff schedule and the running-account clause changed.' },
      { id: 'C-RDD',  name: 'Risk Disclosure Document',                 v: 'v1.4', on: '22 April 2026', st: 'active',   req: true },
      { id: 'C-MITC', name: 'Most Important Terms & Conditions',        v: 'v1.1', on: '22 April 2026', st: 'active',   req: true },
      { id: 'C-RAS',  name: 'Running account settlement authorisation', v: 'v1.0', on: '22 April 2026', st: 'active',   req: true },
      { id: 'C-ECN',  name: 'Electronic contract notes',                v: 'v1.0', on: '22 April 2026', st: 'active',   req: false },
      { id: 'C-MKTG', name: 'Marketing communications',                 v: 'v1.0', on: '22 April 2026', st: 'active',   req: false },
    ],

    totp: false,
    devices: [
      { id: 'd1', name: 'iPhone 15 — Safari',        kind: 'Passkey', last: 'Today, 09:14',       here: true },
      { id: 'd2', name: 'MacBook Air — Chrome',      kind: 'Passkey', last: '11 Aug 2026, 21:02', here: false },
      { id: 'd3', name: 'Redmi Note 12 — Thinq app', kind: 'Device',  last: '02 Aug 2026, 18:47', here: false },
    ],
    signins: [
      { at: '14 Aug 2026, 09:14', where: 'Ahmedabad, IN', dev: 'iPhone 15 — Safari',   ok: true },
      { at: '13 Aug 2026, 20:31', where: 'Ahmedabad, IN', dev: 'MacBook Air — Chrome', ok: true },
      { at: '11 Aug 2026, 07:58', where: 'Mumbai, IN',    dev: 'Unknown — Chrome',     ok: false },
      { at: '09 Aug 2026, 11:22', where: 'Ahmedabad, IN', dev: 'iPhone 15 — Safari',   ok: true },
    ],
    apps: [
      { id: 'a1', name: 'Sensibull', scope: 'Read holdings · Place orders', on: '02 July 2026' },
      { id: 'a2', name: 'Quicko',    scope: 'Read trade history',           on: '18 June 2026' },
    ],

    /* PR-95 — every e-Signed change is filed here, not only emailed. Seeded with
       the history a four-month-old account would hold; anything signed during the
       session appends to it. */
    signedForms: [
      { id: 'chgform0',  name: 'Email address change form',   on: '02 June 2026' },
      { id: 'segform0',  name: 'Commodity activation form',   on: '11 July 2026' },
      { id: 'ddpiform0', name: 'DDPI (Instant Sell) form',    on: '28 July 2026' },
      { id: 'nomform0',  name: 'Nomination form — Meera Arvind Sharma', on: '05 August 2026' },
    ],
    docs: [
      { id: 'cmr', name: 'Client master report', v: 'CMR v1', gen: '22 April 2026', type: 'PDF', size: '214 KB', reissue: true,
        what: 'Your demat and bank details as held by the depository. This is the document another broker, a bank or a registrar will ask you for.' },
      { id: 'aof', name: 'Account opening form', v: 'AOF v4.2', gen: '22 April 2026', type: 'PDF', size: '1.8 MB',
        what: 'The form you e-Signed when the account was opened. It is a closed record of what was declared at that time.' },
      { id: 'con', name: 'Consent records', v: '—', gen: 'Generated on request', type: 'PDF', size: '96 KB',
        what: 'Every consent artefact you accepted, with its version and the moment you accepted it.' },
      /* ⚠ Both additions of 17 Aug 2026 — the KYC application form and the FATCA
         and CRS declaration — were removed the same day on owner direction. What
         was submitted to the KRA, and the tax-residency declaration, are
         retrievable nowhere in Profile. Recorded in §7.14. */
    ],

    funds: 0,                 /* balance in the trading account — mock */
    nomineeRequest: null,     /* a nomination or a correction, in flight */
    segmentRequest: null,     /* a segment activation, in flight */
    contactChange: null, freeze: null, closure: null, revealPanelOpen: false,
  }
}

export const BANK_LIMIT = 3   /* how many bank accounts a customer may link */
/* The KRA-modification charge applies to a registered mobile or email change
   only. A nomination carries no charge. */
export const CONTACT_CHANGE_FEE = 50
export const GST_RATE = 0.18
export function feeTotal() { return Math.round(CONTACT_CHANGE_FEE * (1 + GST_RATE)) }

export const NOMINEE_LIMIT = 3

/* What a pending verification says. Owner direction, 14 Aug 2026: keep it to
   the one fact. Held in one place so a seeded row and a freshly added row
   cannot word the same state differently (PR-80). */
export const BANK_PENDING_NOTE = 'We are securely verifying your bank account details'
