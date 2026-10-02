import { NavLink, Outlet } from 'react-router'

// Shared layout for every page; the matched child route renders in <Outlet />.
function App() {
  return (
    <>
      <header>
        <nav>
          <NavLink to="/">Home</NavLink>
          <NavLink to="/database">Database</NavLink>
          <NavLink to="/leaderboards">Leaderboards</NavLink>
          <NavLink to="/visualization">Visualization</NavLink>
          {/* Plain <a>, not <Link>: this must be a full page load so the
              request reaches Express instead of the client-side router. */}
          <a href="/auth/osu">Log in with osu!</a>
        </nav>
      </header>
      <main>
        <Outlet />
      </main>
    </>
  )
}

export default App
