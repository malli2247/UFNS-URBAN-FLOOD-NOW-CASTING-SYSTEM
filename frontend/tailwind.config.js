/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        aquila: {
          dark: '#0a0f1d',
          card: '#111827',
          cardBorder: '#1f2937',
          accent: '#0ea5e9',
          warning: '#f59e0b',
          critical: '#ef4444',
          safe: '#10b981',
          surcharged: '#ec4899',
        }
      }
    },
  },
  plugins: [],
}
