import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import Home from './routes/Home'
import Queue from './routes/Queue'
import Scan from './routes/Scan'

const router = createBrowserRouter([
  { path: '/', element: <Home /> },
  { path: '/queue', element: <Queue /> },
  { path: '/scan/:id', element: <Scan /> },
])

export default function App() {
  return <RouterProvider router={router} />
}
