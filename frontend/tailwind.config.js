/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          50:  '#E6F4EE',
          100: '#C2E4D3',
          200: '#9BD3B6',
          300: '#71C199',
          400: '#4CAF80',
          500: '#0A8E5A',
          600: '#087A4D',
          700: '#06653F',
          800: '#045032',
          900: '#023B25',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'Segoe UI', 'Tahoma', 'sans-serif'],
        arabic: ['"Noto Naskh Arabic"', '"Amiri"', 'serif'],
        amiri: ['"Amiri"', '"Noto Naskh Arabic"', 'serif'],
      },
    },
  },
  plugins: [],
};