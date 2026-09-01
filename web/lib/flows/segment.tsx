'use client'
/* ═════════════════════════════════════════════════════════════════════════════
   §7.6 Segment activation — a journey, never a toggle.
   PR-39 · PR-42 · PR-45 · PR-45a · DP-5
   ═════════════════════════════════════════════════════════════════════════════ */
import { db, go } from '@/lib/store'
import { MASK } from '@/lib/vault'
import { segPick } from '@/lib/seed'
import { toast } from '@/lib/ui'
import { Pill, Ref } from '@/components/primitives'
import { ReviewRows } from '@/components/ReviewRows'
import { DoneScreen, OtpBlock } from '@/components/flowbits'
import { segShort } from '@/lib/pages/segments'
import { registerFlow } from './engine'

const REQ: Record<string, string> = {
  'Bank statement (last 6 months)': 'Closing balance must be at least ₹10,000',
  'Holdings statement': 'Holdings value must be at least ₹10,000, generated in the last 30 days',
  'Salary slip (last month)': 'Gross salary must be at least ₹10,000',
  'ITR acknowledgement': 'Declared income must be at least ₹1,20,000',
  'Form 16': 'Declared income must be at least ₹1,20,000',
}

registerFlow('segment', {
  title: (F) => 'Activate ' + (F.segName || 'a segment'),
  init: (F) => {
    const codes = (F.arg || '').split('+').filter(Boolean)
    F.segs = db.segments.filter((s) => codes.indexOf(s.code) >= 0)
    if (!F.segs.length) F.segs = [db.segments[1]]
    F.seg = F.segs[0]
    /* one label for however many were chosen — the {segments} token pattern
       onboarding §18 uses at K12 */
    F.segName = F.segs.map((s: any) => segShort(s.code)).join(' & ')
    F.d = { route: 'aa', doc: '', file: null, declared: '', risk1: false, risk2: false, risk3: false }
  },
  steps: [
    /* SEBI's prescribed derivatives risk disclosure, ahead of income proof. It
       exists to be read before the customer commits, so it comes first. The
       study it cites is specifically about equity F&O, so it is shown only when
       F&O is among the segments being activated. */
    {
      nofocus: true,
      skipIf: (F) => !F.segs.some((x: any) => x.code === 'FNO'),
      render: () => (
        <div className="riskcard">
          <h4>Trade Responsibly in Futures &amp; Options</h4>
          <p className="lead">Risk Disclosures on Derivatives:</p>
          <ul>
            <li>9 out of 10 individual traders in Equity, Futures and Options segment, incurred net losses.</li>
            <li>On an average, loss makers registered net trading loss close to ₹50,000.</li>
            <li>Over and above the net trading losses incurred, loss makers expended an additional 28% of net trading
              losses as transaction costs.</li>
            <li>Those making net trading profits, incurred between 15% to 50% of such profits as transaction cost.</li>
          </ul>
          <div className="src">Source:<br />SEBI study dated January 25, 2023 on “Analysis of Profit and Loss of
            Individual Traders dealing in equity Futures and Options (F&amp;O) Segment”, wherein Aggregate Level
            findings are based on annual Profit/Loss incurred by individual traders in equity F&amp;O during
            FY 2021-22.</div>
        </div>
      ),
      cta: 'Proceed',
    },

    /* Activate opens straight on income proof, as the KYC journey does — the
       stages are still named, but underneath the choice rather than ahead of it,
       so the customer is not made to read a page before doing anything (PR-39). */
    {
      nofocus: true,
      render: (F, ctx) => {
        if (!F.d.doc) F.d.doc = Object.keys(REQ)[0]
        return (
          <>
            <h3>Verify income proof</h3>
            <p className="lede">{'SEBI requires proof of income to activate ' + F.segName}</p>
            <button className="upicta" type="button"
                    onClick={() => { F.d.route = 'aa'; F.d.file = null; ctx.next() }}>
              <span className="kico"><svg viewBox="0 0 24 24"><path d="M3 10l9-6 9 6" /><path d="M5 10v8M19 10v8M12 10v8M3 21h18" /></svg></span>
              <span className="txt"><b>Auto-fetch bank statement</b><small>Via a Govt-approved partner only</small></span>
              <span className="fasttag">Fastest</span>
            </button>
            {/* Both routes live on one screen: the fast one as a card, the manual one
                folded away until it is wanted. */}
            <div className="divider">or</div>
            <details className="cardc" open={!!F.d.upOpen}>
              <summary onClick={(e) => { e.preventDefault(); ctx.set({ upOpen: !F.d.upOpen }) }}>
                <h3 style={{ fontSize: 15, fontFamily: 'var(--head)', fontWeight: 600 }}>Upload income proof instead</h3>
                <span className="chev" aria-hidden="true"></span>
              </summary>
              <div className="body">
                <div className="f"><label htmlFor="docSel">Document</label>
                  <select id="docSel" value={F.d.doc} onChange={(e) => ctx.set({ doc: e.target.value })}>
                    {Object.keys(REQ).map((k) => <option key={k}>{k}</option>)}
                  </select></div>
                <div className="reqnote">
                  <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9" /><path d="M12 11v5M12 8h.01" /></svg>
                  <span>{REQ[F.d.doc]}</span>
                </div>
                <div className="reqnote">
                  <svg viewBox="0 0 24 24"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
                  <span>The name on the document must match your PAN — <b>{db.name}</b></span>
                </div>
                <div className="drop" id="drop"
                     onClick={() => ctx.set({ file: 'income-proof.pdf', route: 'up', upOpen: true })}>
                  <b>{F.d.file ? F.d.file : 'Tap to upload PDF'}</b>
                  <span>{F.d.file ? 'Tap to choose a different one' : 'PDF only · less than 2 MB'}</span>
                </div>
                {/* The stage list was removed on owner direction, 14 Aug 2026. PR-39 now
                    rests on the step counter alone, and PR-42's assurance that the AOF is
                    not re-opened survives only on the form step itself. */}
              </div>
            </details>
          </>
        )
      },
      /* the auto-fetch card advances on its own, so the step is satisfied by
         either route — the footer button is what waits for a file */
      valid: (F) => F.d.route === 'aa' || !!F.d.file,
      /* the action only appears once a document is actually attached */
      foot: (F, ok, ctx) => F.d.file
        ? <button className="btn pri" type="button" onClick={ctx.next}>Upload &amp; verify</button>
        : null,
    },

    {
      render: (F, ctx) => (
        <>
          <h3>{'e-Sign the ' + F.segName + ' form'}</h3>
          <p className="lede">
            {'A code has gone to the mobile linked to your Aadhaar. This signs the ' + F.segName
              + ' form — and only that form.'}
          </p>
          <OtpBlock id="sesign" label="Aadhaar OTP" value={F.d.esign || ''} onChange={(v) => ctx.set({ esign: v })} />
          <ReviewRows rows={[['Document', F.segName + ' activation form'],
            ['Version', F.segs.map((x: any) => 'SEG-' + x.code).join(' · ') + ' v1.0'],
            ['Your account opening form', 'Untouched']]} />
        </>
      ),
      valid: (F) => (F.d.esign || '').length === 6,
      cta: 'Sign',
    },

    /* PR-45 — Thinq approving and the exchange enabling are two different things.
       The two-leg split lives on the tracking card now, so this screen confirms
       and points at it rather than repeating it. */
    {
      bare: true, nofocus: true, noback: true,
      render: (F) => (
        <DoneScreen title="Income proof signed and submitted"
          lede="It may take 1–3 business days to complete. You can track the progress from Profile → Segments">
          <ReviewRows rows={[
            ['Segment', F.segName],
            ['Reference', 'SEG-' + db.ucc + '-0814'],
            ['Status', <Pill key="st" kind="warn" label="Under review by Thinq" />],
          ]} />
          <div className="nb info"><span className="ic">◇</span><div>
            {'We have emailed the signed activation form to ' + MASK.email
              + '. It is also in Profile → Account documents'}
          </div></div>
        </DoneScreen>
      ),
      foot: (F, ok, ctx) => <button className="btn pri" type="button" onClick={ctx.next}>Done</button>,
    },
  ],
  finish: (F) => {
    db.segmentRequest = { name: F.segName, ref: 'SEG-' + db.ucc + '-0814', on: '14 August 2026', stage: 3 }
    db.signedForms.push({ id: 'segform', name: F.segName + ' activation form', on: '14 August 2026' })
    F.segs.forEach((sg: any) => {
      sg.status = 'active'; sg.exch = 'pending'; sg.since = '14 August 2026'
      delete sg.drop; delete sg.on
      if (sg.code === 'COMM') sg.venue = 'NSE or BSE commodity derivatives — pending C54'
      segPick[sg.code] = false
    })
    go('segments')
    toast('Approved by Thinq. The exchange has not enabled it yet.', 'ok')
  },
})

