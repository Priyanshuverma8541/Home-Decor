import { useCallback } from "react";
import { orderAPI } from "../services/api.js";
import { useCart }  from "../context/CartContext.jsx";
import toast from "react-hot-toast";

const UPI_ID   = import.meta.env.VITE_UPI_ID    || "6207855397@ybl";
const BRAND    = import.meta.env.VITE_BRAND      || "Savitri Livings";
const RZP_KEY  = import.meta.env.VITE_RAZORPAY_KEY || "";
const WA_NUM   = import.meta.env.VITE_WHATSAPP   || "6207855397";

export function usePayment() {
  const { clearCart } = useCart();

  /* ── Razorpay ───────────────────────────────────────── */
  const payWithRazorpay = useCallback(async ({ orderPayload, onSuccess }) => {
    try {
      const { data } = await orderAPI.create({ ...orderPayload, paymentMethod: "razorpay" });
      if (!data.order) throw new Error("Order creation failed");

      const options = {
        key:         RZP_KEY,
        amount:      data.order.grandTotal * 100,
        currency:    "INR",
        name:        BRAND,
        description: "Home Decor Order",
        order_id:    data.order.razorpayOrderId,
        prefill:     { name: orderPayload.guestName, contact: orderPayload.guestPhone },
        handler:     async () => {
          clearCart();
          toast.success("Payment successful! Order confirmed.");
          onSuccess?.(data.order);
        },
        theme: { color: "#1a3c34" },
        modal: { ondismiss: () => toast("Payment cancelled") },
      };
      const rzp = new window.Razorpay(options);
      rzp.on("payment.failed", () => toast.error("Payment failed. Try UPI instead."));
      rzp.open();
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not initiate payment");
    }
  }, [clearCart]);

  /* ── UPI / QR ───────────────────────────────────────── */
  const placeWithUPI = useCallback(async ({ orderPayload, onSuccess }) => {
    try {
      const { data } = await orderAPI.create({ ...orderPayload, paymentMethod: "upi" });
      if (!data.order) throw new Error("Order creation failed");
      clearCart();
      onSuccess?.(data.order, { upiId: UPI_ID, brand: BRAND });
      return data.order;
    } catch (err) {
      toast.error(err.response?.data?.message || "Order failed");
      return null;
    }
  }, [clearCart]);

  /* ── WhatsApp order ─────────────────────────────────── */
  const orderViaWhatsApp = useCallback(({ items, totalPrice, city, address }) => {
    const itemList = items.map(i => `• ${i.name} x${i.quantity} = Rs.${(i.price*i.quantity).toLocaleString("en-IN")}`).join("\n");
    const msg = `Hi Savitri Livings! 🌿\n\nI'd like to place an order:\n\n${itemList}\n\nTotal: Rs.${totalPrice.toLocaleString("en-IN")}\nCity: ${city}\nAddress: ${address}\n\nPlease confirm. Thank you!`;
    window.open(`https://wa.me/91${WA_NUM}?text=${encodeURIComponent(msg)}`, "_blank");
  }, []);

  return { payWithRazorpay, placeWithUPI, orderViaWhatsApp, UPI_ID, WA_NUM };
}
