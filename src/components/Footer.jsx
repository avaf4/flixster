import './Footer.css'

// Footer: presentational attribution section. No state, no API calls.
const Footer = () => {
  return (
    <footer className="Footer">
      <p className="Footer-text">© 2026 Flixster</p>
      {/* TMDb attribution is required when using their data publicly */}
      <p className="Footer-attribution">
        Movie data provided by{' '}
        <a href="https://www.themoviedb.org/" target="_blank" rel="noopener noreferrer">
          The Movie Database (TMDb)
        </a>
      </p>
    </footer>
  )
}

export default Footer
