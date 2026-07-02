// Revalidates session + refetches data whenever the app returns to the foreground.
// Renders nothing — it just wires the lifecycle. Must sit inside AuthProvider and
// QueryClientProvider.
import { useQueryClient } from '@tanstack/react-query'
import { useAuth } from '@/lib/AuthContext'
import { useAppFocus } from '@/lib/useAppFocus'

export default function AppFocusHandler() {
  const { checkUserAuth } = useAuth()
  const queryClient = useQueryClient()

  useAppFocus({
    onForeground: () => {
      // Re-check the session (token may have expired while backgrounded)
      // and refresh any active queries so the user sees fresh data on resume.
      checkUserAuth()
      queryClient.invalidateQueries()
    },
  })

  return null
}