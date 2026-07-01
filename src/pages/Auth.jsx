import { useEffect } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { base44 } from '@/api/base44Client'

export default function Auth() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()

  useEffect(() => {
    // Check both query params (native deeplink) and hash (web OAuth redirect)
    const hash         = new URLSearchParams(window.location.hash.substring(1))
    const accessToken  = searchParams.get('access_token')  || hash.get('access_token')
    const refreshToken = searchParams.get('refresh_token') || hash.get('refresh_token') || ''
    const error        = searchParams.get('error')         || hash.get('error')

    if (error) {
      console.error('Auth error:', error)
      navigate('/login')
      return
    }

    if (accessToken) {
      // Use Base44's setToken to establish the session, then hard redirect
      base44.auth.setToken(accessToken)
      window.location.href = '/'
    }
  }, [searchParams, navigate])

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin" />
        <p className="text-sm text-muted-foreground">Signing you in...</p>
      </div>
    </div>
  )
}