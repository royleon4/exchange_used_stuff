import type { Config } from "tailwindcss";

export default {
  content: ["./client/index.html", "./client/src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        sage: {
          50: "#EEF4EF",
          100: "#D4E3D6",
          300: "#8AAB8F",
          600: "#5A7A63",
          700: "#496650",
        },
        cream: {
          50: "#F8F5EF",
          200: "#EDE8DF",
        },
        warm: {
          600: "#7A5C45",
        },
        gold: {
          500: "#C4A35A",
        },
        ink: {
          700: "#5A554D",
          900: "#2C2A25",
        },
      },
      fontFamily: {
        sans: ['"Noto Sans TC"', "sans-serif"],
        display: ['"Cormorant Garamond"', '"Noto Serif TC"', "serif"],
      },
      boxShadow: {
        soft: "0 18px 45px rgba(44, 42, 37, 0.08)",
      },
    },
  },
  plugins: [],
} satisfies Config;
