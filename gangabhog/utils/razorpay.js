// export const handlePayment = async (amount) => {
//     const res = await fetch("${API}/api/payment/create-order", {
//       method: "POST",
//       headers: {
//         "Content-Type": "application/json",
//       },
//       body: JSON.stringify({ amount }),
//     });
  
//     const data = await res.json();
  
//     const options = {
//       key: import.meta.env.VITE_RAZORPAY_KEY_ID,
//       amount: data.amount,
//       currency: "INR",
//       name: "Savitri Jewellers",
//       description: "Purchase from Savitri Jewellers",
//       order_id: data.id,
//       handler: async (response) => {
//         const verifyRes = await fetch("${API}/api/payment/verify", {
//           method: "POST",
//           headers: { "Content-Type": "application/json" },
//           body: JSON.stringify(response),
//         });
  
//         const result = await verifyRes.json();
//         alert(result.message);
//       },
//       theme: { color: "#F37254" },
//     };
  
//     const rzp = new window.Razorpay(options);
//     rzp.open();
//   };
import axios from "axios";
const API = import.meta.env.VITE_API_URL || "https://savitri-jewellers-backend-h6vb.onrender.com"
export const handlePayment = (orderData, onSuccess) => {
  const { rpOrder, order } = orderData;

  if (!rpOrder || !order) {
    alert("Invalid order data. Please try again.");
    return;
  }

  const options = {
    key: import.meta.env.VITE_RAZORPAY_KEY_ID,
    amount: rpOrder.amount,
    currency: "INR",
    name: "Savitri Jewellers",
    description: "Purchase from Savitri Jewellers",
    order_id: rpOrder.id,
    handler: async (response) => {
      try {
        const token = localStorage.getItem("token");

        const verifyRes = await axios.post(
          `${API}/api/payment/verify`,
          { ...response, orderId: order._id },
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        if (verifyRes.data.success) {
          alert("✅ Payment successful!");
          onSuccess && onSuccess();
        } else {
          alert("❌ Payment verification failed");
        }
      } catch (err) {
        console.error("💥 Payment verification error:", err);
        alert("Payment verification failed");
      }
    },
    theme: { color: "#F4B400" },
  };

  const rzp = new window.Razorpay(options);
  rzp.open();
};
