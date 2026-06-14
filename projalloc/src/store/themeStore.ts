import { create } from 'zustand'

export type Theme = 'light' | 'dark'

const STORAGE_KEY = 'projalloc-theme'

function readStoredTheme(): Theme {
  try {
    const value = localStorage.getItem(STORAGE_KEY)
    return value === 'light' ? 'light' : 'dark'
  } catch {
    return 'dark'
  }
}

function applyTheme(theme: Theme) {
  document.documentElement.dataset.theme = theme
}

interface ThemeState {
  theme: Theme
  setTheme: (theme: Theme) => void
}

export const useThemeStore = create<ThemeState>((set) => ({
  theme: readStoredTheme(),
  setTheme: (theme) => {
    try {
      localStorage.setItem(STORAGE_KEY, theme)
    } catch {
      /* ignore */
    }
    applyTheme(theme)
    set({ theme })
  },
}))

export function initTheme() {
  applyTheme(readStoredTheme())
}
