import { Navigate, useLocation } from 'react-router-dom'

export default function Guard({ children }: { children: JSX.Element }) {
  const enabled = (import.meta.env.VITE_UI_AUTH_ENABLED || 'false').toString().toLowerCase() === 'true'
  if (!enabled) return children
  const token = typeof window !== 'undefined' ? localStorage.getItem('phishintel_token') : null
  const location = useLocation()
  if (!token) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }
  return children
}