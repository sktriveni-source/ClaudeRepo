import type { ReactNode } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { Layout } from "./components/Layout";
import { LoginPage } from "./pages/LoginPage";
import { DashboardPage } from "./pages/DashboardPage";
import { ProductsPage } from "./pages/ProductsPage";
import { ProductDetailPage } from "./pages/ProductDetailPage";
import { ChangeRequestsPage } from "./pages/ChangeRequestsPage";
import { AiAssistantPage } from "./pages/AiAssistantPage";
import { DataQualityPage } from "./pages/DataQualityPage";
import { DuplicatesPage } from "./pages/DuplicatesPage";
import { AuditLogPage } from "./pages/AuditLogPage";

function RequireAuth({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="empty-state">Loading...</div>;
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route
            element={
              <RequireAuth>
                <Layout />
              </RequireAuth>
            }
          >
            <Route path="/" element={<DashboardPage />} />
            <Route path="/products" element={<ProductsPage />} />
            <Route path="/products/:id" element={<ProductDetailPage />} />
            <Route path="/change-requests" element={<ChangeRequestsPage />} />
            <Route path="/ai-assistant" element={<AiAssistantPage />} />
            <Route path="/data-quality" element={<DataQualityPage />} />
            <Route path="/duplicates" element={<DuplicatesPage />} />
            <Route path="/audit" element={<AuditLogPage />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
