import { supabase } from './supabase'
import type {
  Article,
  Comment,
  HomepageData,
  MarketTicker,
  PodcastEpisode,
  StaticPage,
} from './types'

type AuthorEmbed = { name: string; avatar_url: string | null }
type CategoryEmbed = { name: string }

type ArticleRow = {
  id: string
  slug: string
  title: string
  highlight_word: string | null
  highlight_tone: 'red' | 'tan' | null
  published_label: string | null
  published_at: string
  comments_count: number
  listen_minutes: number
  read_minutes: number
  hero_image: string | null
  hero_alt: string | null
  thumb_image: string | null
  ticker: string | null
  excerpt: string | null
  badge: string | null
  paragraphs: unknown
  featured_slot: 'hero' | 'secondary' | 'opinion' | null
  popular_rank: number | null
  authors: AuthorEmbed | AuthorEmbed[] | null
  categories: CategoryEmbed | CategoryEmbed[] | null
}

type PageRow = {
  slug: string
  title: string
  eyebrow: string | null
  paragraphs: unknown
}

type MarketRow = {
  pair: string
  change_pct: number
  value: string
  is_up: boolean
  sort_order: number
}

type PodcastRow = {
  show_name: string
  episode_number: number
  title: string
  dek: string | null
  host: string | null
  image_url: string | null
  slug: string | null
}

type SettingRow = {
  key: string
  value: unknown
}

const articleSelect = `
  id,
  slug,
  title,
  highlight_word,
  highlight_tone,
  published_label,
  published_at,
  comments_count,
  listen_minutes,
  read_minutes,
  hero_image,
  hero_alt,
  thumb_image,
  ticker,
  excerpt,
  badge,
  paragraphs,
  featured_slot,
  popular_rank,
  authors ( name, avatar_url ),
  categories ( name )
`

function asParagraphs(value: unknown): string[] {
  if (!Array.isArray(value)) return []
  return value.filter((item): item is string => typeof item === 'string')
}

function one<T>(value: T | T[] | null | undefined): T | null {
  if (value == null) return null
  return Array.isArray(value) ? (value[0] ?? null) : value
}

function mapArticle(row: ArticleRow): Article {
  const author = one(row.authors)
  const category = one(row.categories)
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    highlight:
      row.highlight_word && row.highlight_tone
        ? { word: row.highlight_word, tone: row.highlight_tone }
        : undefined,
    author: author?.name ?? 'Sonar Mag',
    authorAvatar: author?.avatar_url,
    publishedLabel: row.published_label ?? '',
    category: category?.name ?? '',
    comments: row.comments_count,
    listenMinutes: row.listen_minutes,
    readMinutes: row.read_minutes,
    heroImage: row.hero_image ?? '',
    heroAlt: row.hero_alt ?? '',
    thumbImage: row.thumb_image,
    ticker: row.ticker ?? '',
    excerpt: row.excerpt,
    badge: row.badge,
    paragraphs: asParagraphs(row.paragraphs),
    featuredSlot: row.featured_slot,
    popularRank: row.popular_rank,
    publishedAt: row.published_at,
  }
}

function mapComment(row: {
  id: string
  article_id: string
  author_name: string
  body: string
  created_at: string
}): Comment {
  return {
    id: row.id,
    articleId: row.article_id,
    authorName: row.author_name,
    body: row.body,
    createdAt: row.created_at,
  }
}

export async function fetchCommentsForArticle(articleId: string): Promise<Comment[]> {
  const { data, error } = await supabase
    .from('comments')
    .select('id, article_id, author_name, body, created_at')
    .eq('article_id', articleId)
    .order('created_at', { ascending: true })

  if (error) throw error
  return (data ?? []).map(mapComment)
}

export async function postComment(input: {
  articleId: string
  authorName: string
  body: string
}): Promise<Comment> {
  const { data, error } = await supabase
    .from('comments')
    .insert({
      article_id: input.articleId,
      author_name: input.authorName.trim(),
      body: input.body.trim(),
    })
    .select('id, article_id, author_name, body, created_at')
    .single()

  if (error) throw error
  return mapComment(data)
}

export async function fetchArticleBySlug(slug: string): Promise<Article | null> {
  const { data, error } = await supabase
    .from('articles')
    .select(articleSelect)
    .eq('slug', slug)
    .eq('status', 'published')
    .maybeSingle()

  if (error) throw error
  if (!data) return null
  return mapArticle(data as unknown as ArticleRow)
}

export async function fetchStaticPage(slug: string): Promise<StaticPage | null> {
  const { data, error } = await supabase
    .from('pages')
    .select('slug, title, eyebrow, paragraphs')
    .eq('slug', slug)
    .maybeSingle()

  if (error) throw error
  if (!data) return null

  const page = data as unknown as PageRow
  return {
    slug: page.slug,
    title: page.title,
    eyebrow: page.eyebrow ?? undefined,
    paragraphs: asParagraphs(page.paragraphs),
  }
}

