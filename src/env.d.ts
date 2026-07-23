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
  /** Bearer secret for GET /api/cron/* (Vercel Cron sends this automatically when set). */
  readonly CRON_SECRET?: string
  /** Vercel API token with Web Analytics read access. */
  readonly VERCEL_API_TOKEN?: string
  /** Fallback name some setups use for the same token. */
  readonly VERCEL_TOKEN?: string
  /** Vercel project id (also injected automatically on Vercel). */
  readonly VERCEL_PROJECT_ID?: string
  /** Vercel team / org id when the project is under a team. */
  readonly VERCEL_TEAM_ID?: string
  readonly VERCEL_ORG_ID?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
