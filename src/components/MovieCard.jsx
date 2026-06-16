import './MovieCard.css'
import emptyHeartImg from '../assets/empty_heart.png'
import redHeartImg from '../assets/red_heart.png'
import starImg from '../assets/star.png'
import eyeImg from '../assets/eye_icon.png'

//   movie       — a single movie object from the TMDb API (has title, poster_path, vote_average, id)
//   onClick     — a function from App; we call it with this movie's id when the card is clicked
//   isFavorited — whether this movie is in the user's favorites
//   isWatched   — whether this movie is marked watched
//   onToggleFavorite / onToggleWatched — called with the movie when those controls are used
const MovieCard = ({
  movie,
  onClick,
  isFavorited = false,
  isWatched = false,
  onToggleFavorite,
  onToggleWatched,
}) => {
  // Glue the end of the poster path to the tmdb url to generate the image. Check if it's null to avoid errors.
  const posterUrl = movie.poster_path
    ? `https://image.tmdb.org/t/p/w500${movie.poster_path}`
    : null

  // open the modal — used by both click and keyboard (Enter/Space)
  const open = () => onClick(movie.id)
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      open()
    }
  }

  // stopPropagation so clicking a control doesn't also open the modal
  const handleFavorite = (e) => {
    e.stopPropagation()
    onToggleFavorite?.(movie)
  }
  const handleWatched = (e) => {
    e.stopPropagation()
    onToggleWatched?.(movie)
  }

  return (
    // Clicking (or pressing Enter/Space while focused) opens the modal with the movie's id.
    // role/tabIndex make the card reachable and activatable via keyboard.
    <div
      className={`MovieCard ${isWatched ? 'is-watched' : ''}`}
      onClick={open}
      onKeyDown={handleKeyDown}
      role="button"
      tabIndex={0}
    >
      <div className="MovieCard-posterWrap">
        {/* If we have a poster URL, show the image; otherwise show a placeholder box
            so the layout doesn't break on movies with no image. */}
        {posterUrl ? (
          <img className="MovieCard-poster" src={posterUrl} alt={`${movie.title} poster`} />
        ) : (
          <div className="MovieCard-poster MovieCard-poster--placeholder">No image</div>
        )}

        {/* favorite heart — fills in when favorited */}
        <button
          className={`MovieCard-fav ${isFavorited ? 'is-on' : ''}`}
          onClick={handleFavorite}
          aria-pressed={isFavorited}
          aria-label={isFavorited ? 'Remove from favorites' : 'Add to favorites'}
          title={isFavorited ? 'Remove from favorites' : 'Add to favorites'}
        >
          <img
            className="MovieCard-favIcon"
            src={isFavorited ? redHeartImg : emptyHeartImg}
            alt=""
          />
        </button>

        {/* "Watched" badge shown on the poster when marked */}
        {isWatched && (
          <span className="MovieCard-watchedBadge">
            <img className="MovieCard-badgeIcon" src={eyeImg} alt="" /> Watched
          </span>
        )}
      </div>

      <div className="MovieCard-info">
        {/* The movie's title */}
        <h3 className="MovieCard-title">{movie.title}</h3>
        {/* The rating, rounded to one decimal (e.g. 7.8). The ?. avoids a crash
            if vote_average happens to be missing. */}
        <span className="MovieCard-vote">
          <img className="MovieCard-starIcon" src={starImg} alt="" />
          {movie.vote_average?.toFixed(1)}
        </span>
      </div>

      {/* watched checkbox row */}
      <label className="MovieCard-watched" onClick={(e) => e.stopPropagation()}>
        <input
          type="checkbox"
          checked={isWatched}
          onChange={handleWatched}
        />
        Watched
      </label>
    </div>
  )
}

export default MovieCard
