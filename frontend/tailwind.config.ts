import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        lulu: {
          blue: "#0891B2",
          pink: "#FF6B00",
        },
      },
    },
  },
  plugins: [],
};

export default config;
