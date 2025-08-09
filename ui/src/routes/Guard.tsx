import { Navigate, useLocation } from 'react-router-dom'

declare global {
  // eslint-disable-next-line no-var
  var __UI_AUTH_ENABLED__: string | boolean | undefined
}

export default function Guard({ children }: { children: JSX.Element }) {
  const raw = typeof globalThis !== 'undefined' && typeof (globalThis as any).__UI_AUTH_ENABLED__ !== 'undefined'
    ? (globalThis as any).__UI_AUTH_ENABLED__
    : (import.meta.env.VITE_UI_AUTH_ENABLED || 'false')
  const enabled = String(raw).toLowerCase() === 'true'
  if (!enabled) return children
  const token = typeof window !== 'undefined' ? localStorage.getItem('phishintel_token') : null
  const location = useLocation()
  if (!token) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }
  return children
}