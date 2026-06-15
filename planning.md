## Flixster — Planning Spec

### Component Architecture

**Hierarchy**

```
App
├─ Header
├─ SearchBar
├─ Sort
├─ MovieList → MovieCard (×N)
├─ MovieModal
└─ Footer
```

| Component | Responsibility (1 sentence) | Renders | Props | Manages state? |

|-----------|------------------------------|---------|-------|----------------|

| App | Root component; fetches movies from TMDb, owns all shared state, and wires children together. | Header, SearchBar, Sort, MovieList, MovieModal, Footer | none | Yes — movie list, query, page, selected movie, sort, loading, error |

| Header | Displays the site title/logo and banner section. | Title text, banner | `title` (string) | No |
| SearchBar | Lets the user type a query and submit, search, or clear it. | Text input, Search button, Clear button | `query`, `onQueryChange`, `onSearch`, `onClear` | No (controlled by App) |

| Sort | Drop-down that lets the user pick a sort criterion. | `<select>` with Title / Release date / Vote average options | `sortBy`, `onSortChange` | No (controlled by App) |

| MovieList | Lays out the fetched movies in a responsive grid. | One MovieCard per movie | `movies` (array), `onCardClick` (handler) | No |

| MovieCard | Displays a single movie's poster, title, and vote average as a clickable tile. | Poster `<img>`, title, vote average | `movie` (object), `onClick` | No |

| MovieModal | Pop-up showing full details for the selected movie plus the AI watch recommendation. | Backdrop poster, runtime, release date, genres, overview, AI recommendation | `movie` (object/null), `onClose` | Yes — AI response, AI loading, AI error |

| Footer | Displays footer/attribution section. | Footer text, TMDb attribution | none | No |

### API Contracts

Base URL: `https://api.themoviedb.org/`
Auth: `api_key` query param (or Bearer token). Poster/backdrop images load from `https://image.tmdb.org/t/p/<size>/<path>`.

| Endpoint | URL | Required params | Response fields used | Error cases |

|----------|-----|-----------------|----------------------|-------------|

| Now Playing | `/movie/playing` | `api_key`, `page` | `results[]` → `id`, `title`, `poster_path`, `vote_average`; `page`, `total_pages` | Network failure, non-200 status, empty `results` |

| Search | `/movie/search` | `api_key`, `query`, `page` | `results[]` → `id`, `title`, `poster_path`, `vote_average`; `page`, `total_pages` | Empty query, no matches, network/non-200 |

| Movie Details | `/movie/{movie_id}` | `api_key` (path: `movie_id`) | `runtime`, `genres[].name`, `release_date`, `backdrop_path`, `overview` | Invalid id, network/non-200 |

> Note: `runtime` and `genres` are only available from the Movie Details endpoint, so the modal triggers a separate fetch when a card is clicked.

### State Architecture

| State variable | Type | Initial value | Owner component | Update trigger |

|----------------|------|---------------|-----------------|----------------|

| `movies` | array | `[]` | App | Now Playing / Search fetch resolves; "Load More" appends next page |

| `query` | string | `""` | App | User types in SearchBar; cleared by Clear button |

| `page` | number | `1` | App | User clicks "Load More"; reset to 1 on new search/clear |

| `selectedMovie` | object \| null | `null` | App | User clicks a MovieCard; set to `null` on modal close |

| `sortBy` | string | `""` (none) | App | User picks an option in the Sort drop-down |

| `loading` | boolean | `false` | App | `true` while a fetch is in flight, `false` when it settles |

| `error` | string \| null | `null` | App | Set on a failed fetch, cleared on a successful one |

| `aiResponse` | string \| null | `null` | MovieModal | AI recommendation fetch resolves |

| `aiLoading` | boolean | `false` | MovieModal | `true` while the AI call is in flight |

| `aiError` | string \| null | `null` | MovieModal | Set if the AI call fails |


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

- **State:** `aiResponse`, `aiLoading`, and `aiError` live in `MovieModal`.

- **Constraints:** keep it to 2–3 sentences; no spoilers; tone is friendly/helpful. The request goes to `https://openrouter.ai/` — not to a backend server — so it is visible in the Network tab.

- **Failure behavior:** show a loading state while generating; if the call fails, display a graceful fallback message (e.g. "Couldn't generate a recommendation right now.") instead of breaking the modal.
