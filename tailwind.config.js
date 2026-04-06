/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: {
          50:  '#edfdf8',
          100: '#d2f9ef',
          200: '#a8f2e1',
          300: '#6fe8ce',
          400: '#34d5b7',
          500: '#0ecfb0',
          600: '#08b094',
          700: '#098c78',
          800: '#0b6f61',
          900: '#0b5b50',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