export async function fetchSitemapEntries(): Promise<
  Array<{ loc: string; lastmod?: string }>
> {
  const [{ data: articles }, { data: pages }] = await Promise.all([
    supabase
      .from('articles')
      .select('slug, updated_at, published_at')
      .eq('status', 'published')
      .order('published_at', { ascending: false }),
    supabase.from('pages').select('slug, updated_at').order('slug'),
  ])

  const entries: Array<{ loc: string; lastmod?: string }> = [{ loc: '/' }]

  for (const article of articles ?? []) {
    entries.push({
      loc: `/article/${article.slug}`,
      lastmod: (article.updated_at || article.published_at || '')
        .toString()
        .slice(0, 10),
    })
  }

  for (const page of pages ?? []) {
    entries.push({
      loc: `/${page.slug}`,
      lastmod: (page.updated_at || '').toString().slice(0, 10),
    })
  }

  return entries
}

export async function fetchHomepageData(): Promise<HomepageData> {
  const [
    featuredResult,
    latestResult,
    popularResult,
    marketsResult,
    podcastResult,
    settingsResult,
    privacyResult,
  ] = await Promise.all([
    supabase
      .from('articles')
      .select(articleSelect)
      .eq('status', 'published')
      .not('featured_slot', 'is', null),
    supabase
      .from('articles')
      .select(articleSelect)
      .eq('status', 'published')
      .is('featured_slot', null)
      .neq('slug', 'privacy-new-age-ai')
      .order('published_at', { ascending: false })
      .limit(6),
    supabase
      .from('articles')
      .select(articleSelect)
      .eq('status', 'published')
      .not('popular_rank', 'is', null)
      .order('popular_rank', { ascending: true })
      .limit(5),
    supabase
      .from('market_tickers')
      .select('pair, change_pct, value, is_up, sort_order')
      .order('sort_order', { ascending: true }),
    supabase
      .from('podcast_episodes')
      .select('show_name, episode_number, title, dek, host, image_url, slug')
      .order('published_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase.from('site_settings').select('key, value'),
    supabase
      .from('articles')
      .select(articleSelect)
      .eq('slug', 'privacy-new-age-ai')
      .eq('status', 'published')
      .maybeSingle(),
  ])

  for (const result of [
    featuredResult,
    latestResult,
    popularResult,
    marketsResult,
    podcastResult,
    settingsResult,
    privacyResult,
  ]) {
    if (result.error) throw result.error
  }

  const featured =
    (featuredResult.data as unknown as ArticleRow[] | null)?.map(mapArticle) ?? []
  const bySlot = Object.fromEntries(
    featured.map((article) => [article.featuredSlot, article]),
  ) as Record<string, Article>

  const settings = Object.fromEntries(
    ((settingsResult.data as unknown as SettingRow[] | null) ?? []).map((row) => [
      row.key,
      row.value,
    ]),
  )

  const promoStats = (settings.promo_stats ?? { articles: 0, authors: 0 }) as {
    articles: number
    authors: number
  }
  const player = (settings.player ?? { time: '0:00', views: 0 }) as {
    time: string
    views: number
  }
  const magazineCover = (settings.magazine_cover ?? {
    image: '',
    alt: 'Sonar Mag print cover',
  }) as { image: string; alt: string }

  const markets: MarketTicker[] = (
    (marketsResult.data as unknown as MarketRow[] | null) ?? []
  ).map((row) => ({
    pair: row.pair,
    change: `${row.change_pct}%`,
    value: row.value,
    up: row.is_up,
  }))

  const podcastRow = podcastResult.data as unknown as PodcastRow | null
  const podcast: PodcastEpisode | null = podcastRow
    ? {
        showName: podcastRow.show_name,
        episodeNumber: podcastRow.episode_number,
        title: podcastRow.title,
        dek: podcastRow.dek ?? '',
        host: podcastRow.host ?? '',
        imageUrl: podcastRow.image_url ?? '',
        slug: podcastRow.slug,
      }
    : null

  return {
    hero: bySlot.hero ?? null,
    secondary: bySlot.secondary ?? null,
    opinion: bySlot.opinion ?? null,
    privacyCard: privacyResult.data
      ? mapArticle(privacyResult.data as unknown as ArticleRow)
      : null,
    latest:
      (latestResult.data as unknown as ArticleRow[] | null)?.map(mapArticle) ?? [],
    popular:
      (popularResult.data as unknown as ArticleRow[] | null)?.map(mapArticle) ?? [],
    markets,
    podcast,
    promoStats,
    player,
    magazineCover,
  }
}
