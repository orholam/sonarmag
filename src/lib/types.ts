export type TweetBlock = {
  type: 'tweet'
  url: string
  authorName?: string
  authorHandle?: string
  text?: string
  postedAt?: string
}

/** Body blocks stored in articles.paragraphs jsonb. */
export type ArticleBlock = string | TweetBlock

export type Article = {
  id: string
  slug: string
  title: string
  highlight?: {
    word: string
    tone: 'red' | 'tan'
  }
  author: string
  authorAvatar?: string | null
  publishedLabel: string
  category: string
  comments: number
  listenMinutes: number
  readMinutes: number
  heroImage: string
  heroAlt: string
  thumbImage?: string | null
  ticker: string
  excerpt?: string | null
  badge?: string | null
  paragraphs: ArticleBlock[]
  /** When true, eligible for the large homepage splash hero (newest wins). */
  isHighlighted?: boolean
  featuredSlot?: 'hero' | 'secondary' | 'opinion' | null
  popularRank?: number | null
  publishedAt?: string
}

export type Comment = {
  id: string
  articleId: string
  authorName: string
  body: string
  createdAt: string
}

export type StaticPage = {
  slug: string
  title: string
  eyebrow?: string
  paragraphs: string[]
}

export type MarketTicker = {
  pair: string
  change: string
  value: string
  up: boolean
}

export type PodcastEpisode = {
  showName: string
  episodeNumber: number
  title: string
  dek: string
  host: string
  imageUrl: string
  slug?: string | null
}

export type HomepageData = {
  hero: Article | null
  secondary: Article | null
  opinion: Article | null
  privacyCard: Article | null
  latest: Article[]
  popular: Article[]
  markets: MarketTicker[]
  podcast: PodcastEpisode | null
  promoStats: { articles: number; authors: number }
  player: { time: string; views: number }
  magazineCover: { image: string; alt: string }
}

export function isTweetBlock(block: ArticleBlock): block is TweetBlock {
  return typeof block === 'object' && block !== null && block.type === 'tweet'
}

export function textBlocks(blocks: ArticleBlock[]): string[] {
  return blocks.filter((block): block is string => typeof block === 'string')
}
