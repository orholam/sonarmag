import { Link } from 'react-router-dom'

const footerGroups = [
  {
    title: 'Sections',
    links: [
      { to: '/world', label: 'World' },
      { to: '/business', label: 'Business' },
      { to: '/lifestyle', label: 'Lifestyle' },
      { to: '/podcasts', label: 'Podcasts' },
    ],
  },
  {
    title: 'Explore',
    links: [
      { to: '/latest', label: 'Latest' },
      { to: '/popular', label: 'Popular' },
      { to: '/subscribe', label: 'Subscribe' },
      { to: '/about', label: 'About' },
    ],
  },
  {
    title: 'Company',
    links: [
      { to: '/contact', label: 'Contact' },
      { to: '/privacy', label: 'Privacy' },
      { to: '/terms', label: 'Terms' },
    ],
  },
]

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="footer-top">
        <div className="footer-brand-block">
          <Link className="footer-brand" to="/">
            <strong>Sonar</strong> Mag
          </Link>
          <p className="footer-tagline">
            Signals from the deep web of culture.
          </p>
        </div>

        <div className="footer-menus">
          {footerGroups.map((group) => (
            <div className="footer-group" key={group.title}>
              <h2>{group.title}</h2>
              <ul>
                {group.links.map((link) => (
                  <li key={link.to}>
                    <Link to={link.to}>{link.label}</Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      <div className="footer-bottom">
        <p>© {new Date().getFullYear()} Sonar Mag</p>
        <div className="footer-legal">
          <Link to="/privacy">Privacy</Link>
          <Link to="/terms">Terms</Link>
          <Link to="/contact">Contact</Link>
        </div>
      </div>
    </footer>
  )
}
