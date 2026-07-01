import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import * as customAuth from '@/lib/customAuth'

export default function ResetPassword() {
  const navigate = useNavigate()
  const resetToken = new URLSearchParams(window.location.search).get('token')

  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (password.length < 8) { setError('Password must be at least 8 characters'); return }
    if (password !== confirm) { setError('Passwords do not match'); return }
    setLoading(true)
    try {
      await customAuth.resetPassword({ reset_token: resetToken, new_password: password })
      setDone(true)
      setTimeout(() => navigate('/login'), 2500)
    } catch (err) {
      const msg = err?.response?.data?.error || err?.message || 'Something went wrong'
      setError(msg)
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm flex flex-col items-center gap-8">
        <div className="flex flex-col items-center gap-2 text-center">
          <h1 className="text-2xl font-bold font-heading text-foreground">Set a new password</h1>
          <p className="text-sm text-muted-foreground">
            {done ? 'Your password has been updated.' : 'Choose a new password for your account.'}
          </p>
        </div>

        {done ? (
          <p className="text-sm text-muted-foreground text-center">Redirecting you to sign in...</p>
        ) : !resetToken ? (
          <p className="text-sm text-destructive text-center">This reset link is invalid or missing its token.</p>
        ) : (
          <form onSubmit={handleSubmit} className="w-full flex flex-col gap-3">
            <input
              type="password"
              required
              placeholder="New password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border border-border bg-background px-4 py-3 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring"
            />
            <input
              type="password"
              required
              placeholder="Confirm new password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              className="w-full rounded-lg border border-border bg-background px-4 py-3 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring"
            />
            {error && <p className="text-xs text-destructive">{error}</p>}
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-primary text-primary-foreground px-4 py-3 text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {loading ? 'Updating...' : 'Update password'}
            </button>
          </form>
        )}

        <Link to="/login" className="text-xs text-muted-foreground">Back to sign in</Link>
      </div>
    </div>
  )
}