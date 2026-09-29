import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useState } from "react";
import { X } from "lucide-react";

// ── Contexts ──────────────────────────────────────────────────────
import { AuthProvider } from "./context/AuthContext.jsx";
import { CartProvider } from "./context/CartContext.jsx";
import { CityProvider } from "./context/CityContext.jsx";
import { EntertainmentProvider } from "./context/EntertainmentContext.jsx";

// ── Layout ────────────────────────────────────────────────────────
import Layout from "./components/layout/Layout.jsx";

// ── Pages ─────────────────────────────────────────────────────────
import Home from "./components/pages/HomeExperience.jsx";
import Shop from "./components/pages/Shop.jsx";
import ProductDetail from "./components/pages/ProductDetail.jsx";
import Cart from "./components/pages/Cart.jsx";
import { EntertainmentHome, EntertainmentSearch, PlaylistPage } from "./modules/entertainment/index.js";
import { Login, Register } from "./components/pages/AuthPages.jsx";
import { MyAccount, MyOrders } from "./components/pages/AccountPages.jsx";
import { About, Contact, FAQs, Legal } from "./components/pages/StaticPages.jsx";
import { NotFound } from "./components/ui/Shared.jsx";
import { MarketplaceHome, ListingDetail, SellerHub } from "./components/pages/Marketplace.jsx";
import Ecosystem from "./components/pages/Ecosystem.jsx";
import PartnerWithUs from "./components/pages/PartnerWithUs.jsx";
import PermissionCenter from "./components/ui/PermissionCenter.jsx";
import Navbar from "./components/layout/Navbar.jsx";
import Footer from "./components/layout/Footer.jsx";
import PageRenderer from "./components/pages/PageRenderer.jsx";
import SavinexaHome from "./components/pages/SavinexaHome.jsx";
import SavinexaProducts from "./components/pages/SavinexaProducts.jsx";
import SavinexaProductDetail from "./components/pages/SavinexaProductDetail.jsx";

function AppShell() {
  const [permissionOpen, setPermissionOpen] = useState(false);
  const [privacyLauncherVisible, setPrivacyLauncherVisible] = useState(
    () => localStorage.getItem("savitri-hide-privacy-launcher") !== "true"
  );

  const hidePrivacyLauncher = () => {
    localStorage.setItem("savitri-hide-privacy-launcher", "true");
    setPrivacyLauncherVisible(false);
  };

  return (
    <>
      <Routes>
        <Route element={<Layout onOpenPermissions={() => setPermissionOpen(true)} />}>
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
          <Route path="savinexa" element={<SavinexaHome />} />
          <Route path="savinexa/products" element={<SavinexaProducts />} />
          <Route path="savinexa/product/:slug" element={<SavinexaProductDetail />} />
          <Route path="savinexa/category/:slug" element={<SavinexaProducts />} />
          <Route path="savinexa/collection/:slug" element={<SavinexaProducts />} />
          <Route path="ecosystem" element={<Ecosystem />} />
          <Route path="partner-with-us" element={<PartnerWithUs />} />
          <Route path="entertainment" element={<EntertainmentHome />} />
          <Route path="entertainment/search" element={<EntertainmentSearch />} />
          <Route path="entertainment/category/:slug" element={<EntertainmentHome />} />
          <Route path="entertainment/playlists" element={<PlaylistPage />} />
          <Route path="*" element={<NotFound />} />
        </Route>

        <Route path="login" element={<Login />} />
        <Route path="register" element={<Register />} />
        <Route path="p/:slug" element={<PageRenderer Navbar={Navbar} Footer={Footer} />} />
      </Routes>

      {privacyLauncherVisible && (
        <div style={{ position: "fixed", right: 18, bottom: 22, zIndex: 1000 }}>
          <button
            type="button"
            onClick={() => setPermissionOpen(true)}
            style={{
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
          <button
            type="button"
            onClick={hidePrivacyLauncher}
            aria-label="Hide Privacy & Permissions button"
            title="Hide Privacy & Permissions button"
            style={{
              position: "absolute",
              top: -8,
              right: -8,
              width: 24,
              height: 24,
              border: "1px solid rgba(255,255,255,0.85)",
              borderRadius: "50%",
              background: "#fffaf3",
              color: "#1a3c34",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
              cursor: "pointer",
            }}
          >
            <X size={14} />
          </button>
        </div>
      )}

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
            <EntertainmentProvider>
              <AppShell />
            </EntertainmentProvider>
          </CartProvider>
        </CityProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
