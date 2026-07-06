// Profile card shown on the login screen when a signed-in account is remembered
// on this device — avatar (or initials), name, and email above the Continue CTA.
export default function SavedAccountCard({ account }) {
  const initial = (account.full_name || account.email || '?').charAt(0).toUpperCase()
  return (
    <div className="flex flex-col items-center gap-3 mb-3">
      {account.avatar_url ? (
        <img
          src={account.avatar_url}
          alt=""
          className="w-16 h-16 rounded-full object-cover ember-glass"
        />
      ) : (
        <div className="w-16 h-16 rounded-full ember-glass flex items-center justify-center text-2xl font-bold text-foreground">
          {initial}
        </div>
      )}
      <div className="text-center min-w-0">
        <p className="text-[16px] font-semibold text-foreground truncate max-w-[16rem]">
          {account.full_name || account.email}
        </p>
        {account.full_name && account.email && (
          <p className="text-[13px] text-muted-foreground truncate max-w-[16rem]">{account.email}</p>
        )}
      </div>
    </div>
  )
}