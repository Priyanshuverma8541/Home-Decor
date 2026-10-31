
import React, { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../App";
import { FaShoppingCart, FaClipboardList, FaUser, FaTimes, FaBars ,FaGem} from "react-icons/fa";
import { Tooltip } from "react-tooltip";
import "react-tooltip/dist/react-tooltip.css";

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  // Nav items (icons only)
  const navItems = [
    { name: "Products", path: "/product", icon: <FaGem className="text-2xl" /> },
    { name: "Cart", path: "/dashboard/cart", icon: <FaShoppingCart className="text-2xl" /> },
    { name: "Orders", path: "/dashboard/orders", icon: <FaClipboardList className="text-2xl" /> },
    { name: "Profile", path: "/dashboard/profile", icon: <FaUser className="text-2xl" /> },
  ];

  return (
    <header className="fixed top-0 left-0 w-full z-50 bg-white/90 backdrop-blur-md shadow-sm border-b border-gray-200">
      <nav className="max-w-7xl mx-auto flex justify-between items-center px-6 py-2 lg:py-2">
        {/* Logo */}
        <NavLink
          to="/dashboard"
          className="text-2xl font-serif font-bold text-slate-900 hover:text-yellow-600 transition-colors"
        >
          <span className="text-yellow-500">Savitri</span> Jewels
        </NavLink>

        {/* Hamburger Menu (Mobile) */}
        <button
          className="lg:hidden text-slate-700 hover:text-yellow-600 transition-colors focus:outline-none"
          onClick={toggleMenu}
        >
          {isMenuOpen ? <FaTimes className="w-6 h-6" /> : <FaBars className="w-6 h-6" />}
        </button>

        {/* Nav Items */}
        <div
          className={`absolute lg:static top-full left-0 w-full lg:w-auto bg-white/95 lg:bg-transparent backdrop-blur-md lg:backdrop-blur-0 flex flex-col lg:flex-row items-center gap-4 py-4 lg:py-0 px-6 lg:px-0 transition-all duration-300 ease-in-out ${
            isMenuOpen
              ? "opacity-100 pointer-events-auto"
              : "opacity-0 lg:opacity-100 pointer-events-none lg:pointer-events-auto"
          }`}
        >
          {navItems.map((item, index) => (
            <div key={index}>
              <NavLink
                to={item.path}
                data-tooltip-id={`nav-tip-${index}`}
                data-tooltip-content={item.name}
                className={({ isActive }) =>
                  `p-3 rounded-full transition-all duration-200 flex justify-center items-center ${
                    isActive
                      ? "bg-yellow-400 text-white shadow-md"
                      : "text-gray-600 hover:text-yellow-600 hover:bg-yellow-100"
                  }`
                }
                onClick={() => setIsMenuOpen(false)}
              >
                {item.icon}
              </NavLink>
              <Tooltip id={`nav-tip-${index}`} place="bottom" />
            </div>
          ))}

          {/* Logout Button */}
          {isAuthenticated && (
            <button
              onClick={handleLogout}
              data-tooltip-id="logout-tip"
              data-tooltip-content="Logout"
              className="p-3 rounded-full text-gray-600 hover:text-yellow-600 hover:bg-yellow-100 transition-all duration-200 flex justify-center items-center"
            >
              <FaTimes className="text-xl" />
              <Tooltip id="logout-tip" place="bottom" />
            </button>
          )}
        </div>
      </nav>
    </header>
  );
};

export default Navbar;
