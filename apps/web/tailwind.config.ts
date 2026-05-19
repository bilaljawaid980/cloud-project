import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Near-black ink scale for editorial contrast
        ink: {
          DEFAULT: "#1a0d0d",
          50: "#fbf9f8",
          100: "#f3eded",
          200: "#dccfcf",
          300: "#a89999",
          400: "#7a6868",
          500: "#5a4848",
          600: "#3d2f2f",
          700: "#2b2020",
          800: "#1f1515",
          900: "#1a0d0d"
        },
        mist: "#dccfcf",
        // Brand maroon — deep wine, classic & sexy (kept `ember` key so all existing classes resolve)
        ember: {
          DEFAULT: "#7a1018",
          50: "#fdf4f4",
          100: "#fbe6e6",
          200: "#f4c4c6",
          300: "#e69496",
          400: "#cf5e62",
          500: "#a8313a",
          600: "#7a1018",
          700: "#5c0c12",
          800: "#440a10",
          900: "#2e070c",
          950: "#1a0408"
        },
        sea: "#7a1018",
        sand: {
          DEFAULT: "#fbf9f8",
          50: "#ffffff",
          100: "#fbf9f8",
          200: "#f3eded"
        },
        dusk: "#5a4848"
      },
      fontFamily: {
        display: ["'Space Grotesk'", "ui-sans-serif", "system-ui", "sans-serif"],
        body: ["'Manrope'", "ui-sans-serif", "system-ui", "sans-serif"],
        mono: ["'JetBrains Mono'", "ui-monospace", "SFMono-Regular", "monospace"]
      },
      boxShadow: {
        soft: "0 24px 80px -24px rgba(26, 13, 13, 0.14)",
        lift: "0 1px 0 rgba(255, 255, 255, 0.7) inset, 0 8px 24px -12px rgba(26, 13, 13, 0.18), 0 32px 80px -32px rgba(122, 16, 24, 0.25)",
        ring: "0 0 0 1px rgba(26, 13, 13, 0.07), 0 1px 2px rgba(26, 13, 13, 0.04)",
        glow: "0 0 40px -8px rgba(122, 16, 24, 0.45), 0 0 80px -20px rgba(168, 49, 58, 0.30)",
        "glow-soft": "0 24px 60px -16px rgba(122, 16, 24, 0.30)",
        inset: "inset 0 1px 0 rgba(255, 255, 255, 0.85), inset 0 -1px 0 rgba(26, 13, 13, 0.04)"
      },
      borderRadius: {
        "4xl": "2rem",
        "5xl": "2.5rem"
      },
      letterSpacing: {
        eyebrow: "0.28em"
      },
      keyframes: {
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(10px)" },
          "100%": { opacity: "1", transform: "translateY(0)" }
        },
        "pulse-dot": {
          "0%, 100%": { opacity: "1", transform: "scale(1)" },
          "50%": { opacity: "0.6", transform: "scale(0.85)" }
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" }
        },
        "ambient-drift": {
          "0%, 100%": { transform: "translate(0,0) scale(1)" },
          "33%": { transform: "translate(2%, -2%) scale(1.06)" },
          "66%": { transform: "translate(-2%, 3%) scale(1.03)" }
        },
        "gradient-x": {
          "0%, 100%": { backgroundPosition: "0% 50%" },
          "50%": { backgroundPosition: "100% 50%" }
        }
      },
      animation: {
        "fade-up": "fade-up 0.6s cubic-bezier(0.22, 1, 0.36, 1) both",
        "pulse-dot": "pulse-dot 1.6s ease-in-out infinite",
        shimmer: "shimmer 2.2s linear infinite",
        "ambient-drift": "ambient-drift 22s ease-in-out infinite",
        "gradient-x": "gradient-x 6s ease infinite"
      }
    }
  },
  plugins: []
} satisfies Config;
