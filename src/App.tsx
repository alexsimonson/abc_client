import { Link, Route, Routes } from "react-router-dom";
import { ItemsListPage } from "./pages/ItemsListPage";
import { ItemDetailPage } from "./pages/ItemDetailPage";
import { CheckoutTestPage } from "./pages/CheckoutTestPage";
import { AdminItemsPage } from "./pages/admin/AdminItemsPage";
import { AdminFulfillmentPage } from "./pages/admin/AdminFulfillmentPage";

export default function App() {
  return (
    <div style={{ fontFamily: "system-ui", padding: 16, maxWidth: 1100, margin: "0 auto" }}>
      <header style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 16 }}>
        <h2 style={{ margin: 0 }}>Crochet Store — Test Console</h2>
        <nav style={{ display: "flex", gap: 12 }}>
          <Link to="/">Items</Link>
          <Link to="/checkout">Checkout Test</Link>
          <span style={{ opacity: 0.5 }}>|</span>
          <Link to="/admin/items">Admin Items</Link>
          <Link to="/admin/fulfillment">Admin Fulfillment</Link>
        </nav>
      </header>

      <Routes>
        <Route path="/" element={<ItemsListPage />} />
        <Route path="/items/:id" element={<ItemDetailPage />} />
        <Route path="/checkout" element={<CheckoutTestPage />} />
        <Route path="/admin/items" element={<AdminItemsPage />} />
        <Route path="/admin/fulfillment" element={<AdminFulfillmentPage />} />
      </Routes>
    </div>
  );
}
