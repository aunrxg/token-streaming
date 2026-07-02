import type { Config } from "tailwindcss";

const config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
    "./store/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        canvas: "#0d1117",
        surface: "#161b22",
        raised: "#1c2128",
        overlay: "#22272e",
        border: "#30363d",
        "border-muted": "#21262d",
        "text-primary": "#e6edf3",
        "text-secondary": "#8b949e",
        "text-muted": "#6e7681",
        accent: "#58a6ff",
        "accent-dim": "#1f6feb",
        success: "#3fb950",
        warning: "#d29922",
        danger: "#f85149",
        "ev-token": "#7ee787",
        "ev-tool": "#a5d6ff",
        "ev-context": "#e8b4f8",
        "ev-ping": "#bc8cff",
        "ev-error": "#f85149",
        "ev-conn": "#8b949e",
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "JetBrains Mono", "Fira Code", "monospace"],
      },
      animation: {
        "pulse-slow": "pulse 3s cubic-bezier(0.4,0,0.6,1) infinite",
        blink: "blink 1s step-end infinite",
      },
      keyframes: {
        blink: {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0" },
        },
      },
    },
  },
  plugins: [],
} satisfies Config;

export default config;
