'use client'
/* One icon set, one grammar: 24-unit box, 1.75 stroke, round caps and joins,
   currentColor, no fills. Icons are affordances for the navigation — they carry
   no information the label does not, so every one is aria-hidden and the text
   remains the accessible name. */

const P: Record<string, React.ReactNode> = {
  basic: <><circle cx="12" cy="8" r="3.5" /><path d="M4.5 20a7.5 7.5 0 0 1 15 0" /></>,
  contact: <><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m3.5 7.5 8.5 5.5 8.5-5.5" /></>,
  demat: <><rect x="3" y="5" width="18" height="14" rx="2" /><circle cx="8.5" cy="11" r="2" />
           <path d="M14 10h4M14 14h4M5.4 16.4c.9-1.5 5.3-1.5 6.2 0" /></>,
  banks: <><path d="M12 3.5 21 8H3z" /><path d="M5.5 8v8.5M9.5 8v8.5M14.5 8v8.5M18.5 8v8.5M3 20h18" /></>,
  segments: <><path d="m12 3 9 4.8-9 4.8-9-4.8z" /><path d="m3 12.6 9 4.8 9-4.8" /><path d="m3 17.2 9 4.8 9-4.8" /></>,
  nominee: <><circle cx="9" cy="8" r="3.2" /><path d="M3.2 20a5.8 5.8 0 0 1 11.6 0" />
            <path d="M16.4 5.4a3 3 0 0 1 0 5.9" /><path d="M18 20a5.6 5.6 0 0 0-2.2-4.4" /></>,
  reports: <><rect x="4" y="3" width="16" height="18" rx="2" /><path d="M8 13.5V17M12 10v7M16 14.5V17" /></>,
  pricing: <><path d="M20.6 13.4 13.4 20.6a2 2 0 0 1-2.8 0l-7.2-7.2A2 2 0 0 1 3 12V5a2 2 0 0 1 2-2h7a2 2 0 0 1 1.4.6l7.2 7.2a2 2 0 0 1 0 2.6z" />
             <circle cx="7.6" cy="7.6" r="1.3" /></>,
  margin: <><rect x="5" y="3" width="14" height="18" rx="2" /><path d="M9 7.5h6" />
            <path d="M9 12h.01M12 12h.01M15 12h.01M9 16h.01M12 16h.01M15 16h.01" /></>,
  brokerage: <><path d="M19 5 5 19" /><circle cx="7.6" cy="7.6" r="2.2" /><circle cx="16.4" cy="16.4" r="2.2" /></>,
  prefs: <><path d="M4 8h9M19 8h1M4 16h5M15 16h5" /><circle cx="16" cy="8" r="2.4" /><circle cx="12" cy="16" r="2.4" /></>,
  documents: <><path d="M14 3.2V8h4.8" /><path d="M6 3h8l5 5v11a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z" /></>,
  closure: <><rect x="3" y="4" width="18" height="4" rx="1" />
             <path d="M5 8v11a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V8M10 13h4" /></>,
  security: <><path d="M12 3.2 19.4 6v6c0 4.4-3 7.8-7.4 8.8C7.6 19.8 4.6 16.4 4.6 12V6z" /></>,
  signout: <><path d="M15 4h3a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-3M10 17l-5-5 5-5M5 12h11" /></>,
  chevron: <><path d="m9 6 6 6-6 6" /></>,
  menu: <><path d="M4 7h16M4 12h16M4 17h16" /></>,
}

/* the ids the rail and GO_ALIAS already use */
const ALIAS: Record<string, string> = {
  personal: 'basic', ids: 'demat', account: 'closure', home: 'basic',
}

export function Icon({ name, className, size = 18 }: { name: string; className?: string; size?: number }) {
  const d = P[ALIAS[name] || name] || P.basic
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 24 24" aria-hidden="true"
         fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      {d}
    </svg>
  )
}
