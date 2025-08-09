import { describe, it, expect, beforeEach, vi } from 'vitest'
import { createMemoryRouter, RouterProvider } from 'react-router-dom'
import { render, screen } from '@testing-library/react'
import React from 'react'

// Force-enable UI auth for tests via override used by Guard
;(globalThis as any).__UI_AUTH_ENABLED__ = 'true'

vi.mock('../services/apiClient', async (orig) => {
  const mod = await (orig as any)()
  return {
    ...mod,
    getScan: vi.fn().mockResolvedValue(null),
  }
})

import Home from '../routes/Home'
import Scan from '../routes/Scan'
import Guard from '../routes/Guard'
import Login from '../routes/Login'

function setupRouter(initialEntries: string[]) {
  const routes = [
    { path: '/login', element: <Login /> },
    { path: '/', element: <Guard><Home /></Guard> },
    { path: '/scan/:id', element: <Guard><Scan /></Guard> },
  ]
  return createMemoryRouter(routes, { initialEntries })
}

describe('Guard + Login', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('redirects to /login when no token', async () => {
    const router = setupRouter(['/scan/abc'])
    render(<RouterProvider router={router} />)
    const heading = await screen.findByRole('heading', { level: 1, name: /Sign in/i })
    expect(heading).toBeInTheDocument()
  })

  it('renders protected route when token present', async () => {
    localStorage.setItem('phishintel_token', 'fake')
    const router = setupRouter(['/scan/abc'])
    render(<RouterProvider router={router} />)
    expect(await screen.findByText(/Scan not found/i)).toBeInTheDocument()
  })
})