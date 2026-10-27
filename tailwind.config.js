/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        k8s: {
          bg: '#0a0d14',
          card: '#111622',
          cardHover: '#161d2c',
          border: '#1f293d',
          text: '#f1f5f9',
          muted: '#94a3b8',
          subtle: '#64748b',
          blue: '#3b82f6',
          green: '#10b981',
          amber: '#f59e0b',
          red: '#ef4444',
          purple: '#8b5cf6',
        }
      }
    },
  },
  plugins: [],
}
