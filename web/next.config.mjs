/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Don't emit AGENTS.md / CLAUDE.md into the project.
  agentRules: false,
  // No dev-only overlay badge over the prototype.
  devIndicators: false,
  // Mirrors prototype/vercel.json — the prototype must not be indexed or cached.
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Robots-Tag', value: 'noindex' },
          { key: 'Cache-Control', value: 'no-store' },
        ],
      },
    ]
  },
}
export default nextConfig
