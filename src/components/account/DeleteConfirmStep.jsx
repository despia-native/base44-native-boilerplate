import { useState } from 'react'
import { Fingerprint } from 'lucide-react'
import GoogleIcon from '@/components/GoogleIcon'
import AppleIcon from '@/components/AppleIcon'

// Step 2 of account deletion — verify identity with the account's ORIGINAL
// sign-in method: password → password, Google → Google, Apple → Apple.
// Guests (no method): biometrics on native, type-DELETE on web.
export default function DeleteConfirmStep({ methods, native, busy, onPassword, onGoogle, onApple, onBiometric, onTypeConfirm }) {
  const [password, setPassword] = useState('')
  const [confirmText, setConfirmText] = useState('')
  const hasMethod = methods.password || methods.google || methods.apple
  const dangerBtn = 'w-full h-14 flex items-center justify-center gap-2.5 rounded-full ember-danger text-[16px] font-bold disabled:opacity-40'

  if (methods.password) {
    return (
      <form onSubmit={(e) => { e.preventDefault(); onPassword(password) }} className="flex flex-col gap-3">
        <input type="password" required placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} className="ember-input" />
        <button type="submit" disabled={busy || !password} className={dangerBtn}>
          {busy ? <span className="ember-spinner" /> : 'Confirm with password'}
        </button>
      </form>
    )
  }
  if (methods.google) {
    return (
      <button type="button" disabled={busy} onClick={onGoogle} className={dangerBtn}>
        {busy ? <span className="ember-spinner" /> : <><GoogleIcon className="w-5 h-5" /> Confirm with Google</>}
      </button>
    )
  }
  if (methods.apple) {
    return (
      <button type="button" disabled={busy} onClick={onApple} className={dangerBtn}>
        {busy ? <span className="ember-spinner" /> : <><AppleIcon className="w-5 h-5" /> Confirm with Apple</>}
      </button>
    )
  }
  if (!hasMethod && native) {
    return (
      <button type="button" disabled={busy} onClick={onBiometric} className={dangerBtn}>
        {busy ? <span className="ember-spinner" /> : <><Fingerprint className="w-5 h-5" /> Confirm with biometrics</>}
      </button>
    )
  }
  return (
    <form onSubmit={(e) => { e.preventDefault(); onTypeConfirm() }} className="flex flex-col gap-3">
      <input type="text" required autoComplete="off" placeholder="Type DELETE to confirm" value={confirmText} onChange={(e) => setConfirmText(e.target.value)} className="ember-input" />
      <button type="submit" disabled={busy || confirmText.trim().toUpperCase() !== 'DELETE'} className={dangerBtn}>
        {busy ? <span className="ember-spinner" /> : 'Permanently delete'}
      </button>
    </form>
  )
}