/* PAGES — the surface registry. The prototype held these as PAGES.<id>; the
   ids, and the aliases in GO_ALIAS, are unchanged so every existing link and
   every hash still resolves.
   The prototype's EMBED global is not mirrored here: Personal and Contact take
   an `embed` prop instead, which is the same switch expressed the way React
   already has one. A registry entry is always rendered un-embedded, exactly as
   buildIndex()'s `EMBED = false` intended. */
import type { ComponentType } from 'react'

export const PAGES: Record<string, ComponentType> = {}

export function registerPage(id: string, C: ComponentType) { PAGES[id] = C }
