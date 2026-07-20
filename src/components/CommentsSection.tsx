import { useState, type FormEvent } from 'react'
import { postCommentViaRest } from '../lib/comments-client'
import type { Comment } from '../lib/types'

function formatCommentDate(iso: string): string {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return ''

  const deltaMs = Date.now() - date.getTime()
  const minute = 60_000
  const hour = 60 * minute
  const day = 24 * hour

  if (deltaMs < minute) return 'Just now'
  if (deltaMs < hour) {
    const n = Math.floor(deltaMs / minute)
    return `${n}m ago`
  }
  if (deltaMs < day) {
    const n = Math.floor(deltaMs / hour)
    return `${n}h ago`
  }
  if (deltaMs < 7 * day) {
    const n = Math.floor(deltaMs / day)
    return `${n}d ago`
  }

  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: date.getFullYear() === new Date().getFullYear() ? undefined : 'numeric',
  })
}

type CommentsSectionProps = {
  articleId: string
  initialComments: Comment[]
}

export function CommentsSection({ articleId, initialComments }: CommentsSectionProps) {
  const [comments, setComments] = useState(initialComments)
  const [name, setName] = useState('')
  const [body, setBody] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)

    const trimmedName = name.trim()
    const trimmedBody = body.trim()
    if (!trimmedName || !trimmedBody) {
      setError('Add your name and a note.')
      return
    }

    setSubmitting(true)
    try {
      const comment = await postCommentViaRest({
        articleId,
        authorName: trimmedName,
        body: trimmedBody,
      })
      setComments((prev) => [...prev, comment])
      setBody('')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Could not post.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <section className="comments" id="comments" aria-labelledby="comments-heading">
      <header className="comments-header">
        <h2 id="comments-heading">Letters</h2>
        <p className="comments-count">{comments.length}</p>
      </header>

      {comments.length === 0 ? (
        <p className="comments-empty">No letters yet.</p>
      ) : (
        <ul className="comments-list">
          {comments.map((comment) => (
            <li className="comments-item" key={comment.id}>
              <p className="comments-item-meta">
                <span className="comments-item-name">{comment.authorName}</span>
                <time dateTime={comment.createdAt}>{formatCommentDate(comment.createdAt)}</time>
              </p>
              <p className="comments-item-body">{comment.body}</p>
            </li>
          ))}
        </ul>
      )}

      <form className="comments-form" onSubmit={onSubmit}>
        <p className="comments-compose-label">Write a letter</p>
        <div className="comments-compose">
          <label className="visually-hidden" htmlFor="comment-name">
            Name
          </label>
          <input
            id="comment-name"
            className="comments-input"
            name="name"
            type="text"
            maxLength={80}
            autoComplete="nickname"
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Name"
            required
          />

          <label className="visually-hidden" htmlFor="comment-body">
            Letter
          </label>
          <textarea
            id="comment-body"
            className="comments-textarea"
            name="body"
            rows={3}
            maxLength={2000}
            value={body}
            onChange={(event) => setBody(event.target.value)}
            placeholder="Your response…"
            required
          />

          <div className="comments-compose-foot">
            {error ? <p className="comments-error">{error}</p> : <span />}
            <button className="comments-submit" type="submit" disabled={submitting}>
              {submitting ? 'Sending…' : 'Send'}
            </button>
          </div>
        </div>
      </form>
    </section>
  )
}
