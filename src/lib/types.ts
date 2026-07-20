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
  paragraphs: string[]
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
