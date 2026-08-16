import { useEffect, useId, useRef, useState, type ReactNode } from 'react'
import {
  fieldByRegion,
  fieldUpdatedAt,
  formatFieldUpdatedAt,
  formatPositioningDelta,
  logoDevUrl,
  positioningChartForRegion,
  positioningScoreDelta,
  type AiWarsFieldBoard,
  type FieldCitation,
  type FieldPositioningSnapshot,
  type FieldCompany,
  type RankedFieldCompany,
} from '../lib/ai-wars-field'
import { SeriesLineChart } from './SeriesLineChart'

const CITATION_KIND_LABEL: Record<FieldCitation['kind'], string> = {
  news: 'News',
  opinion: 'Opinion',
  data: 'Data',
  vendor: 'Vendor',
}

function ScoreDeltaPill({ delta }: { delta: number | null }) {
  if (delta == null) return null
  const tone = delta > 0 ? 'is-up' : delta < 0 ? 'is-down' : 'is-flat'
  return (
    <span
      className={`ai-wars-score-delta ${tone}`}
      title="Week-over-week positioning score change"
      aria-label={
        delta === 0
          ? 'Score unchanged week over week'
          : `Score ${delta > 0 ? 'up' : 'down'} ${Math.abs(delta)} week over week`
      }
    >
      {formatPositioningDelta(delta)}
    </span>
  )
}

function renderInlineCites(
  text: string,
  citations: FieldCitation[],
): ReactNode[] {
  const nodes: ReactNode[] = []
  const re = /\[(\d+)\]/g
  let last = 0
  let match: RegExpExecArray | null
  let key = 0
  while ((match = re.exec(text))) {
    if (match.index > last) nodes.push(text.slice(last, match.index))
    const n = Number(match[1])
    const cite = citations[n - 1]
    if (!cite) {
      nodes.push(match[0])
    } else {
      const title = cite.note ? `${cite.label} — ${cite.note}` : cite.label
      nodes.push(
        <sup key={`cite-${n}-${key++}`} className="ai-wars-cite-ref">
          <a
            href={cite.url}
            target="_blank"
            rel="noopener noreferrer"
            title={title}
          >
            {n}
          </a>
        </sup>,
      )
    }
    last = match.index + match[0].length
  }
  if (last < text.length) nodes.push(text.slice(last))
  return nodes
}

/** Split on blank lines; turn [1] [2] into superscript source links. */
export function CitedText({
  text,
  citations,
  className,
}: {
  text: string
  citations: FieldCitation[]
  className?: string
}) {
  const paragraphs = text
    .split(/\n\n+/)
    .map((p) => p.trim())
    .filter(Boolean)
  if (!paragraphs.length) return null
  return (
    <>
      {paragraphs.map((para, i) => (
        <p key={i} className={className}>
          {renderInlineCites(para, citations)}
        </p>
      ))}
    </>
  )
}

/** Full week-move + numbered sources — dialog and desk-analyses only. */
export function AnalysisWeekMove({
  weekMove,
  citations,
}: {
  weekMove: string
  citations: FieldCitation[]
}) {
  if (!weekMove && !citations.length) return null
  return (
    <div className="ai-wars-week-move">
      {weekMove ? (
        <>
          <p className="ai-wars-week-move-label">Why the score moved</p>
          <CitedText
            text={weekMove}
            citations={citations}
            className="ai-wars-week-move-body"
          />
        </>
      ) : null}
      {citations.length ? (
        <ol className="ai-wars-citations">
          {citations.map((c) => (
            <li key={`${c.url}-${c.label}`}>
              <a href={c.url} target="_blank" rel="noopener noreferrer">
                <span className="ai-wars-cite-kind">
                  {CITATION_KIND_LABEL[c.kind]}
                </span>
                {c.label}
              </a>
              {c.note ? <p className="ai-wars-cite-note">{c.note}</p> : null}
            </li>
          ))}
        </ol>
      ) : null}
    </div>
  )
}

function ScoreMeter({ label, value }: { label: string; value: number }) {
  const clamped = Math.max(0, Math.min(100, Math.round(value)))
  return (
    <div className="ai-wars-score">
      <div className="ai-wars-score-top">
        <span>{label}</span>
        <span className="ai-wars-score-num">{clamped}</span>
      </div>
      <div className="ai-wars-score-track" aria-hidden="true">
        <span
          className="ai-wars-score-fill"
          style={{ width: `${clamped}%` }}
        />
      </div>
    </div>
  )
}

