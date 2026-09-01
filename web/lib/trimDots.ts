/* No block of body text in Profile ends in a full stop — sub-headings, row
   descriptions, notices and captions alike. Multi-sentence text keeps its
   internal stops and loses only the last one.
   Kept as a DOM pass, exactly as in the reference: it is a typographic trim
   over rendered text, not a content rule any single component can apply. */
export const DOT_SEL = '.phead p, .chead .sub, .prow .t span, .seg .t span, .quiet, .nb p, .nb div,'
  + '.row .meta, .row .note, .fund .src, .tile span, table caption, .att li .t span,'
  + '.stages li span, .f .hint, .opt .ot span, .lede, .rev .rk b'

/* the last text node inside an element, however deeply nested */
function lastTextNode(el: Node): Text | null {
  for (let i = el.childNodes.length - 1; i >= 0; i--) {
    const n = el.childNodes[i]
    if (n.nodeType === 3 && (n.nodeValue || '').trim()) return n as Text
    if (n.nodeType === 1) { const d = lastTextNode(n); if (d) return d }
  }
  return null
}

export function trimSubDots(root?: Element | null) {
  const host = root || document.getElementById('main')
  if (!host) return
  const els = host.querySelectorAll(DOT_SEL)
  for (let i = 0; i < els.length; i++) {
    const n = lastTextNode(els[i])
    if (!n) continue
    const v = n.nodeValue || ''
    if (!/\.\s*$/.test(v)) continue
    if (/\.\.\s*$/.test(v)) continue          /* leave an ellipsis alone */
    n.nodeValue = v.replace(/\.(\s*)$/, '$1')
  }
}
