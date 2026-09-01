'use client'
/* ══════ prototype bar — not product chrome ══════
   Seeds scenarios so a reviewer can reach a state without walking the journey
   to it. Markup carried over from prototype/index.html unchanged. */
import { useSyncExternalStore } from 'react'
import { subscribe, getSnapshot, getServerSnapshot } from '@/lib/store'
import { ui, subscribeUi, getUiSnapshot, getUiServerSnapshot, setDrawer, setRefs, setStateSel, setPbarOpen } from '@/lib/ui'
import { seedBanks, seedNominees, seedRequest, seedSegments, seedSettlement, seedState } from '@/lib/seed'
import { db, commit } from '@/lib/store'

export function PrototypeBar() {
  useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
  useSyncExternalStore(subscribeUi, getUiSnapshot, getUiServerSnapshot)
  /* A flow that changes the account state writes back into this select, as the
     reference does with $('#stateSel').value — so it lives in ui, not locally. */

  const isOpen = ui.pbarOpen

  if (!isOpen) return null

  return (
    <div className="pbar" id="pbarContent">
      <div className="in">
        <span className="tag">Prototype</span>
        <label>Account state
          <select id="stateSel" aria-label="Account state" value={ui.stateSel}
                  onChange={(e) => { setStateSel(e.target.value); seedState(e.target.value) }}>
            <option value="prospect">Prospect — registered, KYC not started</option>
            <option value="in_kyc">In KYC — application in flight</option>
            <option value="submitted">Submitted — e-Signed, awaiting activation</option>
            <option value="active">Activated</option>
            <option value="frozen">Frozen</option>
            <option value="frozen_req">Frozen — unfreeze requested</option>
            <option value="closing">Closure requested</option>
          </select>
        </label>
        <label>Nominees
          <select id="nomSel" aria-label="Nominees on record" defaultValue="0"
                  onChange={(e) => { db.nominees = seedNominees(Number(e.target.value)); commit() }}>
            <option value="0">None on record</option>
            <option value="1">One nominee</option>
            <option value="2">Two nominees</option>
          </select>
        </label>
        <label>Segments
          <select id="segSel" aria-label="Segment state" defaultValue="eq"
                  onChange={(e) => seedSegments(e.target.value)}>
            <option value="eq">Equity only — F&amp;O de-scoped</option>
            <option value="eqfno">Equity + F&amp;O</option>
            <option value="eqcomm">Equity + Commodity</option>
            <option value="all">All three active</option>
            <option value="fnoPending">F&amp;O activation in progress</option>
            <option value="commPending">Commodity activation in progress</option>
            <option value="bothPending">Both activations in progress</option>
            <option value="none">Equity only — nothing de-scoped</option>
          </select>
        </label>
        <label>Bank verification
          <select id="bankSel" aria-label="Second bank account verification state" defaultValue="one"
                  onChange={(e) => seedBanks(e.target.value)}>
            <option value="one">One account — nothing being added</option>
            <option value="pending">Addition in progress — being verified</option>
            <option value="verified">Addition succeeded — both verified</option>
            <option value="failed">Addition failed — verification failed</option>
          </select>
        </label>
        <label>Requests
          <select id="reqSel" aria-label="Seed a request in progress" defaultValue="none"
                  onChange={(e) => seedRequest(e.target.value)}>
            <option value="none">None in progress</option>
            <option value="mobile">Mobile change — in progress</option>
            <option value="email">Email change — in progress</option>
            <option value="nomadd">Nomination — in progress</option>
            <option value="nomedit">Nominee correction — in progress</option>
            <option value="ddpi">DDPI (Instant Sell) — in progress</option>
            <option value="segment">Segment activation — in progress</option>
          </select>
        </label>
        <label>Settlement
          <select id="setSel" aria-label="Move the next settlement date" defaultValue="far"
                  onChange={(e) => seedSettlement(e.target.value)}>
            <option value="far">Next date is weeks away</option>
            <option value="soon">Next date within 3 business days</option>
          </select>
        </label>
        <label>
          <input type="checkbox" id="refsTgl" checked={ui.refs}
                 onChange={(e) => {
                   setRefs(e.target.checked)
                   document.body.classList.toggle('refs', e.target.checked)
                 }} /> PRD refs
        </label>
        <button className="pnbtn" id="notesBtn" type="button" onClick={() => setDrawer(true)}>
          Build notes &amp; open items
        </button>
        <button className="pbar-close-btn" type="button" title="Close Prototype Bar" onClick={() => setPbarOpen(false)}>
          ✕
        </button>
      </div>
    </div>
  )
}
