/* Chrome state the prototype held as loose globals plus classList toggles:
   the toast, the rail on small screens, the build-notes drawer, the PRD-refs
   body class, the modal and the flow overlay. Same shape, one place. */
import type { ReactNode } from 'react'

export interface ModalState {
  open: boolean
  centered: boolean
  content: ReactNode | null
}

export interface FlowState {
  open: boolean
  id: string | null
  arg: string | null
  step: number
  /* per-flow scratch — the prototype's `F` object */
  data: Record<string, any>
}

export interface UiState {
  toast: { msg: string; kind: string; on: boolean }
  railOpen: boolean
  /* Which rail section is expanded. '' collapses every section; otherwise the
     group's own label. Accordion, so only one is ever set. */
  navGroup: string
  drawerOpen: boolean
  pbarOpen: boolean
  refs: boolean
  modal: ModalState
  flow: FlowState
  /* The prototype bar's Account state select. A flow that changes the account
     state writes back into it, as the reference does with $('#stateSel').value */
  stateSel: string
  searchOpen: boolean
  searchQuery: string
  searchIndex: number
}

export const ui: UiState = {
  toast: { msg: '', kind: '', on: false },
  railOpen: false,
  navGroup: '',
  drawerOpen: false,
  pbarOpen: false,
  refs: false,
  modal: { open: false, centered: false, content: null },
  flow: { open: false, id: null, arg: null, step: 0, data: {} },
  stateSel: 'active',
  searchOpen: false,
  searchQuery: '',
  searchIndex: -1,
}

let version = 0
const listeners = new Set<() => void>()

export function subscribeUi(fn: () => void) {
  listeners.add(fn)
  return () => { listeners.delete(fn) }
}
export function getUiSnapshot() { return version }
export function getUiServerSnapshot() { return 0 }
export function commitUi() {
  version++
  listeners.forEach((fn) => fn())
}

let toastTimer: ReturnType<typeof setTimeout> | null = null

export function toast(msg: string, kind?: string) {
  ui.toast = { msg, kind: kind || '', on: true }
  commitUi()
  if (toastTimer) clearTimeout(toastTimer)
  toastTimer = setTimeout(() => {
    ui.toast = { ...ui.toast, on: false }
    commitUi()
  }, 3600)
}

export function copyText(txt: string, what: string) {
  const done = () => { toast(what + ' copied.') }
  if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(txt).then(done, done)
  else done()
}

export function openModal(content: ReactNode, centered = false) {
  ui.modal = { open: true, centered, content }
  commitUi()
}
export function closeModal() {
  ui.modal = { open: false, centered: false, content: null }
  commitUi()
}

export function setRail(on: boolean) { ui.railOpen = on; commitUi() }
export function setNavGroup(g: string) { ui.navGroup = g; commitUi() }
export function setDrawer(on: boolean) { ui.drawerOpen = on; commitUi() }
export function setPbarOpen(on: boolean) { ui.pbarOpen = on; commitUi() }
export function setRefs(on: boolean) { ui.refs = on; commitUi() }
export function setStateSel(v: string) { ui.stateSel = v; commitUi() }
