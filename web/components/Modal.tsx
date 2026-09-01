'use client'
import { useSyncExternalStore } from 'react'
import { ui, subscribeUi, getUiSnapshot, getUiServerSnapshot, closeModal } from '@/lib/ui'

export function Modal() {
  useSyncExternalStore(subscribeUi, getUiSnapshot, getUiServerSnapshot)
  const m = ui.modal
  return (
    <div className={'mod' + (m.open ? ' on' : '')} id="modal" role="dialog" aria-modal="true"
         aria-labelledby="modalTitle"
         onMouseDown={(e) => { if (e.target === e.currentTarget) closeModal() }}>
      <div className={'box' + (m.centered ? ' ctr' : '')} id="modalBox">{m.content}</div>
    </div>
  )
}
