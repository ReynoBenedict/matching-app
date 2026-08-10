import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: "#002b5a",
        secondary: "#006493",
        tertiary: "#4e1c00",
        surface: "#f8f9ff",
        "surface-bright": "#f8f9ff",
        "surface-container-high": "#dce9ff",
        outline: "#737781",
        "on-primary": "#ffffff",
        "on-secondary": "#ffffff",
        "on-surface": "#0b1c30",
      },
      fontFamily: {
        sans: [
          "var(--font-sans)",
          "ui-sans-serif",
          "system-ui",
          "-apple-system",
          "BlinkMacSystemFont",
          '"Segoe UI"',
          "Roboto",
          '"Helvetica Neue"',
          "Arial",
          '"Noto Sans"',
          "sans-serif",
        ],
      },
    },
  },
  plugins: [],
};

export default config;
