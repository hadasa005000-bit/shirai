import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#1B2430",       // deep navy-charcoal — header/hero background
        parchment: "#F7F1E3", // warm paper background
        gold: "#B8892B",      // brass/gold accent — the "vinyl label" color
        "gold-light": "#D9B15C",
        wine: "#6E2A34",      // secondary accent
        text: "#231F20",
      },
      fontFamily: {
        display: ["var(--font-display)", "serif"],
        body: ["var(--font-body)", "sans-serif"],
        mono: ["var(--font-mono)", "monospace"],
      },
      backgroundImage: {
        grooves:
          "repeating-radial-gradient(circle at center, rgba(247,241,227,0.06) 0px, rgba(247,241,227,0.06) 1px, transparent 1px, transparent 6px)",
      },
    },
  },
  plugins: [],
};
export default config;
