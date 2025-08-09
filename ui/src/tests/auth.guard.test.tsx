import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { createMemoryRouter, RouterProvider } from 'react-router-dom'
import Guard from '../routes/Guard'

function setFlag(val: boolean) {
  ;(import.meta as any).env = { ...(import.meta as any).env, VITE_UI_AUTH_ENABLED: String(val) }
}

describe('Guard', () => {
  const Protected = () => <div data-testid="protected">Protected</div>
  const Login = () => <div data-testid="login">Login</div>

  beforeEach(() => {
    localStorage.clear()
  })

  afterEach(() => {
    localStorage.clear()
  })

  it('redirects to /login when enabled and no token', async () => {
    setFlag(true)
    const router = createMemoryRouter([
      { path: '/login', element: <Login /> },
      { path: '/', element: <Guard><Protected /></Guard> },
    ], { initialEntries: ['/'] })
    render(<RouterProvider router={router} />)
    expect(await screen.findByTestId('login')).toBeInTheDocument()
    expect(router.state.location.pathname).toBe('/login')
  })

  it('renders protected when token exists', async () => {
    setFlag(true)
    localStorage.setItem('phishintel_token', 'fake')
    const router = createMemoryRouter([
      { path: '/login', element: <Login /> },
      { path: '/', element: <Guard><Protected /></Guard> },
    ], { initialEntries: ['/'] })
    render(<RouterProvider router={router} />)
    expect(await screen.findByTestId('protected')).toBeInTheDocument()
  })

  it('does nothing when disabled', async () => {
    setFlag(false)
    const router = createMemoryRouter([
      { path: '/login', element: <Login /> },
      { path: '/', element: <Guard><Protected /></Guard> },
    ], { initialEntries: ['/'] })
    render(<RouterProvider router={router} />)
    expect(await screen.findByTestId('protected')).toBeInTheDocument()
  })
})