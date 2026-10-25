'use client'

import { useSyncExternalStore } from 'react'

type Theme = 'light' | 'dark'
const storageKey = 'fieldobserver-theme'

function systemTheme(): Theme {
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

function savedTheme(): Theme | null {
  try {
    const value = localStorage.getItem(storageKey)
    return value === 'light' || value === 'dark' ? value : null
  } catch {
    return null
  }
}

function subscribe(onChange: () => void) {
  const media = window.matchMedia('(prefers-color-scheme: dark)')
  const sync = () => {
    document.documentElement.setAttribute('data-theme', savedTheme() ?? systemTheme())
    onChange()
  }
  const onStorage = (event: StorageEvent) => {
    if (event.key === storageKey || event.key === null) sync()
  }
  const onSystemChange = () => { if (!savedTheme()) sync() }
  window.addEventListener('fieldobserver-theme-change', onChange)
  window.addEventListener('storage', onStorage)
  media.addEventListener('change', onSystemChange)
  return () => {
    window.removeEventListener('fieldobserver-theme-change', onChange)
    window.removeEventListener('storage', onStorage)
    media.removeEventListener('change', onSystemChange)
  }
}

function getSnapshot(): Theme {
  return document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light'
}

export default function ThemeSwitch() {
  const theme = useSyncExternalStore(subscribe, getSnapshot, () => 'light' as Theme)
  const setTheme = (value: Theme) => {
    document.documentElement.setAttribute('data-theme', value)
    try { localStorage.setItem(storageKey, value) } catch { /* Keep the theme usable when storage is unavailable. */ }
    window.dispatchEvent(new Event('fieldobserver-theme-change'))
  }

  return (
    <div className="theme-switch" role="group" aria-label="Tema tampilan">
      {(['light', 'dark'] as const).map(value => (
        <button key={value} type="button" data-theme-option={value} aria-pressed={theme === value} onClick={() => setTheme(value)}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            {value === 'light' ? <><circle cx="12" cy="12" r="4" /><path d="M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1.5 1.5m11 11L19 19M5 19l1.5-1.5m11-11L19 5" /></> : <path d="M20.5 14A9 9 0 0 1 10 3.5 9 9 0 1 0 20.5 14Z" />}
          </svg>
          <span>{value === 'light' ? 'Light' : 'Dark'}</span>
        </button>
      ))}
    </div>
  )
}
