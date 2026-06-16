import MovieCard from './MovieCard'  // the tile component we render per movie
import './MovieList.css'              // grid layout styles for this component

// MovieList: lays out the movies it's given in a responsive grid. Holds no state.
//   movies      — array of movie objects, passed down from App
//   onCardClick — handler passed to each MovieCard so clicks bubble up to App
//   favorites / watched — id-keyed maps so each card knows its status
//   onToggleFavorite / onToggleWatched — passed through to each card
const MovieList = ({
  movies,
  onCardClick,
  favorites = {},
  watched = {},
  onToggleFavorite,
  onToggleWatched,
}) => {
  return (
    <div className="MovieList">               {/* the responsive grid container */}
      {movies.map((movie) => (                // loop over every movie...
        <MovieCard                            // ...and render one card for each
          key={movie.id}                      // unique key so React can track each card
          movie={movie}                       // pass the whole movie object down
          onClick={onCardClick}               // pass the click handler down (MovieCard calls it with movie.id)
          isFavorited={Boolean(favorites[movie.id])}
          isWatched={Boolean(watched[movie.id])}
          onToggleFavorite={onToggleFavorite}
          onToggleWatched={onToggleWatched}
        />
      ))}
    </div>
  )
}

export default MovieList
