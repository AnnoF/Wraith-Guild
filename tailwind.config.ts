import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        bone: "#EDE7E0",
        void: "#0D0B0A",
        char: "#161210",
        blood: "#A61B1B",
        amber: "#C98A2C",
        moss: "#7A9B5C"
      },
      fontFamily: {
        display: ["'Oswald'", "sans-serif"],
        ui: ["'Inter'", "sans-serif"]
      }
    }
  },
  plugins: []
};
export default config;
