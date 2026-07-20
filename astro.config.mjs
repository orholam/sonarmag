import { defineConfig } from 'astro/config'
import react from '@astrojs/react'
import vercel from '@astrojs/vercel'

export default defineConfig({
  site: 'https://www.sonarmag.com',
  output: 'server',
  adapter: vercel(),
  integrations: [react()],
  prefetch: {
    // Hover/tap-intent only — avoid competing with LCP bandwidth on load.
    // Splash articles still get explicit <link rel="prefetch"> from the layout.
    prefetchAll: true,
    defaultStrategy: 'hover',
  },
})
