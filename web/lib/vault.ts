/* ── PR-31 / DP-3 ─────────────────────────────────────────────────────────────
   The vault is the "server". The render model never holds a tier-A value in the
   clear — it holds the mask. unmask() is the only way in, it demands a live
   re-auth token, and it writes an audit row. A UI that hides a value its own
   payload already carried is not masking; that is T-2, and this is the shape
   that avoids it.
   Carried over from prototype/index.html unchanged. */
import type { RevealEntry, Tier, VaultField } from './types'

/* Keyed by VaultField plus the dynamic `bankN…` fields a newly added bank
   account registers at runtime, exactly as the reference does. */
export const VAULT: Record<string, string> = {
  pan: 'AEFPY3414D', dob: '15 January 1993', ckyc: '40071129384416', boid: '1206390000418872',
  bank1: '50100247719046', bank2: '00281140006193',
  mobile: '9925416939', email: 'arvind.sharma@gmail.com',
}

export const MASK: Record<string, string> = {
  pan: '••••••414D', dob: '•• ••• 1993',
  ckyc: '••••••••••4416', boid: '12063900••••8872',
  bank1: '•••••••••9046', bank2: '•••••••••6193',
  mobile: '99•••••939', email: 'ar•••@gmail.com',
}

/* §6.1 DP-2 — A: regulated identifiers, PIN re-auth + 60s auto-remask.
                B: contact & third-party, single tap.                       */
/* ⚠ Owner direction, 14 Aug 2026: mobile and email moved from tier B to tier A
   so that one reveal message — REVEAL_NOTE — is true on every surface. This
   deviates from §6.1 / DP-2, which places contact details in tier B (single tap,
   no re-authentication). The consequence is that seeing your own email now costs
   a PIN and re-masks after 60 seconds. Reversible by putting these two back to
   'B', but then contact details needs its own wording. */
export const TIER: Record<string, Tier> = {
  pan: 'A', dob: 'A', ckyc: 'A', boid: 'A', bank1: 'A', bank2: 'A',
  mobile: 'A', email: 'A',
}

export const REVEAL_LOG: RevealEntry[] = []   /* PR-31 — field, actor, timestamp, tier */

export const revealed: Partial<Record<VaultField, boolean>> = {}

let authToken: string | null = null           /* issued by the PIN modal, single use */
let remaskTimer: ReturnType<typeof setTimeout> | null = null
let ttlTimer: ReturnType<typeof setInterval> | null = null
export let ttlLeft = 0

export function grantAuthToken() { authToken = 'live' }
export function hasAuthToken() { return !!authToken }

export function unmask(field: VaultField): string {
  if (TIER[field] === 'A' && !authToken) throw new Error('re-auth required')
  REVEAL_LOG.unshift({ field, actor: 'You · this session', at: new Date(), tier: TIER[field] })
  if (TIER[field] === 'A') authToken = null
  return VAULT[field]
}

export function shown(f: VaultField): string {
  return revealed[f] ? VAULT[f] : MASK[f]
}

export function startTtl(onExpire: () => void) {
  if (remaskTimer) clearTimeout(remaskTimer)
  if (ttlTimer) clearInterval(ttlTimer)
  ttlLeft = 60
  remaskTimer = setTimeout(() => { remaskAll('A'); onExpire() }, 60000)
  ttlTimer = setInterval(() => {
    ttlLeft--
    const els = document.querySelectorAll('[data-ttl]')
    for (let i = 0; i < els.length; i++) els[i].textContent = 'hiding in ' + ttlLeft + 's'
    if (ttlLeft <= 0 && ttlTimer) clearInterval(ttlTimer)
  }, 1000)
}

export function stopTtl() {
  if (remaskTimer) clearTimeout(remaskTimer)
  if (ttlTimer) clearInterval(ttlTimer)
}

/* PR-30 / AT-P-06 — a reveal never survives navigation. */
export function remaskAll(tier?: Tier) {
  for (const f in revealed) {
    const k = f as VaultField
    if (!tier || TIER[k] === tier) revealed[k] = false
  }
  stopTtl()
}
