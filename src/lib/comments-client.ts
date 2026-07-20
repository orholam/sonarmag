import type { Comment } from './types'

function supabaseConfig() {
  const url =
    import.meta.env.PUBLIC_SUPABASE_URL || import.meta.env.VITE_SUPABASE_URL
  const key =
    import.meta.env.PUBLIC_SUPABASE_ANON_KEY ||
    import.meta.env.VITE_SUPABASE_ANON_KEY

  if (!url || !key) {
    throw new Error('Missing PUBLIC_SUPABASE_URL or PUBLIC_SUPABASE_ANON_KEY')
  }

  return { url: url.replace(/\/$/, ''), key }
}

/** Lightweight REST helpers — avoids shipping full supabase-js to the browser. */
export async function postCommentViaRest(input: {
  articleId: string
  authorName: string
  body: string
}): Promise<Comment> {
  const { url, key } = supabaseConfig()
  const response = await fetch(`${url}/rest/v1/comments`, {
    method: 'POST',
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
      Prefer: 'return=representation',
    },
    body: JSON.stringify({
      article_id: input.articleId,
      author_name: input.authorName.trim(),
      body: input.body.trim(),
    }),
  })

  if (!response.ok) {
    const detail = await response.text()
    throw new Error(detail || 'Could not post comment.')
  }

  const [row] = (await response.json()) as Array<{
    id: string
    article_id: string
    author_name: string
    body: string
    created_at: string
  }>

  return {
    id: row.id,
    articleId: row.article_id,
    authorName: row.author_name,
    body: row.body,
    createdAt: row.created_at,
  }
}
