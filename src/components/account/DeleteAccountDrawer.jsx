import { useState } from 'react'
import { Trash2, ShieldAlert } from 'lucide-react'
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from '@/components/ui/drawer'
import * as customAuth from '@/lib/customAuth'
import { confirmWithLockedVault } from '@/lib/biometricConfirm'
import { startGoogleReauth, startAppleReauth } from '@/lib/reauth'
import { isNative } from '@/lib/deviceAuth'
import { haptics } from '@/lib/haptics'
import DeleteConfirmStep from '@/components/account/DeleteConfirmStep'

// Two-step account deletion (see src/ACCOUNT_DELETION.md):
// 1. Warning drawer — the user explicitly confirms they want to delete.
// 2. Identity check with the account's ORIGINAL sign-in method:
//    password → password · Google → Google re-auth · Apple → Apple re-auth.
//    Guests (no method): biometrics on native (locked Storage Vault read).
//    Google (and Apple on Android) round-trips through OAuth; Auth.jsx
//    finishes the deletion after the provider confirms identity.
export default function DeleteAccountDrawer({ open, onOpenChange, account, onDeleted }) {
  const native = isNative()
  const methods = account?.auth_methods || {}
  const [step, setStep] = useState(1)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const close = (o) => {
    onOpenChange(o)
    if (!o) { setStep(1); setError(''); setBusy(false) }
  }

  const doDelete = async () => {
    try {
      await customAuth.deleteAccount()
      haptics.success?.()
      onDeleted()
    } catch (err) {
      setError(err?.response?.data?.error || err?.message || 'Deletion failed — please try again.')
      setBusy(false)
    }
  }

  const handlePassword = async (password) => {
    setError('')
    setBusy(true)
    try {
      await customAuth.verifyPassword(account.email, password)
    } catch {
      haptics.error?.()
      setError('Incorrect password')
      setBusy(false)
      return
    }
    await doDelete()
  }

  const handleGoogle = async () => {
    setError('')
    setBusy(true)
    haptics.heavy?.()
    try {
      await startGoogleReauth(account.id) // navigates away; Auth.jsx completes the deletion
    } catch (err) {
      setError(err?.response?.data?.error || err?.message || 'Could not start Google confirmation')
      setBusy(false)
    }
  }

  const handleApple = async () => {
    setError('')
    setBusy(true)
    haptics.heavy?.()
    try {
      const result = await startAppleReauth(account.id)
      if (!result) return // Android: continues via deeplink → /auth
      await customAuth.reauthWithAppleToken(result.idToken)
      await doDelete()
    } catch (err) {
      if (err?.error === 'popup_closed_by_user') { setBusy(false); return }
      haptics.error?.()
      setError(err?.response?.data?.error || err?.message || 'Apple confirmation failed')
      setBusy(false)
    }
  }

  const handleBiometric = async () => {
    setError('')
    setBusy(true)
    haptics.heavy?.()
    const ok = await confirmWithLockedVault()
    if (!ok) {
      haptics.error?.()
      setError('Biometric confirmation failed — please try again.')
      setBusy(false)
      return
    }
    await doDelete()
  }

  const handleTypeConfirm = async () => {
    setError('')
    setBusy(true)
    await doDelete()
  }

  const step2Text = methods.password
    ? 'Enter your password to permanently delete this account.'
    : methods.google
      ? 'Re-authenticate with Google to permanently delete this account.'
      : methods.apple
        ? 'Re-authenticate with Apple to permanently delete this account.'
        : native
          ? 'Verify it\u2019s you to permanently delete this account.'
          : 'Type DELETE below to permanently delete this account.'

  return (
    <Drawer open={open} onOpenChange={close}>
      <DrawerContent>
        <DrawerHeader className="pb-1 pt-3">
          <DrawerTitle className="text-[17px] font-semibold text-center">
            {step === 1 ? 'Delete account?' : 'Confirm deletion'}
          </DrawerTitle>
        </DrawerHeader>
        <div className="px-5 pt-2 flex flex-col gap-3" style={{ paddingBottom: 'calc(var(--safe-area-bottom, 0px) + 20px)' }}>
          <div className="w-14 h-14 rounded-full bg-destructive/10 flex items-center justify-center self-center">
            {step === 1 ? <Trash2 className="w-7 h-7 text-destructive" /> : <ShieldAlert className="w-7 h-7 text-destructive" />}
          </div>
          <p className="text-[14px] text-muted-foreground text-center leading-snug px-2">
            {step === 1
              ? native
                ? 'Your account and all personal data will be permanently deleted. This cannot be undone. Purchases made on this device stay with the device.'
                : 'Your account and all its data will be permanently deleted. This cannot be undone.'
              : step2Text}
          </p>

          {error && <p className="text-[13px] text-destructive text-center">{error}</p>}

          {step === 1 ? (
            <>
              <button
                type="button"
                onClick={() => { haptics.heavy?.(); setStep(2) }}
                className="w-full h-14 rounded-full ember-danger text-[16px] font-bold"
              >
                Delete my account
              </button>
              <button
                type="button"
                onClick={() => close(false)}
                className="w-full h-14 rounded-full ember-glass ember-press text-[16px] font-semibold text-foreground"
              >
                Cancel
              </button>
            </>
          ) : (
            <>
              <DeleteConfirmStep
                methods={methods}
                native={native}
                busy={busy}
                onPassword={handlePassword}
                onGoogle={handleGoogle}
                onApple={handleApple}
                onBiometric={handleBiometric}
                onTypeConfirm={handleTypeConfirm}
              />
              <button
                type="button"
                onClick={() => close(false)}
                className="w-full h-12 rounded-full text-[15px] font-semibold text-muted-foreground"
              >
                Cancel
              </button>
            </>
          )}
        </div>
      </DrawerContent>
    </Drawer>
  )
}