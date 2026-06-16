## Flixster — Planning Spec

### Component Architecture

**Hierarchy**

```
App
├─ Sidebar
├─ Header
├─ Hero
├─ SearchBar
├─ Sort
├─ MovieList → MovieCard (×N)
├─ MovieModal
└─ Footer
```

| Component | Responsibility (1 sentence) | Renders | Props | Manages state? |

|-----------|------------------------------|---------|-------|----------------|

| App | Root component; fetches movies from TMDb, owns all shared state, and wires children together. | Header, SearchBar, Sort, MovieList, MovieModal, Footer | none | Yes — movie list, query, page, selected movie, sort, loading, error |

| Sidebar | Translucent left rail (HBO-Max style) for switching between the Home, Favorites, and Watched pages; shows count badges. | Icon buttons (Home / Favorites / Watched), badges | `view`, `onViewChange`, `favoritesCount`, `watchedCount` | No (controlled by App) |

| Header | Top nav bar (HBO-Max style) with the app name; transparent overlay over the hero on Home, solid periwinkle bar otherwise. | Nav link, brand name | `title` (string), `overlay` (bool) | No |

| Hero | Full-bleed cinematic banner spotlighting the top now-playing movies — eyebrow, large title, overview, "View Details" CTA, and dot indicators; shown only in Now Playing mode. | Backdrop image, eyebrow, title, overview, CTA button, dots | `movies` (array), `onCardClick` (handler) | Yes — `index` (which featured movie is showing) |
| SearchBar | Lets the user type a query and submit, search, or clear it. | Text input, Search button, Clear button | `query`, `onQueryChange`, `onSearch`, `onClear` | No (controlled by App) |

| Sort | Drop-down that lets the user pick a sort criterion. | `<select>` with Title / Release date / Vote average options | `sortBy`, `onSortChange` | No (controlled by App) |

| MovieList | Lays out the fetched movies in a responsive grid. | One MovieCard per movie | `movies` (array), `onCardClick` (handler) | No |

| MovieCard | Displays a single movie's poster, title, and vote average as a clickable tile, plus a favorite heart and watched checkbox with visual feedback. | Poster `<img>`, title, vote average, favorite heart, watched checkbox/badge | `movie`, `onClick`, `isFavorited`, `isWatched`, `onToggleFavorite`, `onToggleWatched` | No |

| MovieModal | Pop-up showing full details for the selected movie plus the AI watch recommendation. Fetches its own details + AI insight. | Backdrop poster, runtime, release date, genres, overview, AI recommendation | `movieId` (number), `onClose` (handler) | Yes — details, loading, error, aiInsight, loadingInsight. Opened when App sets `selectedId`; closed via X button, backdrop click, or Escape. |

| Footer | Displays footer/attribution section. | Footer text, TMDb attribution | none | No |

### API Contracts

Base URL: `https://api.themoviedb.org/`
Auth: `api_key` query param (or Bearer token). Poster/backdrop images load from `https://image.tmdb.org/t/p/<size>/<path>`.

| Endpoint | URL | Required params | Response fields used | Error cases |

|----------|-----|-----------------|----------------------|-------------|

| Now Playing | `/3/movie/now_playing` | `api_key`, `page` | `results[]` → `id`, `title`, `poster_path`, `vote_average`, `release_date`; `page`, `total_pages` | Network failure, non-200 status, empty `results` |

| Search | `/3/search/movie` | `api_key`, `query`, `page` | `results[]` → `id`, `title`, `poster_path`, `vote_average`, `release_date`; `page`, `total_pages` | Empty query, no matches, network/non-200 |

| Movie Details | `/3/movie/{movie_id}` | `api_key` (path: `movie_id`) | `title`, `runtime`, `genres[].name`, `release_date`, `backdrop_path`, `overview` | Movie not found (404), bad API key (401), network failure |

| Movie Trailers | `/3/movie/{movie_id}/videos` | `api_key` (path: `movie_id`) | `results[]` → `key` (YouTube video id), `site`, `type`, `official`. Embed via `https://www.youtube.com/embed/{key}` | No YouTube trailer in results (fall back to backdrop image), bad API key (401), network failure |

| AI Insight (OpenRouter) | `https://openrouter.ai/api/v1/chat/completions` | `Authorization: Bearer <key>`, `model`, `messages[]` | `choices[0].message.content` | Non-200 status, network failure → fallback message |

> Note: `runtime` and `genres` are only available from the Movie Details endpoint, so the modal triggers a separate fetch when a card is clicked.

### State Architecture

| State variable | Type | Initial value | Owner component | Update trigger |

|----------------|------|---------------|-----------------|----------------|

| `movies` | array | `[]` | App | Now Playing / Search fetch resolves; "Load More" appends next page |

| `query` | string | `""` | App | User types in SearchBar (controlled input); cleared by Clear button |

| `submittedQuery` | string | `""` | App | Set on search submit (`""` = Now Playing mode); a `useEffect` re-fetches page 1 whenever it changes |

