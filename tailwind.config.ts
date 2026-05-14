import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        rose: {
          alluri: '#c9a0a0',
          light: '#f5ece8',
          mid:   '#e8d0c8',
        },
        gold: {
          DEFAULT: '#b8935a',
          light:   '#e8d5b0',
          hover:   '#a07840',
        },
        dark: '#2a1f1f',
        alluri: {
          text:   '#4a3535',
          muted:  '#9a8080',
          bg:     '#fdf8f5',
          card:   '#fff9f7',
          border: '#e8d8d0',
          white:  '#fdfaf8',
        },
      },
      fontFamily: {
        sans:  ['var(--font-jost)', 'system-ui', 'sans-serif'],
        serif: ['var(--font-cormorant)', 'Georgia', 'serif'],
      },
    },
  },
  plugins: [],
}

export default config
