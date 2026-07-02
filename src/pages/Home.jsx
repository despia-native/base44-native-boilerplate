import { useNavigate } from 'react-router-dom'
import { UserCircle, Users } from 'lucide-react'
import { useAuth } from '@/lib/AuthContext'
import ListRow from '@/components/mobile/ListRow'

export default function Home() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const isAdmin = user?.role === 'admin'

  return (
    <div className="flex flex-col h-full bg-muted/40">
      {/* Fixed top bar */}
      <header className="shrink-0 pt-safe-top bg-background/80 backdrop-blur-xl border-b border-border/60">
        <div className="h-11 flex items-center justify-center">
          <h1 className="text-[17px] font-semibold text-foreground">Home</h1>
        </div>
      </header>

      {/* Scrollable content */}
      <div className="scroll-container px-5 pb-safe-bottom">
        <div className="pt-8 pb-6">
          <h2 className="text-[28px] font-bold tracking-tight text-foreground">
            Hello{user?.full_name ? `, ${user.full_name.split(' ')[0]}` : ''}
          </h2>
          <p className="mt-1 text-[15px] text-muted-foreground">
            Welcome back to your app.
          </p>
        </div>

        <div className="rounded-2xl bg-card border border-border/60 overflow-hidden shadow-sm">
          <ListRow
            icon={UserCircle}
            iconBg="bg-primary/10"
            iconColor="text-primary"
            label="Account"
            onClick={() => navigate('/account')}
            first
          />
          {isAdmin && (
            <ListRow
              icon={Users}
              iconBg="bg-secondary/15"
              iconColor="text-secondary"
              label="Manage users"
              onClick={() => navigate('/admin/users')}
            />
          )}
        </div>
      </div>
    </div>
  )
}