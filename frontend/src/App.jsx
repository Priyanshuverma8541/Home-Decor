import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useState } from "react";

// ── Contexts ──────────────────────────────────────────────────────
import { AuthProvider } from "./context/AuthContext.jsx";
import { CartProvider } from "./context/CartContext.jsx";
import { CityProvider } from "./context/CityContext.jsx";

// ── Layout ────────────────────────────────────────────────────────
import Layout from "./components/layout/Layout.jsx";

// ── Pages ─────────────────────────────────────────────────────────
import Home from "./components/pages/Home.jsx";
import Shop from "./components/pages/Shop.jsx";
import ProductDetail from "./components/pages/ProductDetail.jsx";
import Cart from "./components/pages/Cart.jsx";
import { Login, Register } from "./components/pages/AuthPages.jsx";
import { MyAccount, MyOrders } from "./components/pages/AccountPages.jsx";
import { About, Contact, FAQs, Legal } from "./components/pages/StaticPages.jsx";
import { NotFound } from "./components/ui/Shared.jsx";
import { MarketplaceHome, ListingDetail, SellerHub } from "./components/pages/Marketplace.jsx";
import Ecosystem from "./components/pages/Ecosystem.jsx";
import PartnerWithUs from "./components/pages/PartnerWithUs.jsx";
import PermissionCenter from "./components/ui/PermissionCenter.jsx";

function AppShell() {
  const [permissionOpen, setPermissionOpen] = useState(false);

  return (
    <>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="shop" element={<Shop />} />
          <Route path="product/:id" element={<ProductDetail />} />
          <Route path="cart" element={<Cart />} />
          <Route path="about" element={<About />} />
          <Route path="contact" element={<Contact />} />
          <Route path="faqs" element={<FAQs />} />
          <Route path="legal" element={<Legal />} />
          <Route path="account" element={<MyAccount />} />
          <Route path="account/orders" element={<MyOrders />} />
          <Route path="marketplace" element={<MarketplaceHome />} />
          <Route path="marketplace/listing/:id" element={<ListingDetail />} />
          <Route path="marketplace/sell" element={<SellerHub />} />
          <Route path="ecosystem" element={<Ecosystem />} />
          <Route path="partner-with-us" element={<PartnerWithUs />} />
          <Route path="*" element={<NotFound />} />
        </Route>

        <Route path="login" element={<Login />} />
        <Route path="register" element={<Register />} />
      </Routes>

      <button
        type="button"
        onClick={() => setPermissionOpen(true)}
        style={{
          position: "fixed",
          right: 18,
          bottom: 22,
          zIndex: 1000,
          background: "#1a3c34",
          color: "white",
          border: "none",
          borderRadius: 999,
          padding: "0.72rem 1rem",
          fontSize: "0.75rem",
          fontWeight: 600,
          boxShadow: "0 18px 40px rgba(26,60,52,0.2)",
          cursor: "pointer",
        }}
      >
        Privacy & Permissions
      </button>

      <PermissionCenter open={permissionOpen} onClose={() => setPermissionOpen(false)} />
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <CityProvider>
          <CartProvider>
            <AppShell />
          </CartProvider>
        </CityProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
