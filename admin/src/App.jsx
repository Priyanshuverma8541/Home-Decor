import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider }               from "./context/AuthContext.jsx";
import { Layout, ProtectedRoute }     from "./components/layout/Layout.jsx";
import Login                          from "./components/pages/Login.jsx";
import Dashboard                      from "./components/pages/Dashboard.jsx";
import Orders                         from "./components/pages/Orders.jsx";
import Products                       from "./components/pages/Products.jsx";
import CRM                            from "./components/pages/CRM.jsx";
import Settings                       from "./components/pages/Settings.jsx";
import { Partners, Campaigns } from "./components/pages/OtherPages.jsx";
import Analytics from "./components/pages/Analytics.jsx";

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
            <Route index           element={<Dashboard />}  />
            <Route path="orders"   element={<Orders />}     />
            <Route path="products" element={<Products />}   />
            <Route path="crm"      element={<CRM />}        />
            <Route path="partners" element={<Partners />}   />
            <Route path="campaigns"element={<Campaigns />}  />
            <Route path="analytics"element={<Analytics />}  />
            <Route path="settings" element={<Settings />}   />
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
