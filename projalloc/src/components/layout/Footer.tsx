import { Link } from 'react-router-dom'
import knurdzLogoDark from '@/assets/knurdz-logo-horizontal.png'
import knurdzLogoLight from '@/assets/knurdz-logo-horizontal-light.png'
import { useThemeStore } from '@/store/themeStore'

const GITHUB_URL = 'https://github.com/knurdz/sp-vote-system'
const KNURDZ_URL = 'https://knurdz.org/'

const CONTACTS = [
  { name: 'Thesaru Praneeth', phone: '+94751864888' },
  { name: 'Kaveesha Ginodh', phone: '+94779392448' },
]

function GitHubIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
    </svg>
  )
}

function PhoneIcon({ className = "h-3.5 w-3.5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
    </svg>
  )
}

function GlobeIcon({ className = "h-3.5 w-3.5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="10" />
      <line x1="2" y1="12" x2="22" y2="12" />
      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
    </svg>
  )
}

function TwitterIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  )
}

function MailIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
      <polyline points="22,6 12,13 2,6" />
    </svg>
  )
}



function LinkedInIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
    </svg>
  )
}

function InstagramIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
    </svg>
  )
}

function FacebookIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M22.675 0h-21.35c-.732 0-1.325.593-1.325 1.325v21.351c0 .731.593 1.324 1.325 1.324h11.495v-9.294h-3.128v-3.622h3.128v-2.671c0-3.1 1.893-4.788 4.659-4.788 1.325 0 2.463.099 2.795.143v3.24l-1.918.001c-1.504 0-1.795.715-1.795 1.763v2.313h3.587l-.467 3.622h-3.12v9.293h6.116c.73 0 1.323-.593 1.323-1.325v-21.35c0-.732-.593-1.325-1.325-1.325z"/>
    </svg>
  )
}

function TikTokIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.06-2.89-.52-4.06-1.39-.33-.25-.65-.53-.94-.84v6.86c.06 1.86-.48 3.79-1.74 5.09-1.52 1.57-3.87 2.29-5.97 1.91-2.22-.41-4.22-1.97-5.01-4.11-1-2.73-.2-6.07 2.05-7.85 1.48-1.17 3.44-1.63 5.3-1.3v4.13c-1.07-.3-2.27-.08-3.08.71-.85.83-1.09 2.16-.62 3.23.47 1.07 1.66 1.79 2.82 1.71 1.16-.08 2.13-.98 2.27-2.14.02-.23.01-.46.01-.69V0h.02z"/>
    </svg>
  )
}

function YouTubeIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M23.498 6.163a3.003 3.003 0 0 0-2.11-2.11C19.53 3.545 12 3.545 12 3.545s-7.53 0-9.388.508a3.003 3.003 0 0 0-2.11 2.11C0 8.017 0 12 0 12s0 3.983.502 5.837a3.003 3.003 0 0 0 2.11 2.11c1.858.508 9.388.508 9.388.508s7.53 0 9.388-.508a3.003 3.003 0 0 0 2.11-2.11C24 15.983 24 12 24 12s0-3.983-.502-5.837zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
    </svg>
  )
}

