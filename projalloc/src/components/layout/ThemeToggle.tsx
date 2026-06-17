import { motion } from 'framer-motion'
import { useThemeStore, type Theme } from '@/store/themeStore'
import { cn } from '@/lib/utils'

function SunIcon() {
  return (
    <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
    </svg>
  )
}

function MoonIcon() {
  return (
    <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden>
      <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" />
    </svg>
  )
}

export function ThemeToggle() {
  const { theme, setTheme } = useThemeStore()

  const options: { value: Theme; label: string; icon: React.ReactNode }[] = [
    { value: 'light', label: 'Light', icon: <SunIcon /> },
    { value: 'dark', label: 'Dark', icon: <MoonIcon /> },
  ]

  return (
    <div
      className="flex items-center rounded-xl border border-border bg-bg-elevated/40 p-1"
      role="group"
      aria-label="Theme"
    >
      {options.map(({ value, label, icon }) => {
        const active = theme === value
        return (
          <button
            key={value}
            type="button"
            aria-pressed={active}
            aria-label={`${label} theme`}
            onClick={() => setTheme(value)}
            className={cn(
              'relative inline-flex min-h-9 cursor-pointer select-none items-center gap-1.5 rounded-lg px-3 py-1.5 text-[12px] font-display font-semibold transition-colors duration-250 active:scale-[0.97] outline-none',
              active
                ? 'text-accent'
                : 'text-text-secondary hover:text-text-primary',
            )}
          >
            {active && (
              <motion.span
                layoutId="activeThemePill"
                transition={{ type: 'spring', stiffness: 350, damping: 25 }}
                className="absolute inset-0 rounded-lg bg-accent/8 border border-accent/15 shadow-[0_0_12px_var(--accent-glow)]"
              />
            )}
            <span className="relative z-10 flex items-center gap-1.5">
              {icon}
              <span className="hidden sm:inline">{label}</span>
            </span>
          </button>
        )
      })}
    </div>
  )
}
