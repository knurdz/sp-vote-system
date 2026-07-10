import CenturionLogoBlack from '@/assets/centurion-logo-black.svg'
import CenturionLogoWhite from '@/assets/centurion-logo-white.svg'
import { useThemeStore } from '@/store/themeStore'

interface WordmarkProps {
  className?: string
  asLink?: boolean
}

export function Wordmark({ className = '', asLink = true }: WordmarkProps) {
  const { theme } = useThemeStore()
  const CenturionLogo = theme === 'light' ? CenturionLogoBlack : CenturionLogoWhite

  const content = (
    <span className={`inline-flex items-center gap-1.5 font-display tracking-tight ${className}`}>
      <span className="flex h-10 w-10 shrink-0 items-center justify-center transition-transform duration-300 group-hover:scale-105">
        <img
          src={CenturionLogo}
          alt=""
          className="h-full w-full object-contain"
          aria-hidden
        />
      </span>

      <span className="font-black text-[22px] leading-none tracking-tight text-text-primary">
        Centurion
      </span>
    </span>
  )

  if (asLink) {
    return (
      <a href="/" className="group inline-flex items-center transition-opacity hover:opacity-95">
        {content}
      </a>
    )
  }

  return content
}
