'use client'
import { EntityNote, Head } from '@/components/primitives'
import { TARIFF } from '@/lib/content/tariff'

export function PricingPage() {
  /* Six groups of tariff is a lot to land on. Collapsed, with the first open so
     the page still shows what it is rather than a stack of closed lids. */
  return (
    <>
      <Head eyebrow="Pricing & calculators" title="Pricing" />
      {TARIFF().map((g, i) => (
        <details className="cardc tariff" key={i}>
          <summary><h3>{g[0]}</h3><span className="chev" aria-hidden="true"></span></summary>
          <div className="body">
            {g[1].map((r, j) => (
              <div className="prow" key={j}>
                <span className="t"><b>{r[0]}</b></span>
                <span className="c">{r[1]}</span>
              </div>
            ))}
          </div>
        </details>
      ))}
      <div className="nb info"><span className="ic">◇</span><div>
        Statutory charges — STT, CTT, stamp duty, exchange, SEBI and IPFT charges and GST — are set by the exchange
        and the government, and are passed on at cost. Everything here is inclusive unless stated; there are no
        hidden charges
      </div></div>
      <EntityNote />
    </>
  )
}
