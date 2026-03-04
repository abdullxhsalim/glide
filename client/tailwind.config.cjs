module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'background-base': '#1E293B', // Dark Slate
        'surface-card': '#334155', // Elevated Slate
        'primary-action': '#4F46E5', // Electric Indigo
        'high-contrast-text': '#F8FAFC', // Off-White/Ice
        'status-accent': '#10B981', // Neon Mint
      },
    },
  },
  plugins: [],
}
