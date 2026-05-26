import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Single distinctive accent: Mantle's "moss" — between standard
        // crypto-green and a flatter institutional teal. Specific enough
        // that the page reads as ours rather than default Tailwind.
        moss: {
          50: "#f1f6f3",
          100: "#dde8e0",
          200: "#bcd0c2",
          300: "#92b29c",
          400: "#699378",
          500: "#4d785f",
          600: "#3b5f4a",
          700: "#304c3c",
          800: "#283d31",
          900: "#22332a",
          950: "#0f1c15",
        },
      },
      fontFamily: {
        // Default to a sans serif but bias toward something with sharper
        // numerals than the macOS default — JetBrains Mono for tabular data,
        // Inter for headings via system stack.
        mono: ["ui-monospace", "SFMono-Regular", "Menlo", "monospace"],
      },
    },
  },
  plugins: [],
};

export default config;