export function Footer() {
  const { theme } = useThemeStore()
  const knurdzLogo = theme === 'light' ? knurdzLogoLight : knurdzLogoDark

  return (
    <footer className="relative mt-auto shrink-0 border-t border-border/40 bg-bg-surface/20 shadow-[0_-8px_32px_rgba(0,0,0,0.05)] backdrop-blur-md overflow-hidden">
      {/* Visual Accent Glow Header Line */}
      <div className="absolute top-0 left-0 right-0 h-[1.5px] bg-gradient-to-r from-transparent via-accent/30 to-transparent" />
      
      {/* Decorative Glow Dot */}
      <div className="pointer-events-none absolute -bottom-16 left-1/2 h-[220px] w-[500px] -translate-x-1/2 rounded-full bg-accent/5 opacity-55 blur-[80px]" aria-hidden="true" />

      <div className="mx-auto max-w-7xl px-6 pt-16 pb-8 sm:px-8 lg:px-8">
        <div className="grid grid-cols-1 gap-12 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-4 lg:gap-8 pb-12 border-b border-border/20">
          
          {/* Column 1: Brand & Logo */}
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-1">
              <p className="font-mono text-[9px] font-extrabold uppercase tracking-widest text-text-muted">
                Powered by
              </p>
              <a
                href={KNURDZ_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex transition-transform hover:scale-[1.01]"
                aria-label="Knurdz — visit knurdz.org"
              >
                <img src={knurdzLogo} alt="Knurdz" className="h-7 w-auto" />
              </a>
            </div>
            <p className="text-[13px] leading-relaxed text-text-muted max-w-[240px]">
              Building open-source projects from code to silicon.
            </p>
            

          </div>

          {/* Column 2: Platform Links */}
          <div className="flex flex-col gap-4">
            <h4 className="font-display text-[11px] font-extrabold uppercase tracking-widest text-text-primary">
              Platform Linktree
            </h4>
            <nav className="flex flex-col gap-2.5">
              <Link to="/" className="text-[13px] font-medium text-text-secondary hover:text-accent transition-colors flex items-center gap-1.5 group">
                <span className="h-1 w-1 rounded-full bg-border group-hover:bg-accent transition-colors" />
                Projects
              </Link>
              <Link to="/results" className="text-[13px] font-medium text-text-secondary hover:text-accent transition-colors flex items-center gap-1.5 group">
                <span className="h-1 w-1 rounded-full bg-border group-hover:bg-accent transition-colors" />
                Results & Logs
              </Link>
              <Link to="/workspace" className="text-[13px] font-medium text-text-secondary hover:text-accent transition-colors flex items-center gap-1.5 group">
                <span className="h-1 w-1 rounded-full bg-border group-hover:bg-accent transition-colors" />
                Team Workspace
              </Link>
              <Link to="/login" className="text-[13px] font-medium text-text-secondary hover:text-accent transition-colors flex items-center gap-1.5 group">
                <span className="h-1 w-1 rounded-full bg-border group-hover:bg-accent transition-colors" />
                Sign In
              </Link>
            </nav>
          </div>

          {/* Column 3: Open Source Community */}
          <div className="flex flex-col gap-4">
            <h4 className="font-display text-[11px] font-extrabold uppercase tracking-widest text-text-primary flex items-center gap-1.5">
              <GitHubIcon className="h-3.5 w-3.5 text-text-primary" />
              Open Source
            </h4>
            <p className="text-[13px] leading-relaxed text-text-muted">
              Centurion is fully transparent and auditable by the entire community from top to bottom.
            </p>
            <a
              href={GITHUB_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 self-start rounded-lg border border-accent/25 bg-accent/8 hover:bg-accent/16 px-4 py-2 text-xs font-display font-bold text-accent transition-all hover:scale-[1.01] hover:border-accent/40 mt-1 cursor-pointer"
            >
              <GitHubIcon className="h-3.5 w-3.5" />
              <span>Contribute on GitHub</span>
            </a>
          </div>

          {/* Column 4: Contact & Support */}
          <div className="flex flex-col gap-4">
            <h4 className="font-display text-[11px] font-extrabold uppercase tracking-widest text-text-primary">
              Operations & Contact
            </h4>
            <ul className="flex flex-col gap-3.5">
              {CONTACTS.map(({ name, phone }) => (
                <li key={name} className="flex flex-col gap-1 border-l-2 border-border/30 pl-3">
                  <span className="text-[13px] font-semibold text-text-primary">{name}</span>
                  <a
                    href={`tel:${phone}`}
                    className="inline-flex items-center gap-1.5 font-mono text-[11px] text-text-muted hover:text-accent transition-colors"
                  >
                    <PhoneIcon className="h-3 w-3" />
                    <span>{phone}</span>
                  </a>
                </li>
              ))}
            </ul>
          </div>

        </div>

        {/* Bottom copyright & socials */}
        <div className="pt-8 flex flex-col sm:flex-row gap-4 items-center justify-between">
          <p className="font-mono text-[11px] text-text-muted">
            © {new Date().getFullYear()} Centurion. All rights reserved.
          </p>

          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <a
              href={KNURDZ_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 rounded-lg bg-border/20 text-text-secondary hover:text-accent hover:bg-border/30 transition-all hover:-translate-y-0.5 cursor-pointer"
              aria-label="Knurdz Organization Website"
            >
              <GlobeIcon className="h-4 w-4" />
            </a>
            <a
              href="mailto:hello@knurdz.org"
              className="p-2 rounded-lg bg-border/20 text-text-secondary hover:text-accent hover:bg-border/30 transition-all hover:-translate-y-0.5 cursor-pointer"
              aria-label="Email Support"
            >
              <MailIcon className="h-4 w-4" />
            </a>
            <a
              href="https://linkedin.com/company/knurdz"
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 rounded-lg bg-border/20 text-text-secondary hover:text-accent hover:bg-border/30 transition-all hover:-translate-y-0.5 cursor-pointer"
              aria-label="LinkedIn"
            >
              <LinkedInIcon className="h-4 w-4" />
            </a>
            <a
              href="https://github.com/knurdz"
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 rounded-lg bg-border/20 text-text-secondary hover:text-accent hover:bg-border/30 transition-all hover:-translate-y-0.5 cursor-pointer"
              aria-label="GitHub"
            >
              <GitHubIcon className="h-4 w-4" />
            </a>
            <a
              href="https://x.com/knurdz_org"
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 rounded-lg bg-border/20 text-text-secondary hover:text-accent hover:bg-border/30 transition-all hover:-translate-y-0.5 cursor-pointer"
              aria-label="X (Twitter)"
            >
              <TwitterIcon className="h-4 w-4" />
            </a>
            <a
              href="https://www.instagram.com/knurdz_org"
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 rounded-lg bg-border/20 text-text-secondary hover:text-accent hover:bg-border/30 transition-all hover:-translate-y-0.5 cursor-pointer"
              aria-label="Instagram"
            >
              <InstagramIcon className="h-4 w-4" />
            </a>
            <a
              href="https://www.facebook.com/people/Knurdz/61579574973113/"
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 rounded-lg bg-border/20 text-text-secondary hover:text-accent hover:bg-border/30 transition-all hover:-translate-y-0.5 cursor-pointer"
              aria-label="Facebook"
            >
              <FacebookIcon className="h-4 w-4" />
            </a>
            <a
              href="https://www.tiktok.com/@knurdz_org"
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 rounded-lg bg-border/20 text-text-secondary hover:text-accent hover:bg-border/30 transition-all hover:-translate-y-0.5 cursor-pointer"
              aria-label="TikTok"
            >
              <TikTokIcon className="h-4 w-4" />
            </a>
            <a
              href="https://www.youtube.com/@knurdz"
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 rounded-lg bg-border/20 text-text-secondary hover:text-accent hover:bg-border/30 transition-all hover:-translate-y-0.5 cursor-pointer"
              aria-label="YouTube"
            >
              <YouTubeIcon className="h-4 w-4" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  )
}
