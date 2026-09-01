'use client'
/* ══════ flow overlay ══════
   The header, the scrolling body and the pinned footer, exactly as in the
   reference. The action sits directly under the content on a short step, and
   only pins to the bottom once the content is long enough to scroll. */
import { useEffect, useLayoutEffect, useRef, useSyncExternalStore } from 'react'
import { ui, subscribeUi, getUiSnapshot, getUiServerSnapshot } from '@/lib/ui'
import { subscribe, getSnapshot, getServerSnapshot } from '@/lib/store'
import { F, fback, fnext, goStep, fdonePublic, closeFlowInternal, isDirty, redraw, type FlowCtx } from '@/lib/flows/engine'
import { confirmModal } from './ConfirmModal'
import { closeModal } from '@/lib/ui'
import { trimSubDots } from '@/lib/trimDots'

export function closeFlow(silent?: boolean) {
  if (!silent && isDirty()) {
    confirmModal({
      title: 'Leave without saving?',
      body: <p>Nothing you have entered will be saved, and nothing has changed on your account. You can start again whenever you like.</p>,
      ok: 'Leave', okKind: 'dgr', cancel: 'Keep going',
      onOk: () => { closeModal(); closeFlowInternal(true) },
    })
    return
  }
  closeFlowInternal(!!silent)
}

export function FlowOverlay() {
  useSyncExternalStore(subscribeUi, getUiSnapshot, getUiServerSnapshot)
  useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
  const body = useRef<HTMLDivElement>(null)
  const scroller = useRef<HTMLDivElement>(null)
  const open = ui.flow.open
  const step = ui.flow.step

  const ctx: FlowCtx = {
    next: fnext,
    back: fback,
    close: () => closeFlow(),
    cancel: () => closeFlowInternal(true),
    set: (patch) => { if (!F) return; Object.assign(F.d, patch); F.dirty = true; redraw() },
    redraw,
    goStep,
    done: fdonePublic,
  }

  useLayoutEffect(() => { if (open) trimSubDots(body.current) })

  /* First field takes focus, and the body starts at the top of every step. */
  useEffect(() => {
    if (!open || !F) return
    if (scroller.current) scroller.current.scrollTop = 0
    const st = F.steps[F.i]
    if (st && st.nofocus) return
    const t = setTimeout(() => {
      const first = body.current?.querySelector('input,select,textarea') as HTMLElement | null
      if (first) first.focus()
    }, 40)
    return () => clearTimeout(t)
  }, [open, step])

  if (!F) {
    return (
      <div className="fl" id="flow" role="dialog" aria-modal="true" aria-labelledby="flowTitle">
        <div className="flh"><div className="in">
          <h2 id="flowTitle">Flow</h2>
          <span className="step" id="flowStep"></span>
          <button className="x" id="flowX" type="button">Cancel</button>
        </div></div>
        <div className="flb"><div className="in" id="flowBody"></div></div>
        <div className="flf"><div className="in" id="flowFoot"></div></div>
      </div>
    )
  }

  const st = F.steps[F.i]
  const ok = st.valid ? st.valid(F) : true
  const showBack = F.i > 0 && !st.noback
  const next = st.foot
    ? st.foot(F, ok, ctx)
    : <button className="btn pri" type="button" disabled={!ok} onClick={fnext}>{st.cta || 'Continue'}</button>

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      const tag = (e.target as HTMLElement)?.tagName
      if (tag === 'INPUT' || tag === 'SELECT') {
        e.preventDefault()
        fnext()
      }
    }
  }

  return (
    <div className={'fl' + (open ? ' on' : '')} id="flow" role="dialog" aria-modal="true" aria-labelledby="flowTitle" onKeyDown={handleKeyDown}>
      <div className="fl-card">
        <div className="flh"><div className="in">
          {showBack ? (
            <button className="flback" type="button" onClick={fback} aria-label="Go back">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="15 18 9 12 15 6"></polyline>
              </svg>
            </button>
          ) : null}
          <h2 id="flowTitle">{typeof F.def.title === 'function' ? F.def.title(F) : F.def.title}</h2>
          <span className="step" id="flowStep"></span>
          <button className="x" id="flowX" type="button" onClick={() => closeFlow()}>Cancel</button>
        </div></div>
        <div className="flb" ref={scroller}><div className="in" id="flowBody" ref={body}>
          {st.render(F, ctx)}
        </div></div>
        <div className="flf"><div className="in" id="flowFoot" style={{ justifyContent: 'center' }}>
          {next}
        </div></div>
      </div>
    </div>
  )
}
