'use client'
import { useEffect, useLayoutEffect, useRef, useSyncExternalStore } from 'react'
import { getCur, normaliseCur, subscribe, getSnapshot, getServerSnapshot } from '@/lib/store'
import { PAGES } from '@/lib/pages/registry'
import { trimSubDots } from '@/lib/trimDots'
import { ui, setMobileDetail, subscribeUi, getUiSnapshot, getUiServerSnapshot } from '@/lib/ui'

export function Main() {
  const v = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
  useSyncExternalStore(subscribeUi, getUiSnapshot, getUiServerSnapshot)
  const host = useRef<HTMLElement>(null)
  normaliseCur()
  const cur = getCur()
  const Page = PAGES[cur] || PAGES.home

  /* The reference calls trimSubDots() at the end of every render(). Same here,
     after React has committed the surface. */
  useLayoutEffect(() => { trimSubDots(host.current) })

  return (
    <main className={'page' + (ui.mobileDetail ? ' mobile-show-page' : '')} id="main" tabIndex={-1} ref={host}>
      {Page ? <Page /> : null}
    </main>
  )
}
