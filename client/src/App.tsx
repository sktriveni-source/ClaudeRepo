import { Route, Routes } from "react-router-dom";
import Header from "./components/Header";
import { UserProvider } from "./context/UserContext";
import ApprovalsPage from "./pages/ApprovalsPage";
import DashboardPage from "./pages/DashboardPage";
import ProductDetailPage from "./pages/ProductDetailPage";
import ProductsPage from "./pages/ProductsPage";

export default function App() {
  return (
    <UserProvider>
      <div className="app-shell">
        <Header />
        <main className="main-content">
          <Routes>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/products" element={<ProductsPage />} />
            <Route path="/products/:id" element={<ProductDetailPage />} />
            <Route path="/approvals" element={<ApprovalsPage />} />
            <Route path="*" element={<div className="state-message">Page not found.</div>} />
          </Routes>
        </main>
        <footer className="site-footer">
          ProductPulse · centralized product lifecycle &amp; approval management
        </footer>
      </div>
    </UserProvider>
  );
}
