import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import './design/tokens.css'
import './design/system.css'
import './design/responsive.css'

/* One face, both grounds, every role.

   Inter Variable, self-hosted by next/font, so a single cut covers 100–900 and
   no request leaves the page at runtime. Every family token — --sans, --mono,
   --serif and --head — resolves to it, so the app has one typeface rather than
   the four it carried (system sans, system mono, Fraunces, Sora).

   Column alignment comes from tabular numerals rather than from a monospace
   face; see the `font-variant-numeric` rules in design/system.css.

   globals.css is the reference stylesheet and supplies the component vocabulary
   (.card, .kv, .prow, .nb, .pill …). design/ is the THINQ system that restates
   those components: tokens, then the system, then the responsive designs. */

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
})

export const metadata: Metadata = {
  title: 'Thinq — Profile',
  description: 'Thinq Profile & Account Management — interactive prototype of THINQ-PROFILE-001 v1.0.0.',
  robots: { index: false },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable}>
      <body>{children}</body>
    </html>
  )
}
