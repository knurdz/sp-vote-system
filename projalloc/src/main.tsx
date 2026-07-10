import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { initTheme } from '@/store/themeStore'
import './index.css'

initTheme()

const root = createRoot(document.getElementById('root')!)
const hasSupabaseEnv = import.meta.env.VITE_SUPABASE_URL?.trim()
  && import.meta.env.VITE_SUPABASE_ANON_KEY?.trim()

if (!hasSupabaseEnv) {
  root.render(
    <div className="grid min-h-screen place-items-center px-4 text-center text-text-primary">
      <div className="max-w-md rounded-2xl border border-border bg-bg-surface p-6 shadow-panel">
        <h1 className="font-display text-xl font-bold">Missing Supabase env</h1>
        <p className="mt-2 text-sm text-text-secondary">
          Copy .env.example to .env and add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.
        </p>
      </div>
    </div>,
  )
} else {
  void import('./App').then(({ default: App }) => {
    root.render(
      <StrictMode>
        <App />
      </StrictMode>,
    )
  })
}
