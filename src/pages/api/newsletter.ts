import type { APIRoute } from 'astro'
import { subscribeToNewsletter } from '../../lib/api'

export const prerender = false

export const POST: APIRoute = async ({ request, redirect }) => {
  const contentType = request.headers.get('content-type') || ''
  let email = ''
  let source = 'homepage'

  if (contentType.includes('application/json')) {
    const body = (await request.json()) as { email?: string; source?: string }
    email = body.email?.trim() ?? ''
    source = body.source?.trim() || 'homepage'
  } else {
    const form = await request.formData()
    email = String(form.get('email') || '').trim()
    source = String(form.get('source') || 'homepage').trim() || 'homepage'
  }

  const result = await subscribeToNewsletter({ email, source })

  const wantsJson =
    contentType.includes('application/json') ||
    (request.headers.get('accept') || '').includes('application/json')

  if (wantsJson) {
    return new Response(JSON.stringify(result), {
      status: result.ok ? 200 : 400,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const status = result.ok
    ? result.duplicate
      ? 'exists'
      : 'ok'
    : 'error'

  return redirect(`/?newsletter=${status}#subscribe`)
}
