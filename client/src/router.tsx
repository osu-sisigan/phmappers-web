import { createBrowserRouter } from 'react-router'
import App from './App.tsx'
import Database from './pages/Database.tsx'
import Home from './pages/Home.tsx'
import Leaderboards from './pages/Leaderboards.tsx'
import NotFound from './pages/NotFound.tsx'
import Visualization from './pages/Visualization.tsx'

// Pages render inside App's <Outlet />, so they all share its layout.
export const router = createBrowserRouter([
  {
    path: '/',
    Component: App,
    children: [
      { index: true, Component: Home },
      { path: 'database', Component: Database },
      { path: 'leaderboards', Component: Leaderboards },
      { path: 'visualization', Component: Visualization },
      { path: '*', Component: NotFound },
    ],
  },
])
