import type { TweetBlock } from '../lib/types'

function formatTweetDate(iso?: string): string {
  if (!iso) return ''
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return ''
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

type TweetEmbedProps = {
  tweet: TweetBlock
}

/** Lightweight SSR tweet card — no Twitter widgets.js (keeps CWV clean). */
export function TweetEmbed({ tweet }: TweetEmbedProps) {
  const handle = tweet.authorHandle?.replace(/^@/, '')
  const profileHref = handle ? `https://x.com/${handle}` : tweet.url
  const lines = (tweet.text || '').split('\n').filter(Boolean)

  return (
    <figure className="tweet-embed">
      <blockquote className="tweet-card" cite={tweet.url}>
        <header className="tweet-card-head">
          <a className="tweet-card-author" href={profileHref} rel="noopener noreferrer">
            <span className="tweet-card-name">{tweet.authorName || handle || 'On X'}</span>
            {handle ? <span className="tweet-card-handle">@{handle}</span> : null}
          </a>
          <span className="tweet-card-mark" aria-hidden="true">
            𝕏
          </span>
        </header>

        {lines.length > 0 ? (
          <div className="tweet-card-body">
            {lines.map((line) => (
              <p key={line.slice(0, 48)}>{line}</p>
            ))}
          </div>
        ) : (
          <p className="tweet-card-body">
            <a href={tweet.url} rel="noopener noreferrer">
              View post on X
            </a>
          </p>
        )}

        <footer className="tweet-card-foot">
          {tweet.postedAt ? (
            <time dateTime={tweet.postedAt}>{formatTweetDate(tweet.postedAt)}</time>
          ) : (
            <span />
          )}
          <a href={tweet.url} rel="noopener noreferrer">
            View on X
          </a>
        </footer>
      </blockquote>
    </figure>
  )
}
