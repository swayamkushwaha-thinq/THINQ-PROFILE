# Thinq Profile — development handover, 25 Aug 2026

Working prototype plus the PRD it is specified against. Five changes were made on
25 Aug 2026; all five are specified in the PRD (now **v1.21.0**) and built in the
prototype, so the document and the build agree.

```
prototype/index.html          the prototype — open it in a browser, no build step
prototype/vercel.json         deploy config (noindex, no-store)
docs/THINQ_PROFILE_PRD.md     THINQ-PROFILE-001 v1.21.0
CHANGES-2026-08-25.md         what changed, with the requirement each change lands under
```

## Running it

Open `prototype/index.html` directly, or serve the folder:

```
cd prototype && python3 -m http.server 8777
# http://localhost:8777/index.html
```

A client-side share gate asks for a password: **`Thinq@2019`**. It is readable in
the page source — it stops a link being casually opened and is not access control.

**Two things you will see locally that are not defects.** `fonts.css` 404s: it is
injected at deploy time and has never existed in the source folder, so the
prototype falls back to system fonts unless Fraunces and Sora are installed
locally. `favicon.ico` 404s for the same reason. Neither affects behaviour.

## Driving it

The strip across the top is the **prototype bar**, not product chrome. It seeds
scenarios so a reviewer can reach a state without walking the journey to it:
account state, nominees, segments, bank verification, requests in progress,
settlement date. **PRD refs** overlays the requirement ID behind each element, and
**Build notes & open items** opens the deviations register — read that before
raising anything, since most known gaps are already recorded there with an owner.

## What to review first

1. **§3.4 Search** is new specification written after the build, which is the
   wrong order and is flagged as such in the Output Status. Read PR-194 … PR-197
   against what the field actually does.
2. **P-31** is the one thing this session opened that costs someone else work: the
   rail now reads ACCOUNT DETAILS · ACCOUNT · ACCOUNT SERVICES, and Support §10.6b
   publishes paths saying `Profile → Account …` that AT-P-01 requires to resolve
   at the name they are spoken at. Three plausible destinations where there was
   one.
3. **DP-23** withdraws PR-161a and strikes AT-P-65 and AT-P-66. Confirm the
   withdrawal is what was intended rather than a removal that lost its
   requirement.

## Not fixed, and known

- A **failed** bank verification raises no attention item and no rail dot; only a
  pending one does. Since the failed state is the one needing customer action,
  that ordering is backwards. `attention()` tests `status==='pending'` only.
- **⌘K** focuses search from behind the password gate. Harmless, one line to
  guard.

Both are behaviour in the prototype, not requirements in the PRD — neither has an
open item raised against it yet.
