'use client'
/* A drawn stand-in, not an encoded payload — the real one carries a UPI collect
   request for ₹1. Deterministic from the seed so it does not shimmer between
   renders, and labelled as a prototype so nobody points a phone at it. */
export function QrBlock({ seed }: { seed: string }) {
  const n = 25
  let s = 0
  for (let i = 0; i < String(seed).length; i++) s = (s * 31 + String(seed).charCodeAt(i)) >>> 0
  const rnd = () => { s = (s * 1103515245 + 12345) >>> 0; return (s >>> 16) / 65536 }
  const inFinder = (a: number, b: number) => (a < 8 && b < 8) || (a > n - 9 && b < 8) || (a < 8 && b > n - 9)
  const cells: React.ReactNode[] = []
  for (let j = 0; j < n; j++) for (let x = 0; x < n; x++) {
    if (inFinder(x, j)) continue
    if (rnd() > 0.52) cells.push(<rect x={x} y={j} width="1" height="1" fill="#032129" key={j + '-' + x} />)
  }
  const finder = (cx: number, cy: number, k: string) => (
    <g key={k}>
      <rect x={cx} y={cy} width="7" height="7" fill="#032129" />
      <rect x={cx + 1} y={cy + 1} width="5" height="5" fill="#fff" />
      <rect x={cx + 2} y={cy + 2} width="3" height="3" fill="#032129" />
    </g>
  )
  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'center', margin: '4px 0 14px' }}>
        <div style={{ background: '#fff', padding: 12, borderRadius: 14, lineHeight: 0 }}>
          <svg width="184" height="184" viewBox={'0 0 ' + n + ' ' + n} role="img"
               aria-label="QR code to add this bank account over UPI">
            {cells}{finder(0, 0, 'a')}{finder(n - 7, 0, 'b')}{finder(0, n - 7, 'c')}
          </svg>
        </div>
      </div>
    </>
  )
}

/* The KYC journey's loader, ported unchanged so a customer who verified a bank
   account during onboarding meets the same screen here. */
export function TqLoader({ msg }: { msg: string }) {
  return (
    <div style={{ textAlign: 'center', paddingTop: 26 }}>
      <div className="tqload" aria-hidden="true">
        <span className="tqring"></span><span className="tqd1"></span><span className="tqd2"></span>
      </div>
      <p className="lede loadmsg" id="loadMsg" role="status" aria-live="polite" style={{ margin: '0 auto' }}>{msg}</p>
    </div>
  )
}
