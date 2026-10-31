
import React, { useState } from "react";
import { NavLink } from "react-router-dom";

const Header = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <header className="w-full bg-white/80 backdrop-blur-md border-b border-yellow-100 shadow-sm fixed top-0 left-0 z-40">
      <div className="max-w-7xl mx-auto flex justify-between items-center px-6 py-4">
        
        {/* Logo */}
        <NavLink
          to="/"
          className="text-2xl font-serif font-bold text-slate-900 hover:text-yellow-600 transition-colors"
        >
          <span className="text-yellow-500">Savitri</span> Jewels
        </NavLink>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-8">
          {["/", "/about", "/product", "/services", "/contact","/decor"].map((path, i) => {
            const labels = ["Home", "About", "Product", "Services", "Contact","Decor"];
            return (
              <NavLink
                key={i}
                to={path}
                className={({ isActive }) =>
                  `font-medium transition-colors ${
                    isActive
                      ? "text-yellow-600 font-semibold"
                      : "text-slate-700 hover:text-yellow-600"
                  }`
                }
              >
                {labels[i]}
              </NavLink>
            );
          })}
        </nav>

        {/* Desktop Buttons */}
        <div className="hidden md:flex items-center gap-4">
          <NavLink
            to="/login"
            className="text-slate-700 font-medium hover:text-yellow-600 transition-colors"
          >
            Login
          </NavLink>

          <NavLink
            to="/registration"
            className="bg-yellow-400 text-slate-900 font-semibold px-4 py-2 rounded-xl shadow hover:bg-yellow-500 active:scale-95 transition-all"
          >
            Sign Up
          </NavLink>
        </div>

        {/* Mobile Menu Button */}
        <button
          className="md:hidden flex items-center justify-center w-10 h-10 text-slate-700 hover:text-yellow-600 transition-colors"
          onClick={() => setIsOpen(!isOpen)}
        >
          {isOpen ? (
            <svg xmlns="http://www.w3.org/2000/svg" className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16m-7 6h7" />
            </svg>
          )}
        </button>
      </div>

      {/* Mobile Dropdown Menu */}
      <div
        className={`md:hidden bg-white border-t border-yellow-100 shadow-sm transition-all duration-300 overflow-hidden ${
          isOpen ? "max-h-200 opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        <div className="flex flex-col gap-4 px-6 py-4">
          {["/", "/about", "/product", "/services", "/contact","/decor"].map((path, i) => {
            const labels = ["Home", "About", "Product", "Services", "Contact","Decor"];
            return (
              <NavLink
                key={i}
                to={path}
                onClick={() => setIsOpen(false)}
                className={({ isActive }) =>
                  `block text-lg py-2 transition rounded-lg ${
                    isActive
                      ? "text-yellow-600 font-semibold"
                      : "text-slate-700 hover:text-yellow-600"
                  }`
                }
              >
                {labels[i]}
              </NavLink>
            );
          })}

          {/* Mobile Login/Register */}
          <NavLink
            to="/login"
            onClick={() => setIsOpen(false)}
            className="text-slate-700 hover:text-yellow-600 text-lg"
          >
            Login
          </NavLink>

          <NavLink
            to="/registration"
            onClick={() => setIsOpen(false)}
            className="bg-yellow-400 text-slate-900 font-semibold px-4 py-2 rounded-xl shadow hover:bg-yellow-500 transition"
          >
            Sign Up
          </NavLink>
        </div>
      </div>
    </header>
  );
};

export default Header;
