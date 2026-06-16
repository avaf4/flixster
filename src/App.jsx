import { useState, useEffect } from 'react'
import Header from './components/Header'
import Sidebar from './components/Sidebar'
import Hero from './components/Hero'
import SearchBar from './components/SearchBar'
import Sort from './components/Sort'
import MovieList from './components/MovieList'
import MovieModal from './components/MovieModal'
import Footer from './components/Footer'
import './App.css'

const API_KEY = import.meta.env.VITE_API_KEY
const BASE_URL = 'https://api.themoviedb.org/3'

// App: root component. Owns all shared state and wires the children together.
const App = () => {
  const [movies, setMovies] = useState([])        // movie objects currently displayed
  const [query, setQuery] = useState('')           // text the user has typed in the search box
  const [submittedQuery, setSubmittedQuery] = useState('') // the query actually being searched ('' = Now Playing)
  const [page, setPage] = useState(1)              // current page number (for Load More)
  const [totalPages, setTotalPages] = useState(1)  // total pages available from the API
  const [selectedId, setSelectedId] = useState(null) // id of the movie whose modal is open (null = closed)
  const [sortOption, setSortOption] = useState('') // current sort criterion ('' = no sort)
  const [loading, setLoading] = useState(false)    // true while a fetch is in flight
  const [error, setError] = useState(null)         // error message string, or null
  const [view, setView] = useState('home')         // active sidebar page: 'home' | 'favorites' | 'watched'
  const [favorites, setFavorites] = useState({})   // id -> movie object (favorited)
  const [watched, setWatched] = useState({})       // id -> movie object (marked watched)

  // Toggle a movie in an id-keyed map (used for both favorites and watched).
  const toggleIn = (setMap) => (movie) =>
    setMap((prev) => {
      const next = { ...prev }
      if (next[movie.id]) delete next[movie.id]
      else next[movie.id] = movie
      return next
    })

  const toggleFavorite = toggleIn(setFavorites)
  const toggleWatched = toggleIn(setWatched)

  // Build the right TMDb URL for the current mode (Now Playing vs Search).
  const buildUrl = (pageNum, searchTerm) => {
    if (searchTerm) {
      return `${BASE_URL}/search/movie?api_key=${API_KEY}&query=${encodeURIComponent(searchTerm)}&page=${pageNum}`
    }
    return `${BASE_URL}/movie/now_playing?api_key=${API_KEY}&page=${pageNum}`
  }

  // Fetch one page of movies. If append is true, add to the list; otherwise replace it.
  const fetchMovies = async (pageNum, searchTerm, append) => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch(buildUrl(pageNum, searchTerm))
      if (!response.ok) throw new Error(`TMDb error: ${response.status}`)
      const data = await response.json()
      setTotalPages(data.total_pages)
      // append the next page's results, or replace on a fresh load/search
      setMovies((prev) => (append ? [...prev, ...data.results] : data.results))
    } catch (err) {
      console.error('Failed to fetch movies:', err)
      setError('Something went wrong loading movies. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // On mount, and whenever the submitted query changes, load page 1.
  useEffect(() => {
    setPage(1)
    fetchMovies(1, submittedQuery, false)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [submittedQuery])

  // Load More: fetch the next page and append it.
  const handleLoadMore = () => {
    const nextPage = page + 1
    setPage(nextPage)
    fetchMovies(nextPage, submittedQuery, true)
  }

  // Search submit: commit the typed query (triggers the effect above).
  const handleSearch = () => {
    setSubmittedQuery(query.trim())
  }

  // Clear / Now Playing: reset query and go back to the Now Playing list.
  const handleClear = () => {
    setQuery('')
    setSubmittedQuery('')
  }

  // Sort a derived copy of the movies based on the selected option (sort during render).
  const sortedMovies = [...movies].sort((a, b) => {
    switch (sortOption) {
      case 'title':
        return a.title.localeCompare(b.title)
      case 'release_date':
        return (b.release_date || '').localeCompare(a.release_date || '')
      case 'vote_average':
        return b.vote_average - a.vote_average
      default:
        return 0 // no sort
    }
  })

  // movies to show in the grid depend on the active sidebar page
  const favoriteMovies = Object.values(favorites)
  const watchedMovies = Object.values(watched)
  const isHome = view === 'home'

  // shared props so every MovieList knows favorite/watched status
  const listProps = {
    favorites,
    watched,
    onToggleFavorite: toggleFavorite,
    onToggleWatched: toggleWatched,
    onCardClick: setSelectedId,
  }

  // the hero only shows on Home, in Now Playing mode, once movies have loaded
  const showHero = isHome && !submittedQuery && movies.length > 0

  return (
    <div className="App">
      <Sidebar
        view={view}
        onViewChange={setView}
        favoritesCount={favoriteMovies.length}
        watchedCount={watchedMovies.length}
      />

      <div className="App-shell">
        {/* search + sort controls live in the header, but only on the Home page */}
        {isHome ? (
          showHero ? (
            <div className="App-hero">
              <Header title="Flixster" overlay>
                <SearchBar
                  query={query}
                  onQueryChange={setQuery}
                  onSearch={handleSearch}
                  onClear={handleClear}
                />
                <Sort sortBy={sortOption} onSortChange={setSortOption} />
              </Header>
              <Hero movies={movies} onCardClick={setSelectedId} />
            </div>
          ) : (
            <Header title="Flixster">
              <SearchBar
                query={query}
                onQueryChange={setQuery}
                onSearch={handleSearch}
                onClear={handleClear}
              />
              <Sort sortBy={sortOption} onSortChange={setSortOption} />
            </Header>
          )
        ) : (
          <Header title="Flixster" />
        )}

        <main className="App-main">
          {/* HOME PAGE */}
          {isHome && (
            <>
              <h2 className="App-sectionTitle">
                {submittedQuery ? `Results for "${submittedQuery}"` : 'Now Playing'}
              </h2>

              {error && <p className="App-error">{error}</p>}

              {!loading && !error && movies.length === 0 && (
                <p className="App-empty">No movies found.</p>
              )}

              <MovieList movies={sortedMovies} {...listProps} />

              {loading && <p className="App-loading">Loading…</p>}

              {!loading && movies.length > 0 && page < totalPages && (
                <button className="App-loadMore" onClick={handleLoadMore}>
                  Load More
                </button>
              )}
            </>
          )}

          {/* FAVORITES PAGE */}
          {view === 'favorites' && (
            <>
              <h2 className="App-sectionTitle">Favorites</h2>
              {favoriteMovies.length === 0 ? (
                <p className="App-empty">No favorites yet — tap the heart on a movie.</p>
              ) : (
                <MovieList movies={favoriteMovies} {...listProps} />
              )}
            </>
          )}

          {/* WATCHED PAGE */}
          {view === 'watched' && (
            <>
              <h2 className="App-sectionTitle">Watched</h2>
              {watchedMovies.length === 0 ? (
                <p className="App-empty">Nothing marked watched yet.</p>
              ) : (
                <MovieList movies={watchedMovies} {...listProps} />
              )}
            </>
          )}
        </main>

        {/* modal renders only when a movie is selected */}
        {selectedId && (
          <MovieModal movieId={selectedId} onClose={() => setSelectedId(null)} />
        )}

        <Footer />
      </div>
    </div>
  )
}

export default App
