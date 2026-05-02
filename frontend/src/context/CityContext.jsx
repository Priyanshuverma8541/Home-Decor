import { createContext, useContext, useState } from "react";

const Ctx = createContext(null);
export const useCity = () => useContext(Ctx);

const CITIES = [
  { name: "Buxar",    active: true  },
  { name: "Varanasi", active: false },
  { name: "Kolkata",  active: false },
];

export function CityProvider({ children }) {
  const [city, setCity] = useState(() => localStorage.getItem("sl_city") || "Buxar");

  const selectCity = (c) => {
    setCity(c);
    localStorage.setItem("sl_city", c);
  };

  return (
    <Ctx.Provider value={{ city, selectCity, cities: CITIES }}>
      {children}
    </Ctx.Provider>
  );
}
