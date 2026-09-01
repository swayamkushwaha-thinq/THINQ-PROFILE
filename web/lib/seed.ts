/* Prototype affordances — the strip across the top seeds scenarios so a
   reviewer can reach a state without walking the journey to it. Carried over
   from the prototype unchanged; this is not product chrome. */
import { db, commit, setCur } from './store'
import { remaskAll } from './vault'
import type { Nominee } from './types'

/* Fixtures behind the prototype's Nominees control, so both states can be seen
   without walking the journey each time. */
export function seedNominees(n: number): any[] {
  const a: any[] = [
    { name: 'Meera Arvind Sharma', relation: 'Spouse', dob: '22 July 1995', share: 60,
      idType: 'Aadhaar', id4: '3121', mobile: '9824113077', email: 'meera.sharma@outlook.com',
      addr: db.address, minor: false },
    { name: 'Kabir Arvind Sharma', relation: 'Son', dob: '09 March 2014', share: 40,
      idType: 'Aadhaar', id4: '8874', mobile: '9825550110', email: 'kabir.sharma@outlook.com',
      addr: db.address, minor: true,
      guardian: 'Meera Arvind Sharma', guardianRel: 'Mother', gdob: '22 July 1995',
      gIdType: 'Aadhaar', gId4: '3121', gMobile: '9824113077', gEmail: 'meera.sharma@outlook.com',
      gAddr: db.address },
  ]
  if (n === 1) { const one = Object.assign({}, a[0]); one.share = 100; return [one] }
  if (n === 2) return a
  return []
}

export const segPick: Record<string, boolean> = {}

export function seedSegments(kind: string) {
  const fno = db.segments[1], comm = db.segments[2]
  const off = (sg: any, drop: boolean) => {
    sg.status = drop ? 'descoped' : 'inactive'
    if (drop) sg.drop = 'descoped'; else delete sg.drop
    sg.on = drop ? '22 April 2026' : undefined
    delete sg.exch; delete sg.since
  }
  const on = (sg: any, exch: boolean) => {
    sg.status = 'active'; sg.exch = exch ? 'enabled' : 'pending'
    sg.since = '22 April 2026'; delete sg.drop; delete sg.on
    if (sg.code === 'COMM') sg.venue = 'NSE or BSE commodity derivatives — pending C54'
  }
  for (const k in segPick) delete segPick[k]
  if (kind === 'eq')     { off(fno, true);  off(comm, false) }
  if (kind === 'none')   { off(fno, false); off(comm, false) }
  if (kind === 'eqfno')  { on(fno, true);   off(comm, false) }
  if (kind === 'eqcomm') { off(fno, true);  on(comm, true) }
  if (kind === 'all')    { on(fno, true);   on(comm, true) }
  db.segmentRequest = null
  const raise = (nm: string) => {
    db.segmentRequest = { name: nm, ref: 'SEG-' + db.ucc + '-0814', on: '14 August 2026', stage: 4 }
  }
  if (kind === 'fnoPending')  { on(fno, false); off(comm, false); raise('F&O') }
  if (kind === 'commPending') { off(fno, true); on(comm, false);  raise('Commodity') }
  if (kind === 'bothPending') { on(fno, false); on(comm, false);  raise('F&O & Commodity') }
  setCur('segments'); commit(); window.scrollTo(0, 0)
}

/* Prototype affordance — the second account's verification state is a scenario,
   not a fixture. "Being verified" was seeded permanently, which made it the only
   one of the four outcomes anyone could see: verified, failed and no-second-
   account were all reachable only by walking the add-bank journey, and the
   pending state could not be cleared at all. PR-29 requires a pending or failed
   verification to carry its reason and its next step, so both need to be
   demonstrable side by side. */
