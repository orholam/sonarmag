export type Article = {
  slug: string
  title: string
  highlight?: {
    word: string
    tone: 'red' | 'tan'
  }
  author: string
  publishedLabel: string
  category: string
  comments: number
  listenMinutes: number
  readMinutes: number
  heroImage: string
  heroAlt: string
  ticker: string
  paragraphs: string[]
}

export const articles: Article[] = [
  {
    slug: 'devices-from-distracted',
    title: 'Turn Your Devices From Distracted Into Time Savers Either',
    highlight: { word: 'Distracted', tone: 'red' },
    author: 'Yagami Souichirou',
    publishedLabel: 'January 30, 2024 · 9:14 AM',
    category: 'Acute Social Issues',
    comments: 38,
    listenMinutes: 9,
    readMinutes: 7,
    heroImage:
      'https://images.unsplash.com/photo-1520986606214-8b456906c813?auto=format&fit=crop&w=1600&q=80',
    heroAlt: 'Ferris wheel against a pale sky',
    ticker: 'AI Revolutionizes Art — New Signals From Coastal Cities — Markets Open Steady',
    paragraphs: [
      'At the beginning of the pandemic, as lockdowns forced millions of professionals worldwide to work from home, I and many others idealized the computer as the “work from home.”',
      'I imagined the computer as a magic box that would make my job easier. Then I discovered how much of that magic was distraction dressed as productivity.',
      'Notifications arrived like weather: constant, ambient, and mostly beyond my control. Each ping promised urgency. Most delivered nothing more than a brief spike of attention and a longer recovery.',
      'The turning point was not a new app. It was a quieter rule: every device had to earn its place on the desk by saving time I could measure by the end of the week.',
      'Phones moved to another room during deep work. Laptops opened to a single document. Tablets became readers again, not portals. The constraint felt severe for two days and then strangely generous.',
      'What returned was not nostalgia for analog life. It was a sharper sense of when a screen was a tool and when it was a habit wearing a tool’s clothing.',
      'Teams that adopted similar rituals did not become slower. They became clearer. Meetings shrank. Drafts improved. The workday stopped feeling like a browser with too many tabs left open.',
      'Devices still matter. They simply no longer set the tempo. That role belongs to attention—and attention, once reclaimed, has a way of making time feel longer than the clock suggests.',
    ],
  },
  {
    slug: 'inspiration-from-vibrancy',
    title: 'Draw Inspiration From Vibrancy',
    author: 'Lind Tailor',
    publishedLabel: 'January 28, 2024 · 2:05 PM',
    category: 'Lifestyle',
    comments: 17,
    listenMinutes: 4,
    readMinutes: 3,
    heroImage:
      'https://images.unsplash.com/photo-1491002052546-bf38f186af56?auto=format&fit=crop&w=1600&q=80',
    heroAlt: 'Bare tree in a snowy field',
    ticker: 'Winter Color Stories — Designers Look Outward — Quiet Cities, Loud Ideas',
    paragraphs: [
      'Inspiration rarely arrives as a mood board. It arrives as a contrast: a bright coat against snow, a market stall lit warmer than the street around it.',
      'Vibrancy is not volume. It is the decision to let one strong note carry a composition while everything else holds still.',
      'In rooms, that might mean a single saturated wall. In writing, it might mean one image held long enough to change the temperature of a paragraph.',
      'The mistake is collecting color the way we collect tabs—endlessly, without choosing. Vibrancy asks for restraint as much as intensity.',
      'Look outside. Then choose one thing worth bringing in.',
    ],
  },
  {
    slug: 'congress-averts-shutdown',
    title: 'Congress Averts Shutdown as Conservatives Steam',
    highlight: { word: 'Shutdown', tone: 'tan' },
    author: 'Alexa Ruyk',
    publishedLabel: 'January 29, 2024 · 11:42 PM',
    category: 'World',
    comments: 32,
    listenMinutes: 6,
    readMinutes: 5,
    heroImage:
      'https://images.unsplash.com/photo-1529107386315-e1a2ed48a620?auto=format&fit=crop&w=1600&q=80',
    heroAlt: 'Capitol building at dusk',
    ticker: 'Late-Night Vote — Markets Watch Washington — Travel Advisories Soften',
    paragraphs: [
      'Lawmakers raced through the night to assemble a stopgap package that would keep agencies open through spring.',
      'Conservatives argued the deal traded too much for too little, while moderates called it the only path that avoided a crisis.',
      'The agreement buys time more than consensus. Committee chairs now face a narrower calendar and a louder set of demands.',
      'Outside the chamber, staffers spoke of exhaustion rather than triumph. Averted disaster rarely feels like victory; it feels like another Monday.',
      'For travelers, contractors, and federal workers, the practical outcome was simpler: payroll continues, offices stay lit, and the next cliff is already circled on the calendar.',
    ],
  },
]

export function getArticle(slug: string): Article | undefined {
  return articles.find((article) => article.slug === slug)
}
