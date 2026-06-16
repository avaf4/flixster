import { useState, useEffect } from 'react'
import './MovieModal.css'

const API_KEY = import.meta.env.VITE_API_KEY
const BASE_URL = 'https://api.themoviedb.org/3'
const OPENROUTER_KEY = import.meta.env.VITE_OPENROUTER_API_KEY

const FALLBACK_DESCRIPTION =
  "We couldn't generate a recommendation right now — check out the overview above!"

// Small wrapper around the OpenRouter chat API. Takes a system + user message,
// returns the AI text on success, or the given fallback string on failure.
async function callOpenRouter(systemContent, userContent, fallback) {
  try {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${OPENROUTER_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'openrouter/free',
        messages: [
          { role: 'system', content: systemContent },
          { role: 'user', content: userContent },
        ],
      }),
    })
    if (!response.ok) throw new Error(`OpenRouter error: ${response.status}`)
    const data = await response.json()
    return data.choices[0].message.content
  } catch (error) {
    console.error('AI call failed:', error)
    return fallback
  }
}

// Generates a short "should you watch this?" recommendation from the movie's
// metadata — triggered on demand by a button.
function getMovieDescription(title, genres, overview) {
  return callOpenRouter(
    // role + constraints (from the prompt spec in planning.md)
    'You are an enthusiastic but honest film critic. Write a friendly, helpful ' +
      '2-3 sentence "should you watch this?" recommendation. Plain text only. ' +
      'No plot spoilers. Do not use "I" statements. Avoid generic phrases like ' +
      '"this film is a must-see."',
    // task + the movie context (title, genres, overview)
    `Write a watch recommendation for the movie "${title}". ` +
      `Genres: ${genres}. Overview: ${overview}`,
    FALLBACK_DESCRIPTION,
  )
}

// MovieModal: fetches and displays full details for the selected movie,
// plus an AI-generated watch recommendation.
//   movieId — the id of the movie to show details for
//   onClose — callback to close the modal (clears the selected id in App)
const MovieModal = ({ movieId, onClose }) => {
  const [details, setDetails] = useState(null)     // fetched movie details object
  const [loading, setLoading] = useState(true)     // true while details are loading
  const [error, setError] = useState(null)         // details fetch error message, or null
  const [trailerKey, setTrailerKey] = useState(null) // YouTube video id for the trailer (null = none)

  const [aiDescription, setAiDescription] = useState(null)       // on-demand AI watch recommendation
  const [loadingDescription, setLoadingDescription] = useState(false) // true while that call runs

  // Button handler: ask the AI for a watch recommendation for this movie.
  const handleDescribe = async () => {
    if (!details) return
    setLoadingDescription(true)
    const genres = (details.genres || []).map((g) => g.name).join(', ')
    const text = await getMovieDescription(details.title, genres, details.overview)
    setAiDescription(text)
    setLoadingDescription(false)
  }

  // Fetch the movie details whenever the selected movieId changes.
  useEffect(() => {
    let active = true // guard against setting state after the modal closes
    setLoading(true)
    setError(null)
    setDetails(null)
    setAiDescription(null) // reset the on-demand description for the new movie

    fetch(`${BASE_URL}/movie/${movieId}?api_key=${API_KEY}`)
      .then((res) => {
        if (!res.ok) throw new Error(`TMDb error: ${res.status}`)
        return res.json()
      })
      .then((data) => {
        if (active) {
          setDetails(data)
          setLoading(false)
        }
      })
      .catch((err) => {
        console.error('Failed to fetch movie details:', err)
        if (active) {
          setError("We couldn't load this movie's details.")
          setLoading(false)
        }
      })

    return () => {
      active = false
    }
  }, [movieId])

  // Fetch the trailer (videos endpoint) whenever the selected movieId changes.
  // No trailer is a soft failure — we just fall back to the backdrop image.
  useEffect(() => {
    let active = true
    setTrailerKey(null)

    fetch(`${BASE_URL}/movie/${movieId}/videos?api_key=${API_KEY}`)
      .then((res) => {
        if (!res.ok) throw new Error(`TMDb error: ${res.status}`)
        return res.json()
      })
      .then((data) => {
        if (!active) return
        const videos = data.results || []
        // prefer an official YouTube "Trailer", then any YouTube "Trailer",
        // then any YouTube video at all
        const pick =
          videos.find((v) => v.site === 'YouTube' && v.type === 'Trailer' && v.official) ||
          videos.find((v) => v.site === 'YouTube' && v.type === 'Trailer') ||
          videos.find((v) => v.site === 'YouTube')
        setTrailerKey(pick ? pick.key : null)
      })
      .catch((err) => {
        console.error('Failed to fetch trailer:', err)
        if (active) setTrailerKey(null) // fall back to the backdrop image
      })

    return () => {
      active = false
    }
  }, [movieId])

  // Close the modal when Escape is pressed.
  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [onClose])

  // Clicking the dark backdrop (but not the modal body) closes the modal.
  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) onClose()
  }

  const backdropUrl = details?.backdrop_path
    ? `https://image.tmdb.org/t/p/w780${details.backdrop_path}`
    : null

  return (
    <div className="MovieModal-backdrop" onClick={handleBackdropClick}>
      <div className="MovieModal" role="dialog" aria-modal="true">
        <button className="MovieModal-close" onClick={onClose} aria-label="Close">
          ✕
        </button>

        {/* loading and error states keep the modal from looking broken */}
        {loading && <p className="MovieModal-status">Loading details…</p>}
        {error && <p className="MovieModal-status">{error}</p>}

        {details && (
          <>
            {/* backdrop image always shows */}
            {backdropUrl && (
              <img
                className="MovieModal-backdropImg"
                src={backdropUrl}
                alt={`${details.title} backdrop`}
              />
            )}

            <div className="MovieModal-body">
              <h2 className="MovieModal-title">{details.title}</h2>
              <div className="MovieModal-meta">
                {details.runtime ? <span>{details.runtime} min</span> : null}
                {details.release_date ? <span>{details.release_date}</span> : null}
              </div>
              {details.genres?.length > 0 && (
                <div className="MovieModal-genres">
                  {details.genres.map((g) => (
                    <span key={g.id} className="MovieModal-genre">{g.name}</span>
                  ))}
                </div>
              )}
              <p className="MovieModal-overview">{details.overview}</p>

              {/* On-demand AI Watch Recommendation */}
              <div className="MovieModal-ai">
                <h3 className="MovieModal-aiLabel">✨ Watch Recommendation</h3>
                {aiDescription ? (
                  <p className="MovieModal-aiText">{aiDescription}</p>
                ) : (
                  <button
                    className="MovieModal-aiButton"
                    onClick={handleDescribe}
                    disabled={loadingDescription}
                  >
                    {loadingDescription ? 'Generating…' : 'Generate Watch Recommendation'}
                  </button>
                )}
              </div>

              {/* trailer, shown below the recommendation when one was found */}
              {trailerKey && (
                <div className="MovieModal-trailer">
                  <iframe
                    className="MovieModal-trailerFrame"
                    src={`https://www.youtube.com/embed/${trailerKey}`}
                    title={`${details.title} trailer`}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default MovieModal