function CompanyCard({
  company,
  scoreDelta,
  onOpen,
}: {
  company: RankedFieldCompany
  scoreDelta: number | null
  onOpen: (company: RankedFieldCompany) => void
}) {
  const logo = logoDevUrl(company.domain, { size: 56 })
  return (
    <a
      href={`#analysis-${company.id}`}
      className="ai-wars-company"
      onClick={(e) => {
        // Keep the hash for crawlers / shareable URLs; open dialog for UX.
        e.preventDefault()
        onOpen(company)
        history.replaceState(null, '', `#analysis-${company.id}`)
      }}
    >
      <div className="ai-wars-company-rank" aria-hidden="true">
        {String(company.rank).padStart(2, '0')}
      </div>
      <div className="ai-wars-company-logo">
        {logo ? (
          <img
            src={logo}
            alt=""
            width={40}
            height={40}
            loading="lazy"
            decoding="async"
          />
        ) : (
          <span className="ai-wars-company-mono" aria-hidden="true">
            {company.name.slice(0, 1)}
          </span>
        )}
      </div>
      <div className="ai-wars-company-copy">
        <div className="ai-wars-company-title">
          <h3>
            <span
              className={`ai-wars-ow-dot ${company.openWeight ? 'is-open' : 'is-closed'}`}
              title={
                company.openWeight
                  ? 'Primary models are open-weight / self-hostable'
                  : 'Primary models are closed-weight'
              }
              aria-label={
                company.openWeight
                  ? 'Primary models open-weight'
                  : 'Primary models closed-weight'
              }
            />
            {company.name}
            <ScoreDeltaPill delta={scoreDelta} />
          </h3>
          <span className="ai-wars-company-open">Read analysis</span>
        </div>
        <p className="ai-wars-company-blurb">{company.blurb}</p>
        <div className="ai-wars-company-scores">
          <ScoreMeter label="Positioning" value={company.scores.positioning} />
          <ScoreMeter label="Heat" value={company.scores.heat} />
        </div>
      </div>
    </a>
  )
}

