/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // === IMPERIAL ROMAN PALETTE ===

        // Background colors - Deep Obsidian/Slate
        'main-bg': '#0a0a0c',
        'container-bg': '#121214',
        'container-bg-hover': '#1c1c1e',
        'container-bg-selected': '#28282c',
        'container-bg-tweet': '#111d2e',
        'container-border': '#2a2a2e',

        // Primary Accent - Antiqued Gold
        'imperial-gold': '#c5a059',
        'imperial-gold-dim': '#8b7340',
        'imperial-gold-bright': '#d4b06a',

        // Positive (Laurel Green/Emerald) - Muted, Regal
        'positive-green': '#3a7f5d',
        'positive-green-hover': '#4a9970',
        'positive-green-pressed': '#2d6349',
        'positive-green-bg': '#0d1a14',

        // Negative (Pompeian Red/Tyrian) - Deep Crimson
        'negative-red': '#990011',
        'negative-red-hover': '#b31a2b',
        'negative-red-pressed': '#7a000e',
        'negative-red-bg': '#1a0a0c',

        // Tooltip
        'tooltip-bg': '#1a1a1e',

        // Text colors - Marble White
        'text-default': '#f5f5f0',
        'text-selected': '#0a0a0c',
        'text-inverted-selected': '#000',
        'text-secondary': '#a8a8a0',
        'text-tertiary': '#6e6e68',
        'text-disabled': '#404040',
        'text-emphasis': '#fafaf5',
        'text-positive-green-button': '#c5e0d0',
        'text-negative-red-button': '#f0d0d4',

        // Interactive colors - Gold-tinted
        'interactive-link': '#c5a059',
        'interactive-link-hover': '#d4b06a',
        'text-interactive': '#a08050',

        // Input colors
        'input-bg': '#18181a',
        'input-border': '#c5a059',
        'input-border-dim': '#3a3a3e',

        // Static colors
        'static-default': '#f5f5f0',
      },
      fontFamily: {
        // Imperial serif for headers - carved stone inscriptions
        imperial: ['Cinzel', 'Trajan Pro', 'Times New Roman', 'serif'],
        // Technical monospace for data - terminal precision
        numeral: ['JetBrains Mono', 'SF Mono', 'Menlo', 'Courier New', 'monospace'],
        // Clean geometric sans for UI labels
        display: ['Inter', 'system-ui', 'sans-serif'],
      },
      fontWeight: {
        normal: '400',
        medium: '500',
        semibold: '600',
        bold: '700',
      },
      borderRadius: {
        // Imperial decree: NO rounded corners. Sharp 90° angles only.
        'none': '0',
        DEFAULT: '0',
        'sm': '0',
        'md': '0',
        'lg': '0',
        'xl': '0',
        '2xl': '0',
        '3xl': '0',
        'full': '0',
      },
      padding: {
        'l': '16px',
        's': '8px',
        'm': '12px',
        'xl': '32px',
      },
      boxShadow: {
        'imperial': '0 0 0 1px #c5a059',
        'imperial-glow': '0 0 20px rgba(197, 160, 89, 0.15)',
        'imperial-inset': 'inset 0 1px 0 rgba(197, 160, 89, 0.1)',
      },
      backgroundImage: {
        'imperial-gradient': 'linear-gradient(180deg, rgba(197, 160, 89, 0.08) 0%, transparent 100%)',
        'metallic-gold': 'linear-gradient(135deg, #c5a059 0%, #8b7340 50%, #c5a059 100%)',
        'metallic-green': 'linear-gradient(135deg, #3a7f5d 0%, #2d6349 50%, #4a9970 100%)',
        'metallic-red': 'linear-gradient(135deg, #990011 0%, #7a000e 50%, #b31a2b 100%)',
      },
      animation: {
        'pulse': 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'shimmer': 'shimmer 2s ease-in-out infinite',
        'spin': 'spin 1s linear infinite',
        'gold-pulse': 'goldPulse 3s ease-in-out infinite',
      },
      keyframes: {
        shimmer: {
          '0%': { opacity: '1' },
          '50%': { opacity: '0.5' },
          '100%': { opacity: '1' },
        },
        goldPulse: {
          '0%, 100%': { boxShadow: '0 0 0 1px rgba(197, 160, 89, 0.3)' },
          '50%': { boxShadow: '0 0 0 1px rgba(197, 160, 89, 0.6)' },
        },
      },
    },
  },
  plugins: [],
}
