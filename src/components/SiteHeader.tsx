import { Link } from 'react-router-dom'

function IconHeadphones() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M4 14v-2a8 8 0 0 1 16 0v2"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <path
        d="M4 14v3a2 2 0 0 0 2 2h1v-7H6a2 2 0 0 0-2 2Zm14-2h-1v7h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2Z"
        fill="currentColor"
      />
    </svg>
  )
}

function IconPlay() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M8 5.5v13l11-6.5L8 5.5Z" fill="currentColor" />
    </svg>
  )
}

function IconChevron() {
  return (
    <svg viewBox="0 0 16 16" aria-hidden="true">
      <path
        d="M4 6l4 4 4-4"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  )
}

function IconArrowUpRight() {
  return (
    <svg viewBox="0 0 16 16" aria-hidden="true">
      <path
        d="M4.5 11.5 11.5 4.5M6 4.5h5.5V10"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function IconMenu() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M4 7h16M4 12h16M4 17h16"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  )
}

export function SiteHeader() {
  return (
    <header className="topbar">
      <div className="topbar-left">
        <button className="listen-pill" type="button">
          <span className="listen-icon">
            <IconHeadphones />
          </span>
          <span>5,810</span>
          <span className="listen-play">
            <IconPlay />
          </span>
        </button>
        <nav className="nav-links" aria-label="Sections">
          <Link to="/world">
            World <IconChevron />
          </Link>
          <Link to="/business">
            Business <IconChevron />
          </Link>
          <Link to="/lifestyle">
            Lifestyle <IconChevron />
          </Link>
        </nav>
      </div>

      <Link className="logo" to="/">
        <strong>Sonar</strong> Mag
      </Link>

      <div className="topbar-right">
        <Link className="subscribe-pill" to="/subscribe">
          Subscribe for €2.50 <IconArrowUpRight />
        </Link>
        <button className="menu-btn" type="button" aria-label="Open menu">
          <IconMenu />
        </button>
      </div>
    </header>
  )
}
