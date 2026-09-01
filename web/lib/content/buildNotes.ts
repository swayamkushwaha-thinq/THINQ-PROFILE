/* Build notes & open items — the deviations register.
   Body extracted VERBATIM from prototype/index.html lines 817–951 (everything
   inside .dr .pn after the Close button and the h2). It is a long block of
   static editorial prose with inline markup; copying the bytes is what keeps it
   identical to the reference. No user input reaches it. */
export const BUILD_NOTES_HTML = String.raw`
    <p>Prototype of <code>THINQ-PROFILE-001 v1.5.0</code>. Every name, number and document here is mock data.</p>

    <h3>Freeze, unfreeze and closure — rebuilt 16 Aug 2026 from six teardowns</h3>
    <p>Four text teardowns plus two screen recordings analysed frame by frame (<code>Freeze-DreamStreet.mp4</code>, <code>Inmoney - Account Closure .mp4</code>). Every change below exists because a named product got it wrong. New requirements are <span class="pr">PR-107a</span> … <span class="pr">PR-122a</span> in PRD §7.11a and §7.11b.</p>
    <ul>
      <li><b>A freeze now says what it does <i>not</i> reach</b> <span class="pr">PR-111a</span>. This is the sharpest finding in the set: all five brokers freeze trading access only, all five are also depositories, and <b>none</b> cross-references the depository freeze facility. In the teardown's words — <i>"a client who believes they have secured their assets has secured only their login"</i>. Step 1 of our flow names the demat account, says it stays open, and offers the route to freeze it too.</li>
      <li><b>Open positions no longer block the freeze</b> <span class="pr">PR-110a</span>. Fyers refuses to freeze a client who holds them, which defeats the facility in the exact scenario it exists for. We freeze anyway, show what stays open, and commit to sending contract expiry dates within the hour — which only Angel One does, of five.</li>
      <li><b>Both timeline limbs are published</b> <span class="pr">PR-108a</span> — 15 minutes during trading hours, before the next session otherwise. Five of five publish an incomplete matrix or none; the teardown calls it "the clearest systemic gap".</li>
      <li><b>Two ways to ask, one that does not need the app</b> <span class="pr">PR-107a</span>, on the domain the customer knows: <code>stoptrade@thinq.in</code>. Sahi publishes <code>stoptrade@aaritya.com</code> while every client-facing surface says sahi.com.</li>
      <li><b>Alternatives sit beside the freeze, not in front of it</b> <span class="pr">PR-112a</span>. DreamStreet puts three on an interstitial and labels the requested action <b>"Freeze Account Anyway"</b> in a pale button beneath them.</li>
      <li><b>Unfreeze is self-service, PIN + OTP, ~30 minutes</b> <span class="pr">PR-113a</span>. Groww demands a booked video-KYC call with a physical PAN; DreamStreet takes 72 hours with no in-app route at all. ⚠ The line naming that difference — <i>"no video call, no branch visit and no form; nothing in the rules requires any of those"</i> — was removed on owner direction, 16 Aug 2026. The turnaround is still stated; that our lighter process is a choice and not a regulatory floor is no longer said anywhere.</li>
      <li><b>Closure opens with a records checkpoint</b> <span class="pr">PR-114a</span> — a step, not a hint, which is Paytm's own recommended remedy for its principal finding. Our retention duty survives closure; only the customer's channel to reach the records does not, and the post-closure route and its 5-working-day timeframe are named.</li>
      <li><b>Both exits are built</b> <span class="pr">PR-115a</span> — sell, or transfer out. INDmoney names both and builds one.</li>
      <li><b>The transfer form states the format, names the CMR as the source, and echoes the receiving broker back</b> <span class="pr">PR-116a</span>. Try <code>IN301234</code>, then <code>IN999999</code>. INDmoney takes both IDs as bare text with no hint, no validation and no echo — and a typo sends the shares to a stranger, irreversibly.</li>
      <li><b>Both statutory clocks, not a callback SLA</b> <span class="pr">PR-117a</span> — 3 working days trading, 2 working days demat. Dhan publishes "we will get in touch within 1–2 working days" where the closure clock belongs.</li>
      <li><b>The demat account is named</b> <span class="pr">PR-118a</span>. Dhan is a CDSL DP and never names it anywhere in closure.</li>
      <li><b>We say you can come back</b> <span class="pr">PR-119a</span>. INDmoney says <i>"you will not be able to … create a new account with us once your account is closed"</i>. No rule imposes that.</li>
      <li><b>Freeze offered as the reversible alternative</b> when the reason is inactivity <span class="pr">PR-121a</span> — Paytm offers "I have stopped trading" as a reason and never mentions its own freeze facility.</li>
    </ul>
    <p>⚠ <b>Three unverified regulatory claims across three products</b>, each placed exactly where it discourages an action the customer chose: Groww's <i>"mandatory as per SEBI regulations"</i>, DreamStreet's <code>Required by SEBI</code> on a PIN reset, INDmoney's re-opening bar. <span class="pr">PR-122a</span> makes verification the writer's burden.</p>

    <h3>Settlement cycle — merged in from the account sandbox, 16 Aug 2026</h3>
    <p><code>thinq-account.html</code> was a standalone sandbox for §7.11 and the settlement cycle, written against the same tokens and helper signatures so it could be merged back rather than rewritten. Freeze, unfreeze and closure were lifted from Profile unchanged, so nothing came back with them. The settlement cycle was built there for the first time, from a running-account teardown of Groww, Angel One, Dhan, Sahi and Fyers:</p>
    <ul>
      <li><b>Two bare radio pills became a journey</b> <span class="pr">PR-38</span>. Four of the five brokers publish no way to change the preference at all; only Angel One does. Choose → see exactly what changes → confirm.</li>
      <li><b>The dates now come from the exchange calendar, and this fixes a live defect.</b> Profile hardcoded the next quarterly settlement as <b>2 October 2026</b> — the <i>first Friday of the quarter</i>. That rule died in December 2023 and was replaced by a joint NSE/BSE calendar published at the start of each financial year. The real FY 2026-27 quarterly dates are 17/18 Apr, 3/4 Jul, <b>16/17 Oct</b>, 1/2 Jan. <b>P-5 is now answerable</b> — not from a cycle model, but from NSE circular 4/2026.</li>
      <li><b>The 30-day idle override gets its own row.</b> A quarterly client who does not trade is settled monthly. No broker in the set surfaces it; Dhan quietly redefines "monthly" as this. It sits directly under the cycle it overrides.</li>
      <li><b>The running-account authorisation is stated as voluntary and revocable.</b> Two brokers tell clients it is "mandatory as per SEBI". It is the opposite.</li>
      <li><b>The whole calendar, both cycles.</b> Nobody publishes a complete one; Groww's stops at Dec 2026.</li>
      <li><b>The 225% retention cap, with a worked example.</b> Two of the five never disclose it, and two client-signed forms still carry the formula it replaced in 2022.</li>
      <li><b>What is deliberately absent</b>, because no regulation imposes it and the teardown found brokers presenting their own friction as SEBI's: no lock-in, no notice period, no cut-off before a settlement date, no cap on switching, no fee, no "takes effect next quarter". If one is ever added it has to be labelled as ours.</li>
    </ul>

    <h3>Statements &amp; reports — rebuilt 15 Aug 2026 from §7.10a</h3>
    <p>Three teardowns on one surface (Dhan, Paytm Money, INDmoney) became PRD §2.4 and §7.10a. What this build does about each:</p>
    <ul>
      <li><b>Pick the report first, then its own controls open</b> — owner direction, 16 Aug 2026. This is the shape both teardowns criticise, so the defects it caused there are designed out rather than inherited: it is a <b>native <code>&lt;select&gt;</code></b>, which cannot cover the period control the way Dhan's custom panel does, cannot ignore Escape, and cannot render two panels at once — and it satisfies §9.2 without a bespoke listbox. The list is <b>grouped and ordered by relevance</b>, not by which system produces the report, and the four people actually arrive for sit at the top.</li>
      <li><b>Nothing selected is not nothing.</b> Paytm leaves ~800×550px blank at the exact moment a customer is least sure which of eleven similarly-named reports they need. That space carries the four real jobs — filing your return, reconciling your bank, proof of a trade, checking what you paid us — each opening the right report.</li>
      <li><b>The build and the PRD are in step.</b> §7.11a.1 and §7.11b.1 record the freeze, unfreeze and closure journeys screen by screen, so the document cannot drift from what ships. New requirements settled by building it: <span class="pr">PR-123a</span> a freeze ends every session including this one · <span class="pr">PR-124a</span> a third factor to unfreeze, PAN or date of birth, checked against the vault · <span class="pr">PR-125a</span> a progress state where the change is not instant · <span class="pr">PR-126a</span> an assisted request returns a quotable reference · <span class="pr">PR-127a</span> / <span class="pr">DP-17</span> a reversible assisted request raises itself, an irreversible one collects intent for a person.</li>
      <li><b>Freeze and unfreeze are four comms events, not two</b> <span class="pr">PR-109a</span> — <code>FREEZE_REQUESTED</code> / <code>ACCOUNT_FROZEN</code> and <code>UNFREEZE_REQUESTED</code> / <code>ACCOUNT_UNFROZEN</code>. The request being accepted and the state actually changing are separated because the gap between them is real and disclosed: a freeze asked for after trading hours may not land until the next session. One message is wrong at one end or the other — a receipt claiming the account is frozen before it is would be false, and holding the confirmation until the freeze lands leaves the customer with nothing for hours at the moment they are most anxious. All four are specified in Onboarding §18.3; copy still to be approved in §18.2a. <b>None of the five brokers in the teardown sends a receipt at all.</b></li>
      <li><b>⚠ Two obliged documents were removed</b> — owner direction, 16 Aug 2026. <b>Daily margin statement</b> (SEBI Rights and Obligations, cl. 35, sent daily) and <b>Statement of accounts</b> (cl. 34) are no longer offered, and have no other home in Profile — a customer who loses the email that carried one cannot retrieve it. Of the five statutory documents §7.10a started with, <b>two remain</b>: contract notes and the demat transaction statement, plus the annual holding obligation now folded into Holdings statement. <i>Statement of holding</i> also went, correctly — it was the same document as Holdings statement under the depository's name.</li>
      <li><b>⚠ The obliged documents are no longer marked</b> — owner direction, 16 Aug 2026. The <i>Required</i> tag, the statutory clause and the report description have all gone, so nothing distinguishes the five documents SEBI and the depositories oblige Thinq to produce from the seven it offers by choice, beyond the dropdown group name. <span class="pr">DP-16</span> has no surface. A customer cannot tell which report their CA, their bank or a regulator recognises.</li>
      <li><b>Five of the reports are not product decisions.</b> Contract notes, the daily margin statement, the statement of accounts, the demat transaction statement and the statement of holding are obliged by SEBI's Rights and Obligations (cl. 32, 34, 35) and the Depositories Master Circular (1.8.5, 1.8.6). They are grouped together and marked <b>Required</b>, with the clause on each <span class="pr">DP-16</span>. A customer otherwise cannot tell which report their CA or their bank actually recognises.</li>
      <li><b>⚠ The period control removed</b> — owner direction, 16 Aug 2026. It carried <span class="pr">PR-108</span>'s financial-year-first presets and <span class="pr">PR-117</span>'s rule that the period belongs to the question rather than to the report, so it survives every switch between reports — the answer to Dhan, which resets to a 7-day window on some transitions and not others with no rule a customer could learn. Every report now renders at FY 2026–27 and there is no way to ask for another window, which also strands <span class="pr">PR-118</span>'s bounded date pickers and <span class="pr">PR-111</span>'s empty-window notice, since neither state can be reached. <b>AT-P-27, AT-P-29 and AT-P-31 fail by design</b>, and the two bullets below describing those behaviours no longer hold.</li>
      <li><b>⚠ The advance-tax instalment windows removed</b> — owner direction, 16 Aug 2026. <span class="pr">PR-108</span> put the real instalment dates (1 Apr – 15 Jun, 16 Jun – 15 Sep, 16 Sep – 15 Dec, 16 Dec – 15 Mar, 16 Mar – 31 Mar) on the two tax reports instead of arbitrary quarters. The idea was lifted unchanged from INDmoney's Tax Centre — the one genuinely good piece of tax-domain design across all three products — and a customer computing an instalment now derives the window themselves.</li>
      <li><b>⚠ Per-report depth removed</b> — owner direction, 16 Aug 2026. <span class="pr">PR-109</span> required each report to state how far back <i>it</i> goes, because the market's habit is to differ silently: Paytm's Trade Book reaches back 1 year and its Tax P&amp;L 5, discoverable only by noticing that 2024 is greyed out. What survived was the account-level floor in the note at the foot of the page and the bound on the date control — <b>both since removed</b> (see below), so nothing on this surface now states how far back anything goes, and <b>AT-P-30 fails by design</b>.</li>
      <li><b>⚠ The account-level floor note removed</b> — owner direction, 16 Aug 2026. <i>"Older than 22 April 2026 is before your account existed"</i> was the last of <span class="pr">PR-109</span> standing once the per-report depths came out, and it carried the surface's only route to support for a document Reports cannot produce. Both are now gone.</li>
      <li><b>Empty windows say so</b> <span class="pr">PR-111</span> — <b>unreachable since the period control was removed</b>, as neither <i>Last 30 days</i> nor <i>This quarter</i> can be selected. The behaviour is still built: every report named its window and offered to widen it inline, against Dhan's illustrated <i>"No Traded History"</i> that reads as though the account has no records.</li>
      <li><b>Contract notes and the daily margin statement carry their statutory fields</b> <span class="pr">PR-107</span>. Open either and press <b>View</b>. Dhan ships four "reports" that are the same seven-column trade book — no brokerage, no STT, no GST, no margin required, no shortfall.</li>
      <li><b>One delivery model</b> <span class="pr">PR-113</span> — view, download, email — and where one does not apply the reason is stated rather than the button silently missing. Paytm distributes three verbs across eleven types with no rule.</li>
      <li><b>Requests have a state</b> <span class="pr">PR-115</span>. <i>Your requests</i> carries preparing, ready and failed, and email is the notification that a report is ready rather than the only channel. All three products ship fire-and-forget email with no status.</li>
      <li><b>The destination is named before anything is sent</b> <span class="pr">PR-116</span>, which is also the cheapest way to catch a stale email on file.</li>
      <li><b>Dates are bounded by the account</b> <span class="pr">PR-118</span> — <b>unreachable since the period control was removed</b>, as <i>Custom dates</i> can no longer be selected. The pickers are still built and still refuse January 2025, against Dhan's, which offers 2003 and renders ₹0.00 for periods in which the account did not exist.</li>
      <li><b>Commodity is reportable</b> <span class="pr">PR-119</span>. Set Segments to <i>All three active</i>: Equity, F&amp;O and Commodity appear on every segment-aware report, in §7.6's words <span class="pr">PR-122</span>. INDmoney sells MCX commodity F&amp;O and has no commodity report anywhere.</li>
      <li><b>Charges are the customer's own</b> <span class="pr">PR-120</span>, and the row says so — the published rates are under Pricing. INDmoney's <i>"View Charges &amp; Brokerage"</i> opens the public rate card.</li>
      <li><b>A failure is attributed honestly</b> <span class="pr">PR-123</span> — see the failed job in <i>Your requests</i>. Paytm reports a null dereference in its own render as <i>"check your network connection"</i>.</li>
    </ul>
    <p><b>Blocked:</b> <b>P-14 · P0</b> — no Thinq document names the reports engine, the retention window or the range caps, so the depths and limits on this surface are placeholders. <b>P-15 · P1</b> — commodity is sold and appears in no PRD's report list. <b>P-16 · P0</b> — the statutory <i>delivery</i> obligations (daily contract notes, daily margin statements, quarterly and annual depository statements) have no owner in any PRD; this surface is retrieval only and does not discharge them.</p>

    <h3>Interpretation calls made in this build</h3>
    <ul>
      <li><b>§3.2 groups vs §7 surfaces.</b> §3.2 lists 22 items across six groups; §7 specifies eleven surfaces. Putting all 22 in the rail would rebuild the ~20-item sidebar §7.9 criticises Paytm for. Resolved by treating the items inside <b>Preferences</b>, <b>Privacy</b>, <b>Security</b> and <b>Documents</b> as sections <i>within</i> their surface, each with its own heading — nothing in §3.2 is lost and the rail stays at eleven destinations.</li>
      <li><b>Nominee relations: 12, not 16.</b> The PRD says <i>16 SEBI relations</i> in §5.4 and PR-35; the shipped onboarding screen (<code>thinq-journey-v3.html:1883</code>) offers <b>12</b>. PR-35 requires the two surfaces not diverge, so this build renders the shipped 12 and raises the difference rather than inventing four. See defects below.</li>
      <li><b>Log out</b> sits in <b>Security</b> per §3.2 and is present on every viewport <span class="pr">PR-03</span>. It navigates, so PR-01's bar on in-place controls inside a navigating list is not engaged.</li>
      <li><b>Masking is modelled server-side</b> <span class="pr">PR-31</span>. Full values live in a vault object the render layer cannot read. <code>unmask()</code> is the only way in, it requires a live re-auth token, and it writes an audit row. That log is on <b>Security → Reveal activity</b>, which makes <span class="pr">AT-P-05</span> demonstrable rather than asserted.</li>
      <li><b>No network requests at all.</b> That is how PR-46 and PR-49 stay true instead of being promised.</li>
      <li><b>Account state is called "Activated", not "Active"</b> — §4's wording. Segments use <i>Active</i>, so reusing that word for the account would put one label on two different conditions, which is what PR-81 exists to prevent.</li>
    </ul>

    <h3>Deviations from the PRD — owner direction, 14 Aug 2026</h3>
    <p>Both were requested during the build. Neither is an oversight, and both need the PRD amended or the decision reversed:</p>
    <ul>
      <li><b>"No nominee on record" is off the Profile home attention band.</b> §3.3 lists it as a band item. It remains on the Nominee surface in full (with the opt-out declaration, its date and version, per <span class="pr">PR-34</span>) and still marks the rail with a dot.</li>
      <li><b>Pending re-consent is off the Profile home attention band.</b> This one contradicts a requirement rather than a list: <span class="pr">PR-59</span> says re-consent <i>SHALL</i> surface in the band, and <b>AT-P-19 tests for exactly that</b> — so that acceptance test now fails by design. The prior acceptance is still not treated as covering the new version, and the item remains on Privacy &amp; consents with a rail dot.</li>
      <li><b>The ACCOUNT DETAILS group carries two entries, not three.</b> §3.2 groups YOU as <i>Personal &amp; KYC details · Contact details · Nominee</i>. This build has <b>Personal details</b> (Personal &amp; KYC and Contact details merged, each still a titled section) and <b>Demat details</b>; Nominee moved to ACCOUNT so it keeps its own destination. The group and its first entry were renamed from YOU / Basic details on owner direction, 25 Aug 2026.
        <br><b>This one has teeth.</b> <code>Profile → Contact Details</code> is one of the eight published paths in Support §10.6b, spoken aloud by the assistant, and <b>AT-P-01 requires every one of them to resolve at that name</b>. It no longer does — the content is a section inside Personal details, not a rail entry. Closing <b>H38</b> was the stated purpose of this PRD, so either the published path changes to <code>Profile → Personal details</code> or the rail regains a Contact details entry. Owner: Content + Support.</li>
      <li><b>Segments shows two groups</b> — <i>Enabled now</i> and <i>You can add</i> (plus <i>Being enabled</i> when something sits between Thinq approval and exchange enablement, which is <span class="pr">PR-45</span>). The per-segment detail tables are gone; <span class="pr">PR-40</span>'s four states are carried by which group a segment sits in plus one line of its own, and the <code>drop_reason</code> is rendered as a sentence rather than the raw enum <span class="pr">PR-81</span>.</li>
      <li><b>"Always on" pill removed from Equity.</b> <span class="pr">PR-43</span> still holds — the row says <i>"Comes with every Thinq account"</i> and carries no control at all, rather than a disabled one.</li>
      <li><b>Bank verification copy commits "1–3 business days".</b> Support <b>H34</b> records a standing owner rule that no timeline is committed. Owner-supplied copy, so it ships as given.</li>
      <li><b>A three-account limit on linked bank accounts</b> is enforced in the surface and in the flow. <b>No PRD states this limit</b> — §7.4 and PR-27/28/29 are silent on it. It needs to land in the Profile PRD or it exists only here.</li>
    </ul>

    <h3>Deliberately absent — absence is invisible, so it is listed</h3>
    <ul>
      <li>No trading, market, portfolio or funds data on any surface <span class="pr">PR-46</span>; no market ticker anywhere <span class="pr">PR-47</span>.</li>
      <li>No advertising, remarketing or conversion tag <span class="pr">PR-49</span>.</li>
      <li>No product promotion, <code>New</code> badge or cross-sell in the rail <span class="pr">PR-50</span>.</li>
      <li>No signature specimen image <span class="pr">PR-11</span>.</li>
      <li>No completion timeline quoted in any flow <span class="pr">PR-22</span> — which will read as a contradiction against three published answers until <b>P-4</b> resolves.</li>
      <li>No depository choice and no "CDSL/NSDL" string; MCX is never named as the commodity venue <span class="pr">PR-45a</span>.</li>
      <li>No <code>disabled</code> input used to display a read-only value, anywhere <span class="pr">PR-04</span>.</li>
    </ul>

    <h3>Blocked in the PRD — marked on screen where they land</h3>
    <ul>
      <li><b>P-2 · P0</b> — DPDP rights <span class="pr">PR-61</span>. No Privacy Policy exists (TnC T14). → <i>Privacy &amp; consents → Your data</i>.</li>
      <li><b>P-5 · P0</b> — settlement cycle model. Rolling 90/30-day vs calendar-aligned (Support H31). → <i>Preferences → Settlement cycle</i>.</li>
      <li><b>P-6 · P0</b> — freeze semantics: trading suspension, CDSL demat freeze, or both. → <i>Freeze or close</i>.</li>
      <li><b>P-7 · P1</b> — closure has no owning flow. → <i>Freeze or close</i>.</li>
      <li><b>P-8 · P1</b> — post-activation nominee e-Sign has no named provider. → <i>Nominee flow, e-Sign step</i>.</li>
      <li><b>P-9 · P1</b> — re-KYC has no trigger, period or journey <span class="pr">PR-24</span>. → <i>Personal &amp; KYC details</i>.</li>
    </ul>

    <h3>Defects to raise against other documents</h3>
    <ul>
      <li><b>Nominee relation count.</b> PRD says 16, shipped screen offers 12. PR-35 makes the divergence a defect. Owner: Onboarding.</li>
      <li><b>P-1 is live in this build.</b> The section is called <b>Profile</b> <span class="pr">DP-1</span>; the two onboarding confirmations still say <i>"from Settings"</i>. Onboarding's owner has to make that change.</li>
      <li><b>P-3 is live.</b> <code>HC-ACC-01</code>, <code>HC-ACC-04</code> and <code>HC-SEG-04</code> describe these as self-service edits. Walk the contact-change and segment flows and compare.</li>
    </ul>

    <h3>Acceptance tests you can run here</h3>
    <ul>
      <li><b>AT-P-01</b> — every §10.6b <code>Profile → …</code> path resolves; rail names match the published paths.</li>
      <li><b>AT-P-02</b> — state <i>Activated</i>: the band carries the de-scoped F&amp;O with its <code>drop_reason</code>.</li>
      <li><b>AT-P-03</b> — Profile → Nominee shows the opt-out declaration with date and version, and never reads "no nominee added".</li>
      <li><b>AT-P-19 fails by design</b> — see the deviations above.</li>
      <li><b>AT-P-05 / 06</b> — reveal a PAN, then navigate away, or wait 60 seconds.</li>
      <li><b>AT-P-07</b> — Contact details → change email.</li>
      <li><b>AT-P-08</b> — state <i>Prospect</i> → Contact details.</li>
      <li><b>AT-P-12</b> — add a nominee, then look at the card.</li>
      <li><b>AT-P-14</b> — holder DOB is 15 Jan 1993, nominee DOB is seeded different; each renders from its own record.</li>
      <li><b>AT-P-16</b> — open any flow and abandon it.</li>
      <li><b>AT-P-17 / 18</b> — activate F&amp;O, then try to deactivate it with an open position seeded.</li>
      <li><b>AT-P-20</b> — Documents: type and size stated before every download.</li>
      <li><b>AT-P-27</b> — set the period to <i>Last 30 days</i>: every report names the window and offers to widen it.</li>
      <li><b>AT-P-28</b> — Contract notes: one action for the whole range, not one per trading day.</li>
      <li><b>AT-P-29</b> — set a period, then open a different report. It persists.</li>
      <li><b>AT-P-30</b> — every report states how far back it goes, before you pick a period.</li>
      <li><b>AT-P-31</b> — <i>Custom dates</i> → try 1 January 2025.</li>
      <li><b>AT-P-32</b> — Segments <i>All three active</i> → Trade book, Tax P&amp;L, Contract notes.</li>
      <li><b>AT-P-33</b> — press <b>Email it to me</b> on any report.</li>
      <li><b>AT-P-34</b> — <b>View</b> a contract note and a daily margin statement. Each carries its own statutory fields.</li>
    </ul>
  </div>
</div>
`
