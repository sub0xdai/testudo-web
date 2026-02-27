/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'main-bg': '#050505',
        'container-bg': '#0A0A0A',
        'container-bg-hover': '#111111',
        'panel-bg': '#0A0A0A',
        'container-border': '#3F3F46',
        'border-active': '#FFFFFF',
        'accent-steel': '#94A3B8',
        'accent-steel-hover': '#CBD5E1',
        'signal-green': '#00FF41',
        'signal-red': '#FF003C',
        'text-primary': '#FFFFFF',
        'text-secondary': '#888888',
        'text-tertiary': '#555555',
      },
      fontFamily: {
        display: ['Unbounded', 'system-ui', 'sans-serif'],
        mono: ['Space Mono', 'JetBrains Mono', 'monospace'],
      },
      borderRadius: {
        'none': '0',
        DEFAULT: '0.25rem',
        'sm': '0.125rem',
        'md': '0.375rem',
        'lg': '0.5rem',
        'xl': '0.75rem',
      },
    },
  },
  plugins: [],
}
