/**
 * Perplexity research deep-links for the AI Wars board.
 * Branded as an external integration — not Sonar homepage chrome.
 */

const QUERIES: Array<{ label: string; q: string }> = [
  {
    label: 'Who’s winning the AI race right now?',
    q: 'Who is winning the AI race in 2026 across Arena Elo, OpenRouter volume, and coding agents?',
  },
  {
    label: 'OpenCode vs Claude Code',
    q: 'OpenCode vs Claude Code vs Codex vs Cursor — which coding agent is winning in 2026?',
  },
  {
    label: 'Grok Build open source',
    q: 'xAI Grok Build open source coding agent GitHub stars and reception',
  },
  {
    label: 'Anthropic vs OpenAI positioning',
    q: 'Anthropic vs OpenAI vs Google vs DeepSeek AI competitive positioning July 2026',
  },
  {
    label: 'Polymarket AI markets',
    q: 'Polymarket best AI model and AI agent markets 2026 probabilities',
  },
]

function perplexityUrl(q: string): string {
  return `https://www.perplexity.ai/search?q=${encodeURIComponent(q)}`
}

function PerplexityMark({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      width="18"
      height="18"
      aria-hidden="true"
      focusable="false"
    >
      <path
        fill="currentColor"
        d="M22.3977 7.0896h-2.3106V.0676l-7.5094 6.3542V.1577h-1.1554v6.1966L4.4904 0v7.0896H1.6023v10.3976h2.8882V24l6.932-6.3591v6.2005h1.1554v-6.0469l6.9318 6.1807v-6.4879h2.8882V7.0896zm-3.4657-4.531v4.531h-5.355l5.355-4.531zm-13.2862.0676 4.8691 4.4634H5.6458V2.6262zM2.7576 16.332V8.245h7.8476l-6.1149 6.1147v1.9723H2.7576zm2.8882 5.0404v-3.8852h.0001v-2.6488l5.7763-5.7764v7.0111l-5.7764 5.2993zm12.7086.0248-5.7766-5.1509V9.0618l5.7766 5.7766v6.5588zm2.8882-5.0652h-1.733v-1.9723L13.3948 8.245h7.8478v8.087z"
      />
    </svg>
  )
}

/** External Perplexity research strip for AI Wars. */
export function AiWarsPerplexity() {
  return (
    <section
      className="ai-wars-pplx"
      aria-labelledby="ai-wars-pplx-heading"
    >
      <div className="ai-wars-pplx-inner">
        <header className="ai-wars-pplx-head">
          <div className="ai-wars-pplx-brand">
            <span className="ai-wars-pplx-logo" aria-hidden="true">
              <PerplexityMark />
            </span>
            <div>
              <p className="ai-wars-pplx-kicker">Integration</p>
              <h2 id="ai-wars-pplx-heading">Research on Perplexity</h2>
            </div>
          </div>
          <p className="ai-wars-pplx-dek">
            Jump into Perplexity with board-shaped queries — cited answers off
            Sonar’s desk layout.
          </p>
        </header>

        <ul className="ai-wars-pplx-queries">
          {QUERIES.map((item) => (
            <li key={item.q}>
              <a
                href={perplexityUrl(item.q)}
                target="_blank"
                rel="noopener noreferrer"
              >
                <span>{item.label}</span>
                <span className="ai-wars-pplx-go" aria-hidden="true">
                  →
                </span>
              </a>
            </li>
          ))}
        </ul>

        <a
          className="ai-wars-pplx-home"
          href="https://www.perplexity.ai/"
          target="_blank"
          rel="noopener noreferrer"
        >
          <PerplexityMark className="ai-wars-pplx-home-mark" />
          Open Perplexity
        </a>
      </div>
    </section>
  )
}
