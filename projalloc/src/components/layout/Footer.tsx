import knurdzLogoDark from '@/assets/knurdz-logo-horizontal.png'
import knurdzLogoLight from '@/assets/knurdz-logo-horizontal-light.png'
import { useThemeStore } from '@/store/themeStore'

const GITHUB_URL = 'https://github.com/knurdz/sp-vote-system'
const KNURDZ_URL = 'https://knurdz.org/'

const CONTACTS = [
  { name: 'Thesaru Praneeth', phone: '07xxxxxxxxx' },
  { name: 'Kaveesha Ginodh', phone: '07xxxxxxxxx' },
]

function GitHubIcon() {
  return (
    <svg
      className="h-4 w-4 shrink-0 text-accent"
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden
    >
      <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
    </svg>
  )
}

export function Footer() {
  const { theme } = useThemeStore()
  const knurdzLogo = theme === 'light' ? knurdzLogoLight : knurdzLogoDark

  return (
    <footer className="mt-auto shrink-0 border-t border-border/30 bg-bg-surface/20 shadow-[0_-8px_32px_rgba(0,0,0,0.04)] backdrop-blur-md">
      <div className="mx-auto grid max-w-page grid-cols-1 gap-8 px-6 py-10 sm:px-8 sm:py-12 md:grid-cols-3 md:gap-12">
        {/* Left — Powered by Knurdz */}
        <div className="space-y-3">
          <p className="font-mono text-[10px] font-bold uppercase tracking-widest text-text-muted">
            Powered by
          </p>
          <a
            href={KNURDZ_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex transition-opacity hover:opacity-80"
            aria-label="Knurdz — visit knurdz.org"
          >
            <img src={knurdzLogo} alt="Knurdz" className="h-7 w-auto" />
          </a>
          <p className="max-w-[280px] text-[13px] leading-relaxed text-text-muted">
            Engineering the future through code, hardware, and social
            innovation.
          </p>
        </div>

        {/* Center — Open source */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <GitHubIcon />
            <span className="font-display text-[15px] font-bold text-text-primary">
              Open Source
            </span>
          </div>
          <p className="max-w-xs text-[13px] leading-relaxed text-text-muted">
            This platform is open source so the allocation process stays
            transparent and auditable by everyone involved.
          </p>
          <a
            href={GITHUB_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block font-display text-[13px] font-semibold text-accent transition-colors hover:text-accent-hover hover:underline"
          >
            View on GitHub →
          </a>
        </div>

        {/* Right — Contact */}
        <div className="space-y-3 md:text-right">
          <p className="font-mono text-[10px] font-bold uppercase tracking-widest text-text-muted">
            Contact
          </p>
          <ul className="space-y-2.5">
            {CONTACTS.map(({ name, phone }) => (
              <li key={name} className="text-[13px] font-medium text-text-secondary">
                <span>{name}</span>
                <span className="mx-2 text-border">·</span>
                <a
                  href={`tel:${phone}`}
                  className="font-mono text-text-muted transition-colors hover:text-accent"
                >
                  {phone}
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="border-t border-border/30 py-4 pb-24 xl:pb-4">
        <p className="mx-auto max-w-page px-6 text-center font-mono text-[11px] text-text-muted sm:px-8 md:text-left">
          © 2026 FITsp. All rights reserved.
        </p>
      </div>
    </footer>
  )
}
