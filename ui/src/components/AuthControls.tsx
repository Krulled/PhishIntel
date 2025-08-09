import { useNavigate } from 'react-router-dom'
import { clearToken } from '../services/apiClient'

const UI_AUTH_ENABLED = ((import.meta as any).env?.VITE_UI_AUTH_ENABLED || 'false') === 'true'

export default function AuthControls() {
  const navigate = useNavigate()
  if (!UI_AUTH_ENABLED) return null
  const has = (()=>{ try {return !!localStorage.getItem('phishintel_token')} catch {return false} })()
  if (!has) return null
  return (
    <div className="fixed right-4 top-4 z-50">
      <button
        className="rounded bg-white/10 px-3 py-2 text-xs text-white hover:bg-white/15"
        onClick={() => { clearToken(); navigate('/login', { replace: true }) }}
      >Logout</button>
    </div>
  )
}