export function seedBanks(kind: string) {
  const b1: any = db.banks[0]
  b1.primary = true; b1.status = 'verified'
  if (kind === 'one') { db.banks = [b1]; setCur('banks'); commit(); window.scrollTo(0, 0); return }
  /* Switching away from "one account only" and back has to rebuild the second
     account rather than resurrect a reference the list no longer holds. */
  const b2: any = db.banks[1] || { id: 'b2', bank: 'ICICI Bank', branch: 'Prahladnagar, Ahmedabad',
    ifsc: 'ICIC0000281', type: 'Savings', f: 'bank2', primary: false }
  b2.primary = false; b2.method = 'UPI (₹1 debit, reversed)'; b2.on = '11 August 2026'
  if (kind === 'verified') { b2.status = 'verified'; b2.note = null }
  else if (kind === 'failed') {
    b2.status = 'failed'
    b2.note = 'The name on this account does not match ' + db.name + ', the name on your PAN. '
      + 'Nothing was added, and no money moved.'
  } else { b2.status = 'pending'; b2.note = null }
  db.banks = [b1, b2]
  setCur('banks'); commit(); window.scrollTo(0, 0)
}

/* Prototype affordance — drops a request straight onto the relevant surface so
   the tracking view can be seen without walking the journey first. */
export function seedRequest(kind: string) {
  db.contactChange = null; db.nomineeRequest = null; db.ddpiRequest = null; db.segmentRequest = null
  if (kind === 'mobile' || kind === 'email') {
    db.contactChange = { kind, value: '', on: '14 August 2026', reqid: 'CHG-' + db.ucc + '-0814', stage: 3 } as any
    setCur('contact')
  } else if (kind === 'nomadd') {
    if (!db.nominees.length) db.nominees = seedNominees(1) as Nominee[]
    db.nomineeRequest = { type: 'add', name: (db.nominees[0] as any).name, ref: 'NOM-' + db.ucc + '-0814',
      on: '14 August 2026', stage: 2 }
    setCur('nominee')
  } else if (kind === 'nomedit') {
    if (!db.nominees.length) db.nominees = seedNominees(1) as Nominee[]
    db.nomineeRequest = { type: 'edit', name: (db.nominees[0] as any).name, ref: 'NOM-' + db.ucc + '-0814',
      on: '14 August 2026', stage: 1 }
    setCur('nominee')
  } else if (kind === 'ddpi') {
    /* Stage 2 is the depository leg — the state that lasts, and the one the
       tracker was built to explain. */
    db.prefs.ddpi = false
    db.ddpiRequest = { ref: 'DDPI-' + db.ucc + '-0814', on: '14 August 2026', stage: 2 }
    setCur('prefs')
  } else if (kind === 'segment') {
    db.segmentRequest = { name: 'Futures & Options', ref: 'SEG-' + db.ucc + '-0814', on: '14 August 2026', stage: 3 }
    setCur('segments')
  }
  commit(); window.scrollTo(0, 0)
}

export const NEXT = { monthly: '4 / 5 September 2026', quarterly: '16 / 17 October 2026' }
let NEXT_FAR: { monthly: string; quarterly: string } | null = null

/* Prototype affordance — the settlement lock (PR-138a) only shows itself when a
   date is close, and the seeded calendar is months out. This moves the next
   date rather than the clock, so every other date on the page stays true. */
export function seedSettlement(when: string) {
  if (!NEXT_FAR) NEXT_FAR = { monthly: NEXT.monthly, quarterly: NEXT.quarterly }
  if (when === 'soon') {
    /* TODAY_ISO is Sat 15 Aug 2026, so Mon 17 / Tue 18 is one business day out
       and sits inside the three-day window on either cycle. */
    NEXT.monthly = '17 / 18 August 2026'; NEXT.quarterly = '17 / 18 August 2026'
  } else {
    NEXT.monthly = NEXT_FAR.monthly; NEXT.quarterly = NEXT_FAR.quarterly
  }
  setCur('prefs'); commit(); window.scrollTo(0, 0)
}

export function seedState(value: string) {
  /* "Frozen — unfreeze requested" is the frozen state with an open assisted
     request, so the row that reports one can be seen without walking the
     journey to raise it. */
  db.unfreezeReq = (value === 'frozen_req')
  db.state = (value === 'frozen_req' ? 'frozen' : value) as any
  remaskAll(); setCur('home'); commit()
}
