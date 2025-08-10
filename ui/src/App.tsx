import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import Home from './routes/Home'
import Queue from './routes/Queue'
import Scan from './routes/Scan'
import Terms from './routes/Terms'
import Privacy from './routes/Privacy'
import Security from './routes/Security'

const router = createBrowserRouter([
  { path: '/', element: <Home /> },
  { path: '/queue', element: <Queue /> },
  { path: '/scan/:id', element: <Scan /> },
  { path: '/terms', element: <Terms /> },
  { path: '/privacy', element: <Privacy /> },
  { path: '/security', element: <Security /> },
])

export default function App() {
  return <RouterProvider router={router} />
}

