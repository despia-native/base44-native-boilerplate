import { useEffect, useState } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import * as customAuth from '@/lib/customAuth'
import { useAuth } from '@/lib/AuthContext'

export default function Auth() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { checkUserAuth } = useAuth()
  const [status, setStatus] = useState('Signing you in...')

  useEffect(() => {
    // Google token arrives either on the query (native deeplink) or the hash (web redirect).
    const hash = new URLSearchParams(window.location.hash.substring(1))
    const token = searchParams.get('token') || searchParams.get('access_token') || hash.get('access_token')
    const error = searchParams.get('error') || hash.get('error')

    if (error) {
      setStatus('Sign-in error: ' + error)
      setTimeout(() => navigate('/login'), 3000)
      return
    }

    if (!token) {
      setStatus('No sign-in token received.')
      setTimeout(() => navigate('/login'), 3000)
      return
    }

    setStatus('Verifying your account...')
    customAuth.loginWithGoogleToken(token)
      .then(async () => {
        await checkUserAuth()
        window.location.href = '/'
      })
      .catch((err) => {
        const msg = err?.response?.data?.error || err?.message || 'Unknown error'
        setStatus('Sign-in failed: ' + msg)
        setTimeout(() => navigate('/login'), 3000)
      })
  }, [searchParams, navigate, checkUserAuth])

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-6">
      <div className="flex flex-col items-center gap-4">
        <div className="w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin" />
        <p className="text-sm text-muted-foreground text-center">{status}</p>
      </div>
    </div>
  )
}