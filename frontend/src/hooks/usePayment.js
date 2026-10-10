// import { useCallback } from "react";
// import { orderAPI } from "../services/api.js";
// import { useCart }  from "../context/CartContext.jsx";
// import toast from "react-hot-toast";

// const UPI_ID   = import.meta.env.VITE_UPI_ID    || "6207855397@ybl";
// const BRAND    = import.meta.env.VITE_BRAND      || "Savitri Livings";
// const RZP_KEY  = import.meta.env.VITE_RAZORPAY_KEY || "";
// const WA_NUM   = import.meta.env.VITE_WHATSAPP   || "6207855397";

// export function usePayment() {
//   const { clearCart } = useCart();

//   /* ── Razorpay ───────────────────────────────────────── */
//   const payWithRazorpay = useCallback(async ({ orderPayload, onSuccess }) => {
//     try {
//       const { data } = await orderAPI.create({ ...orderPayload, paymentMethod: "razorpay" });
//       if (!data.order) throw new Error("Order creation failed");

//       const options = {
//         key:         RZP_KEY,
//         amount:      data.order.grandTotal * 100,
//         currency:    "INR",
//         name:        BRAND,
//         description: "Home Decor Order",
//         order_id:    data.order.razorpayOrderId,
//         prefill:     { name: orderPayload.guestName, contact: orderPayload.guestPhone },
//         handler:     async () => {
//           clearCart();
//           toast.success("Payment successful! Order confirmed.");
//           onSuccess?.(data.order);
//         },
//         theme: { color: "#1a3c34" },
//         modal: { ondismiss: () => toast("Payment cancelled") },
//       };
//       const rzp = new window.Razorpay(options);
//       rzp.on("payment.failed", () => toast.error("Payment failed. Try UPI instead."));
//       rzp.open();
//     } catch (err) {
//       toast.error(err.response?.data?.message || "Could not initiate payment");
//     }
//   }, [clearCart]);

//   /* ── UPI / QR ───────────────────────────────────────── */
//   const placeWithUPI = useCallback(async ({ orderPayload, onSuccess }) => {
//     try {
//       const { data } = await orderAPI.create({ ...orderPayload, paymentMethod: "upi" });
//       if (!data.order) throw new Error("Order creation failed");
//       clearCart();
//       onSuccess?.(data.order, { upiId: UPI_ID, brand: BRAND });
//       return data.order;
//     } catch (err) {
//       toast.error(err.response?.data?.message || "Order failed");
//       return null;
//     }
//   }, [clearCart]);

//   /* ── WhatsApp order ─────────────────────────────────── */
//   const orderViaWhatsApp = useCallback(({ items, totalPrice, city, address }) => {
//     const itemList = items.map(i => `• ${i.name} x${i.quantity} = Rs.${(i.price*i.quantity).toLocaleString("en-IN")}`).join("\n");
//     const msg = `Hi Savitri Livings! 🌿\n\nI'd like to place an order:\n\n${itemList}\n\nTotal: Rs.${totalPrice.toLocaleString("en-IN")}\nCity: ${city}\nAddress: ${address}\n\nPlease confirm. Thank you!`;
//     window.open(`https://wa.me/91${WA_NUM}?text=${encodeURIComponent(msg)}`, "_blank");
//   }, []);

//   return { payWithRazorpay, placeWithUPI, orderViaWhatsApp, UPI_ID, WA_NUM };
// }

import { useCallback } from "react";
import { orderAPI } from "../services/api.js";
import { useCart }  from "../context/CartContext.jsx";
import toast from "react-hot-toast";

const UPI_ID   = import.meta.env.VITE_UPI_ID        || "6207855397@ybl";
const BRAND    = import.meta.env.VITE_BRAND          || "Savitri Livings";
const RZP_KEY  = import.meta.env.VITE_RAZORPAY_KEY   || "";
const WA_NUM   = import.meta.env.VITE_WHATSAPP       || "6207855397";

const landingAttribution = () => {
  const query = new URLSearchParams(window.location.search);
  if (query.get("source") === "kolkata-local") return {
    landingPageSlug: "kolkata-local-commerce",
    landingPageSessionId: query.get("lcSession") || "",
    acquisition: {
      source: query.get("source") || "",
      medium: query.get("medium") || "",
      campaign: query.get("campaign") || "",
      referralCode: query.get("ref") || "",
      localArea: query.get("location") || "",
    },
  };
  return {
    landingPageSlug: sessionStorage.getItem("sl_landing_page_slug") || "",
    landingPageSessionId: sessionStorage.getItem("sl_landing_page_session") || "",
  };
};

export function usePayment() {
  const { clearCart } = useCart();

  /* ── Razorpay ───────────────────────────────────────── */
  const payWithRazorpay = useCallback(async ({ orderPayload, onSuccess }) => {
    if (!RZP_KEY) {
      toast.error("Online payment not available right now");
      return;
    }
    try {
      const { data } = await orderAPI.create({ ...orderPayload, ...landingAttribution(), paymentMethod: "razorpay" });
      if (!data.order) throw new Error("Order creation failed");

      const options = {
        key:         RZP_KEY,
        amount:      data.order.grandTotal * 100,
        currency:    "INR",
        name:        BRAND,
        description: "Savitri Livings Order",
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
      const { data } = await orderAPI.create({ ...orderPayload, ...landingAttribution(), paymentMethod: "upi" });
      if (!data.order) throw new Error("Order creation failed");
      onSuccess?.(data.order, { upiId: UPI_ID, brand: BRAND });
      clearCart();
      return data.order;
    } catch (err) {
      toast.error(err.response?.data?.message || "Order failed");
      return null;
    }
  }, [clearCart]);

  /* ── WhatsApp order ─────────────────────────────────── */
  const orderViaWhatsApp = useCallback(async ({ orderPayload, items, whatsappNumber }) => {
    const whatsappTab = window.open("about:blank", "_blank");
    try {
      if (whatsappTab) whatsappTab.opener = null;
      const { data } = await orderAPI.create({ ...orderPayload, ...landingAttribution(), orderSource: "whatsapp", paymentMethod: "whatsapp" });
      if (!data.order) throw new Error("Order creation failed");
      const order = data.order;
      const itemList = items.map((item) => `• ${item.name} x${item.quantity}`).join("\n");
      const rawNumber = String(whatsappNumber || WA_NUM).replace(/\D/g, "");
      const number = rawNumber.startsWith("91") ? rawNumber : `91${rawNumber}`;
      const msg = `Hi Savitri Livings! ✨\n\nI've placed order ${order.orderNumber || order._id}.\n\n${itemList}\n\nOrder total (including delivery): Rs.${Number(order.grandTotal || 0).toLocaleString("en-IN")}\nCity: ${order.city}\nAddress: ${order.deliveryAddress}\nPIN code: ${order.pincode || ""}\n\nPlease confirm availability and delivery. Thank you!`;
      const url = `https://wa.me/${number}?text=${encodeURIComponent(msg)}`;
      clearCart();
      toast.success(`Order ${order.orderNumber || "request"} is in Savitri Livings Admin. Continue in WhatsApp to confirm.`);
      if (whatsappTab) whatsappTab.location.replace(url);
      else window.location.assign(url);
      return order;
    } catch (err) {
      whatsappTab?.close();
      toast.error(err.response?.data?.message || err.message || "Could not place your order");
      return null;
    }
  }, [clearCart]);

  return { payWithRazorpay, placeWithUPI, orderViaWhatsApp, UPI_ID, WA_NUM };
}
