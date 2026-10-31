import React, { useEffect, useState } from "react";
import axios from "axios";
import { motion } from "framer-motion";
import io from "socket.io-client";
import { useAuth } from "../App";

const API_BASE = import.meta.env.VITE_API_URL;
const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || API_BASE;
const steps = ["ordered", "processing", "shipped", "delivered"];

const ProgressDots = ({ status }) => {
  const idx = Math.max(0, steps.indexOf((status || "").toLowerCase()));
  return (
    <div className="flex items-center space-x-3 mt-3">
      {steps.map((s, i) => (
        <div key={s} className="flex items-center">
          <div
            title={s}
            className={`w-4 h-4 rounded-full ${i <= idx ? "bg-yellow-500" : "bg-gray-300"}`}
          />
          {i < steps.length - 1 && (
            <div className={`h-1 ${i < idx ? "bg-yellow-400" : "bg-gray-200"} w-16 mx-3`} />
          )}
        </div>
      ))}
    </div>
  );
};

const Order = () => {
  const { user, token: authToken } = useAuth ? useAuth() : { user: null, token: null };
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const token = authToken || localStorage.getItem("token");
  const userId = user?._id || JSON.parse(localStorage.getItem("user") || "{}")._id;

  // ✅ Fetch user orders from backend
  const fetchOrders = async () => {
    try {
      setLoading(true);
      console.log("📦 Fetching orders for:", userId);
      const res = await axios.get(`${API_BASE}/api/payment/my-orders`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.data.success) {
        setOrders(res.data.orders || []);
      } else {
        setOrders([]);
      }
    } catch (err) {
      console.error("❌ Failed to fetch orders:", err.message);
      setError("Failed to fetch orders. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // ✅ Initialize Socket.IO for real-time updates
  useEffect(() => {
    if (!userId || !token) {
      setError("Please login to view your orders");
      setLoading(false);
      return;
    }

    fetchOrders();
    let socket;

    try {
      socket = io(SOCKET_URL, { transports: ["websocket"] });
      socket.on("connect", () => {
        console.log("🔌 Connected to Socket.io server");
        socket.emit("joinUserRoom", userId);
      });

      socket.on("orderCreated", (newOrder) => {
        console.log("🆕 New Order Received:", newOrder);
        if (newOrder?.user === userId || newOrder?.user?._id === userId) {
          setOrders((prev) => [newOrder, ...prev]);
        }
      });

      socket.on("orderUpdated", (updatedOrder) => {
        console.log("🔄 Order Updated:", updatedOrder);
        setOrders((prev) =>
          prev.map((o) => (o._id === updatedOrder._id ? updatedOrder : o))
        );
      });
    } catch (err) {
      console.warn("⚠️ Socket init failed:", err.message);
    }

    return () => {
      if (socket) {
        socket.emit("leaveUserRoom", userId);
        socket.disconnect();
      }
    };
  }, [userId, token]);

  // ✅ Razorpay payment initiation
  const handlePayment = async (order) => {
    try {
      const { _id, items, totalAmount } = order;

      console.log("💰 Initiating payment for Order:", _id, totalAmount);

      const res = await axios.post(
        `${API_BASE}/api/payment/create-order`,
        {
          userId,
          items: items.map((it) => ({
            productId: it.productId?._id || it.productId,
            quantity: it.quantity,
            price: it.productId?.price || it.price,
          })),
          totalAmount,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const orderData = res.data;
      console.log("✅ Razorpay order created:", orderData);

      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID,
        amount: orderData?.rpOrder?.amount,
        currency: "INR",
        name: "Savitri Jewellers",
        description: `Payment for Order #${_id}`,
        order_id: orderData?.rpOrder?.id,
        handler: async (response) => {
          try {
            console.log("🔐 Verifying payment:", response);
            const verifyRes = await axios.post(
              `${API_BASE}/api/payment/verify`,
              { ...response, orderId: orderData.order._id },
              { headers: { Authorization: `Bearer ${token}` } }
            );

            if (verifyRes.data.success) {
              alert("✅ Payment Successful!");
              await fetchOrders();
            } else {
              alert("❌ Payment verification failed");
            }
          } catch (err) {
            console.error("💥 Payment verification error:", err.message);
            alert("Verification failed. Please contact support.");
          }
        },
        theme: { color: "#F4B400" },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err) {
      console.error("💥 Payment initiation failed:", err.message);
      alert("Error initiating payment. Please try again.");
    }
  };

  // ✅ UI rendering
  if (loading) return <p className="text-center text-gray-600 mt-10">Loading orders...</p>;
  if (error) return <p className="text-center text-red-500 mt-10">{error}</p>;

  return (
    <div className="min-h-screen bg-[#fff4e3] flex flex-col items-center py-16 px-4">
      <motion.h2
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="text-4xl font-serifHeading font-bold mb-8 text-yellow-600 text-center"
      >
        📦 Your Orders
      </motion.h2>

      {orders.length === 0 ? (
        <p className="text-lg text-gray-700 bg-white/70 px-6 py-4 rounded-xl shadow-md">
          No orders yet.
        </p>
      ) : (
        <div className="w-full max-w-5xl space-y-6">
          {orders.map((order) => {
            const items = order.items || [];
            const total =
              order.totalAmount ??
              items.reduce(
                (sum, it) =>
                  sum + (it.productId?.price ?? it.price ?? 0) * (it.quantity ?? 0),
                0
              );
            const status = (order.status || "").toLowerCase();

            return (
              <motion.div
                key={order._id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35 }}
                className="bg-white/90 border border-yellow-200 rounded-3xl p-6 shadow-lg"
              >
                <div className="flex flex-col md:flex-row md:justify-between">
                  <div className="flex items-start space-x-4">
                    <img
                      src={
                        items[0]?.productId?.images?.[0] ||
                        "https://via.placeholder.com/80"
                      }
                      alt={items[0]?.productId?.name || "product"}
                      className="w-20 h-20 object-cover rounded-lg border"
                    />
                    <div>
                      <h3 className="text-lg font-semibold text-slate-900">
                        Order #{order._id.slice(-6)}{" "}
                        <span className="text-sm font-medium text-slate-600">
                          {new Date(order.createdAt).toLocaleString()}
                        </span>
                      </h3>

                      <div className="text-slate-700 mt-2 space-y-2">
                        {items.map((it) => (
                          <div
                            key={String(it.productId?._id || it.productId)}
                            className="flex items-center"
                          >
                            <span className="font-medium">
                              {it.productId?.name || "Product"}
                            </span>
                            <span className="ml-3 text-sm text-slate-600">
                              x{it.quantity}
                            </span>
                            <span className="ml-4 text-yellow-600 font-semibold">
                              ₹
                              {(
                                (it.productId?.price ?? it.price) * it.quantity
                              ).toFixed(2)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 md:mt-0 text-right">
                    <div className="text-slate-800 font-bold">
                      Total: ₹{Number(total).toFixed(2)}
                    </div>
                    <div className="text-sm text-slate-600 mt-2 capitalize">
                      Status: {status}
                    </div>
                  </div>
                </div>

                <ProgressDots status={status} />

                {order.paymentStatus === "pending" && (
                  <div className="mt-4 flex gap-3">
                    <button
                      onClick={() => handlePayment(order)}
                      className="bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded-full font-medium"
                    >
                      Pay Now
                    </button>
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Order;
