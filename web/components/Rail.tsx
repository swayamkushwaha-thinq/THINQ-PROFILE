'use client'
/* PR-02 — the current destination is marked, and is not listed as navigable
   inside itself. aria-current does both jobs.
   Redesigned: each destination carries an icon, groups carry a label, and the
   selected item is a solid brand fill rather than a faint wash — so "where am
   I" is answered from across the room, not by reading. */
import { useEffect, useRef, useSyncExternalStore } from 'react'
import { getCur, go, railDef, subscribe, getSnapshot, getServerSnapshot } from '@/lib/store'
import { ui, subscribeUi, getUiSnapshot, getUiServerSnapshot, setRail, setNavGroup, setMobileDetail, toast } from '@/lib/ui'
import { remaskAll } from '@/lib/vault'
import { confirmModal } from './ConfirmModal'
import { closeModal } from '@/lib/ui'
import { Icon } from './Icon'

export function signOut() {
  confirmModal({
    title: 'Are you sure you want to log out?',
    ok: 'Log out', okKind: 'dgr', cancel: 'Cancel',
    onOk: () => { closeModal(); remaskAll(); toast('Logged out. In the real product this returns you to sign-in.') },
  })
}

export function Rail() {
  useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
  useSyncExternalStore(subscribeUi, getUiSnapshot, getUiServerSnapshot)
  const cur = getCur()
  const panel = useRef<HTMLElement>(null)
  const groups = railDef()

  /* Which section holds the surface being shown. */
  const groupOf = (id: string) =>
    groups.find((g) => g.items.some((it) => it[0] === id))?.g ?? ''
  const currentGroup = groupOf(cur)

  /* Landing on a child page opens its parent — including a direct hit on a URL
     hash, which is why this keys off `cur` rather than off the click. The user
     can still collapse it afterwards; it reopens on the next navigation. */
  useEffect(() => { setNavGroup(currentGroup) }, [currentGroup])

  const openGroup = ui.navGroup
  const toggleGroup = (g: string) => {
    const isOpening = openGroup !== g
    setNavGroup(isOpening ? g : '')
  }

  const navigate = (id: string) => {
    if (id === 'signout') { signOut(); return }
    go(id)
    setMobileDetail(true)
    setRail(false)
    const b = document.getElementById('menuBtn')
    if (b) b.setAttribute('aria-expanded', 'false')
  }

  /* As a sheet it is a layer over the page: Escape and a click on the scrim
     close it, and focus moves into it on open. */
  useEffect(() => {
    if (!ui.railOpen) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setRail(false) }
    document.addEventListener('keydown', onKey)
    const t = setTimeout(() => {
      const first = panel.current?.querySelector('button') as HTMLElement | null
      if (first) first.focus()
    }, 40)
    return () => { document.removeEventListener('keydown', onKey); clearTimeout(t) }
  }, [ui.railOpen])

  return (
    <aside className={'rail' + (ui.railOpen ? ' on' : '') + (ui.mobileDetail ? ' mobile-hide-rail' : '')} id="rail" ref={panel}
           onClick={(e) => { if (e.target === e.currentTarget) setRail(false) }}>
      <button className="btn sec sm railx" id="railX" type="button" onClick={() => setRail(false)}>Close menu</button>
      
      {/* Top User Profile Header (matching requested layout) */}
      <div className="rail-user-profile" style={{ padding: '16px 12px 14px', borderBottom: '1px solid var(--line)', marginBottom: '12px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', marginBottom: '12px' }}>
          <div style={{
            width: '64px', height: '64px', borderRadius: '50%', background: 'linear-gradient(135deg, #0e3b43, #082830)',
            color: '#ffffff', display: 'grid', placeItems: 'center', fontSize: '24px', fontWeight: 700,
            border: '2px solid var(--line2)', marginBottom: '8px', boxShadow: '0 4px 14px rgba(8,40,48,0.25)'
          }}>
            A
          </div>
          <div style={{ fontSize: '15.5px', fontWeight: 700, color: 'var(--ink)', letterSpacing: '-0.01em' }}>ARVIND YADAV</div>
        </div>

        {/* Wallet Balance Row */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          background: 'var(--surface-2)', border: '1px solid var(--line)', borderRadius: '12px', padding: '10px 14px'
        }}>
          <div>
            <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--ink)' }}>₹2,512.00</div>
            <div style={{ fontSize: '11px', color: 'var(--ink-3)', marginTop: '1px' }}>Stocks, FnO Balance</div>
          </div>
          <button className="mini" type="button" style={{
            padding: '4px 10px', fontSize: '11.5px', borderRadius: '999px',
            background: 'var(--ok-soft)', color: 'var(--ok)', border: '1px solid var(--ok-line)', fontWeight: 600
          }} onClick={() => toast('Add money interface')}>
            + Add money
          </button>
        </div>
      </div>

      <nav id="nav" aria-label="Account sections">
        {groups.map((grp, gi) => {
          const bodyId = 'navsec-' + gi
          const isOpen = openGroup === grp.g
          const isSingle = grp.items.length === 1 && grp.items[0][2] !== 'out'
          if (isSingle) {
            const it = grp.items[0]
            return (
              <div className="rsec" key={gi}>
                <button type="button" className="ritem"
                        {...(cur === it[0] ? { 'aria-current': 'page' as const } : {})}
                        onClick={() => navigate(it[0])}>
                  <span className="rtx">{it[1]}</span>
                  {it[2] ? <span className="dot" title="Needs your attention"></span> : null}
                </button>
              </div>
            )
          }
          return (
          <div className="rsec" key={gi}>
            {/* a real button, so Enter/Space work and the whole heading is the
                target rather than the chevron alone */}
            <button type="button" className="rgrp" aria-expanded={isOpen} aria-controls={bodyId}
                    onClick={() => toggleGroup(grp.g)}>
              <span className="rgrp-t">{grp.g}{grp.badge ? <span className="rec">{grp.badge}</span> : null}</span>
              <Icon name="chevron" className="rgrp-cv" size={14} />
            </button>
            <div className="rsec-body" id={bodyId} hidden={!isOpen}>
            {grp.items.map((it, ii) => (
              it[2] === 'out' ? (
                <button key={ii} className="ritem out" type="button" onClick={() => navigate('signout')}>
                  <Icon name="signout" className="rico" />
                  <span className="rtx">{it[1]}</span>
                </button>
              ) : (
                <button key={ii} className="ritem" type="button"
                        {...(cur === it[0] ? { 'aria-current': 'page' as const } : {})}
                        onClick={() => navigate(it[0])}>
                  <Icon name={it[0]} className="rico" />
                  <span className="rtx">{it[1]}</span>
                  {it[2] ? <span className="dot" title="Needs your attention"></span> : null}
                </button>
              )
            ))}
            </div>
          </div>
          )
        })}
      </nav>
    </aside>
  )
}
