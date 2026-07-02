import { Link } from 'react-router-dom'
import { Users, ChevronRight } from 'lucide-react'
import { useAuth } from '@/lib/AuthContext'

export default function Home() {
  const { user, logout } = useAuth()

  return (
    <div className="scroll-container flex flex-col items-center justify-center bg-background px-6 pt-safe-top pb-safe-bottom">
      <div className="w-full max-w-sm flex flex-col items-center">
        {/* Avatar + identity */}
        <div className="flex flex-col items-center text-center">
          {user?.avatar_url ? (
            <img
              src={user.avatar_url}
              alt=""
              className="w-24 h-24 rounded-full object-cover ring-1 ring-black/5 shadow-sm"
            />
          ) : (
            <div className="w-24 h-24 rounded-full bg-gradient-to-b from-muted to-secondary flex items-center justify-center text-foreground/80 text-3xl font-semibold ring-1 ring-black/5 shadow-sm">
              {user?.full_name?.[0] || user?.email?.[0] || '?'}
            </div>
          )}
          <h1 className="mt-5 text-2xl font-semibold tracking-tight text-foreground">
            {user?.full_name || 'Welcome'}
          </h1>
          {user?.email && (
            <p className="mt-1 text-sm text-muted-foreground">{user.email}</p>
          )}
          {user?.role === 'admin' && (
            <span className="mt-3 inline-flex items-center rounded-full bg-secondary px-3 py-1 text-xs font-medium text-secondary-foreground">
              Administrator
            </span>
          )}
        </div>

        {/* Actions */}
        <div className="mt-10 w-full space-y-3">
          {user?.role === 'admin' && (
            <Link
              to="/admin/users"
              className="flex items-center gap-3 w-full rounded-2xl bg-card border border-border/60 px-4 py-3.5 shadow-sm active:scale-[0.99] transition-transform"
            >
              <span className="flex items-center justify-center w-9 h-9 rounded-full bg-secondary">
                <Users className="w-4.5 h-4.5 text-foreground/70" />
              </span>
              <span className="flex-1 text-left text-sm font-medium text-foreground">
                Manage users
              </span>
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            </Link>
          )}

          <button
            onClick={() => logout()}
            className="w-full rounded-2xl bg-card border border-border/60 px-4 py-3.5 text-sm font-medium text-destructive shadow-sm active:scale-[0.99] transition-transform"
          >
            Sign out
          </button>
        </div>
      </div>
    </div>
  )
}