import { absoluteUrl, SITE_URL } from './site'

/** Ownership key hosted at /{INDEXNOW_KEY}.txt (see public/). */
export const INDEXNOW_KEY =
  import.meta.env.INDEXNOW_KEY || 'a7c3e91f2b4d68a05e17c9f3d8b2a461'

const INDEXNOW_ENDPOINT = 'https://api.indexnow.org/indexnow'

function hostFromSiteUrl(): string {
  return new URL(SITE_URL).host
}

function keyLocation(): string {
  return absoluteUrl(`/${INDEXNOW_KEY}.txt`)
}

function toAbsoluteUrls(urls: string[]): string[] {
  return [...new Set(urls.map((url) => absoluteUrl(url)))]
}

export type IndexNowResult = {
  ok: boolean
  status: number
  submitted: string[]
  error?: string
}

/**
 * Notify IndexNow (Bing and participating engines) that URLs changed.
 * Only submit URLs added/updated/deleted since you started using IndexNow.
 */
export async function submitIndexNow(urls: string[]): Promise<IndexNowResult> {
  const urlList = toAbsoluteUrls(urls)
  if (urlList.length === 0) {
    return { ok: true, status: 200, submitted: [] }
  }

  const body = {
    host: hostFromSiteUrl(),
    key: INDEXNOW_KEY,
    keyLocation: keyLocation(),
    urlList,
  }

  try {
    const response = await fetch(INDEXNOW_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
      body: JSON.stringify(body),
    })

    // 200 = accepted; 202 = accepted for processing (also fine)
    const ok = response.status === 200 || response.status === 202
    const errorText = ok ? undefined : await response.text().catch(() => '')

    return {
      ok,
      status: response.status,
      submitted: urlList,
      error: errorText || undefined,
    }
  } catch (error) {
    return {
      ok: false,
      status: 0,
      submitted: urlList,
      error: error instanceof Error ? error.message : String(error),
    }
  }
}

/** Article + homepage (homepage changes when a story ships). */
export function urlsForPublishedArticle(slug: string): string[] {
  return ['/', `/article/${slug}`]
}
