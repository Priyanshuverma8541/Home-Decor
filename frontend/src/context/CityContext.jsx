import { createContext, useContext, useState } from "react";

const Ctx = createContext(null);
export const useCity = () => useContext(Ctx);

const CITIES = [{ name: "Pan India", active: true }];

export function CityProvider({ children }) {
  const [city, setCity] = useState("Pan India");

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
