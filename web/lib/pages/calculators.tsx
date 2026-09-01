'use client'
/* ═════════════════════════════════════════════════════════════════════════════
   Trading calculators. Illustrative rates only — the authoritative tariff is
   the schedule Legal owns, and these figures are mock.
   ⚠ Owner direction 14 Aug 2026. This is the one thing §1.4 and PR-50 rule out
   outright — "Profile is not a growth surface" (DP-6). Recorded in the notes.
   ═════════════════════════════════════════════════════════════════════════════ */
import { commit } from '@/lib/store'
import { EntityNote, Head } from '@/components/primitives'

export const calcState = {
  m: { seg: 'intraday', price: '2500', qty: '100' },
  b: { seg: 'delivery', buy: '2500', sell: '2560', qty: '100' },
}

const MARGIN_PCT: Record<string, number> = { delivery: 1, intraday: 0.20, futures: 0.15, options: 0.12 }
const SEG_LABEL: Record<string, string> = {
  delivery: 'Equity delivery', intraday: 'Equity intraday',
  futures: 'Futures', options: 'Options (sell)',
}

function rup(n: number) {
  return '₹' + Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function SegPicker({ name, val, keys, onPick }: { name: string; val: string; keys: string[]; onPick: (k: string) => void }) {
  return (
    <fieldset>
      <legend>Segment</legend>
      <div className="pills">
        {keys.map((k) => (
          <label key={k}>
            <input type="radio" name={name} value={k} checked={val === k} onChange={() => onPick(k)} />
            <span>{SEG_LABEL[k]}</span>
          </label>
        ))}
      </div>
    </fieldset>
  )
}

function NumField({ id, label, val, hint, onChange }:
  { id: string; label: string; val: string; hint?: string; onChange: (v: string) => void }) {
  return (
    <div className="f">
      <label htmlFor={id}>{label}</label>
      <input type="text" inputMode="decimal" id={id} value={val} autoComplete="off"
             onChange={(e) => onChange(e.target.value.replace(/[^\d.]/g, ''))} />
      {hint ? <div className="hint">{hint}</div> : null}
    </div>
  )
}

function marginResult() {
  const m = calcState.m, price = parseFloat(m.price) || 0, qty = parseFloat(m.qty) || 0
  const value = price * qty, pct = MARGIN_PCT[m.seg], need = value * pct
  return (
    <>
      <div className="rr"><span>Contract value</span><b>{rup(value)}</b></div>
      <div className="rr"><span>Margin rate</span><b>{(pct * 100).toFixed(0)}%</b></div>
      <div className="rr"><span>Leverage</span><b>{(1 / pct).toFixed(1)}×</b></div>
      <div className="rr tot"><span>Margin required</span><b>{rup(need)}</b></div>
    </>
  )
}

export function MarginPage() {
  return (
    <>
      <Head eyebrow="Pricing & calculators" title="Margin calculator" />
      <div className="card">
        <SegPicker name="mseg" val={calcState.m.seg} keys={['delivery', 'intraday', 'futures', 'options']}
                   onPick={(k) => { calcState.m.seg = k; commit() }} />
        <div className="calc">
          <NumField id="mPrice" label="Price per share or unit" val={calcState.m.price}
                    onChange={(v) => { calcState.m.price = v; commit() }} />
          <NumField id="mQty" label="Quantity" val={calcState.m.qty}
                    onChange={(v) => { calcState.m.qty = v; commit() }} />
        </div>
        <div className="res" id="mRes">{marginResult()}</div>
      </div>
      <div className="nb info"><span className="ic">◇</span><div>
        An estimate. The exchange sets the real requirement daily and it moves with volatility, so treat this as a
        guide rather than a quote
      </div></div>
      <EntityNote />
    </>
  )
}

function brokerageResult() {
  const b = calcState.b, buy = parseFloat(b.buy) || 0, sell = parseFloat(b.sell) || 0, qty = parseFloat(b.qty) || 0
  const bt = buy * qty, st = sell * qty, turnover = bt + st
  const R = ({
    delivery: { brk: 0 as number | 'flat', stt: [0.001, 0.001], txn: 0.0000297, stamp: 0.00015 },
    intraday: { brk: 0.0003 as number | 'flat', stt: [0, 0.00025], txn: 0.0000297, stamp: 0.00003 },
    futures:  { brk: 0.0003 as number | 'flat', stt: [0, 0.000125], txn: 0.0000173, stamp: 0.00002 },
    options:  { brk: 'flat' as number | 'flat', stt: [0, 0.000625], txn: 0.0003503, stamp: 0.00003 },
  } as Record<string, { brk: number | 'flat'; stt: number[]; txn: number; stamp: number }>)[b.seg]
  const brk = R.brk === 'flat' ? (bt ? 20 : 0) + (st ? 20 : 0)
    : R.brk ? Math.min(bt * (R.brk as number), 20) + Math.min(st * (R.brk as number), 20) : 0
  const stt = bt * R.stt[0] + st * R.stt[1]
  const txn = turnover * R.txn
  const sebi = turnover * 0.000001
  const stamp = bt * R.stamp
  const gst = (brk + txn + sebi) * 0.18
  const total = brk + stt + txn + sebi + stamp + gst
  const gross = st - bt, net = gross - total
  const be = qty ? total / qty : 0
  return (
    <>
      <div className="rr"><span>Turnover</span><b>{rup(turnover)}</b></div>
      <div className="rr"><span>Brokerage</span><b>{rup(brk)}</b></div>
      <div className="rr"><span>STT</span><b>{rup(stt)}</b></div>
      <div className="rr"><span>Exchange transaction charges</span><b>{rup(txn)}</b></div>
      <div className="rr"><span>SEBI charges</span><b>{rup(sebi)}</b></div>
      <div className="rr"><span>Stamp duty</span><b>{rup(stamp)}</b></div>
      <div className="rr"><span>GST</span><b>{rup(gst)}</b></div>
      <div className="rr tot"><span>Total charges</span><b>{rup(total)}</b></div>
      <div className="rr"><span>Gross P&amp;L</span><b>{rup(gross)}</b></div>
      <div className="rr"><span>Net P&amp;L</span><b style={{ color: net >= 0 ? 'var(--ok)' : 'var(--danger)' }}>{rup(net)}</b></div>
      <div className="rr"><span>Breakeven move</span><b>{rup(be)} per share</b></div>
    </>
  )
}

export function BrokeragePage() {
  return (
    <>
      <Head eyebrow="Pricing & calculators" title="Brokerage calculator" />
      <div className="card">
        <SegPicker name="bseg" val={calcState.b.seg} keys={['delivery', 'intraday', 'futures', 'options']}
                   onPick={(k) => { calcState.b.seg = k; commit() }} />
        <div className="calc">
          <NumField id="bBuy" label="Buy price" val={calcState.b.buy}
                    onChange={(v) => { calcState.b.buy = v; commit() }} />
          <NumField id="bSell" label="Sell price" val={calcState.b.sell}
                    onChange={(v) => { calcState.b.sell = v; commit() }} />
          <NumField id="bQty" label="Quantity" val={calcState.b.qty}
                    onChange={(v) => { calcState.b.qty = v; commit() }} />
        </div>
        <div className="res" id="bRes">{brokerageResult()}</div>
      </div>
      <div className="nb info"><span className="ic">◇</span><div>
        Charges shown are illustrative. The tariff schedule is what applies to your account — see Pricing
      </div></div>
      <EntityNote />
    </>
  )
}
