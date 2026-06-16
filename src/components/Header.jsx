import './Header.css'

// Header: top nav bar (HBO-Max style) — active section on the left, brand on the right.
//   title    — the app name to display
//   overlay  — when true, the bar is transparent and floats over the hero;
//              when false, it's a solid periwinkle bar (used in search mode)
//   children — optional controls (search + sort) rendered in the center of the bar
const Header = ({ title, overlay = false, children }) => {
  return (
    <header className={`Header ${overlay ? 'Header--overlay' : 'Header--solid'}`}>
      <nav className="Header-nav" aria-label="Primary">
        <span className="Header-link is-active">Now Playing</span>
      </nav>
      {children && <div className="Header-controls">{children}</div>}
      <span className="Header-brand">{title}</span>
    </header>
  )
}

export default Header
