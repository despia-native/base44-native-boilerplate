import { Users, Activity, UserPlus } from 'lucide-react'

// Signup overview cards: total accounts, active in the last 7 days, new this week.
export default function UserStats({ total, active, fresh }) {
  const stats = [
    { icon: Users, label: 'Total', value: total, color: 'text-primary', bg: 'bg-primary/10' },
    { icon: Activity, label: 'Active 7d', value: active, color: 'text-secondary', bg: 'bg-secondary/15' },
    { icon: UserPlus, label: 'New 7d', value: fresh, color: 'text-foreground/70', bg: 'bg-muted' },
  ]
  return (
    <div className="grid grid-cols-3 gap-3 mb-4">
      {stats.map((s) => (
        <div key={s.label} className="rounded-3xl ember-card p-3.5 flex flex-col items-start gap-2">
          <span className={`flex items-center justify-center w-8 h-8 rounded-full ${s.bg}`}>
            <s.icon className={`w-4 h-4 ${s.color}`} />
          </span>
          <div>
            <p className="text-[20px] font-bold leading-none text-foreground">{s.value}</p>
            <p className="mt-1 text-[11px] font-medium text-muted-foreground">{s.label}</p>
          </div>
        </div>
      ))}
    </div>
  )
}