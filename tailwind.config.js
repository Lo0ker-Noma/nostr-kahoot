/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      colors: {
        'nostr-purple': '#9333ea',
        'nostr-blue': '#3b82f6',
      }
    },
  },
  plugins: [],
}
