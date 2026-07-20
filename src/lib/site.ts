/** Canonical public site origin (no trailing slash). */
export const SITE_URL = (
  import.meta.env.PUBLIC_SITE_URL ||
  import.meta.env.VITE_SITE_URL ||
  'https://www.sonarmag.com'
).replace(/\/$/, '')

export const SITE_NAME = 'Sonar Mag'

export const DEFAULT_DESCRIPTION =
  'Sonar Mag — independent journalism, culture, and markets.'

export const DEFAULT_OG_IMAGE =
  'https://images.unsplash.com/photo-1520986606214-8b456906c813?auto=format&fit=crop&w=1200&q=80'

export function absoluteUrl(path: string): string {
  if (path.startsWith('http://') || path.startsWith('https://')) return path
  const normalized = path.startsWith('/') ? path : `/${path}`
  return `${SITE_URL}${normalized}`
}

export function pageTitle(title?: string): string {
  if (!title || title === SITE_NAME) return SITE_NAME
  return `${title} — ${SITE_NAME}`
}
