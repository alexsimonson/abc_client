import { Link, Route, Routes } from "react-router-dom";
import { ItemsListPage } from "./pages/ItemsListPage";
import { ItemDetailPage } from "./pages/ItemDetailPage";
import { CheckoutTestPage } from "./pages/CheckoutTestPage";
import { LoginPage } from "./pages/LoginPage";
import { AdminItemsPage } from "./pages/admin/AdminItemsPage";
import { AdminFulfillmentPage } from "./pages/admin/AdminFulfillmentPage";
import { useAuth } from "./auth/authProvider";
import { CartWidget } from "./cart/CartWidget";
import { useCart } from "./cart/CartContext";

export default function App() {
  const { user, logout } = useAuth();
  const { totalItems } = useCart();
  const isAdmin = user?.isAdmin ?? false;

  return (
    <div style={{ fontFamily: "system-ui", padding: 16, maxWidth: 1100, margin: "0 auto" }}>
      <header style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 16 }}>
        <h2 style={{ margin: 0 }}>Crochet Store — Test Console</h2>
        <nav style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <Link to="/">Items</Link>
          <Link to="/checkout" style={{ position: "relative" }}>
            Checkout
            {totalItems > 0 && (
              <span
                style={{
                  position: "absolute",
                  top: -8,
                  right: -8,
                  background: "#ff4444",
                  color: "white",
                  borderRadius: "50%",
                  width: 18,
                  height: 18,
                  fontSize: 11,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: 700,
                }}
              >
                {totalItems}
              </span>
            )}
          </Link>
          {isAdmin && (
            <>
              <span style={{ opacity: 0.5 }}>|</span>
              <Link to="/admin/items">Admin Items</Link>
              <Link to="/admin/fulfillment">Admin Fulfillment</Link>
            </>
          )}
          {user && (
            <>
              <span style={{ opacity: 0.5 }}>|</span>
              <span style={{ fontSize: 14, opacity: 0.7 }}>{user.username}</span>
              <button onClick={() => logout()} style={{ padding: "4px 8px", fontSize: 12 }}>
                Logout
              </button>
            </>
          )}
        </nav>
      </header>

      <Routes>
        <Route path="/" element={<ItemsListPage />} />
        <Route path="/items/:id" element={<ItemDetailPage />} />
        <Route path="/checkout" element={<CheckoutTestPage />} />
        <Route path="/admin/login" element={<LoginPage />} />
        <Route path="/admin/items" element={<AdminItemsPage />} />
        <Route path="/admin/fulfillment" element={<AdminFulfillmentPage />} />
      </Routes>

      <CartWidget />
    </div>
  );
}
