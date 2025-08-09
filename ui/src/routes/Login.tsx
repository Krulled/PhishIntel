import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { login } from '../services/apiClient'

export default function Login() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const location = useLocation() as any

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const res = await login(username, password)
      if ((res as any).error) {
        const err = (res as any).error
        setError(err === 'auth_disabled' ? 'Authentication is disabled on the server' : 'Invalid credentials')
        return
      }
      const redirectTo = location?.state?.from || '/scan/placeholder'
      navigate(redirectTo, { replace: true })
    } catch (e: any) {
      setError(e?.message || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-[#0b0e16] text-white">
      <section className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center px-4">
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-semibold">Sign in</h1>
          <p className="mt-1 text-sm text-gray-400">Enter your credentials to continue</p>
        </div>
        <form onSubmit={onSubmit} className="w-full space-y-3">
          <input className="w-full rounded-lg border border-white/10 bg-black/30 px-4 py-3 outline-none ring-1 ring-white/5 focus:ring-indigo-400" placeholder="Username" value={username} onChange={(e)=>setUsername(e.target.value)} autoFocus />
          <input className="w-full rounded-lg border border-white/10 bg-black/30 px-4 py-3 outline-none ring-1 ring-white/5 focus:ring-indigo-400" placeholder="Password" type="password" value={password} onChange={(e)=>setPassword(e.target.value)} />
          <button disabled={loading} className="w-full rounded-lg bg-indigo-500 px-4 py-3 font-medium text-white hover:bg-indigo-400 disabled:opacity-60" type="submit">{loading? 'Signing in…':'Sign in'}</button>
        </form>
        {error && <div role="alert" className="mt-4 w-full rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-200">{error}</div>}
      </section>
    </main>
  )
}