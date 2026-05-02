import { BrowserRouter, Routes, Route } from "react-router-dom";

// ── Contexts ──────────────────────────────────────────────────────
import { AuthProvider } from "./context/AuthContext.jsx";
import { CartProvider } from "./context/CartContext.jsx";
import { CityProvider } from "./context/CityContext.jsx";

// ── Layout ────────────────────────────────────────────────────────
import Layout from "./components/layout/Layout.jsx";

// ── Pages ─────────────────────────────────────────────────────────
import Home           from "./components/pages/Home.jsx";
import Shop           from "./components/pages/Shop.jsx";
import ProductDetail  from "./components/pages/ProductDetail.jsx";
import Cart           from "./components/pages/Cart.jsx";
import { Login, Register }             from "./components/pages/AuthPages.jsx";
import { MyAccount, MyOrders }         from "./components/pages/AccountPages.jsx";
import { About, Contact, FAQs, Legal } from "./components/pages/StaticPages.jsx";
import { NotFound }                    from "./components/ui/Shared.jsx";

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <CityProvider>
          <CartProvider>
            <Routes>

              {/* Public — with Navbar + Footer */}
              <Route element={<Layout />}>
                <Route index             element={<Home />}          />
                <Route path="shop"       element={<Shop />}          />
                <Route path="product/:id"element={<ProductDetail />} />
                <Route path="cart"       element={<Cart />}          />
                <Route path="about"      element={<About />}         />
                <Route path="contact"    element={<Contact />}       />
                <Route path="faqs"       element={<FAQs />}          />
                <Route path="legal"      element={<Legal />}         />
                <Route path="account"    element={<MyAccount />}     />
                <Route path="account/orders" element={<MyOrders />}  />
                <Route path="*"          element={<NotFound />}      />
              </Route>

              {/* Auth — no nav/footer (own full-screen layouts) */}
              <Route path="login"    element={<Login />}    />
              <Route path="register" element={<Register />} />

            </Routes>
          </CartProvider>
        </CityProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
