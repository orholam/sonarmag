/// <reference types="astro/client" />

interface ImportMetaEnv {
  readonly PUBLIC_SUPABASE_URL?: string
  readonly PUBLIC_SUPABASE_ANON_KEY?: string
  readonly PUBLIC_SITE_URL?: string
  readonly VITE_SUPABASE_URL?: string
  readonly VITE_SUPABASE_ANON_KEY?: string
  readonly VITE_SITE_URL?: string
  /** Server-only. OpenRouter Data API (rankings). Never prefix with PUBLIC_. */
  readonly OPENROUTER_API_KEY?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
