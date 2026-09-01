/* Shapes for the mock record. The prototype is untyped JS; these types describe
   what it already holds, they do not change any value or add a field. */

export type AccountState =
  | 'prospect' | 'in_kyc' | 'submitted' | 'active' | 'frozen' | 'closing'

export type VaultField =
  | 'pan' | 'dob' | 'ckyc' | 'boid' | 'bank1' | 'bank2' | 'mobile' | 'email'

export type Tier = 'A' | 'B'

export interface RevealEntry {
  field: VaultField
  actor: string
  at: Date
  tier: Tier
}

export interface Bank {
  id: string
  bank: string
  branch: string
  ifsc: string
  type: string
  f: VaultField
  primary: boolean
  status: 'verified' | 'pending' | 'failed'
  method: string
  on: string
  note?: string
}

export interface Nominee {
  name: string
  rel: string
  share: number
  dob?: string
  idType?: string
  idVal?: string
  addr?: Addr
  sameAddr?: boolean
  guardian?: { name: string; rel: string; dob?: string } | null
  minor?: boolean
  on?: string
}

export interface Addr {
  line1?: string
  line2?: string
  city?: string
  state?: string
  pin?: string
}

export interface Segment {
  code: 'EQ' | 'FNO' | 'COMM'
  name: string
  venue: string | null
  mandatory: boolean
  status: 'active' | 'descoped' | 'inactive' | 'pending' | 'approved'
  since?: string
  exch?: string
  drop?: string
  on?: string
  ref?: string
  stage?: number
}

export interface Consent {
  id: string
  name: string
  v: string
  on: string
  st: 'active' | 'restated' | 'withdrawn'
  req: boolean
  newV?: string
  why?: string
}

export interface Device {
  id: string
  name: string
  kind: string
  last: string
  here: boolean
}

export interface SignIn {
  at: string
  where: string
  dev: string
  ok: boolean
}

export interface ConnectedApp {
  id: string
  name: string
  scope: string
  on: string
}

export interface SignedForm {
  id: string
  name: string
  on: string
}

export interface Doc {
  id: string
  name: string
  v: string
  gen: string
  type: string
  size: string
  what: string
  reissue?: boolean
}

export interface Prefs {
  settlement: string
  rasOn: string
  rasVer: string
  ecn: string
  ddpi: boolean
  lang: string
  biometric: boolean
  notif: { priceAlerts: boolean; digest: boolean; wa: boolean }
}

export interface ContactChange {
  kind: 'mobile' | 'email'
  value: string
  stage: number
  ref?: string
  raisedOn?: string
}

export interface Db {
  state: AccountState
  kycStage: string
  name: string
  display: string
  father: string
  aadhaar4: string
  gender: string
  marital: string
  occupation: string
  income: string
  address: string
  kraStatus: string
  kraCheckedAt: string
  kraOn: string
  reKycDue: string
  ucc: string
  dpId: string
  openedOn: string
  sebiDp: string
  entity: string
  banks: Bank[]
  nomineeOptOut: { on: string; version: string; artefact: string } | null
  nominees: Nominee[]
  segments: Segment[]
  positions: Record<string, string[]>
  ddpiRequest: unknown
  unfreezeReq: boolean
  pledged: unknown[]
  outstanding: { holdings: number; holdingsVal: string; money: number; dues: number }
  prefs: Prefs
  consents: Consent[]
  totp: boolean
  devices: Device[]
  signins: SignIn[]
  apps: ConnectedApp[]
  signedForms: SignedForm[]
  docs: Doc[]
  funds: number
  nomineeRequest: unknown
  segmentRequest: unknown
  contactChange: ContactChange | null
  freeze: unknown
  closure: unknown
  revealPanelOpen: boolean
}
