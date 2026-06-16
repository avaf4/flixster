import { useState, useMemo } from 'react'
import './Hero.css'

// Hero: full-bleed cinematic banner (HBO-Max style) spotlighting a random set of
// now-playing movies. Left-aligned eyebrow + title + overview + CTA, with dots.
//   movies      — array of movie objects (we feature a random few)
//   onCardClick — called with a movie id (opens the detail modal)
const Hero = ({ movies, onCardClick }) => {
  const [index, setIndex] = useState(0) // which featured movie is showing

  // Pick 5 random movies (that have a backdrop) to feature.
  // useMemo keeps the selection stable across re-renders — it only re-shuffles
  // when the movies list itself changes, so clicking a dot doesn't reshuffle.
  const featured = useMemo(() => {
    const withBackdrop = movies.filter((m) => m.backdrop_path)
    // Fisher–Yates shuffle on a copy, then take the first 5
    const shuffled = [...withBackdrop]
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
    }
    return shuffled.slice(0, 5)
  }, [movies])

  if (featured.length === 0) return null // nothing to feature yet

  const safeIndex = index % featured.length
  const movie = featured[safeIndex]
  const backdropUrl = `https://image.tmdb.org/t/p/original${movie.backdrop_path}`

  return (
    <section
      className="Hero"
      style={{ backgroundImage: `url(${backdropUrl})` }}
    >
      {/* dark gradient so white text stays readable over any backdrop */}
      <div className="Hero-scrim" />

      <div className="Hero-content">
        <p className="Hero-eyebrow">Flixster · Now Playing</p>
        <h2 className="Hero-title">{movie.title}</h2>
        {movie.overview && (
          <p className="Hero-overview">{movie.overview}</p>
        )}
        <button className="Hero-cta" onClick={() => onCardClick(movie.id)}>
          View Details
        </button>
      </div>

      {/* dot indicators */}
      <div className="Hero-dots">
        {featured.map((m, i) => (
          <button
            key={m.id}
            className={`Hero-dot ${i === safeIndex ? 'is-active' : ''}`}
            onClick={() => setIndex(i)}
            aria-label={`Go to featured movie ${i + 1}`}
          />
        ))}
      </div>
    </section>
  )
}

export default Hero
