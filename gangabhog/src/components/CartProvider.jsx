import React, { createContext, useContext, useState, useEffect } from "react";
import axios from "axios";
import { useAuth } from "../App";

const API = import.meta.env.VITE_API_URL;

// ✅ Create Context
const CartContext = createContext();

// ✅ Export Hook (THIS FIXES YOUR ERROR)
export const useCart = () => useContext(CartContext);

// ✅ Provider
const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState([]);
  const { token } = useAuth();

  // ===============================
  // 🔹 FETCH CART
  // ===============================
  const fetchCart = async () => {
    if (!token) return;

    try {
      const res = await axios.get(`${API}/api/carts`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setCartItems(res.data.items || []);
    } catch (err) {
      console.error("❌ Fetch cart error:", err);
    }
  };

  // ===============================
  // 🔹 ADD TO CART
  // ===============================
  const addToCart = async (productId, quantity = 1) => {
    if (!token) {
      alert("Please login first");
      return;
    }

    try {
      const res = await axios.post(
        `${API}/api/carts/add`,
        { productId, quantity },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setCartItems(res.data.items || []);
    } catch (err) {
      console.error("❌ Add to cart error:", err);
      throw err;
    }
  };

  // ===============================
  // 🔹 REMOVE FROM CART
  // ===============================
  const removeFromCart = async (productId) => {
    if (!token) return;

    try {
      const res = await axios.delete(
        `${API}/api/carts/remove/${productId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setCartItems(res.data.items || []);
    } catch (err) {
      console.error("❌ Remove error:", err);
    }
  };

  // ===============================
  // 🔹 LOAD CART ON LOGIN
  // ===============================
  useEffect(() => {
    fetchCart();
  }, [token]);

  // ===============================
  // 🔹 PROVIDER VALUE
  // ===============================
  return (
    <CartContext.Provider
      value={{
        cartItems,
        addToCart,
        removeFromCart,
        fetchCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export default CartProvider;