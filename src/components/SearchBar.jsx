import { useState, useEffect, useRef } from 'react'
import searchIcon from '../assets/search_icon.png'
import './SearchBar.css'

// SearchBar: controlled input plus Search and Clear buttons.
// On narrow screens it collapses to a single search icon that expands on click.
//   query         — current text in the input (controlled by App)
//   onQueryChange — called with the new text on every keystroke
//   onSearch      — called when the user submits the search
//   onClear       — wipes the input and returns the grid to the Now Playing list
const SearchBar = ({ query, onQueryChange, onSearch, onClear }) => {
  // true when the viewport is narrow enough to collapse the bar to an icon
  const [isCompact, setIsCompact] = useState(false)
  // when compact, whether the full input is expanded open
  const [isOpen, setIsOpen] = useState(false)
  const inputRef = useRef(null)

  // watch the viewport width with matchMedia and keep isCompact in sync
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 720px)')
    const update = () => setIsCompact(mq.matches)
    update()                       // set the initial value
    mq.addEventListener('change', update)
    return () => mq.removeEventListener('change', update)
  }, [])

  // when the bar expands on a small screen, focus the input so the user can type
  useEffect(() => {
    if (isCompact && isOpen) inputRef.current?.focus()
  }, [isCompact, isOpen])

  // submitting the form (button click or Enter) runs the search
  const handleSubmit = (e) => {
    e.preventDefault() // stop the browser from reloading the page
    onSearch()
  }

  // collapse back to the icon and clear, when compact
  const handleClear = () => {
    onClear()
    if (isCompact) setIsOpen(false)
  }

  // compact + closed → show only the search icon button
  if (isCompact && !isOpen) {
    return (
      <div className="SearchBar SearchBar--collapsed">
        <button
          type="button"
          className="SearchBar-iconBtn"
          onClick={() => setIsOpen(true)}
          aria-label="Open search"
        >
          <img className="SearchBar-iconImg" src={searchIcon} alt="" />
        </button>
      </div>
    )
  }

  return (
    <form
      className={`SearchBar ${isCompact ? 'SearchBar--open' : ''}`}
      onSubmit={handleSubmit}
    >
      <input
        ref={inputRef}
        type="text"
        className="SearchBar-input"
        value={query}                                  // React owns the value (controlled input)
        onChange={(e) => onQueryChange(e.target.value)} // update App's state on each keystroke
        placeholder="Search movies..."
        aria-label="Search movies"
      />
      <button type="submit" className="SearchBar-button">Search</button>
      <button type="button" className="SearchBar-button" onClick={handleClear}>
        Clear
      </button>
    </form>
  )
}

export default SearchBar
