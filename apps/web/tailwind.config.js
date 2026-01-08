/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Background colors
        'main-bg': '#090909',
        'container-bg': '#121212',
        'container-bg-hover': '#1a1a1a',
        'container-bg-selected': '#262626',
        'container-bg-tweet': '#111d2e',
        'container-border': '#262626',

        // Positive (green) colors
        'positive-green': '#34cb88',
        'positive-green-hover': '#5dd5a0',
        'positive-green-pressed': '#2ba06e',
        'positive-green-bg': '#0a1f14',

        // Negative (red) colors
        'negative-red': '#ff615c',
        'negative-red-hover': '#ff887f',
        'negative-red-pressed': '#cc4e4a',
        'negative-red-bg': '#1e0c0b',

        // Tooltip
        'tooltip-bg': '#152a44',

        // Text colors
        'text-default': '#e4e4e7',
        'text-selected': '#080f18',
        'text-inverted-selected': '#000',
        'text-secondary': '#a1a1aa',
        'text-tertiary': '#71717a',
        'text-disabled': '#3f3f46',
        'text-emphasis': '#fafafa',
        'text-positive-green-button': '#d4edda',
        'text-negative-red-button': '#f8d7da',

        // Interactive colors
        'interactive-link': '#60a5fa',
        'interactive-link-hover': '#93c5fd',
        'text-interactive': '#6683a7',

        // Input colors
        'input-bg': '#1a1a1a',
        'input-bg-hover': '#262626',
        'input-border': '#3f3f46',

        // Static colors
        'static-default': '#e4e4e7',
      },
      fontFamily: {
        numeral: ['Marfa', 'SF Mono', 'Menlo', 'Courier New', 'monospace'],
        display: ['Inter', 'system-ui', 'sans-serif'],
      },
      fontWeight: {
        normal: '400',
        medium: '500',
        semibold: '600',
        bold: '700',
      },
      padding: {
        'l': '16px',
        's': '8px',
        'm': '12px',
        'xl': '32px',
      },
      animation: {
        'pulse': 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'shimmer': 'shimmer 2s ease-in-out infinite',
        'spin': 'spin 1s linear infinite',
      },
      keyframes: {
        shimmer: {
          '0%': { opacity: '1' },
          '50%': { opacity: '0.5' },
          '100%': { opacity: '1' },
        },
      },
    },
  },
  plugins: [],
}