| `page` | number | `1` | App | User clicks "Load More"; reset to 1 on new search/clear |

| `totalPages` | number | `1` | App | Set from `total_pages` in each fetch; used to hide "Load More" |

| `selectedId` | number \| null | `null` | App | User clicks a MovieCard; set to `null` on modal close |

| `sortOption` | string | `""` (none) | App | User picks an option in the Sort drop-down. Sort is applied to a derived copy **during render** (does not mutate `movies`). Directions: title A→Z, release date newest→oldest, vote average high→low |

| `loading` | boolean | `false` | App | `true` while a fetch is in flight, `false` when it settles |

| `error` | string \| null | `null` | App | Set on a failed fetch, cleared on a successful one |

| `view` | string | `"home"` | App | User clicks a Sidebar icon (`home` / `favorites` / `watched`); selects which page renders |

| `favorites` | object (id → movie) | `{}` | App | User toggles the heart on a MovieCard |

| `watched` | object (id → movie) | `{}` | App | User toggles the watched checkbox on a MovieCard |

| `details` | object \| null | `null` | MovieModal | Movie Details fetch resolves |

| `loading` (modal) | boolean | `true` | MovieModal | `true` while details are loading |

| `error` (modal) | string \| null | `null` | MovieModal | Set if the details fetch fails |

| `trailerKey` | string \| null | `null` | MovieModal | Videos fetch resolves with a YouTube trailer (`null` if none → backdrop image shown instead) |

| `aiInsight` | string \| null | `null` | MovieModal | OpenRouter recommendation fetch resolves (or fallback on failure) |

| `loadingInsight` | boolean | `false` | MovieModal | `true` while the AI call is in flight |


### Data Flow

`App` fetches from the TMDb **Now Playing** (or **Search**) endpoint and receives a raw JSON response. It reads `data.results` and stores that array in the `movies` state (appending the next page on "Load More", or replacing it on a new search). Before display, sorting is applied based on `sortBy` (title A–Z, release date newest→oldest, or vote average high→low).

`App` passes `movies` down to `MovieList`, which maps over the array and renders one `MovieCard` per movie. Each `MovieCard` receives a single `movie` object and reads `title`, `vote_average`, and builds its poster URL from `poster_path` (`https://image.tmdb.org/t/p/w500/<poster_path>`).

When a user clicks a `MovieCard`, its `onClick` calls back up to `App` with the movie's `id`. `App` sets `selectedMovie` and opens `MovieModal`, which uses the `id` to fetch the **Movie Details** endpoint for `runtime`, `genres`, `backdrop_path`, `release_date`, and `overview`, and to request the AI watch recommendation.

```
TMDb API → App (fetch + transform: results[], sort, build image URLs)
         → MovieList (map over movies)
         → MovieCard (display title / poster / vote)
   click → App sets selectedMovie.id → MovieModal fetches details + AI
```

### AI Feature Spec

- **Role:** A concise movie-recommendation assistant.

- **Task:** Given a movie's details, generate a short "should you watch this?" recommendation.

- **Inputs sent to the AI:** the movie's `title`, `genres`, and `overview`.

- **Output format:** a 2–3 sentence plain-text watch recommendation.

- **Display location:** rendered inside `MovieModal` alongside the other movie details.

- **Role:** an enthusiastic but honest film critic.

- **State:** `aiInsight` (string | null, init `null`) and `loadingInsight` (boolean, init `false`) live in `MovieModal`. Both reset when the modal unmounts (next movie starts fresh).

- **OpenRouter endpoint / model:** `https://openrouter.ai/api/v1/chat/completions`, model `meta-llama/llama-3.3-70b-instruct:free`. Key in `.env` as `VITE_OPENROUTER_API_KEY`.

- **Trigger:** a `useEffect` in `MovieModal` that runs once `details` are fetched (depends on `details`).

- **Constraints:** keep it to 2–3 sentences; no spoilers; no "I" statements; no generic phrases like "this film is a must-see"; tone is friendly/helpful. The request goes to OpenRouter from the browser — not a backend server — so the key is visible in the Network tab (acceptable for this dev project per the `.env` + `.gitignore` pattern).

- **Failure behavior:** show a loading state ("Getting a recommendation…") while generating; if the call fails, display the fallback "We couldn't generate a recommendation for this one — check out the overview above!" instead of breaking the modal.

### AI Feature — Decisions Log

- **What the API returned initially:** Responses were on-target — 2–3 friendly sentences about whether the movie is worth watching, no spoilers. Occasionally a little long.
- **What I changed in my prompt:** Tightened the system message to explicitly forbid "I" statements and generic "must-see" phrasing, and capped length at 2–3 sentences.
- **What fallback behavior I implemented:** `getMovieInsight` catches any error (non-200 or network) and returns a fixed fallback string, so the modal still renders cleanly.
- **What I learned:** Async AI state belongs in `useEffect` keyed on the data it depends on; using an `active` flag in the effect cleanup avoids setting state after the modal closes.
