/** @type {import('tailwindcss').Config} */

export default {

  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}', './ui-preview/index.html', './ui-preview/src/**/*.{js,ts,jsx,tsx}'],

  theme: {

    extend: {

      colors: {

        'bg-base': 'var(--bg-base)',

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

        ice: 'var(--color-ice)',

        cyan: 'var(--color-cyan)',

        steel: 'var(--color-steel)',

        ocean: 'var(--color-ocean)',

        midnight: 'var(--color-midnight)',

      },

      fontFamily: {

        sans: ['DM Sans', 'system-ui', 'sans-serif'],

        display: ['Syne', 'system-ui', 'sans-serif'],

        mono: ['JetBrains Mono', 'monospace'],

      },

      maxWidth: {

        page: '1200px',

      },

      borderRadius: {

        card: '16px',

        btn: '10px',

      },

      boxShadow: {

        'accent-glow': '0 0 12px var(--accent-glow)',

        'card-hover': '0 0 0 1px var(--border-cyan), 0 0 20px rgba(84, 172, 191, 0.15)',

        'glow-cyan': 'var(--glow-cyan)',

        'glow-ice': 'var(--glow-ice)',

        'panel-inner': 'inset 0 1px 0 rgba(167, 235, 242, 0.06)',

      },

    },

  },

}

