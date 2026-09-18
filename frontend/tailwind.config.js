/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          primary: '#E86A8A',
          secondary: '#F4A6B5',
          accent: '#C94A6A',
          bg: '#FFF6F8',
          dark: '#2B2B2B',
          'dark-light': '#6B6B6B',
          // Legacy aliases for backward compat
          nude: '#F4A6B5',
          blush: '#E86A8A',
          cream: '#FFF6F8',
        },
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
        serif: ['var(--font-playfair)', 'Georgia', 'serif'],
      },
    },
  },
  plugins: [],
};
