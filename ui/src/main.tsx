import React from 'react'
import { createRoot } from 'react-dom/client'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import Home from './routes/Home'
import Scan from './routes/Scan'
import './index.css'

const router = createBrowserRouter([
  { path: '/', element: <Home /> },
  { path: '/scan/:uuid', element: <Scan /> },
])

const el = document.getElementById('root')!
createRoot(el).render(<React.StrictMode><RouterProvider router={router} /></React.StrictMode>)