/* PR-44 / AT-P-17 — deactivation requires open positions closed first, says so
   before the customer starts, and names the positions. */
registerFlow('segoff', {
  title: (F) => 'Deactivate ' + (F.seg ? F.seg.name : 'segment'),
  init: (F) => {
    F.seg = db.segments.filter((s) => s.code === F.arg)[0]
    F.segName = F.seg ? F.seg.name : ''
    F.open = db.positions[F.arg as string] || []
  },
  steps: [{
    bare: true, nofocus: true,
    render: (F) => F.open.length ? (
      <>
        <h3>Close your open positions first</h3>
        <p className="lede">You cannot switch off a segment you still hold positions in — you would be left holding
          something you could not act on.</p>
        <div className="rev">
          {F.open.map((p: string, i: number) => (
            <div className="rk" key={i}><span>Open position</span><b>{p}</b></div>
          ))}
        </div>
        <div className="nb warn"><span className="ic">◇</span><div>
          Close or square off both positions, then come back. We are naming them rather than telling you that
          "positions exist".<Ref r="PR-44" />
        </div></div>
      </>
    ) : (
      <>
        <h3>{'Deactivate ' + F.segName + '?'}</h3>
        <p className="lede">You have no open positions in this segment, so it can be switched off now. You can
          activate it again later, but that means the whole journey again — income proof, form and signature.</p>
      </>
    ),
    foot: (F, ok, ctx) => F.open.length
      ? <button className="btn sec" type="button" onClick={ctx.cancel}>Go back</button>
      : <button className="btn dgr" type="button" onClick={ctx.next}>{'Deactivate ' + F.segName}</button>,
  }],
  finish: (F) => {
    if (F.open.length) return
    F.seg.status = 'inactive'; delete F.seg.exch; delete F.seg.since
    go('segments'); toast(F.segName + ' deactivated.')
  },
})
