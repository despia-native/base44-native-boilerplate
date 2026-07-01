import { useState } from 'react'
import { Link } from 'react-router-dom'
import * as customAuth from '@/lib/customAuth'

export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    // Always show generic success — never reveal whether the email exists.
    await customAuth.requestPasswordReset(email).catch(() => {})
    setSent(true)
    setLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm flex flex-col items-center gap-8">
        <div className="flex flex-col items-center gap-2 text-center">
          <h1 className="text-2xl font-bold font-heading text-foreground">Reset password</h1>
          <p className="text-sm text-muted-foreground">
            {sent ? 'Check your inbox for a reset link.' : "Enter your email and we'll send you a reset link."}
          </p>
        </div>

        {sent ? (
          <p className="text-sm text-muted-foreground text-center">
            If an account exists for <span className="font-medium text-foreground">{email}</span>, a reset link is on its way. The link expires in 30 minutes.
          </p>
        ) : (
          <form onSubmit={handleSubmit} className="w-full flex flex-col gap-3">
            <input
              type="email"
              required
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg border border-border bg-background px-4 py-3 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring"
            />
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-primary text-primary-foreground px-4 py-3 text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {loading ? 'Sending...' : 'Send reset link'}
            </button>
          </form>
        )}

        <Link to="/login" className="text-xs text-muted-foreground">Back to sign in</Link>
      </div>
    </div>
  )
}