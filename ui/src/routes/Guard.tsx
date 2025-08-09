import { Navigate, useLocation } from 'react-router-dom'

function isUiAuthEnabled(): boolean {
  const envFlag = ((import.meta as any).env?.VITE_UI_AUTH_ENABLED || 'false')
  const override = (globalThis as any).__UI_AUTH_ENABLED__
  return (override ?? envFlag) === 'true'
}

function hasToken(): boolean {
  try { return !!localStorage.getItem('phishintel_token') } catch { return false }
}

export default function Guard({ children }: { children: React.ReactNode }) {
  const location = useLocation()
  const enabled = isUiAuthEnabled()
  if (enabled && !hasToken()) {
    return <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />
  }
  return <>{children}</>
}