export type StaticPage = {
  slug: string
  title: string
  eyebrow?: string
  paragraphs: string[]
}

export const staticPages: StaticPage[] = [
  {
    slug: 'about',
    title: 'About Sonar Mag',
    eyebrow: 'The publication',
    paragraphs: [
      'Sonar Mag is an independent online publication for essays, reporting, and cultural field notes that travel by resonance—not noise.',
      'We publish across World, Business, and Lifestyle with a simple brief: write clearly, edit carefully, and make discovery feel intentional.',
      'Sonar Mag began as an experiment in self-directed SEO and has grown into a home for readers who want fewer alerts and better attention.',
    ],
  },
  {
    slug: 'contact',
    title: 'Contact',
    eyebrow: 'Reach the desk',
    paragraphs: [
      'Editorial tips, corrections, and partnership notes can be sent to desk@sonarmag.example.',
      'For subscription support, use subscribe@sonarmag.example and include the email on your account.',
      'We read every message. Response times are usually within two business days.',
    ],
  },
  {
    slug: 'privacy',
    title: 'Privacy Policy',
    eyebrow: 'Your data',
    paragraphs: [
      'Sonar Mag collects only what we need to deliver the site, newsletters, and subscription services.',
      'We do not sell personal information. Analytics help us understand which stories find readers, not who those readers are in private life.',
      'You can request access or deletion of account data by emailing privacy@sonarmag.example.',
    ],
  },
  {
    slug: 'terms',
    title: 'Terms of Use',
    eyebrow: 'House rules',
    paragraphs: [
      'By using Sonar Mag, you agree to read and share our work within ordinary personal and non-commercial limits unless we grant written permission.',
      'Subscription access is for the named account holder and may not be redistributed.',
      'Content remains the property of Sonar Mag and its contributors. If something looks wrong, tell us—we correct the record.',
    ],
  },
  {
    slug: 'subscribe',
    title: 'Subscribe',
    eyebrow: '€2.50',
    paragraphs: [
      'A Sonar Mag subscription unlocks the full archive, member newsletters, and the print edition when it ships.',
      'Cancel anytime. Your support keeps the desk independent and the ads quieter.',
      'Ready when you are—start with digital access today and add print whenever you want the tactile edition.',
    ],
  },
  {
    slug: 'world',
    title: 'World',
    eyebrow: 'Section',
    paragraphs: [
      'Global reporting, politics, and the systems that shape public life.',
      'From late-night votes to coastal archives, World covers the stories that redraw the map of attention.',
      'Browse the latest World pieces from the homepage Latest rail, or start with our most-read Popular picks.',
    ],
  },
  {
    slug: 'business',
    title: 'Business',
    eyebrow: 'Section',
    paragraphs: [
      'Markets, media, and the quiet mechanics of commerce.',
      'We look for durable signals: how brands earn trust, how discovery changes, and where capital actually moves.',
      'Business stories appear throughout the homepage board and in the Latest feed.',
    ],
  },
  {
    slug: 'lifestyle',
    title: 'Lifestyle',
    eyebrow: 'Section',
    paragraphs: [
      'Culture, habits, and the design of everyday life.',
      'Lifestyle at Sonar Mag is less about trends and more about the rituals that restore attention.',
      'Find new Lifestyle essays in Latest, and longer listens in Podcasts.',
    ],
  },
  {
    slug: 'podcasts',
    title: 'Podcasts',
    eyebrow: 'Sonar Signal',
    paragraphs: [
      'Sonar Signal is our flagship show: conversations on privacy, culture, and the public record.',
      'New episodes land with the same editorial standard as our written stories—tight, human, and worth your time.',
      'Start with Episode 42, then browse Popular for the pieces listeners share most.',
    ],
  },
  {
    slug: 'latest',
    title: 'Latest',
    eyebrow: 'All stories',
    paragraphs: [
      'The Latest page collects new Sonar Mag reporting as it publishes.',
      'For now, the full running list lives on the homepage Latest rail—this page will grow into a complete archive view.',
      'Prefer a ranked cut? Visit Popular for what readers are opening today.',
    ],
  },
  {
    slug: 'popular',
    title: 'Popular',
    eyebrow: 'Most read',
    paragraphs: [
      'Popular highlights the stories drawing the most sustained attention right now.',
      'Rankings shift through the day. Open any title to read the full piece.',
      'Want the newest work instead? Head to Latest.',
    ],
  },
]

export function getStaticPage(slug: string): StaticPage | undefined {
  return staticPages.find((page) => page.slug === slug)
}
