'use client'
/* OTP / PIN groups. Behaviour carried over from the prototype's global input
   handlers: digits only, one per box, auto-advance forward, Backspace on an
   empty box steps back and clears, and once every box in the group is full the
   step submits itself after 240ms rather than making the customer reach for a
   button they can no longer add anything to. */
import { useEffect, useRef } from 'react'

interface Props {
  id: string
  length: number
  value: string
  onChange: (v: string) => void
  onFull?: () => void
  /* .pinin is the sign-in PIN row; .otp is the in-flow code row. */
  variant?: 'otp' | 'pinin'
  masked?: boolean
  autoFocus?: boolean
  ariaLabel?: string
}

export function OtpGroup({
  id, length, value, onChange, onFull, variant = 'otp', masked = false, autoFocus = false,
  ariaLabel = 'Digit',
}: Props) {
  const wrap = useRef<HTMLDivElement>(null)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (!autoFocus) return
    const t = setTimeout(() => {
      const i = wrap.current?.querySelector('input')
      if (i) (i as HTMLInputElement).focus()
    }, 50)
    return () => clearTimeout(t)
  }, [autoFocus])

  useEffect(() => {
    if (!onFull) return
    if (value.length !== length) return
    if (timer.current) clearTimeout(timer.current)
    timer.current = setTimeout(() => { onFull() }, 240)
    return () => { if (timer.current) clearTimeout(timer.current) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, length])

  const digits: string[] = []
  for (let i = 0; i < length; i++) digits.push(value[i] || '')

  const setAt = (i: number, ch: string) => {
    const next = digits.slice()
    next[i] = ch
    onChange(next.join('').slice(0, length))
  }

  return (
    <div className={variant === 'pinin' ? 'pinin' : 'otp'} data-otp={id} ref={wrap}>
      {digits.map((d, i) => (
        <input
          key={i}
          type={masked ? 'password' : 'text'}
          inputMode="numeric"
          maxLength={1}
          aria-label={ariaLabel + ' ' + (i + 1)}
          data-i={id}
          value={d}
          onChange={(e) => {
            const ch = e.target.value.replace(/\D/g, '').slice(0, 1)
            setAt(i, ch)
            if (ch) {
              const n = (e.target as HTMLInputElement).nextElementSibling
              if (n && n.tagName === 'INPUT') (n as HTMLInputElement).focus()
            }
          }}
          onKeyDown={(e) => {
            if (e.key === 'Backspace' && !(e.target as HTMLInputElement).value) {
              const p = (e.target as HTMLInputElement).previousElementSibling
              if (p && p.tagName === 'INPUT') {
                ;(p as HTMLInputElement).focus()
                setAt(i - 1, '')
                e.preventDefault()
              }
            } else if (e.key === 'Enter') {
              const nextBtn = document.querySelector('#flowFoot button.pri') as HTMLButtonElement | null
              if (nextBtn && !nextBtn.disabled) {
                e.preventDefault()
                nextBtn.click()
              }
            }
          }}
        />
      ))}
    </div>
  )
}

/* The same PIN screen the customer signs in with — auth-login.html .pinrow. */
export function LoginPinBlock(p: Omit<Props, 'variant' | 'length'> & { length?: number }) {
  return <OtpGroup {...p} length={p.length ?? 4} variant="pinin" ariaLabel="PIN digit" />
}
