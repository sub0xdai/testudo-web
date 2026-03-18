import preset from '../packages/tailwind-preset/index.ts'

/** @type {import('tailwindcss').Config} */
export default {
  presets: [preset],
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      borderRadius: {
        'none': '0',
        DEFAULT: '0.25rem',
        'sm': '0.125rem',
        'md': '0.375rem',
        'lg': '0.5rem',
        'xl': '0.75rem',
      },
      animation: {
        flicker: 'flicker 4s ease-in-out infinite',
        'ticker-pulse': 'ticker-pulse 3s ease-in-out infinite',
      },
      keyframes: {
        flicker: {
          '0%, 100%': { opacity: '0.3' },
          '50%': { opacity: '0.9' },
        },
        'ticker-pulse': {
          '0%, 100%': { opacity: '0.7' },
          '50%': { opacity: '1' },
        },
      },
    },
  },
  plugins: [],
}
