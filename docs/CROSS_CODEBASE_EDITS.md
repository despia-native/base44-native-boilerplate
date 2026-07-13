# Cross-Codebase Edit Discipline

Rules for making a change EVERYWHERE it applies — not just in the first file
found. Written after a real miss: the 2s provider-button loader was added to
the Login page buttons but skipped in the AccountPickerDrawer, which renders
the SAME Google/Apple actions.

## The core rule

> A UI behavior belongs to the ACTION, not to one button. Before editing,
> enumerate every surface that triggers the same action, then edit all of them
> in the same change.

## Mandatory checklist before any edit ships

1. **Find every surface.** Grep for the handler / action name (e.g.
   `handleGoogleSignIn`, `onGoogle`, `signInWithApple`) across `src/`.
   Every callsite is a candidate surface for the change.
2. **Find every duplicate of the pattern.** The same visual pattern often
   exists in a page AND a drawer/sheet/modal/menu. Known duplicated surfaces
   in this app:
   - Google/Apple/Email sign-in: `src/pages/Login.jsx` (CTA stack) **and**
     `src/components/onboarding/AccountPickerDrawer.jsx` (bottom sheet).
   - Saved-account entry: `SavedAccountCard` (Login) **and**
     `SavedAccountRow` (drawer).
   - Link-account actions: `src/pages/Account.jsx` **and**
     `src/pages/LinkAccount.jsx`.
3. **Never lose existing state or behavior.** Adding a feature to a component
   must not drop props, handlers, styles, or conditional branches already
   there. Diff mentally against the previous version: everything that existed
   before must still exist unless its removal was the request.
4. **Keep the pattern identical across surfaces.** Same state shape
   (`btnLoading: 'google' | 'apple' | ''`), same duration, same spinner class
   (`.ember-spinner`), same disabled behavior — so surfaces never drift.
5. **Check the interaction between surfaces.** e.g. the drawer must stay open
   while its loader shows; closing it on tap would make the loader invisible.
6. **Update docs in the same change** when behavior or conventions change
   (this file, `docs/ROUTER.md`, etc.).

## Current convention: provider-button tap loader

- Hardcoded 2 seconds, no state check: `setBtnLoading(x)` +
  `setTimeout(() => setBtnLoading(''), 2000)`.
- Spinner: `<span className="ember-spinner" aria-label="Loading" />`.
- Button is `disabled` while its loader shows.
- Applies to Google and Apple buttons on **both** the Login page and the
  AccountPickerDrawer.