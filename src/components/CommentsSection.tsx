import { useState, type FormEvent } from 'react'
import { postCommentViaRest } from '../lib/comments-client'
import type { Comment } from '../lib/types'

function formatCommentDate(iso: string): string {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return ''
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
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
  const [success, setSuccess] = useState(false)

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    setSuccess(false)

    const trimmedName = name.trim()
    const trimmedBody = body.trim()
    if (!trimmedName || !trimmedBody) {
      setError('Add your name and a comment to post.')
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
      setSuccess(true)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Could not post comment.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <section className="comments" id="comments" aria-labelledby="comments-heading">
      <div className="comments-header">
        <h2 id="comments-heading">Discussion</h2>
        <p className="comments-count">
          {comments.length} {comments.length === 1 ? 'comment' : 'comments'}
        </p>
      </div>

      <form className="comments-form" onSubmit={onSubmit}>
        <label className="comments-label" htmlFor="comment-name">
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
          placeholder="Your name"
          required
        />

        <label className="comments-label" htmlFor="comment-body">
          Comment
        </label>
        <textarea
          id="comment-body"
          className="comments-textarea"
          name="body"
          rows={4}
          maxLength={2000}
          value={body}
          onChange={(event) => setBody(event.target.value)}
          placeholder="Join the discussion…"
          required
        />

        {error ? <p className="comments-error">{error}</p> : null}
        {success ? <p className="comments-success">Comment posted.</p> : null}

        <button className="comments-submit" type="submit" disabled={submitting}>
          {submitting ? 'Posting…' : 'Post comment'}
        </button>
      </form>

      {comments.length === 0 ? (
        <p className="comments-empty">No comments yet. Start the discussion.</p>
      ) : (
        <ul className="comments-list">
          {comments.map((comment) => (
            <li className="comments-item" key={comment.id}>
              <div className="comments-item-meta">
                <strong>{comment.authorName}</strong>
                <time dateTime={comment.createdAt}>{formatCommentDate(comment.createdAt)}</time>
              </div>
              <p>{comment.body}</p>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
