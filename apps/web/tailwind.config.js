/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // === INDUSTRIAL BRUTALIST PALETTE ===
        // "The Machine" - Raw, functional, aggressive

        // Core Backgrounds - The Void
        'main-bg': '#050505',
        'container-bg': '#0A0A0A',
        'container-bg-hover': '#111111',
        'container-bg-selected': '#1A1A1A',
        'panel-bg': '#0A0A0A',

        // The Grid - Thick visible structure
        'container-border': '#333333',
        'border-thick': '#333333',
        'border-active': '#FFFFFF',

        // Signal Green - Terminal / Buy
        'signal-green': '#00FF41',
        'positive-green': '#00FF41',
        'positive-green-hover': '#00CC33',
        'positive-green-pressed': '#009926',
        'positive-green-bg': '#001A0A',

        // Signal Red - Reactor / Sell
        'signal-red': '#FF003C',
        'signal-orange': '#FF5F00',
        'negative-red': '#FF003C',
        'negative-red-hover': '#CC0030',
        'negative-red-pressed': '#990024',
        'negative-red-bg': '#1A0008',

        // Text - Maximum Contrast
        'text-default': '#FFFFFF',
        'text-primary': '#FFFFFF',
        'text-secondary': '#888888',
        'text-tertiary': '#555555',
        'text-disabled': '#333333',
        'text-emphasis': '#FFFFFF',
        'text-inverted': '#050505',

        // Interactive
        'interactive-link': '#00FF41',
        'interactive-link-hover': '#FFFFFF',

        // Input
        'input-bg': '#0A0A0A',
        'input-border': '#333333',
        'input-border-focus': '#00FF41',

        // Legacy aliases for migration
        'steel-primary': '#888888',
        'steel-dim': '#555555',
        'steel-bright': '#FFFFFF',
        'imperial-gold': '#888888',
      },
      fontFamily: {
        // Industrial Display - Heavy, aggressive
        display: ['Unbounded', 'Archivo Black', 'system-ui', 'sans-serif'],
        // Technical Monospace - Terminal precision
        mono: ['Space Mono', 'JetBrains Mono', 'SF Mono', 'monospace'],
        numeral: ['Space Mono', 'JetBrains Mono', 'monospace'],
        // Legacy
        imperial: ['Unbounded', 'system-ui', 'sans-serif'],
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
        'signal-green': '0 0 20px rgba(0, 255, 65, 0.3)',
        'signal-red': '0 0 20px rgba(255, 0, 60, 0.3)',
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
