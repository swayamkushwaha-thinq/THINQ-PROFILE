'use client'
/* The prototype's confirmModal(): title, optional body, cancel + ok. Focus lands
   on the confirming button after 40ms, as it did before. */
import { useEffect, useRef } from 'react'
import type { ReactNode } from 'react'
import { openModal, closeModal } from '@/lib/ui'

interface Opts {
  title: ReactNode
  body?: ReactNode
  ok?: string
  okKind?: string
  cancel?: string
  onOk: () => void
}

function ConfirmBody({ title, body, ok, okKind, cancel, onOk }: Opts) {
  const okRef = useRef<HTMLButtonElement>(null)
  useEffect(() => {
    const t = setTimeout(() => { if (okRef.current) okRef.current.focus() }, 40)
    return () => clearTimeout(t)
  }, [])
  return (
    <>
      <h3 id="modalTitle">{title}</h3>
      {body}
      <div className="btnrow" style={{ justifyContent: 'flex-end' }}>
        <button className="btn sec" type="button" onClick={() => closeModal()}>{cancel || 'Cancel'}</button>
        <button className={'btn ' + (okKind || 'pri')} type="button" ref={okRef} onClick={onOk}>{ok || 'Confirm'}</button>
      </div>
    </>
  )
}

export function confirmModal(o: Opts) {
  openModal(<ConfirmBody {...o} />)
}
