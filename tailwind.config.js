/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{js,jsx,ts,tsx}', './components/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        cream: '#FDF6EE',
        accent: '#0EA5E9',
        'accent-light': '#E0F2FE',
        brand: '#2D3A4A',
        muted: '#8E9BAB',
        surface: '#FFFFFF',
        border: '#EDE8E1',
      },
    },
  },
  plugins: [],
};
