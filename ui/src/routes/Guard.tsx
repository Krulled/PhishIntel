import { Navigate, useLocation } from 'react-router-dom'

const UI_AUTH_ENABLED = (import.meta.env.VITE_UI_AUTH_ENABLED || 'false').toString().toLowerCase() === 'true'

export default function Guard({ children }: { children: JSX.Element }) {
  if (!UI_AUTH_ENABLED) return children
  const token = typeof window !== 'undefined' ? localStorage.getItem('phishintel_token') : null
  const location = useLocation()
  if (!token) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }
  return children
}