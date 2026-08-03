import { Routes, Route } from "react-router-dom";
import { Header } from "./components/Header";
import { OrdersListPage } from "./pages/OrdersListPage";
import { NewRequirementPage } from "./pages/NewRequirementPage";
import { OrderDetailPage } from "./pages/OrderDetailPage";
import { VendorsPage } from "./pages/VendorsPage";

export default function App() {
  return (
    <div className="app-shell">
      <Header />
      <main>
        <Routes>
          <Route path="/" element={<OrdersListPage />} />
          <Route path="/new" element={<NewRequirementPage />} />
          <Route path="/orders/:id" element={<OrderDetailPage />} />
          <Route path="/vendors" element={<VendorsPage />} />
        </Routes>
      </main>
    </div>
  );
}
