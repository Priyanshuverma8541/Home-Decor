import { StrictMode } from "react";
import { createRoot }  from "react-dom/client";
import { Toaster }     from "react-hot-toast";
import App             from "./App.jsx";
import "./index.css";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <App />
    <Toaster position="top-right" toastOptions={{
      duration: 3500,
      style: {
        fontFamily: "'DM Sans', sans-serif", fontSize: "13px",
        background: "#1a3c34", color: "#fdf6ee",
        border: "1px solid rgba(201,96,48,.3)", borderRadius: "12px",
      },
      success: { iconTheme: { primary: "#30ac90", secondary: "#fff" } },
      error:   { iconTheme: { primary: "#ef4444", secondary: "#fff" } },
    }}/>
  </StrictMode>
);
