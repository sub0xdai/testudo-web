/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // === ROMAN STOIC PALETTE ===
        // "The Empire" - Disciplined, permanent, unemotional

        // Core Backgrounds - Warm Stone
        'main-bg': '#0A0A0A',
        'container-bg': '#121212',
        'container-bg-hover': '#1A1A1A',
        'container-bg-selected': '#242424',
        'panel-bg': '#121212',

        // The Grid - Architectural structure
        'container-border': '#333333',
        'border-thick': '#333333',
        'border-active': '#FFFFFF',

        // Jade Green - Stoic / Buy
        'signal-green': '#4E9F76',
        'positive-green': '#4E9F76',
        'positive-green-hover': '#3D7F5E',
        'positive-green-pressed': '#2D5F46',
        'positive-green-bg': '#0D1A14',

        // Terracotta Red - Pompeiian / Sell
        'signal-red': '#A64B4B',
        'signal-orange': '#B87333',
        'negative-red': '#A64B4B',
        'negative-red-hover': '#8A3D3D',
        'negative-red-pressed': '#6E2F2F',
        'negative-red-bg': '#1A0D0D',

        // Tyrian Purple - Imperial Accent (CTAs only)
        'tyrian-purple': '#5C2D5C',
        'tyrian-purple-hover': '#4A244A',

        // Text - Maximum Contrast
        'text-default': '#FFFFFF',
        'text-primary': '#FFFFFF',
        'text-secondary': '#888888',
        'text-tertiary': '#555555',
        'text-disabled': '#333333',
        'text-emphasis': '#FFFFFF',
        'text-inverted': '#0A0A0A',

        // Interactive
        'interactive-link': '#4E9F76',
        'interactive-link-hover': '#FFFFFF',

        // Input
        'input-bg': '#121212',
        'input-border': '#333333',
        'input-border-focus': '#4E9F76',

        // Legacy aliases for migration
        'steel-primary': '#888888',
        'steel-dim': '#555555',
        'steel-bright': '#FFFFFF',
        'imperial-gold': '#888888',
      },
      fontFamily: {
        // Roman Inscription Serif - Chiseled authority
        display: ['Cinzel', 'Times New Roman', 'serif'],
        // Technical Monospace - Data precision
        mono: ['Space Mono', 'SF Mono', 'monospace'],
        numeral: ['Space Mono', 'monospace'],
        // Imperial serif for headers
        imperial: ['Cinzel', 'Times New Roman', 'serif'],
      },
      fontWeight: {
        normal: '400',
        medium: '500',
        semibold: '600',
        bold: '700',
        heavy: '800',
        black: '900',
      },
      borderRadius: {
        // INDUSTRIAL DECREE: NO CURVES. HARD 90-DEGREE ANGLES ONLY.
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
      borderWidth: {
        DEFAULT: '1px',
        '0': '0',
        '1': '1px',
        '2': '2px',
        '3': '3px',
        '4': '4px',
      },
      padding: {
        'l': '16px',
        's': '8px',
        'm': '12px',
        'xl': '32px',
      },
      boxShadow: {
        'none': 'none',
        'grid': '0 0 0 2px #333333',
        'grid-active': '0 0 0 2px #FFFFFF',
        'signal-green': '0 0 20px rgba(78, 159, 118, 0.3)',
        'signal-red': '0 0 20px rgba(166, 75, 75, 0.3)',
        // Legacy
        'steel': '0 0 0 2px #333333',
        'imperial': '0 0 0 2px #333333',
      },
      backgroundImage: {
        'none': 'none',
        // No gradients in brutalism - solid colors only
      },
      letterSpacing: {
        'tighter': '-0.05em',
        'tight': '-0.025em',
        'normal': '0',
        'wide': '0.025em',
        'wider': '0.05em',
        'widest': '0.1em',
        'industrial': '-0.02em',
      },
      animation: {
        'none': 'none',
        'pulse-signal': 'pulseSignal 1s ease-in-out infinite',
        'blink': 'blink 1s step-end infinite',
      },
      keyframes: {
        pulseSignal: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.5' },
        },
        blink: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0' },
        },
      },
    },
  },
  plugins: [],
}
