// Anti-freeze helpers for native (Despia) bridge calls. See ANTI_FREEZE.md.
//
// The Despia bridge has NO guaranteed callback: if the native side never
// answers (feature disabled, old shell build, web preview edge case), an
// awaited `despia(...)` promise can hang for 15–30s until the SDK times out.
// UI state must NEVER be held hostage by that. Two tools:
//
//   raceTimeout(promise, fallback, ms) — hard-cap ANY await; resolves with
//     `fallback` if the bridge doesn't answer in time. The original call keeps
//     running in the background and its late result is simply ignored.
//
//   withCappedBusy(setBusy, task, ms)  — for buttons: show the busy state for
//     AT MOST `ms` (default 2s), then restore the button no matter what, while
//     the task keeps running in the background and still applies its result
//     (e.g. a biometric prompt the user is slow to answer).

export const BUSY_CAP_MS = 2000
export const NATIVE_TIMEOUT_MS = 2000

// Resolve with `fallback` if `promise` hasn't settled within `ms`.
// A late rejection after the timeout is swallowed (never an unhandled rejection).
export function raceTimeout(promise, fallback = undefined, ms = NATIVE_TIMEOUT_MS) {
  const task = Promise.resolve(promise)
  task.catch(() => {}) // silence late rejections once the race is decided
  return Promise.race([
    task,
    new Promise((resolve) => setTimeout(() => resolve(fallback), ms)),
  ])
}

// Run `task()` with `setBusy(true)`, but force-release the busy state after
// `capMs` even if the task is still running. The task itself is still awaited
// and its result returned — only the VISUAL blocking is capped.
export async function withCappedBusy(setBusy, task, capMs = BUSY_CAP_MS) {
  setBusy(true)
  const timer = setTimeout(() => setBusy(false), capMs)
  try {
    return await task()
  } finally {
    clearTimeout(timer)
    setBusy(false)
  }
}