/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        arcDark: "#05060a",
        arcCard: "#111524",
        arcAccent: "#3b82f6",
      },
    },
  },
  plugins: [],
};

