/** Unsplash-friendly responsive URLs + defaults for CLS-safe images. */

export function unsplashUrl(
  src: string,
  opts: { width: number; quality?: number },
): string {
  try {
    const url = new URL(src)
    if (!url.hostname.includes('unsplash.com') && !url.hostname.includes('images.unsplash')) {
      return src
    }
    url.searchParams.set('auto', 'format')
    url.searchParams.set('fit', 'crop')
    url.searchParams.set('w', String(opts.width))
    url.searchParams.set('q', String(opts.quality ?? 75))
    return url.toString()
  } catch {
    return src
  }
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
