/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        paper: '#FAF7F2',
        'paper-dim': '#F1EBDF',
        ink: '#221F1B',
        'ink-soft': '#5B5548',
        brass: '#A8763E',
        'brass-dark': '#8B5F2E',
        moss: '#4B5D45',
        rust: '#A34A3C',
        line: '#E2DCD1',
      },
      fontFamily: {
        display: ['var(--font-display)'],
        sans: ['var(--font-body)'],
        mono: ['var(--font-mono)'],
      },
    },
  },
  plugins: [],
};
