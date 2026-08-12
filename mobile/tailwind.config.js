/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
  ],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        background: '#0A1628',
        foreground: '#ffffff',
        gold: '#F5C518',
        surface: 'rgba(255,255,255,0.05)',
        surfaceBorder: 'rgba(255,255,255,0.08)',
        mutedForeground: 'rgba(255,255,255,0.5)',
      },
      backgroundImage: {
        'gold-gradient': 'linear-gradient(135deg, #F5C518 0%, #FF6B35 100%)',
        'hero-gradient': 'linear-gradient(135deg, #1A2A4A 0%, #0A1628 100%)',
      },
    },
  },
  plugins: [],
};
