import { createBrowserRouter } from 'react-router'
import App from './App.tsx'
import Home from './pages/Home.tsx'
import NotFound from './pages/NotFound.tsx'

// Pages render inside App's <Outlet />, so they all share its layout.
export const router = createBrowserRouter([
  {
    path: '/',
    Component: App,
    children: [
      { index: true, Component: Home },
      { path: '*', Component: NotFound },
    ],
  },
])
