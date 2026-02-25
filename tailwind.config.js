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
        'container-border': '#333333',
        'border-active': '#FFFFFF',
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
        DEFAULT: '0',
        'sm': '0',
        'md': '0',
        'lg': '0',
        'xl': '0',
      },
    },
  },
  plugins: [],
}
