'use client'
/* The flow engine. Same shape as the prototype's F / FLOWS / drawFlow / fnext /
   fback / closeFlow, with one deliberate change: a step's inputs write into
   F.d directly instead of being scraped back out of the DOM by a read() pass.
   Everything else — skipIf, valid, onNext, foot, cta, bare, noback, the dirty
   guard on Cancel, and the guards below — is carried over unchanged. */
import type { ReactNode } from 'react'
import { commit, contactLockReason, go, isClosing, isPost, isRO } from '@/lib/store'
import { ui, commitUi, toast } from '@/lib/ui'
import { openRequests, settleLockReason } from '@/lib/dates'

export interface FlowCtx {
  next: () => void
  back: () => void
  /* the header Cancel — asks first if anything has been entered */
  close: () => void
  /* an in-step `data-fl="cancel"` — leaves without asking, as in the reference */
  cancel: () => void
  /* mark the run dirty so Cancel asks before discarding, then redraw */
  set: (patch: Record<string, any>) => void
  redraw: () => void
  /* the reference's `F.i = n; drawFlow()` — a step that routes rather than
     advances (the bank journey's retry / exhaust / switch-to-UPI paths) */
  goStep: (i: number) => void
  /* the reference's fdone() — finish now, from inside a step */
  done: () => void
}

export interface FlowRun {
  id: string
  arg: string | null
  i: number
  d: Record<string, any>
  dirty: boolean
  dir: number
  def: FlowDef
  steps: FlowStep[]
  /* timers a step may have started — cleared on close, as in the reference */
  _t?: ReturnType<typeof setTimeout> | null
  _t2?: ReturnType<typeof setTimeout> | null
  [k: string]: any
}

export interface FlowStep {
  render: (F: FlowRun, ctx: FlowCtx) => ReactNode
  valid?: (F: FlowRun) => boolean
  onNext?: (F: FlowRun) => boolean | void
  skipIf?: (F: FlowRun) => boolean
  foot?: (F: FlowRun, ok: boolean, ctx: FlowCtx) => ReactNode
  cta?: string
  bare?: boolean
  noback?: boolean
  nofocus?: boolean
}

export interface FlowDef {
  title: string | ((F: FlowRun) => string)
  init?: (F: FlowRun) => void
  steps: FlowStep[]
  finish?: (F: FlowRun) => void
}

export const FLOWS: Record<string, FlowDef> = {}
export function registerFlow(id: string, def: FlowDef) { FLOWS[id] = def }

export let F: FlowRun | null = null

export function flow(spec: string) {
  const p = String(spec).split(':'), id = p[0], arg = p[1]
  const def = FLOWS[id]
  if (!def) { toast('That flow is not part of this prototype.'); return }
  /* PR-133a — cproc routes a consent withdrawal straight into closure, so the
     rule is enforced at the flow, not only at the button that usually opens
     it. */
  /* PR-139a — enforced at the journey, not only at the control. Freeze,
     unfreeze, PIN, the authenticator and Add funds are deliberately absent from
     this list: none of them changes what the account says about the customer,
     and the first two are what a compromised customer needs. */
  /* Freeze, unfreeze and signing a device out stay open: each one narrows
     access rather than widening it, and they are what a customer who has just
     spotted a takeover reaches for. Changing a PIN or adding a second factor
     is the takeover's own next step, so both wait. */
  if (id === 'contact' && !isPost()) {
    toast('Your contact details can’t be changed until your account is opened.'); return
  }
  if ((id === 'pin' || id === 'totp' || id === 'totpoff') && !isPost()) {
    toast('You will set your PIN the first time you sign in after your account is activated.'); return
  }
  /* Nothing to freeze, unfreeze or close until the account is open. */
  if (['freeze', 'unfreeze', 'unfreezereq', 'close'].indexOf(id) >= 0 && !isPost()) {
    toast('Your account is not open yet, so there is nothing to freeze.'); return
  }
  const LOCKED_BY_CONTACT = ['contact', 'nominee', 'nomchange', 'segment', 'segoff', 'bank', 'primary', 'ddpi',
    'reconsent', 'cproc', 'settle', 'close', 'descope', 'display', 'pin', 'totp', 'totpoff']
  if (LOCKED_BY_CONTACT.indexOf(id) >= 0 && contactLockReason()) {
    toast(contactLockReason()); return
  }
  /* A closure in progress locks the same journeys, for the reason roBanner
     already states on every surface that draws one. */
  if (LOCKED_BY_CONTACT.indexOf(id) >= 0 && isRO()) {
    toast(isClosing() ? 'Settings are locked while account closure is in progress'
      : 'Nothing can be changed until your account is live')
    return
  }
  if (id === 'settle' && settleLockReason()) {
    go('prefs'); toast(settleLockReason()); return
  }
  if ((id === 'close' || spec === 'support:close') && openRequests().length) {
    go('closure')
    toast('Some requests are still being processed. Please wait for them to complete before closing your account.')
    return
  }
  F = { id, arg: arg ?? null, i: 0, d: {}, dirty: false, dir: 1, def, steps: def.steps }
  if (def.init) def.init(F)
  ui.flow = { open: true, id, arg: arg ?? null, step: 0, data: F.d }
  document.documentElement.style.overflow = 'hidden'
  settle()
  commitUi()
}

/* a step may not apply to this run — step past it in whichever direction we
   were already travelling */
function settle() {
  if (!F) return
  let guard = 0
  while (F.steps[F.i] && F.steps[F.i].skipIf && F.steps[F.i].skipIf!(F) && guard++ < 20)
    F.i += (F.dir === -1 ? -1 : 1)
  if (F.i < 0) F.i = 0
  ui.flow = { ...ui.flow, step: F.i }
}

export function redraw() { commitUi() }

export function goStep(i: number) {
  if (!F) return
  F.dir = i >= F.i ? 1 : -1
  F.i = i
  settle(); commitUi()
}

export function fdonePublic() { fdone() }

export function fnext() {
  /* A click landing after the flow has closed — a double-tap on the last step,
     or a stale footer button — used to throw here. */
  if (!F) return
  F.dir = 1
  const st = F.steps[F.i]
  if (st.valid && !st.valid(F)) { commitUi(); return }
  if (st.onNext && st.onNext(F) === false) { commitUi(); return }
  if (F.i < F.steps.length - 1) { F.i++; settle(); commitUi() }
  else fdone()
}

export function fback() { if (F && F.i > 0) { F.dir = -1; F.i--; settle(); commitUi() } }

function fdone() {
  const f = F, fin = F!.def.finish   /* keep the flow — closeFlow() nulls the global */
  closeFlowInternal(true)
  if (fin && f) fin(f)
  commit()
}

/* PR-07 — Cancel returns the customer unchanged. If they have entered anything,
   it asks first, because silently discarding typed data is its own defect. */
export function closeFlowInternal(silent: boolean) {
  if (F && F._t) { clearTimeout(F._t); F._t = null }
  if (F && F._t2) { clearTimeout(F._t2); F._t2 = null }
  ui.flow = { open: false, id: null, arg: null, step: 0, data: {} }
  document.documentElement.style.overflow = ''
  F = null
  commitUi()
  if (!silent) commit()
}

export function isDirty() { return !!(F && F.dirty) }
