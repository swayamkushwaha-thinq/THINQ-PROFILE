# Thinq Profile — React / Next.js port

A port of `prototype/index.html` (THINQ-PROFILE-001 v1.21.0) to Next.js, carrying
the reference's structure exactly and recoloured to a teal palette.

**Palette:** a white/near-white ground with neutral near-black text, and
`#032129` / `#0f252a` held back as the accent — primary buttons, the current
rail item, links, focus rings, the avatar, key figures. Nothing else is teal, so
the accent keeps meaning "this is the action" rather than reading as decoration.

It lives entirely in `app/theme.css`. Delete that import from `app/layout.tsx`
and the original dark near-black-and-gold reference palette returns exactly,
because `app/globals.css` is still byte-identical to the reference.

## Running it

```
cd web
npm install
npm run dev      # http://localhost:3000
```

`npm run build && npm start` for the production build. `vercel.json`'s `noindex`
and `no-store` headers are reproduced in `next.config.mjs`.

A client-side share gate asks for the same password as the prototype:
**`Thinq@2019`**. It is readable in the page source — it stops a link being
casually opened and is not access control.

## Design system

`app/globals.css` is the reference stylesheet and supplies the component
vocabulary (`.card`, `.kv`, `.prow`, `.nb`, `.pill` …). Nothing edits it. The
system lives in `app/design/`:

| file | what it owns |
|---|---|
| `tokens.css`     | every value the UI may use: 5 surface levels, 3 ink steps, 7 type steps, 4 radii, one 4→64 space scale, 4 control heights, 3 elevations, motion |
| `system.css`     | the components, restated against those tokens — stated once, not patched |
| `responsive.css` | three designs: rail + canvas, single column + nav sheet, one-handed phone |

Components carrying structure were refactored rather than overridden: `TopBar`
(three zones), `Rail` (icons, group labels, solid selected state), plus an
`Icon` set. Page and flow components were not touched, which is why the content
comparison below is meaningful.

## How fidelity is held

* **`app/theme.css` is the only file with colour in it.** It redefines the
  tokens `globals.css` declares, plus the handful of rules where the reference
  hardcodes a colour instead of a token. No spacing, radius, type scale or
  breakpoint is touched, so the recolour cannot move the layout.
* **`app/globals.css` is the reference's `<style>` block, byte for byte** —
  lines 11–645 copied unmodified. Every token, radius, breakpoint and spacing
  value is therefore the reference's own, not a re-derivation. Restyle by
  editing that file; nothing else carries visual values.
* **No font loader.** The reference links a deploy-time `fonts.css` that has
  never existed in the source folder, so its typography resolves from the family
  stacks in `globals.css` alone. Self-hosting a Google copy of Fraunces rendered
  a visibly different cut, so the stacks are left exactly as written. To restore
  the deployed faces, add the same `fonts.css` at the seam in `app/layout.tsx`.
* **Text nodes are kept whole.** JSX splits a sentence into several text nodes
  around an interpolation, which shifts glyph rasterisation by a subpixel. Where
  a line interpolates mid-sentence it is written as one expression
  (`{'… ' + value + ' …'}`) rather than as mixed JSX. This is why the port is
  pixel-identical rather than merely close.

## Shape

```
app/
  globals.css          the reference <style> block, verbatim
  layout.tsx           <html>/<body>, metadata, the fonts.css seam
  page.tsx             share gate + shell
components/            chrome and shared primitives (Kv, Pill, MaskField, …)
lib/
  db.ts store.ts       the record, and the mutable store + commit()
  vault.ts             PR-31 masking, PIN re-auth, 60s re-mask
  seed.ts              the prototype bar's scenarios
  search.tsx           the index, harvested from the surfaces as they render
  pages/               one module per surface, registered by id
  flows/               the step engine and all 29 journeys
  content/             long static data lifted from the reference
```

## The store

The prototype keeps one mutable `DB` and calls `render()` after every change.
That model is preserved rather than reinterpreted as immutable React state: the
journeys mutate the record at roughly forty call sites and reproducing their
behaviour exactly is the requirement. Mutation is confined to `lib/store.ts`'s
`db` export plus `commit()`; components never hold their own copy and subscribe
through `useSyncExternalStore`.

## Verification

Compared against the reference served from `prototype/`, full-page screenshots
at 2× DPR:

| Check | Result |
|---|---|
| 14 surfaces × 3 breakpoints (1440 / 820 / 390) | **0 differing pixels** |
| 25 interaction scenarios × 3 breakpoints | 0 differing pixels except the `.spin` keyframe phase |
| 98 surface visits across all 7 account states | 0 exceptions, 0 console errors |
| 29 journeys | all present, all open, parity with the reference |
| Keyboard (`/`, ⌘K, Escape ×3, skip link) | identical behaviour |
