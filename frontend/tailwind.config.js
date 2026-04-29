/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
      },
      colors: {
        hud: {
          bg: '#020408',
          surface: 'rgba(255,255,255,0.04)',
          border: 'rgba(255,255,255,0.1)',
          accent: '#3b82f6',
          accent2: '#34d399',
          muted: 'rgba(148,163,184,0.6)',
        },
      },
      backdropBlur: { hud: '12px' },
      keyframes: {
        'scan-line': {
          '0%':   { top: '-2%', opacity: '0' },
          '5%':   { opacity: '1' },
          '95%':  { opacity: '1' },
          '100%': { top: '102%', opacity: '0' },
        },
        'pulse-dot': {
          '0%, 100%': { opacity: '1', transform: 'scale(1)' },
          '50%':      { opacity: '0.4', transform: 'scale(0.8)' },
        },
        'fade-up': {
          '0%':   { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        'scan-line':  'scan-line 5s ease-in-out infinite',
        'pulse-dot':  'pulse-dot 1.8s ease-in-out infinite',
        'fade-up':    'fade-up 0.3s ease-out forwards',
      },
      boxShadow: {
        'glow-blue':  '0 0 20px rgba(59,130,246,0.35)',
        'glow-green': '0 0 12px rgba(52,211,153,0.3)',
      },
    },
  },
  plugins: [],
}
