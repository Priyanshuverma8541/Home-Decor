import { createContext, useContext, useState, useEffect, useCallback } from "react";
import toast from "react-hot-toast";

const Ctx = createContext(null);
export const useCart = () => useContext(Ctx);

const load = () => { try { return JSON.parse(localStorage.getItem("sl_cart")) || []; } catch { return []; } };
const save = (items) => localStorage.setItem("sl_cart", JSON.stringify(items));

export function CartProvider({ children }) {
  const [items, setItems] = useState(load);

  useEffect(() => { save(items); }, [items]);

  const totalItems = items.reduce((s, i) => s + i.quantity, 0);
  const totalPrice = items.reduce((s, i) => s + i.price * i.quantity, 0);

  const addToCart = useCallback((product, quantity = 1) => {
    setItems(prev => {
      const existing = prev.find(i => i._id === product._id);
      if (existing) {
        toast.success("Quantity updated");
        return prev.map(i => i._id === product._id ? { ...i, quantity: i.quantity + quantity } : i);
      }
      toast.success("Added to cart");
      return [...prev, { _id: product._id, name: product.name, price: product.price, image: product.images?.[0] || "", category: product.category, quantity }];
    });
  }, []);

  const removeFromCart = useCallback((id) => {
    setItems(prev => prev.filter(i => i._id !== id));
    toast.success("Removed from cart");
  }, []);

  const updateQty = useCallback((id, qty) => {
    if (qty < 1) return;
    setItems(prev => prev.map(i => i._id === id ? { ...i, quantity: qty } : i));
  }, []);

  const clearCart = useCallback(() => { setItems([]); save([]); }, []);

  return (
    <Ctx.Provider value={{ items, totalItems, totalPrice, addToCart, removeFromCart, updateQty, clearCart }}>
      {children}
    </Ctx.Provider>
  );
}
