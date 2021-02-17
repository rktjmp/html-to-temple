module.exports = {
  purge: [],
  purge: ['./index.html', './**/*.{vue,js,ts,jsx,tsx}'],
  darkMode: false, // or 'media' or 'class'
  theme: {
    extend: {
      'sans': ['IBM Plex Sans', 'sans-serif'],
      'serif': ['IBM Plex Serif', 'serif'],
      'mono': ['IBM Plex Mono', 'monospace']
    },
  },
  variants: {
    extend: {},
  },
  plugins: [],
}
