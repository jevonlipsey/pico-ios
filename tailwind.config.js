/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{vue,js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: [
          "-apple-system",
          "BlinkMacSystemFont",
          '"San Francisco"',
          '"Helvetica Neue"',
          "Helvetica",
          "Arial",
          "sans-serif",
        ],
      },
      colors: {
        "glass-light": "rgba(255, 255, 255, 0.1)",
        "glass-dark": "rgba(0, 0, 0, 0.3)",
      },
      backdropBlur: {
        xs: "2px",
        xl: "20px",
        "2xl": "40px",
      },
    },
  },
  plugins: [],
};
