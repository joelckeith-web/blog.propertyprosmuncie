import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          orange: "#FF7300",
          "orange-hover": "#E56800",
          "orange-light": "rgba(255, 115, 0, 0.1)",
          dark: "#313131",
          "dark-secondary": "#575757",
          text: "#333333",
          "text-secondary": "#51553D",
          light: "#EEEEEE",
          white: "#FFFFFF",
        },
      },
      fontFamily: {
        sans: [
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
      typography: {
        DEFAULT: {
          css: {
            maxWidth: "none",
            color: "#333333",
            a: {
              color: "#FF7300",
              "&:hover": {
                color: "#E56800",
              },
            },
            h1: {
              color: "#313131",
            },
            h2: {
              color: "#313131",
            },
            h3: {
              color: "#313131",
            },
            strong: {
              color: "#313131",
            },
            blockquote: {
              borderLeftColor: "#FF7300",
            },
          },
        },
      },
    },
  },
  plugins: [require("@tailwindcss/typography")],
};

export default config;
