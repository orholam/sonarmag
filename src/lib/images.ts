/** Unsplash-friendly responsive URLs + defaults for CLS-safe images. */

/** Stable key for uniqueness checks (Unsplash photo id when present). */
export function articleImageKey(src: string | null | undefined): string | null {
  if (!src?.trim()) return null
  try {
    const url = new URL(src.trim())
    const path = url.pathname.toLowerCase()
    const unsplashPhoto = path.match(/\/(photo-[a-z0-9-]+)\/?$/)
    if (unsplashPhoto?.[1] && url.hostname.includes('unsplash')) {
      return unsplashPhoto[1]
    }
    const photosSlug = path.match(/\/photos\/([a-z0-9_-]+)\/?$/)
    if (photosSlug?.[1] && url.hostname.includes('unsplash')) {
      return photosSlug[1]
    }
    return `${url.hostname}${path}`.toLowerCase()
  } catch {
    return src.trim().split(/[?#]/)[0]?.toLowerCase() || null
  }
}

export function unsplashUrl(
  src: string,
  opts: { width: number; height?: number; quality?: number },
): string {
  try {
    const url = new URL(src)
    if (!url.hostname.includes('unsplash.com') && !url.hostname.includes('images.unsplash')) {
      return src
    }
    url.searchParams.set('auto', 'format')
    url.searchParams.set('fit', 'crop')
    url.searchParams.set('w', String(opts.width))
    if (opts.height) {
      url.searchParams.set('h', String(opts.height))
    }
    url.searchParams.set('q', String(opts.quality ?? 75))
    return url.toString()
  } catch {
    return src
  }
}

/** Article mid-body hero: wide crop so the figure stays short in the scroll. */
export function articleHeroSrcSet(src: string): string {
  return [800, 1200, 1600]
    .map((width) => {
      const height = Math.round(width / 2)
      return `${unsplashUrl(src, { width, height })} ${width}w`
    })
    .join(', ')
}

export function heroSrcSet(src: string): string {
  return [800, 1200, 1600]
    .map((width) => `${unsplashUrl(src, { width })} ${width}w`)
    .join(', ')
}

export function thumbSrcSet(src: string): string {
  return [240, 400]
    .map((width) => `${unsplashUrl(src, { width, quality: 70 })} ${width}w`)
    .join(', ')
}
