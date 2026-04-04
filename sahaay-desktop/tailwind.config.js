/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'tactical-bg': '#0F1115',      // Deepest background
        'tactical-card': '#161B22',    // Card background
        'tactical-border': '#30363D',  // Border color
        'neon-blue': '#3B82F6',        // Primary Action
        'neon-orange': '#F59E0B',      // Warning/Sahaay Brand
        'neon-red': '#EF4444',         // SOS/Critical
        'neon-green': '#10B981',       // Safe/Online
        'text-primary': '#E0E0E0',
        'text-secondary': '#9CA3AF',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
    },
  },
  plugins: [],
}
