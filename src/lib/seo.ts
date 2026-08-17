import { absoluteUrl, DEFAULT_DESCRIPTION, SITE_NAME, SITE_URL } from './site'
import { textBlocks, type Article } from './types'

/** SERP / Open Graph description. Homepage cards keep the full excerpt. */
const META_DESCRIPTION_MAX = 160

export function searchDescription(
  text: string | null | undefined,
  fallback = DEFAULT_DESCRIPTION,
): string {
  const raw = (text ?? '').replace(/\s+/g, ' ').trim()
  if (!raw) return fallback
  if (raw.length <= META_DESCRIPTION_MAX) return raw

  const prefix = raw.slice(0, META_DESCRIPTION_MAX)
  const sentence = prefix.match(/^(.+?[.!?])(?:\s|$)/)
  if (sentence && sentence[1].length >= 90) return sentence[1]

  const lastSpace = prefix.lastIndexOf(' ')
  const clipped = (lastSpace > 80 ? prefix.slice(0, lastSpace) : prefix).replace(
    /[,:;]+$/,
    '',
  )
  return `${clipped}…`
}

export function organizationJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': ['NewsMediaOrganization', 'Organization'],
    name: SITE_NAME,
    url: SITE_URL,
    logo: absoluteUrl('/favicon.svg'),
    description: DEFAULT_DESCRIPTION,
    sameAs: [] as string[],
  }
}

export function websiteJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: SITE_NAME,
    url: SITE_URL,
    description: DEFAULT_DESCRIPTION,
    publisher: {
      '@type': ['NewsMediaOrganization', 'Organization'],
      name: SITE_NAME,
      url: SITE_URL,
    },
  }
}

export function faqJsonLd(
  faqs: Array<{ question: string; answer: string }>,
) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  }
}

export function articleJsonLd(article: Article) {
  const url = absoluteUrl(`/article/${article.slug}`)
  const description = searchDescription(
    article.excerpt?.trim() || textBlocks(article.paragraphs)[0],
  )

  return {
    '@context': 'https://schema.org',
    '@type': 'NewsArticle',
    headline: article.title,
    description,
    image: article.heroImage ? [article.heroImage] : undefined,
    datePublished: article.publishedAt || undefined,
    dateModified: article.updatedAt || article.publishedAt || undefined,
    author: {
      '@type': 'Person',
      name: article.author,
    },
    publisher: {
      '@type': ['NewsMediaOrganization', 'Organization'],
      name: SITE_NAME,
      url: SITE_URL,
      logo: {
        '@type': 'ImageObject',
        url: absoluteUrl('/favicon.svg'),
      },
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': url,
    },
    articleSection: article.category || undefined,
    wordCount: textBlocks(article.paragraphs).join(' ').split(/\s+/).filter(Boolean).length,
    timeRequired: `PT${Math.max(1, article.readMinutes)}M`,
    url,
  }
}

const AI_WARS_TOPIC =
  /\b(ai|artificial intelligence|openai|anthropic|claude|chatgpt|gemini|deepseek|mistral|hugging face|openrouter|frontier models?|ai agents?|coding agents?|llms?)\b/i

export function isAiWarsCoverage(article: Article): boolean {
  return AI_WARS_TOPIC.test(
    [article.title, article.ticker, article.excerpt].filter(Boolean).join(' '),
  )
}

export function breadcrumbJsonLd(
  crumbs: Array<{ name: string; path: string }>,
) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: crumbs.map((crumb, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: crumb.name,
      item: absoluteUrl(crumb.path),
    })),
  }
}

/** Permanent / data board page (AI Wars, etc.). */
export function webPageJsonLd(opts: {
  name: string
  description: string
  path: string
  dateModified?: string | null
}) {
  const url = absoluteUrl(opts.path)
  return {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: opts.name,
    description: opts.description,
    url,
    isPartOf: {
      '@type': 'WebSite',
      name: SITE_NAME,
      url: SITE_URL,
    },
    about: {
      '@type': 'Thing',
      name: 'Artificial intelligence industry competition',
    },
    ...(opts.dateModified
      ? { dateModified: opts.dateModified }
      : {}),
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': url,
    },
  }
}

/** Ranked named entities (labs, models, tools) for a board section. */
export function itemListJsonLd(opts: {
  name: string
  description?: string
  path: string
  items: Array<{ name: string; url?: string; position: number }>
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: opts.name,
    ...(opts.description ? { description: opts.description } : {}),
    url: absoluteUrl(opts.path),
    numberOfItems: opts.items.length,
    itemListOrder: 'https://schema.org/ItemListOrderAscending',
    itemListElement: opts.items.map((item) => ({
      '@type': 'ListItem',
      position: item.position,
      name: item.name,
      ...(item.url ? { url: item.url } : {}),
    })),
  }
}

/** Map display category names to existing section routes. */
export function categoryPath(category: string): string | null {
  const map: Record<string, string> = {
    World: '/world',
    Business: '/business',
    Lifestyle: '/lifestyle',
  }
  return map[category] ?? null
}
