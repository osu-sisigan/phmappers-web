import { NavLink, Outlet } from 'react-router'

// Shared layout for every page; the matched child route renders in <Outlet />.
function App() {
  return (
    <>
      <header>
        <nav>
          <NavLink to="/">Home</NavLink>
        </nav>
      </header>
      <main>
        <Outlet />
      </main>
    </>
  )
}

export default App
