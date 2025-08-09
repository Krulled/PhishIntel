import React from 'react'
import ReactDOM from 'react-dom/client'
import './index.css'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import Home from './routes/Home'
import Scan from './routes/Scan'
import Guard from './routes/Guard'
import Login from './routes/Login'

const UI_AUTH_ENABLED = (import.meta.env.VITE_UI_AUTH_ENABLED || 'false').toString().toLowerCase() === 'true'

const routes = UI_AUTH_ENABLED ? [
  { path: '/login', element: <Login /> },
  { path: '/', element: <Guard><Home /></Guard> },
  { path: '/scan/:id', element: <Guard><Scan /></Guard> },
] : [
  { path: '/', element: <Home /> },
  { path: '/scan/:id', element: <Scan /> },
]

const router = createBrowserRouter(routes)

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <div data-theme="dark" className="min-h-screen bg-[#0b0e16]">
      <RouterProvider router={router} />
    </div>
  </React.StrictMode>,
)
