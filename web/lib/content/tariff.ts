/* The full tariff a broker is expected to publish. Figures are illustrative in
   this prototype — the schedule Legal owns is authoritative, and statutory rates
   are set by the exchange and the government, not by Thinq.
   Rows copied from the reference; the HTML entities it carried (&amp;) are plain
   characters here because JSX escapes text for you. */
import { feeTotal } from '../db'

export type TariffGroup = [string, [string, string][]]

export const TARIFF: () => TariffGroup[] = () => [
  ['Account', [
    ['Account opening','Free'],
    ['Annual maintenance (AMC)','₹300 + GST a year, charged from the second year'],
    ['DDPI (Instant Sell), added after opening','₹150 one-off, GST included'],
    ['Account closure','Free'],
    ['Reactivating a dormant account','Free'],
    ['Change of registered mobile or email','₹' + feeTotal() + ' per change, GST included'],
    ['Change of other client details','Free']
  ]],
  ['Brokerage', [
    ['Equity delivery','Free'],
    ['Equity intraday','0.03% or ₹20 per executed order, whichever is lower'],
    ['Futures','0.03% or ₹20 per executed order, whichever is lower'],
    ['Options','₹20 per executed order'],
    ['Commodity futures','0.03% or ₹20 per executed order, whichever is lower'],
    ['Commodity options','₹20 per executed order'],
    ['Call & trade, and orders squared off by us','₹50 per order, on top of brokerage'],
    ['Minimum brokerage','None']
  ]],
  ['Statutory & regulatory charges', [
    ['Securities Transaction Tax (STT)',
      'Delivery 0.1% on buy and sell · Intraday 0.025% on sell · Futures 0.02% on sell · '
      +'Options 0.1% on premium sell, 0.125% on exercised contracts'],
    ['Commodity Transaction Tax (CTT)','0.01% on sell, non-agricultural futures'],
    ['Exchange transaction charges',
      'Equity 0.00297% · Futures 0.00173% · Options 0.03503% on premium · Commodity 0.0021%'],
    ['SEBI turnover fees','₹10 per crore of turnover'],
    ['Investor Protection Fund (IPFT)','Equity 0.0001% · Futures 0.0001% · Options 0.0005% on premium'],
    ['Stamp duty','Delivery 0.015% · Intraday 0.003% · Futures 0.002% · Options 0.003%, on buy'],
    ['GST','18% on brokerage, transaction, SEBI, IPFT and DP charges']
  ]],
  ['Demat (DP) charges', [
    ['Selling from your demat account','₹13.50 + GST per scrip, per day, regardless of quantity'],
    ['Pledge creation','₹20 + GST per request'],
    ['Pledge invocation','₹20 + GST per request'],
    ['Dematerialisation','₹150 per certificate, plus courier'],
    ['Rematerialisation','₹150 per certificate, plus depository charges'],
    ['Client master report, physical copy','₹50 + GST'],
    ['Client master report, by email','Free']
  ]],
  ['Funds & settlement', [
    ['Adding funds by UPI','Free'],
    ['Adding funds by net banking or payment gateway','₹9 + GST per transaction'],
    ['Withdrawing to your primary bank account','Free'],
    ['Delayed payment charges','18% a year on the shortfall, charged daily'],
    ['Cheque or mandate return','₹350 per instance']
  ]],
  ['Other', [
    ['Physical contract notes','₹20 + GST per note, plus courier'],
    ['Auction or short-delivery penalty','As levied by the exchange, passed on at cost'],
    ['Duplicate statements over email','Free']
  ]]
]
