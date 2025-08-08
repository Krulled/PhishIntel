import React from 'react'
import ReactDOM from 'react-dom/client'
import './index.css'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import Home from './routes/Home'
import Scan from './routes/Scan'

const router = createBrowserRouter([
  { path: '/', element: <Home /> },
  { path: '/scan/:id', element: <Scan /> },
])

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <div data-theme="dark">
      <RouterProvider router={router} />
    </div>
  </React.StrictMode>,
)
