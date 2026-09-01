'use client'
/* ══ timeline ══
   A step reading "Registering" while marked done is the PR-09 defect in
   miniature, so a completed step swaps to its own past-tense label and its own
   status enum. Rows are [title, sub, code] or
   [title, sub, code, doneTitle, doneSub, doneCode]. */
export type TlStep = [string, string, string] | [string, string, string, string, string, string]

export function Timeline({ steps, stage }: { steps: TlStep[]; stage: number }) {
  return (
    <ul className="tl">
      {steps.map((s, i) => {
        const cls = i < stage ? 'done' : (i === stage ? 'now' : 'todo')
        /* a completed step reads in the past tense, with its own status value */
        const done = cls === 'done' && s[3]
        const tt = done ? s[3] : s[0]
        const ts = done ? s[4] : s[1]
        const code = done ? s[5] : s[2]
        return (
          <li className={cls} key={i}>
            <span className="d"></span>
            <span>
              <span className="tt">{tt}{code ? <span className="pr">{code}</span> : null}</span>
              <span className="ts">{ts}</span>
            </span>
          </li>
        )
      })}
    </ul>
  )
}
