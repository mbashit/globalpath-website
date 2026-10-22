import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./data/**/*.{ts,tsx}"],
  theme: {
    container: { center: true, padding: { DEFAULT: "1.25rem", md: "2rem" }, screens: { "2xl": "1240px" } },
    extend: {
      colors: {
        navy: { DEFAULT: "#252B83", deep: "#171B5E", ink: "#10133F", soft: "#E9EAF7" },
        brandorange: { DEFAULT: "#F7941D", dark: "#D97706" },
        gold: { DEFAULT: "#FDBE18", soft: "#FFF4D1" },
        canvas: "#F7F8FC",
        ink: { DEFAULT: "#172033", muted: "#4A5468", faint: "#7A8398" },
        line: "#E3E6F0",
      },
      fontFamily: {
        display: ["var(--font-display)", "ui-sans-serif", "system-ui", "sans-serif"],
        sans: ["var(--font-body)", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      boxShadow: {
        card: "0 1px 2px rgba(23,32,51,.04), 0 8px 24px -12px rgba(37,43,131,.18)",
        lift: "0 24px 48px -24px rgba(23,27,94,.35)",
      },
      borderRadius: { xl2: "1.25rem", xl3: "1.75rem" },
      keyframes: {
        rise: { "0%": { opacity: "0", transform: "translateY(14px)" }, "100%": { opacity: "1", transform: "none" } },
        dash: { to: { strokeDashoffset: "0" } },
        // The marquee track holds three copies of its items; moving one copy's width loops seamlessly.
        marquee: { to: { transform: "translateX(-33.3333%)" } },
      },
      animation: {
        rise: "rise .7s cubic-bezier(.2,.7,.2,1) both",
        marquee: "marquee 45s linear infinite",
      },
    },
  },
  plugins: [],
};

export default config;
