import './Sidebar.css'
import houseImg from '../assets/house_icon.png'
import heartImg from '../assets/heart_icon.png'
import eyeImg from '../assets/eye_icon.png'

// Sidebar: translucent left rail (HBO-Max style) for switching between pages.
//   view         — the active page ('home' | 'favorites' | 'watched')
//   onViewChange — called with the page key when an icon is clicked
//   favoritesCount / watchedCount — small badge counts
// `img` holds an imported image URL (rendered as <img>); `emoji` is plain text.
const NAV_ITEMS = [
  { key: 'home', icon: houseImg, label: 'Home' },
  { key: 'favorites', icon: heartImg, label: 'Favorites' },
  { key: 'watched', icon: eyeImg, label: 'Watched' },
]

const Sidebar = ({ view, onViewChange, favoritesCount = 0, watchedCount = 0 }) => {
  const countFor = (key) =>
    key === 'favorites' ? favoritesCount : key === 'watched' ? watchedCount : 0

  return (
    <nav className="Sidebar" aria-label="Pages">
      {NAV_ITEMS.map((item) => {
        const count = countFor(item.key)
        return (
          <button
            key={item.key}
            className={`Sidebar-item ${view === item.key ? 'is-active' : ''}`}
            onClick={() => onViewChange(item.key)}
            aria-label={item.label}
            aria-current={view === item.key ? 'page' : undefined}
            title={item.label}
          >
            <span className="Sidebar-icon" aria-hidden="true">
              {item.icon ? (
                <img className="Sidebar-iconImg" src={item.icon} alt="" />
              ) : (
                item.icon
              )}
            </span>
            {count > 0 && <span className="Sidebar-badge">{count}</span>}
            <span className="Sidebar-tooltip">{item.label}</span>
          </button>
        )
      })}
    </nav>
  )
}

export default Sidebar
