import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#0f172a",
        mist: "#e2e8f0",
        ember: "#f97316",
        sea: "#0f766e",
        sand: "#fff7ed",
        dusk: "#334155"
      },
      fontFamily: {
        display: ["'Space Grotesk'", "sans-serif"],
        body: ["'Manrope'", "sans-serif"]
      },
      boxShadow: {
        soft: "0 24px 80px rgba(15, 23, 42, 0.12)"
      }
    }
  },
  plugins: []
} satisfies Config;
