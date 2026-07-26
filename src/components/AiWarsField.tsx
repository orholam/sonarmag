import { useEffect, useId, useRef, useState } from 'react'
import {
  fieldByRegion,
  fieldUpdatedAt,
  formatFieldUpdatedAt,
  logoDevUrl,
  positioningChartForRegion,
  type AiWarsFieldBoard,
  type FieldPositioningSnapshot,
  type FieldCompany,
  type RankedFieldCompany,
} from '../lib/ai-wars-field'
import { SeriesLineChart } from './SeriesLineChart'

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
  onOpen,
}: {
  company: RankedFieldCompany
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
          </h3>
          <span className="ai-wars-company-open">Read analysis</span>
        </div>
        <p>{company.blurb}</p>
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
                ? 'Open weight — primary / frontier models are self-hostable or open-weight.'
                : 'Closed weight — primary models are closed (side experiments don’t count).'}
            </p>
          </div>
        </header>

        <div className="ai-wars-dialog-scores">
          <ScoreMeter label="Positioning" value={company.scores.positioning} />
          <ScoreMeter label="Heat" value={company.scores.heat} />
        </div>

        <div className="ai-wars-dialog-body">
          {company.analysis.map((para) => (
            <p key={para.slice(0, 48)}>{para}</p>
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
              <em>Updated —</em>
            )}
          </span>
        </div>
        <p>{dek}</p>
      </header>

      <div className="ai-wars-field-chart">
        <div className="ai-wars-field-chart-label">
          <span>Positioning over time</span>
          <span>0–100</span>
        </div>
        <SeriesLineChart chart={chart} height={200} />
      </div>

      <ol className="ai-wars-field-list">
        {companies.map((company) => (
          <li key={company.id}>
            <CompanyCard company={company} onOpen={onOpen} />
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
          Desk ranking of who holds the field right now — split by US and
          international labs. Order is positioning + heat (0–100). Green dot =
          primary models are open-weight / self-hostable; red = primary models
          closed (side experiments don’t count). Click a company for the full
          analysis (also below in Desk analyses).
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
