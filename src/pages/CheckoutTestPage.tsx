import { useState, useMemo } from "react";
import { ordersApi } from "../api/endpoints";
import { useCart } from "../cart/CartContext";
import type { CreateOrderResult } from "../types";

export function CheckoutTestPage() {
  const { items: cartItems, updateQuantity, removeFromCart, clearCart, subtotalCents } = useCart();
  const [email, setEmail] = useState("test@example.com");
  const [emailError, setEmailError] = useState<string | null>(null);
  const [shippingCents, setShippingCents] = useState(500);
  const [taxCents, setTaxCents] = useState(0);
  const [result, setResult] = useState<CreateOrderResult | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const lineItems = useMemo(() => {
    return cartItems.map((item) => ({
      itemId: item.itemId,
      quantity: item.quantity,
    }));
  }, [cartItems]);

  const validateEmail = (emailValue: string): boolean => {
    const trimmed = emailValue.trim();
    if (!trimmed) {
      setEmailError("Email is required");
      return false;
    }
    if (!trimmed.includes("@") || !trimmed.includes(".")) {
      setEmailError("Please enter a valid email address");
      return false;
    }
    // More comprehensive email regex
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmed)) {
      setEmailError("Please enter a valid email address");
      return false;
    }
    setEmailError(null);
    return true;
  };

  async function placeOrder() {
    setErr(null);
    setResult(null);

    if (!validateEmail(email)) return;
    if (lineItems.length === 0) return setErr("Add at least one item");

    setBusy(true);
    try {
      const res = await ordersApi.create({
        email: email.trim(),
        shippingAddress: { name: "Test User", line1: "123 Main", city: "NYC", state: "NY", zip: "10001" },
        items: lineItems,
        taxCents,
        shippingCents,
        currency: "USD",
      });
      setResult(res);
      clearCart();
    } catch (e: any) {
      setErr(String(e?.message ?? e));
    } finally {
      setBusy(false);
    }
  }

  if (err && !result) return <div style={{ color: "crimson" }}>Error: {err}</div>;

  return (
    <div>
      <h3>Checkout</h3>

      {cartItems.length === 0 ? (
        <div style={{ padding: "40px 0", textAlign: "center", color: "#999" }}>
          Your cart is empty. <a href="/">Browse items</a>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <div style={{ border: "1px solid #ddd", borderRadius: 8, padding: 12 }}>
            <h4>Your Cart</h4>
            {cartItems.map((item) => (
              <div key={item.itemId} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 0", borderBottom: "1px solid #eee" }}>
                <div>
                  <div style={{ fontWeight: 700 }}>{item.title}</div>
                  <div style={{ opacity: 0.7, fontSize: 13 }}>${(item.priceCents / 100).toFixed(2)} each</div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <input
                    type="number"
                    min={0}
                    value={item.quantity}
                    onChange={(e) => {
                      const qty = Number(e.target.value || 0);
                      if (qty === 0) {
                        removeFromCart(item.itemId);
                      } else {
                        updateQuantity(item.itemId, qty);
                      }
                    }}
                    style={{ width: 80 }}
                  />
                  <button
                    onClick={() => removeFromCart(item.itemId)}
                    style={{ background: "#ff4444", color: "white", border: "none", padding: "4px 8px", borderRadius: 4, cursor: "pointer" }}
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div style={{ border: "1px solid #ddd", borderRadius: 8, padding: 12 }}>
            <h4>Order Details</h4>
            <div style={{ display: "grid", gap: 8 }}>
              <label>
                Email *
                <input 
                  type="email"
                  value={email} 
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setEmailError(null); // Clear error on change
                  }}
                  onBlur={() => validateEmail(email)}
                  style={{ 
                    width: "100%",
                    borderColor: emailError ? "#ff4444" : undefined,
                    borderWidth: emailError ? 2 : undefined,
                  }} 
                />
                {emailError && (
                  <span style={{ color: "#ff4444", fontSize: 12, marginTop: 4 }}>
                    {emailError}
                  </span>
                )}
              </label>

              <div style={{ paddingTop: 8, borderTop: "1px solid #eee", marginTop: 8 }}>
                <div style={{ display: "flex", justifyContent: "space-between", padding: "4px 0" }}>
                  <span>Subtotal:</span>
                  <span>${(subtotalCents / 100).toFixed(2)}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", padding: "4px 0" }}>
                  <span>Shipping:</span>
                  <span>${(shippingCents / 100).toFixed(2)}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", padding: "4px 0" }}>
                  <span>Tax:</span>
                  <span>${(taxCents / 100).toFixed(2)}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderTop: "1px solid #eee", marginTop: 4, fontWeight: 600, fontSize: 16 }}>
                  <span>Total:</span>
                  <span>${((subtotalCents + taxCents + shippingCents) / 100).toFixed(2)}</span>
                </div>
              </div>

              <button disabled={busy || cartItems.length === 0 || !!emailError} onClick={placeOrder} style={{ padding: 10, marginTop: 8 }}>
                {busy ? "Placing…" : "Place Order (Test)"}
              </button>
            </div>
          </div>
        </div>
      )}

      {result ? (
        <div style={{ marginTop: 16, border: "1px solid #ddd", borderRadius: 8, padding: 12 }}>
          <h4>Result</h4>
          <div>Order ID: {result.orderId}</div>
          <div>
            Fulfillment created: NEEDS_SHIPPED={result.fulfillment.needsShipped}, NEEDS_CREATED={result.fulfillment.needsCreated}
          </div>
          <pre style={{ whiteSpace: "pre-wrap" }}>{JSON.stringify(result, null, 2)}</pre>
        </div>
      ) : null}
    </div>
  );
}
