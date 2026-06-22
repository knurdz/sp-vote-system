/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        'bg-base': 'var(--bg-base)',
        'bg-header': 'var(--bg-header)',
        'bg-surface': 'var(--bg-surface)',
        'bg-elevated': 'var(--bg-elevated)',
        border: 'var(--border)',
        accent: 'var(--accent)',
        'accent-hover': 'var(--accent-hover)',
        'accent-glow': 'var(--accent-glow)',
        'text-primary': 'var(--text-primary)',
        'text-secondary': 'var(--text-secondary)',
        'text-muted': 'var(--text-muted)',
        green: 'var(--green)',
        yellow: 'var(--yellow)',
        gray: 'var(--gray)',
        red: 'var(--red)',
        'status-voting': 'var(--status-voting)',
        'status-upcoming': 'var(--status-upcoming)',
        'status-closed': 'var(--status-closed)',
        'status-assigned': 'var(--status-assigned)',
      },
      backgroundImage: {
        'theme-bg': 'var(--bg-image)',
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'system-ui', 'sans-serif'],
        display: ['Outfit', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      maxWidth: {
        page: '1200px',
      },
      borderRadius: {
        card: '20px',
        btn: '12px',
      },
      boxShadow: {
        'accent-glow': '0 0 24px var(--accent-glow)',
        'card-hover': '0 12px 36px -8px rgba(0, 0, 0, 0.25), 0 0 0 1px var(--accent-glow)',
        'panel': '0 8px 30px rgba(0, 0, 0, 0.04)',
      },
    },
  },
}
