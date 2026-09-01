'use client'
import type { ReactNode } from 'react'

/* The prototype's reviewRows() / reviewRowsRaw(): a label/value list inside a
   .rev block. A value may be a node where the row shows a tick rather than a
   sentence, which is what reviewRowsRaw existed for. */
export function ReviewRows({ rows }: { rows: [string, ReactNode][] }) {
  return (
    <table className="rev-table">
      <tbody>
        {rows.map((r, i) => (
          <tr key={i}>
            <td className="label-col">{r[0]}</td>
            <td className="value-col">{r[1]}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}
