/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,jsx}',
    './components/**/*.{js,jsx}'
  ],
  theme: {
    extend: {
      colors: {
        bg: '#0a0a0f',
        panel: '#12121a',
        panel2: '#181822',
        border: '#242430',
        accent: '#6d5efc',
        accent2: '#00d4b5'
      }
    }
  },
  plugins: []
};
