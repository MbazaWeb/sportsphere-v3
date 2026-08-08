/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
  ],
  presets: [require('@sportsphere/design-system/tailwind-preset')],
  theme: {
    extend: {
      // Brand-specific extras not covered by the shared preset
      backgroundImage: {
        'gold-gradient': 'linear-gradient(135deg, #F5C518 0%, #FF6B35 100%)',
        'hero-gradient': 'linear-gradient(135deg, #1A2A4A 0%, #0A1628 100%)',
      },
    },
  },
  plugins: [],
};
