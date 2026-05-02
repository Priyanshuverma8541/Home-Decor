import { StrictMode } from "react";
import { createRoot }  from "react-dom/client";
import { Toaster }     from "react-hot-toast";
import App             from "./App.jsx";
import "./index.css";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <App />
    <Toaster position="top-right" toastOptions={{
      duration: 3000,
      style: { fontFamily:"'Inter',sans-serif", fontSize:"13px", background:"#2c1f14", color:"#fdf8f2", border:"1px solid rgba(201,96,48,.3)", borderRadius:"10px" },
      success: { iconTheme: { primary:"#c96030", secondary:"#fff" } },
      error:   { iconTheme: { primary:"#ef4444", secondary:"#fff" } },
    }}/>
  </StrictMode>
);
