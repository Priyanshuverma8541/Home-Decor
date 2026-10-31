// /** @type {import('tailwindcss').Config} */
// export default {
//   content: [
//     "./index.html",
//     "./src/**/*.{js,ts,jsx,tsx}",
//   ],
//   theme: {
//     extend: {},
//   },
//   plugins: [],
// }




/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brandGold: "#d4af37", // elegant gold accent
        brandBlack: "#1a1a1a", // deep black
        brandWhite: "#faf9f6", // off-white / ivory tone
        brandGray: "#6b7280", // muted gray for text
        brandRose: "#b76e79", // optional rose accent (for jewelry vibe)
      },
      fontFamily: {
        serifHeading: ["Playfair Display", "serif"], // for headings
        sans: ["Inter", "sans-serif"], // for paragraphs / UI
      },
      boxShadow: {
        soft: "0 8px 24px rgba(0, 0, 0, 0.08)", // subtle shadow for product cards
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
      },
    },
  },
  plugins: [],
};
