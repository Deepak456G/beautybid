/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        cream: {
          50: '#FDFCFB',
          100: '#FAF8F5',
          200: '#F4EFEB',
          300: '#EAE2D8',
        },
        gold: {
          50: '#FAF6F0',
          100: '#F4EDE0',
          200: '#E8DBC3',
          300: '#DCC8A6',
          400: '#D0B68A',
          500: '#C5A880',
          600: '#B08E61',
          700: '#8E6E45',
        },
        noir: {
          900: '#0E0E10',
          800: '#18181B',
          700: '#27272A',
          600: '#3F3F46',
        },
        blush: {
          50: '#FDF8F7',
          100: '#F9F1EF',
          200: '#F4E5E1',
          300: '#EBD2CB',
        },
      },
      fontFamily: {
        serif: ['"Playfair Display"', 'Georgia', 'Cambria', 'serif'],
        sans: ['"Plus Jakarta Sans"', 'Inter', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
      },
      boxShadow: {
        'editorial': '0 10px 30px -10px rgba(0, 0, 0, 0.05), 0 20px 25px -5px rgba(0, 0, 0, 0.02)',
        'editorial-hover': '0 20px 40px -15px rgba(0, 0, 0, 0.08), 0 0 1px 1px rgba(197, 168, 128, 0.2)',
        'gold-glow': '0 0 25px rgba(197, 168, 128, 0.25)',
      },
    },
  },
  plugins: [],
};
