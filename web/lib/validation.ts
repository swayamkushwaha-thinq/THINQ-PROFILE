/* Validation lifted from the KYC journey (thinq-journey-v3.html, validate()):
   the CTA stays enabled and pressing it surfaces a message under each field that
   needs one, rather than the button silently refusing to light up. Same rules,
   same wording — PR-35. */
export const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/

/* Identity-proof config, lifted from the KYC journey (thinq-journey-v3.html
   IDCFG) so the two screens validate identically — PR-35. */
export interface IdCfg { lbl: string; max: number; re: RegExp; mono: boolean }
export const IDCFG: Record<string, IdCfg> = {
  'Aadhaar': { lbl: 'Aadhaar (last 4 digits)', max: 4, re: /^\d{4}$/, mono: true },
  'PAN': { lbl: 'PAN', max: 10, re: /^[A-Z]{5}[0-9]{4}[A-Z]$/, mono: true },
  'Driving Licence': { lbl: 'Driving Licence number', max: 16, re: /^.{6,}$/, mono: false },
}

/* §5.4 / PR-35 say 16 SEBI relations; the shipped onboarding screen
   (thinq-journey-v3.html:1883) offers 12. PR-35 forbids the two surfaces
   diverging, so the shipped list is used and the difference is raised as a
   defect in the build notes rather than resolved here. */
export const RELATIONS = ['Spouse', 'Son', 'Daughter', 'Father', 'Mother', 'Brother', 'Sister',
  'Grand Son', 'Grand Daughter', 'Grand Father', 'Grand Mother', 'Others']

/* The KYC journey's addrBlock: line 1, optional line 2, city + 6-digit pincode
   side by side, and a state select — not a free-text box. */
export const IN_STATES = ['Andhra Pradesh', 'Assam', 'Bihar', 'Chhattisgarh', 'Delhi', 'Goa', 'Gujarat', 'Haryana',
  'Himachal Pradesh', 'Jharkhand', 'Karnataka', 'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Odisha', 'Punjab',
  'Rajasthan', 'Tamil Nadu', 'Telangana', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal']

export interface AddrObj { a1?: string; a2?: string; city?: string; pin?: string; state?: string }

export function addrText(a?: AddrObj) {
  if (!a) return ''
  return [a.a1, a.a2, a.city, a.state].filter(Boolean).join(', ') + (a.pin ? ' ' + a.pin : '')
}

export function age(iso: string) {
  const d = new Date(iso); if (isNaN(d.getTime())) return 99
  const t = new Date(2026, 7, 14)
  let a = t.getFullYear() - d.getFullYear()
  const m = t.getMonth() - d.getMonth()
  if (m < 0 || (m === 0 && t.getDate() < d.getDate())) a--
  return a
}

export function fmtDate(iso: string) {
  const d = new Date(iso); if (isNaN(d.getTime())) return iso
  const M = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October',
    'November', 'December']
  return d.getDate() + ' ' + M[d.getMonth()] + ' ' + d.getFullYear()
}

/* The KYC journey sanitises as you type: ID uppercased and stripped to the
   character class its type allows, mobiles and pincodes to digits only. Without
   this the two screens accept different input for the same field. */
export function sanId(v: string, type: string) {
  const c = IDCFG[type] || IDCFG.Aadhaar
  if (c.mono) return v.toUpperCase().replace(type === 'Aadhaar' ? /\D/g : /[^A-Z0-9]/g, '')
  return v
}
export function sanDigits(v: string) { return v.replace(/\D/g, '') }

export function validAddr(p: string, a: AddrObj, err: Record<string, string>) {
  let ok = true
  if (!a.a1) { err['e' + p + 'A1'] = 'Enter the address.'; ok = false }
  if (!a.city || !/^\d{6}$/.test(a.pin || '')) { err['e' + p + 'City'] = 'Enter a valid city and 6-digit pincode.'; ok = false }
  if (!a.state) { err['e' + p + 'State'] = 'Select the state.'; ok = false }
  return ok
}

export function validateNominee(d: any, err: Record<string, string>) {
  for (const k in err) delete err[k]
  let ok = true
  const cfg = IDCFG[d.idType] || IDCFG.Aadhaar
  if (!d.name || (d.ownerName && d.name.trim().toLowerCase() === d.ownerName.trim().toLowerCase())) { err.enName = 'Nominee name must be different from your own name'; ok = false }
  if (!d.relation) { err.enRel = 'Select the nominee’s relationship.'; ok = false }
  if (!cfg.re.test((d.id4 || '').toUpperCase())) { err.enId = 'Enter a valid ' + cfg.lbl + '.'; ok = false }
  if ((d.mobile || '').length !== 10) { err.enMob = 'Enter a valid 10-digit mobile number.'; ok = false }
  if (!EMAIL_RE.test(d.email || '')) { err.enEmail = 'Enter a valid email address.'; ok = false }
  if (!d.dob) { err.enDob = 'Select the nominee’s date of birth.'; ok = false }
  else if (new Date(d.dob) > new Date(2026, 7, 14)) { err.enDob = 'Date of birth can’t be in the future.'; ok = false }
  if (!d.sameAddr && !validAddr('nn', d.addrObj || {}, err)) ok = false
  if (Number(d.share) < 1 || Number(d.share) > 100) { err.enShare = 'Share must be between 1 and 100.'; ok = false }
  if (d.minor) {
    const gcfg = IDCFG[d.gIdType] || IDCFG.Aadhaar
    if (!d.guardian) { err.enGName = 'Enter the guardian’s name.'; ok = false }
    if (!d.guardianRel) { err.enGRel = 'Select the guardian relationship.'; ok = false }
    if (!gcfg.re.test((d.gId4 || '').toUpperCase())) { err.engId = 'Enter a valid guardian ' + gcfg.lbl + '.'; ok = false }
    if ((d.gMobile || '').length !== 10) { err.enGMob = 'Enter a valid 10-digit guardian mobile.'; ok = false }
    if (!EMAIL_RE.test(d.gEmail || '')) { err.enGEmail = 'Enter a valid guardian email.'; ok = false }
    if (!d.gdob) { err.enGDob = 'Select the guardian’s date of birth.'; ok = false }
    else if (new Date(d.gdob) > new Date(2026, 7, 14)) { err.enGDob = 'Date of birth can’t be in the future.'; ok = false }
    else if (age(d.gdob) < 18) { err.enGDob = 'Guardian must be at least 18 years old.'; ok = false }
    if (d.gSame === false && !validAddr('ng', d.gAddrObj || {}, err)) ok = false
  }
  return ok
}
