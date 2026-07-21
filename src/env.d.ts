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
  /** IndexNow ownership key (must match public/{key}.txt). */
  readonly INDEXNOW_KEY?: string
  /** Bearer secret for POST /api/indexnow. Set in production. */
  readonly INDEXNOW_SUBMIT_SECRET?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
