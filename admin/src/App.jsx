import { lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider }               from "./context/AuthContext.jsx";
import { Layout, ProtectedRoute }     from "./components/layout/Layout.jsx";
import { PageLoader } from "./components/ui/index.jsx";

const Login = lazy(() => import("./components/pages/Login.jsx"));
const Dashboard = lazy(() => import("./components/pages/Dashboard.jsx"));
const Orders = lazy(() => import("./components/pages/Orders.jsx"));
const Products = lazy(() => import("./components/pages/Products.jsx"));
const CRM = lazy(() => import("./components/pages/CRM.jsx"));
const Settings = lazy(() => import("./components/pages/Settings.jsx"));
const Partners = lazy(() => import("./components/pages/OtherPages.jsx").then((module) => ({ default: module.Partners })));
const Campaigns = lazy(() => import("./components/pages/OtherPages.jsx").then((module) => ({ default: module.Campaigns })));
const Analytics = lazy(() => import("./components/pages/Analytics.jsx"));
const Marketplace = lazy(() => import("./components/pages/Marketplace.jsx"));
const Marketing = lazy(() => import("./components/pages/Marketing.jsx"));
const BusinessOpportunities = lazy(() => import("./components/pages/BusinessOpportunities.jsx"));
const PushNotifications = lazy(() => import("./components/pages/PushNotifications.jsx"));
const PrivacyDataCenter = lazy(() => import("./components/pages/PrivacyDataCenter.jsx"));
const Pages = lazy(() => import("./components/pages/Pages.jsx"));
const Savinexa = lazy(() => import("./components/pages/Savinexa.jsx"));
const Audience = lazy(() => import("./components/pages/Audience.jsx"));
const PlatformApps = lazy(() => import("./components/pages/PlatformApps.jsx"));
const SavinexaWebsite = lazy(() => import("./components/savinexa/SavinexaWebsite.jsx"));

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
            <Route index           element={<Dashboard />}  />
            <Route path="orders"   element={<Orders />}     />
            <Route path="products" element={<Products />}   />
            <Route path="crm"      element={<CRM />}        />
            <Route path="audience" element={<Audience />}   />
            <Route path="partners" element={<Partners />}   />
            <Route path="campaigns"element={<Campaigns />}  />
            <Route path="analytics"element={<Analytics />}  />
            <Route path="marketplace" element={<Marketplace />} />
            <Route path="marketing" element={<Marketing />} />
            <Route path="business-opportunities" element={<BusinessOpportunities />} />
            <Route path="push-notifications" element={<PushNotifications />} />
            <Route path="platform" element={<PlatformApps />} />
            <Route path="privacy" element={<PrivacyDataCenter />} />
            <Route path="pages" element={<Pages />} />
            <Route path="savinexa" element={<Savinexa />} />
            <Route path="savinexa/website" element={<SavinexaWebsite />} />
            <Route path="settings" element={<Settings />}   />
          </Route>
        </Routes>
        </Suspense>
      </AuthProvider>
    </BrowserRouter>
  );
}
