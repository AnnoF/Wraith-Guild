import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        bone: "#F1E6C9",
        void: "#0B1E22",
        char: "#122A2E",
        gold: "#D4AF37",
        amber: "#B8863B",
        moss: "#7A9B5C",
        garnet: "#8B2E2E"
      },
      fontFamily: {
        display: ["'Cinzel'", "serif"],
        ui: ["'EB Garamond'", "serif"]
      }
    }
  },
  plugins: []
};
export default config;
