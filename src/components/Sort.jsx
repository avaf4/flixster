import './Sort.css'

// Sort: a dropdown for choosing how the movie list is ordered. Holds no state.
//   sortBy       — the current sort option (controlled by App)
//   onSortChange — called with the new option value when the user picks one
const Sort = ({ sortBy, onSortChange }) => {
  return (
    <div className="Sort">
      <label htmlFor="sort-select" className="Sort-label">Sort by:</label>
      <select
        id="sort-select"
        className="Sort-select"
        value={sortBy}
        onChange={(e) => onSortChange(e.target.value)}
      >
        <option value="">None</option>
        <option value="title">Title (A–Z)</option>
        <option value="release_date">Release Date (Newest)</option>
        <option value="vote_average">Vote Average (Highest)</option>
      </select>
    </div>
  )
}

export default Sort
