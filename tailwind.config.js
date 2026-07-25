/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,jsx}',
    './components/**/*.{js,jsx}'
  ],
  theme: {
    extend: {
      colors: {
        bg: '#050505',
        panel: '#0d0d10',
        panel2: '#141417',
        border: '#232326',
        accent: '#8B5CF6',
        accent2: '#00d4b5'
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'Inter', 'system-ui', 'sans-serif']
      },
      boxShadow: {
        glass: '0 8px 32px rgba(0,0,0,0.35)'
      },
      backdropBlur: {
        xs: '2px'
      }
    }
  },
  plugins: []
};
