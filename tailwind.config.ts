import type { Config } from 'tailwindcss'
const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        tg: {
          bg: '#0e0e10',
          card: '#1c1c1e',
          border: '#2c2c2e',
          primary: '#8b5cf6',
          accent: '#a78bfa',
          text: '#f5f5f7',
          muted: '#8e8e93'
        }
      },
      fontFamily: { sans: ['system-ui', 'sans-serif'] }
    }
  },
  plugins: []
}
export default config
