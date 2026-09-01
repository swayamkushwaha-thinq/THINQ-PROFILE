'use client'
import { useSyncExternalStore } from 'react'
import { ui, subscribeUi, getUiSnapshot, getUiServerSnapshot } from '@/lib/ui'

export function Toast() {
  useSyncExternalStore(subscribeUi, getUiSnapshot, getUiServerSnapshot)
  const t = ui.toast
  return (
    <div className={'toast' + (t.on ? ' on' : '') + (t.on && t.kind ? ' ' + t.kind : '')}
         id="toast" role="status" aria-live="polite">
      {t.msg}
    </div>
  )
}
