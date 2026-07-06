// Folder-driven route registry: Vite's import.meta.glob picks up every file
// in src/pages/ (subfolders included) and turns it into a route — adding a
// page never requires touching the router. URL = kebab-case of the file path
// (subfolders become URL segments); custom URLs live in config PATH_OVERRIDES.
import { PATH_OVERRIDES } from '@/config/navigation'

const modules = import.meta.glob('/src/pages/**/*.jsx', { eager: true })

const kebab = (s) => s.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase()

export const pages = Object.entries(modules)
  .map(([file, mod]) => {
    const rel = file.replace('/src/pages/', '').replace(/\.jsx$/, '')
    const name = rel.split('/').pop()
    const path = PATH_OVERRIDES[name] ?? '/' + rel.split('/').map(kebab).join('/')
    return { path, Component: mod.default }
  })
  .filter((p) => p.Component)

export const componentFor = (path) => pages.find((p) => p.path === path)?.Component