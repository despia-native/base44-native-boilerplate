import { useEffect, useState } from 'react'
import { base44 } from '@/api/base44Client'

export default function Home() {
  const [user, setUser] = useState(null)

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {})
  }, [])

  const handleLogout = () => {
    base44.auth.logout('/login')
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background px-4 gap-6">
      <div className="flex flex-col items-center gap-2 text-center">
        <div className="w-16 h-16 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-2xl font-bold">
          {user?.full_name?.[0] || user?.email?.[0] || '?'}
        </div>
        <h1 className="text-xl font-bold font-heading text-foreground">
          {user?.full_name || 'Welcome!'}
        </h1>
        <p className="text-sm text-muted-foreground">{user?.email}</p>
      </div>

      <button
        onClick={handleLogout}
        className="px-6 py-2 rounded-lg border border-border text-sm text-muted-foreground hover:bg-muted transition-colors"
      >
        Sign out
      </button>
    </div>
  )
}