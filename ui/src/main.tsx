import React from 'react'
import ReactDOM from 'react-dom/client'
import './index.css'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import Home from './routes/Home'
import Scan from './routes/Scan'
import Guard from './routes/Guard'
import Login from './routes/Login'
import AuthControls from './components/AuthControls'

const UI_AUTH_ENABLED = ((import.meta as any).env?.VITE_UI_AUTH_ENABLED || 'false') === 'true'

const router = createBrowserRouter([
  UI_AUTH_ENABLED ? { path: '/login', element: <Login /> } : undefined,
  UI_AUTH_ENABLED
    ? { path: '/', element: <Guard><Home /></Guard> }
    : { path: '/', element: <Home /> },
  UI_AUTH_ENABLED
    ? { path: '/scan/:id', element: <Guard><Scan /></Guard> }
    : { path: '/scan/:id', element: <Scan /> },
].filter(Boolean) as any)

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <div data-theme="dark" className="min-h-screen bg-[#0b0e16]">
      <AuthControls />
      <RouterProvider router={router} />
    </div>
  </React.StrictMode>,
)
