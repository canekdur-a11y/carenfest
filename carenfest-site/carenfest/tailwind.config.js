/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'system-ui', 'sans-serif'],
      },
      colors: {
        brand: {
          bg: '#0D0A09',
          surface: '#181210',
          card: '#1E1715',
          input: '#140F0E',
          border: '#2D221F',
          coral: '#F25C4D',
          coralHover: '#E04B3C',
          muted: '#9C8E8A',
        },
      },
    },
  },
  plugins: [],
};
