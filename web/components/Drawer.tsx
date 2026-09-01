'use client'
import { useEffect, useRef, useSyncExternalStore } from 'react'
import { ui, subscribeUi, getUiSnapshot, getUiServerSnapshot, setDrawer } from '@/lib/ui'
import { BUILD_NOTES_HTML } from '@/lib/content/buildNotes'

export function Drawer() {
  useSyncExternalStore(subscribeUi, getUiSnapshot, getUiServerSnapshot)
  const closeRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (ui.drawerOpen && closeRef.current) closeRef.current.focus()
  }, [ui.drawerOpen])

  return (
    <div className={'dr' + (ui.drawerOpen ? ' on' : '')} id="drawer"
         onMouseDown={(e) => { if (e.target === e.currentTarget) setDrawer(false) }}>
      <div className="pn" role="dialog" aria-modal="true" aria-labelledby="drTitle">
        <button className="cl" id="drX" type="button" ref={closeRef}
                onClick={() => {
                  setDrawer(false)
                  const b = document.getElementById('notesBtn')
                  if (b) b.focus()
                }}>Close</button>
        <h2 id="drTitle">Build notes</h2>
        <div dangerouslySetInnerHTML={{ __html: BUILD_NOTES_HTML }} />
      </div>
    </div>
  )
}
