export default {
  content: ["./index.html","./src/**/*.{js,jsx}"],
  theme: { extend: {
    fontFamily: { display: ["'Playfair Display'","Georgia","serif"], body: ["'Inter'","system-ui","sans-serif"] },
    colors: {
      clay:  { 50:"#fdf6f0",100:"#fae8d8",200:"#f5cba6",300:"#eda974",400:"#e38345",500:"#c96030",600:"#a84a22",700:"#87381a",800:"#6b2c14",900:"#52200f" },
      teal:  { 50:"#f0faf7",100:"#d0f0e8",200:"#a0e0d0",300:"#60c8b0",400:"#30ac90",500:"#1a8e72",600:"#137058",700:"#0e5444",800:"#0a3d32",900:"#06281f" },
      sand:  { 50:"#fdfaf5",100:"#f7f0e0",200:"#edddc0",300:"#e0c89a",400:"#cfaf6e",500:"#b89248",600:"#946e32",700:"#715024","800":"#553b19",900:"#3c2810" },
      cream: "#fdf8f2", ivory: "#f5ede0",
    },
  }},
  plugins: [],
};
