import type { Config } from "tailwindcss";

export default {
  darkMode: 'class', // <--- This enables our dark mode toggle!
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
} satisfies Config;