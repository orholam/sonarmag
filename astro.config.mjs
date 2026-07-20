import { defineConfig } from 'astro/config'
import react from '@astrojs/react'
import vercel from '@astrojs/vercel'

export default defineConfig({
  site: 'https://www.sonarmag.com',
  output: 'server',
  adapter: vercel(),
  integrations: [react()],
  prefetch: {
    prefetchAll: true,
    // Warm article routes as soon as the homepage finishes loading
    // so splash / latest clicks feel instant.
    defaultStrategy: 'load',
  },
})
