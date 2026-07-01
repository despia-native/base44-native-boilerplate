import { useAuth } from '@/lib/AuthContext'

export default function Home() {
  const { user, logout } = useAuth()

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background px-4 gap-6">
      <div className="flex flex-col items-center gap-2 text-center">
        {user?.avatar_url ? (
          <img src={user.avatar_url} alt="" className="w-16 h-16 rounded-full object-cover" />
        ) : (
          <div className="w-16 h-16 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-2xl font-bold">
            {user?.full_name?.[0] || user?.email?.[0] || '?'}
          </div>
        )}
        <h1 className="text-xl font-bold font-heading text-foreground">
          {user?.full_name || 'Welcome!'}
        </h1>
        <p className="text-sm text-muted-foreground">{user?.email}</p>
      </div>

      <button
        onClick={() => logout()}
        className="px-6 py-2 rounded-lg border border-border text-sm text-muted-foreground hover:bg-muted transition-colors"
      >
        Sign out
      </button>
    </div>
  )
}