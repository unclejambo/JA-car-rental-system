/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        pathway: ['"Pathway Gothic One"', "sans-serif"],
      },
    },
  },
  plugins: [
    function ({ matchUtilities }) {
      matchUtilities(
        {
          "text-outline": (value) => ({
            textShadow: `0 0 ${value} currentColor`,
          }),
        },
        { values: { sm: "1px", md: "2px" } }
      );
    },
  ],
};
