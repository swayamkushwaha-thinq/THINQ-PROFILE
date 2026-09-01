'use client'
/* Prototype affordance only — steps a request through its states so every
   tracking view can be seen without waiting three days for the real one. */
import { commit, db } from '@/lib/store'

type Which = 'chg' | 'seg' | 'ddpi' | 'clo' | 'nom'

function target(which: Which): any {
  return which === 'chg' ? db.contactChange
    : which === 'seg' ? db.segmentRequest
    : which === 'ddpi' ? db.ddpiRequest
    : which === 'clo' ? db.closure : db.nomineeRequest
}

export function stageAdvance(which: Which, delta: number) {
  const t = target(which)
  const max = which === 'ddpi' ? 3 : (which === 'chg' || which === 'seg') ? 6 : 4
  if (!t) return
  t.stage = Math.max(0, Math.min(max, t.stage + delta))
  if (which === 'ddpi') db.prefs.ddpi = (t.stage >= max)
  commit()
}

export function StageStepper({ which, stage, max }: { which: Which; stage: number; max: number }) {
  return null
}
