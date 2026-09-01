'use client'
/* ══════ product chrome ══════
   PR-88 — opaque, not translucent. Markup carried over from the reference; the
   search behaviour (build index on focus, word-start matching, arrow keys,
   Enter, Escape, "/" and ⌘K) is the prototype's, unchanged. */
import { Fragment, useEffect, useRef, useState, useSyncExternalStore } from 'react'
import { db, go, isPost, subscribe, getSnapshot, getServerSnapshot } from '@/lib/store'
import { ui, subscribeUi, getUiSnapshot, getUiServerSnapshot, setRail, setPbarOpen, setMobileDetail } from '@/lib/ui'
import { buildIndex, searchProfile, flashRow, type IndexEntry } from '@/lib/search'
import { Icon } from './Icon'

/* A match is highlighted where it was found, not at the front of the label. */
function Highlight({ text, q }: { text: string; q: string }) {
  const i = text.toLowerCase().indexOf(q)
  if (i < 0) return <>{text}</>
  return (
    <>
      {text.slice(0, i)}
      <mark>{text.slice(i, i + q.length)}</mark>
      {text.slice(i + q.length)}
    </>
  )
}

export function TopBar() {
  useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
  useSyncExternalStore(subscribeUi, getUiSnapshot, getUiServerSnapshot)

  const [raw, setRaw] = useState('')
  const [res, setRes] = useState<IndexEntry[]>([])
  const [idx, setIdx] = useState(-1)
  const [open, setOpen] = useState(false)
  const input = useRef<HTMLInputElement>(null)
  const wrap = useRef<HTMLDivElement>(null)

  const needle = raw.trim().toLowerCase()

  const draw = (value: string, keepIdx = false) => {
    const v = value.trim()
    if (!v) { setRes([]); setIdx(-1); setOpen(false); return }
    const r = searchProfile(v)
    setRes(r)
    setIdx(r.length ? (keepIdx && idx >= 0 && idx < r.length ? idx : 0) : -1)
    setOpen(true)
  }

  const closeResults = () => { setOpen(false); setRes([]); setIdx(-1) }

  const choose = (i: number) => {
    const e = res[i]
    if (!e) return
    const label = e.label, isRow = !e.isPage
    setRaw('')
    closeResults()
    if (input.current) input.current.blur()
    go(e.page)
    if (isRow) flashRow(label)
  }

  /* mousedown, not click — the input's blur would otherwise tear the list down
     before the click lands on it. */
  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      const t = e.target as HTMLElement
      if (!t.closest || !t.closest('.psearch')) closeResults()
    }
    document.addEventListener('click', onDocClick)
    return () => document.removeEventListener('click', onDocClick)
  }, [])

  /* "/" is the shorthand people already have for this; ⌘K is the one they have
     from everywhere else. Neither fires while a flow or a modal owns the screen,
     or while they are being typed into a field. */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement
      const tag = (t.tagName || '').toLowerCase()
      const typing = (tag === 'input' || tag === 'textarea' || tag === 'select' || t.isContentEditable)
      if (ui.flow.open || ui.modal.open) return
      /* The gate owns the screen until it is passed; ⌘K must not reach through it. */
      if (document.getElementById('tqGate')) return
      if ((e.key === '/' && !typing) || ((e.metaKey || e.ctrlKey) && (e.key === 'k' || e.key === 'K'))) {
        e.preventDefault()
        if (input.current) { input.current.focus(); input.current.select() }
      }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [])

  const who = (isPost() || db.state === 'submitted') ? db.display : 'Arvind'

  return (
    <header className={'top' + (ui.mobileDetail ? ' mobile-detail-header' : '')}>
      <div className="in">
        {/* Mobile Header Back Arrow — replaces logo on detail screens */}
        <button className="mobile-header-back" type="button" aria-label="Back to Profile Menu" title="Back to Profile Menu" onClick={() => setMobileDetail(false)}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="19" y1="12" x2="5" y2="12"></line>
            <polyline points="12 19 5 12 12 5"></polyline>
          </svg>
        </button>
        <span className="mark"><span className="wm">Th<span className="i">i</span>nq</span><span className="sub">Profile</span></span>
        <div className="psearch" ref={wrap}>
          <div className="pin">
            <svg className="mg" viewBox="0 0 16 16" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.6">
              <circle cx="7" cy="7" r="4.6"></circle><path d="M10.4 10.4 14 14" strokeLinecap="round"></path>
            </svg>
            <input id="pq" type="search" autoComplete="off" spellCheck="false"
                   placeholder="Search settings" aria-label="Search profile settings"
                   role="combobox" aria-expanded={open} aria-controls="pres" aria-autocomplete="list"
                   {...(open && idx >= 0 ? { 'aria-activedescendant': 'pres-' + idx } : {})}
                   ref={input}
                   value={raw}
                   onFocus={() => { buildIndex(); if (raw.trim()) draw(raw, true) }}
                   onChange={(e) => { setRaw(e.target.value); setIdx(0); draw(e.target.value) }}
                   onKeyDown={(e) => {
                     if (e.key === 'Escape') {
                       if (open) { e.stopPropagation(); closeResults() }
                       else { setRaw(''); e.currentTarget.blur() }
                       return
                     }
                     if (!res.length) return
                     if (e.key === 'ArrowDown') { e.preventDefault(); setIdx((idx + 1) % res.length) }
                     else if (e.key === 'ArrowUp') { e.preventDefault(); setIdx((idx - 1 + res.length) % res.length) }
                     else if (e.key === 'Enter') { e.preventDefault(); choose(idx < 0 ? 0 : idx) }
                   }} />
            <kbd className="pk">/</kbd>
          </div>
          <div className="pres" id="pres" role="listbox" aria-label="Search results" hidden={!open}
               onMouseDown={(e) => {
                 const b = (e.target as HTMLElement).closest('.r') as HTMLElement | null
                 if (!b) return
                 e.preventDefault()
                 choose(Number(b.getAttribute('data-i')))
               }}>
            {open && !res.length ? (
              <div className="none">
                Nothing in Profile matches <b>{raw.trim()}</b>.
                <br />Try the name of a setting — nominee, bank account, PIN, statements.
              </div>
            ) : null}
            {open && res.length ? (
              <Fragment>
                <div className="rh">{res.length + ' result' + (res.length === 1 ? '' : 's')}</div>
                {res.map((e, i) => (
                  <button className="r" type="button" role="option" id={'pres-' + i} data-i={i}
                          key={i} aria-selected={i === idx}>
                    <span className="w">
                      <b><Highlight text={e.label} q={needle} /></b>
                      {e.hint ? <span>{e.hint}</span> : null}
                    </span>
                    {e.isPage ? null : <span className="at">{e.pageLabel}</span>}
                  </button>
                ))}
              </Fragment>
            ) : null}
          </div>
        </div>
        <div className="who">
          <button className={`header-proto-btn ${ui.pbarOpen ? 'active' : ''}`} id="headerProtoBtn" type="button"
                  title="Toggle Prototype Controls" onClick={() => setPbarOpen(!ui.pbarOpen)}>
            {/* the word is wrapped so a narrow header can collapse it to the icon
                without losing it — hidden the accessible way, still announced */}
            <span aria-hidden="true">⚙️</span> <span className="proto-label">Prototype</span>
          </button>
          <span className="nm" id="whoName">{who}</span>
          <span className="av" id="whoAv" aria-hidden="true">{db.display.charAt(0)}</span>
        </div>
      </div>
    </header>
  )
}
