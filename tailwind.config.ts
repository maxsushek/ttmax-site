import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    container: {
      center: true,
      padding: {
        DEFAULT: "1rem",
        sm: "1.5rem",
        lg: "2rem",
      },
      screens: {
        "2xl": "1200px",
      },
    },
    extend: {
      colors: {
        bg: {
          base: "#080A0E",
          raised: "#0E1117",
          elevated: "#121720",
          deeper: "#05070B",
        },
        accent: {
          DEFAULT: "#E8FF47",
          glow: "rgba(232,255,71,0.4)",
        },
        success: "#2ED573",
        danger: "#FF6B81",
        info: "#54A0FF",
        violet: "#A29BFE",
        ink: {
          DEFAULT: "#F0F0F0",
          muted: "#888888",
          dim: "#555555",
          ghost: "#3a3a3a",
        },
        border: {
          subtle: "rgba(255,255,255,0.06)",
          DEFAULT: "rgba(255,255,255,0.10)",
          strong: "rgba(255,255,255,0.14)",
        },
      },
      fontFamily: {
        display: ["var(--font-display)", "system-ui", "sans-serif"],
        body: ["var(--font-body)", "system-ui", "sans-serif"],
      },
      fontSize: {
        // Responsive display sizes using clamp
        "display-xl": ["clamp(2.5rem, 8vw, 6rem)", { lineHeight: "0.9", letterSpacing: "-0.025em" }],
        "display-lg": ["clamp(2rem, 6vw, 3.5rem)", { lineHeight: "0.92", letterSpacing: "-0.02em" }],
        "display-md": ["clamp(1.75rem, 4.5vw, 2.75rem)", { lineHeight: "1", letterSpacing: "-0.02em" }],
      },
      animation: {
        "fade-up": "fadeUp 0.65s cubic-bezier(0.23,1,0.32,1) forwards",
        float: "float 9s ease-in-out infinite",
        "spin-slow": "spin 28s linear infinite",
        "spin-slower": "spin 20s linear infinite reverse",
        "pulse-ring": "pulseRing 2.8s ease-out infinite",
        "ping-dot": "pingDot 1.7s ease-out infinite",
        marquee: "marquee 28s linear infinite",
        ripple: "ripple 0.65s ease-out forwards",
        "slide-in": "slideIn 0.3s ease",
        "check-bounce": "checkBounce 0.4s cubic-bezier(0.23,1,0.32,1)",
        "badge-pop": "badgePop 0.3s cubic-bezier(0.23,1,0.32,1)",
      },
      keyframes: {
        fadeUp: {
          from: { opacity: "0", transform: "translateY(28px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-22px)" },
        },
        pulseRing: {
          "0%": { transform: "scale(0.88)", opacity: "0.8" },
          "100%": { transform: "scale(1.5)", opacity: "0" },
        },
        pingDot: {
          "0%": { transform: "scale(0.88)", opacity: "0.8" },
          "100%": { transform: "scale(1.5)", opacity: "0" },
        },
        marquee: {
          from: { transform: "translateX(0)" },
          to: { transform: "translateX(-50%)" },
        },
        ripple: {
          to: { transform: "scale(3.5)", opacity: "0" },
        },
        slideIn: {
          from: { opacity: "0", transform: "translateY(6px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        checkBounce: {
          "0%": { transform: "scale(0) rotate(-15deg)" },
          "70%": { transform: "scale(1.2) rotate(5deg)" },
          "100%": { transform: "scale(1) rotate(0)" },
        },
        badgePop: {
          "0%": { transform: "scale(0)" },
          "70%": { transform: "scale(1.25)" },
          "100%": { transform: "scale(1)" },
        },
      },
      backgroundImage: {
        grid: "linear-gradient(rgba(255,255,255,0.016) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.016) 1px,transparent 1px)",
        "accent-fade": "linear-gradient(90deg,#E8FF47 0%,#fff 70%)",
      },
      backgroundSize: {
        grid: "60px 60px",
      },
      boxShadow: {
        glow: "0 0 32px rgba(232,255,71,0.35)",
        "card-hover": "0 22px 50px rgba(0,0,0,0.55)",
        "accent-glow": "0 8px 28px rgba(232,255,71,0.4)",
      },
    },
  },
  plugins: [],
};

export default config;
