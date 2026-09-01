'use client'
import { useEffect } from 'react'
import { GO_ALIAS, getCur, setCur, railDef, commit } from '@/lib/store'
import { PAGES } from '@/lib/pages/registry'
import '@/lib/pages'
import '@/lib/flows'
import { ui, closeModal, setDrawer, commitUi } from '@/lib/ui'
import { PrototypeBar } from './PrototypeBar'
import { TopBar } from './TopBar'
import { Rail } from './Rail'
import { Main } from './Main'
import { Modal } from './Modal'
import { Drawer } from './Drawer'
import { Toast } from './Toast'
import { FlowOverlay, closeFlow } from './FlowOverlay'

export function Shell() {
  /* ── boot ────────────────────────────────────────────────────────────────
     A hash naming a surface opens on that surface. Anything else — no hash, an
     unknown one, or one this account state has no rail entry for — falls back to
     the landing page, so the URL can never strand someone on a page that should
     not exist for them. */
  useEffect(() => {
    let want = (location.hash || '').replace(/^#/, '')
    if (GO_ALIAS[want]) want = GO_ALIAS[want] as string
    const inRail = railDef().some((g) => g.items.some((it) => it[0] === want))
    if (want && PAGES[want] && inRail) { setCur(want); commit() }
    else if (location.hash) {
      try { history.replaceState(null, '', location.pathname + location.search) } catch (e) { /* ignore */ }
    }
  }, [])

  /* Escape closes whatever owns the screen, innermost first. */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return
      if (ui.modal.open) closeModal()
      else if (ui.flow.open) closeFlow()
      else if (ui.drawerOpen) setDrawer(false)
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [])

  return (
    <>
      <a className="skip" href="#main">Skip to content</a>
      <TopBar />
      {/* The bar is toggled from a chip in the header, so it opens directly
          under its own trigger. Rendered above the header it pushed the header
          — and the button just clicked — down the page on every open. */}
      <PrototypeBar />
      <div className="shell">
        <Rail />
        <Main />
      </div>
      <FlowOverlay />
      <Modal />
      <Drawer />
      <Toast />
    </>
  )
}
