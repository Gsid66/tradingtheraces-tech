module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}"
  ],
  theme: {
    extend: {
      screens: {
        'xs': '475px',
        'fold-cover': '884px',
        'fold-open': '1768px',
      },
    },
  },
  plugins: [],
}