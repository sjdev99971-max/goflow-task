import type { Config } from 'tailwindcss'
const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        bg: { DEFAULT: '#0a0a0a', card: '#141414', soft: '#1a1a1a' },
        line: { DEFAULT: '#252525', soft: '#1f1f1f' },
        brand: { DEFAULT: '#ff6b1a', hover: '#ff8c42', soft: 'rgba(255,107,26,0.12)' },
        gold: '#ffd54a',
        green: '#22c55e',
        red: '#ef4444',
        muted: '#8b8b8b',
        dim: '#5c5c5c',
        txt: { DEFAULT: '#ffffff', soft: '#d1d1d1' }
      },
      fontFamily: { sans: ['-apple-system', 'BlinkMacSystemFont', 'system-ui', 'sans-serif'] },
      boxShadow: {
        brand: '0 8px 24px rgba(255,107,26,0.35)',
        glow: '0 0 20px rgba(255,107,26,0.5)',
        'glow-lg': '0 0 40px rgba(255,107,26,0.4)',
        card: '0 4px 12px rgba(0,0,0,0.4)'
      },
      keyframes: {
        shimmer: {
          '100%': { transform: 'translateX(100%)' }
        },
        'fade-in': {
          '0%': { opacity: '0', transform: 'translateY(6px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' }
        },
        'scale-in': {
          '0%': { transform: 'scale(0.95)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' }
        },
        glow: {
          '0%, 100%': { boxShadow: '0 0 12px rgba(255,107,26,0.5)' },
          '50%': { boxShadow: '0 0 24px rgba(255,107,26,0.9)' }
        }
      },
      animation: {
        'fade-in': 'fade-in 0.25s ease-out',
        'scale-in': 'scale-in 0.2s ease-out',
        'glow': 'glow 2s ease-in-out infinite'
      }
    }
  },
  plugins: []
}
export default config
