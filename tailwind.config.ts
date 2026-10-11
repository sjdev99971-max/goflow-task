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
        brand: '0 8px 24px rgba(255,107,26,0.25)',
        card: '0 4px 12px rgba(0,0,0,0.4)'
      }
    }
  },
  plugins: []
}
export default config
