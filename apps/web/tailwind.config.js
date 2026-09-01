/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        'primary-purple': '#50377A',
        'deep-purple': '#332052',
        'light-lavender': '#F8F6FC',
        'accent-orange': '#F28A45',
      },
      fontFamily: {
        display: ['Bebas Neue', 'sans-serif'],
        body: ['Inter', 'sans-serif'],
        technical: ['JetBrains Mono', 'monospace'],
        handwritten: ['Caveat', 'cursive'],
      },
      backgroundImage: {
        'blueprint': 'linear-gradient(to right, rgba(80, 55, 122, 0.05) 1px, transparent 1px), linear-gradient(to bottom, rgba(80, 55, 122, 0.05) 1px, transparent 1px)',
      },
      backgroundSize: {
        'blueprint-size': '40px 40px',
      }
    },
  },
  plugins: [],
}
