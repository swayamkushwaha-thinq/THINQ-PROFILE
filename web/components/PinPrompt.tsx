'use client'
/* The PIN re-auth modal. No confirm button — the reveal fires as soon as the
   fourth digit lands. Cancel stays, because leaving has to remain possible
   without typing. */
import { useState } from 'react'
import { LoginPinBlock } from './Otp'

export const DEMO_BAD_PIN = '1111'

export function PinPrompt({ onOk, onCancel }: { onOk: () => void; onCancel: () => void }) {
  const [pin, setPin] = useState('')
  const [bad, setBad] = useState(false)

  const submit = () => {
    if (pin.length !== 4) return
    if (pin === DEMO_BAD_PIN) { setBad(true); setPin(''); return }
    onOk()
  }

  return (
    <>
      <h3 id="modalTitle">Enter your Thinq PIN</h3>
      <LoginPinBlock
        id="mpin"
        value={pin}
        autoFocus
        onChange={(v) => { setPin(v); if (bad) setBad(false) }}
        onFull={submit}
      />
      <div className="inlineerr" id="mpinErr" role="alert" style={{ display: bad ? 'flex' : 'none' }}>
        ⚠ That PIN is not right. Try again
      </div>
      <p className="sent" style={{ marginTop: 14, fontSize: 11.5, color: 'var(--faint)' }}>
        Any four digits work here — 1111 is treated as the wrong PIN
      </p>
      {/* The 60-second re-mask, the re-mask on navigation and the audit entry all
          still happen — PR-30 / PR-31 / AT-P-05, AT-P-06. Only the sentence saying
          so was removed, on owner direction 14 Aug 2026, so the behaviour is now
          undisclosed rather than absent. */}
      <div className="btnrow">
        <button className="btn sec" type="button" onClick={onCancel}>Cancel</button>
      </div>
    </>
  )
}
