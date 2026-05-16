import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./features/**/*.{ts,tsx}",
    "./layouts/**/*.{ts,tsx}",
    "./modules/**/*.{ts,tsx}",
    "./providers/**/*.{ts,tsx}"
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-sans)"],
        display: ["var(--font-display)"],
        mono: ["var(--font-mono)"]
      },
      colors: {
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        card: "hsl(var(--card))",
        "card-foreground": "hsl(var(--card-foreground))",
        muted: "hsl(var(--muted))",
        "muted-foreground": "hsl(var(--muted-foreground))",
        accent: "hsl(var(--accent))",
        "accent-foreground": "hsl(var(--accent-foreground))",
        primary: "hsl(var(--primary))",
        "primary-foreground": "hsl(var(--primary-foreground))",
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        success: "hsl(var(--success))",
        warning: "hsl(var(--warning))",
        danger: "hsl(var(--danger))",
        info: "hsl(var(--info))"
      },
      boxShadow: {
        glow: "0 22px 50px rgba(36,31,22,.16)",
        soft: "0 10px 24px rgba(36,31,22,.12)",
        card: "0 4px 16px rgba(36,31,22,.08)"
      },
      borderRadius: {
        xl2: "1.25rem"
      },
      backgroundImage: {
        "grid-light":
          "linear-gradient(0deg, rgba(31,42,45,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(31,42,45,0.04) 1px, transparent 1px)",
        "grid-dark":
          "linear-gradient(0deg, rgba(231,241,237,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(231,241,237,0.05) 1px, transparent 1px)"
      }
    }
  },
  plugins: []
};

export default config;
