import React from "react";
import axios from "axios";
import { useCart } from "./CartProvider";
import { motion } from "framer-motion";
import { handlePayment } from "../../utils/razorpay";

const API = import.meta.env.VITE_API_URL;

const Cart = () => {
  const { cartItems, removeFromCart } = useCart();

  const getTotal = () =>
    cartItems.reduce(
      (total, item) => total + (item.productId?.price || 0) * item.quantity,
      0
    );

  const handleBuyNow = async (productId, quantity) => {
    const selectedItem = cartItems.find(
      (item) => item.productId?._id === productId
    );

    if (!selectedItem) {
      alert("Item not found");
      return;
    }

    const token = localStorage.getItem("token");
    if (!token) {
      alert("Please login first");
      return;
    }

    const totalAmount = selectedItem.productId.price * quantity;

    try {
      console.log("📦 Creating order:", {
        totalAmount,
        productId,
        quantity,
      });

      const { data } = await axios.post(
        `${API}/api/payment/create-order`,
        {
          totalAmount,
          items: [
            {
              productId: selectedItem.productId._id,
              quantity: quantity, // ✅ FIXED
              price: selectedItem.productId.price,
            },
          ],
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      console.log("✅ Order created:", data);

      handlePayment(data, () => {
        window.location.href = "/dashboard/orders";
      });
    } catch (error) {
      console.error("💥 Payment failed:", error);
      alert(error.response?.data?.message || "Payment failed");
    }
  };

  return (
    <div className="min-h-screen bg-[#fff4e3] flex flex-col items-center py-16 px-4">
      <motion.h2
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-4xl font-bold mb-10 text-yellow-600 text-center"
      >
        🛒 Your Cart
      </motion.h2>

      {cartItems.length === 0 ? (
        <p className="text-lg text-gray-700 bg-white px-6 py-4 rounded-xl shadow">
          Your cart is empty.
        </p>
      ) : (
        <div className="w-full max-w-5xl space-y-6">
          {cartItems.map((item) => (
            <motion.div
              key={item._id}
              className="flex flex-col md:flex-row items-center justify-between bg-white border rounded-3xl p-6 shadow"
            >
              <div className="flex items-center space-x-6">
                <img
                  src={
                    item.productId?.images?.[0] ||
                    "https://via.placeholder.com/100"
                  }
                  alt={item.productId?.name}
                  className="w-28 h-28 object-cover rounded-xl"
                />
                <div>
                  <h3 className="text-xl font-semibold">
                    {item.productId?.name}
                  </h3>
                  <p>₹{item.productId?.price}</p>
                  <p>Qty: {item.quantity}</p>
                </div>
              </div>

              <div className="flex gap-3 mt-4 md:mt-0">
                <button
                  onClick={() =>
                    handleBuyNow(item.productId?._id, item.quantity)
                  }
                  className="bg-yellow-500 hover:bg-yellow-600 text-white px-5 py-2 rounded-full"
                >
                  Buy Now
                </button>

                <button
                  onClick={() => removeFromCart(item.productId?._id)}
                  className="bg-red-500 hover:bg-red-600 text-white px-5 py-2 rounded-full"
                >
                  Remove
                </button>
              </div>
            </motion.div>
          ))}

          <div className="text-2xl font-bold text-right mt-10">
            Total: ₹{getTotal().toFixed(2)}
          </div>
        </div>
      )}
    </div>
  );
};

export default Cart;