function CompanyDialog({
  company,
  onClose,
}: {
  company: RankedFieldCompany
  onClose: () => void
}) {
  const titleId = useId()
  const closeRef = useRef<HTMLButtonElement>(null)
  const logo = logoDevUrl(company.domain, { size: 128 })
  const regionLabel =
    company.region === 'us' ? 'United States' : 'International'

  useEffect(() => {
    closeRef.current?.focus()
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    const prevOverflow = document.body.style.overflow
    const prevPaddingRight = document.body.style.paddingRight
    const scrollbar = window.innerWidth - document.documentElement.clientWidth
    if (scrollbar > 0) {
      document.body.style.paddingRight = `${scrollbar}px`
    }
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prevOverflow
      document.body.style.paddingRight = prevPaddingRight
    }
  }, [onClose])

  return (
    <div className="ai-wars-dialog-root" role="presentation">
      <button
        type="button"
        className="ai-wars-dialog-backdrop"
        aria-label="Close analysis"
        onClick={onClose}
      />
      <div
        className="ai-wars-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
      >
        <button
          ref={closeRef}
          type="button"
          className="ai-wars-dialog-close"
          onClick={onClose}
        >
          Close
        </button>

        <header className="ai-wars-dialog-head">
          <div className="ai-wars-dialog-logo">
            {logo ? (
              <img
                src={logo}
                alt=""
                width={56}
                height={56}
                decoding="async"
              />
            ) : (
              <span aria-hidden="true">{company.name.slice(0, 1)}</span>
            )}
          </div>
          <div>
            <p className="ai-wars-dialog-kicker">
              #{company.rank} · {regionLabel} · {company.hq}
            </p>
            <h2 id={titleId}>
              <span
                className={`ai-wars-ow-dot ${company.openWeight ? 'is-open' : 'is-closed'}`}
                title={
                  company.openWeight
                    ? 'Primary models are open-weight / self-hostable'
                    : 'Primary models are closed-weight'
                }
                aria-label={
                  company.openWeight
                    ? 'Primary models open-weight'
                    : 'Primary models closed-weight'
                }
              />
              {company.name}
            </h2>
            <p className="ai-wars-dialog-blurb">{company.blurb}</p>
            <p className="ai-wars-dialog-ow">
              {company.openWeight
                ? 'Open weight: primary / frontier models are self-hostable or open-weight.'
                : 'Closed weight: primary models are closed (side experiments don’t count).'}
            </p>
          </div>
        </header>

        <div className="ai-wars-dialog-scores">
          <ScoreMeter label="Positioning" value={company.scores.positioning} />
          <ScoreMeter label="Heat" value={company.scores.heat} />
        </div>

        <AnalysisWeekMove
          weekMove={company.weekMove}
          citations={company.citations}
        />

        <div className="ai-wars-dialog-body">
          {company.analysis.map((para) => (
            <CitedText
              key={para.slice(0, 48)}
              text={para}
              citations={company.citations}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

function RegionColumn({
  title,
  dek,
  region,
  companies,
  allCompanies,
  history,
  onOpen,
}: {
  title: string
  dek: string
  region: 'us' | 'international'
  companies: RankedFieldCompany[]
  allCompanies: FieldCompany[]
  history: FieldPositioningSnapshot[]
  onOpen: (company: RankedFieldCompany) => void
}) {
  const chart = positioningChartForRegion(allCompanies, history, region)
  const updatedAt = fieldUpdatedAt(allCompanies, region)
  const updatedLabel = formatFieldUpdatedAt(updatedAt)

  return (
    <section className="ai-wars-field-col">
      <header className="ai-wars-field-col-head">
        <div className="ai-wars-field-col-title">
          <h3>{title}</h3>
          <span className="ai-wars-field-updated" title={updatedAt ?? undefined}>
            {updatedLabel ? (
              <>
                <em>Updated</em>
                <time dateTime={updatedAt ?? undefined}>{updatedLabel}</time>
              </>
            ) : (
              <em>Updated</em>
            )}
          </span>
        </div>
        <p>{dek}</p>
      </header>

      <div className="ai-wars-field-chart">
        <div className="ai-wars-field-chart-label">
          <span>Positioning over time</span>
          <span>0 to 100</span>
        </div>
        <SeriesLineChart chart={chart} height={200} />
      </div>

      <ol className="ai-wars-field-list">
        {companies.map((company) => (
          <li key={company.id}>
            <CompanyCard
              company={company}
              scoreDelta={positioningScoreDelta(company.id, history)}
              onOpen={onOpen}
            />
          </li>
        ))}
      </ol>
    </section>
  )
}

export function AiWarsField({ field }: { field: AiWarsFieldBoard }) {
  const us = fieldByRegion(field.companies, 'us')
  const intl = fieldByRegion(field.companies, 'international')
  const [active, setActive] = useState<RankedFieldCompany | null>(null)

  if (!field.companies.length) {
    return (
      <section className="ai-wars-field" aria-labelledby="ai-wars-field-heading">
        <div className="ai-wars-section-label">
          <h2 id="ai-wars-field-heading">Current state</h2>
          <p>Desk rankings are unavailable right now.</p>
        </div>
      </section>
    )
  }

  return (
    <section className="ai-wars-field" aria-labelledby="ai-wars-field-heading">
      <div className="ai-wars-section-label">
        <h2 id="ai-wars-field-heading">Current state</h2>
        <p>
          Desk ranking of who holds the field right now, split by US and
          international labs. Order is positioning + heat (0 to 100). Green dot
          means primary models are open-weight / self-hostable; red means
          primary models are closed (side experiments don’t count). Click a
          company for the full analysis, also listed below under Desk analyses.
        </p>
      </div>

      <div className="ai-wars-field-grid">
        <RegionColumn
          title="United States"
          dek="Frontier labs + the coding products riding them."
          region="us"
          companies={us}
          allCompanies={field.companies}
          history={field.history}
          onOpen={setActive}
        />
        <RegionColumn
          title="International"
          dek="Usage and open-weight pressure from outside the US."
          region="international"
          companies={intl}
          allCompanies={field.companies}
          history={field.history}
          onOpen={setActive}
        />
      </div>

      {active ? (
        <CompanyDialog
          company={active}
          onClose={() => {
            setActive(null)
            if (typeof window !== 'undefined' && window.location.hash) {
              history.replaceState(null, '', window.location.pathname)
            }
          }}
        />
      ) : null}
    </section>
  )
}
