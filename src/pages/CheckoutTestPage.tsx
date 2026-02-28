import { useState, useMemo, useCallback } from "react";
import { paymentApi } from "../api/endpoints";
import { useCart } from "../cart/CartContext";
import { SquarePaymentWidget } from "../components/SquarePaymentWidget";
import type { CardSummary } from "../components/SquarePaymentWidget";
import type { CreateOrderResult } from "../types";

type ShippingDetails = {
  name: string;
  line1: string;
  line2: string;
  city: string;
  state: string;
  zip: string;
};

export function CheckoutTestPage() {
  const { items: cartItems, updateQuantity, removeFromCart, clearCart, subtotalCents } = useCart();
  const [email, setEmail] = useState("test@example.com");
  const [emailError, setEmailError] = useState<string | null>(null);
  const [shippingCents, setShippingCents] = useState(500);
  const [taxCents, setTaxCents] = useState(0);
  const [result, setResult] = useState<CreateOrderResult | null>(null);
  const [paymentResult, setPaymentResult] = useState<{ id: string; status: string; receiptUrl?: string } | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [cardNonce, setCardNonce] = useState<string | null>(null);
  const [cardSummary, setCardSummary] = useState<CardSummary | null>(null);
  const [shippingDetails, setShippingDetails] = useState<ShippingDetails>({
    name: "",
    line1: "",
    line2: "",
    city: "",
    state: "",
    zip: "",
  });
  const [shippingError, setShippingError] = useState<string | null>(null);
  const [activeStep, setActiveStep] = useState<"review" | "payment" | "confirm">("review");

  const formatMoney = (cents: number, currency = "USD") => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
    }).format(cents / 100);
  };

  const squareApplicationId = import.meta.env.VITE_SQUARE_APPLICATION_ID;
  const squareLocationId = import.meta.env.VITE_SQUARE_LOCATION_ID;
  const squareEnvironment = (import.meta.env.VITE_SQUARE_ENVIRONMENT || "sandbox").toLowerCase() === "production"
    ? "production"
    : "sandbox";

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
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmed)) {
      setEmailError("Please enter a valid email address");
      return false;
    }
    setEmailError(null);
    return true;
  };

  const validateShipping = (shipping: ShippingDetails): boolean => {
    if (!shipping.name.trim()) return setShippingError("Shipping name is required"), false;
    if (!shipping.line1.trim()) return setShippingError("Shipping address line 1 is required"), false;
    if (!shipping.city.trim()) return setShippingError("Shipping city is required"), false;
    if (!shipping.state.trim()) return setShippingError("Shipping state is required"), false;
    if (!shipping.zip.trim()) return setShippingError("Shipping ZIP is required"), false;
    setShippingError(null);
    return true;
  };

  const handlePaymentSourceReady = useCallback((sourceId: string, summary?: CardSummary) => {
    setCardNonce(sourceId);
    setCardSummary(summary ?? null);
    setActiveStep("confirm");
  }, []);

  const handlePaymentError = useCallback((error: string) => {
    setErr(error);
  }, []);

  async function processPayment() {
    setErr(null);
    setResult(null);

    if (!validateEmail(email)) return;
    if (!validateShipping(shippingDetails)) return;
    if (lineItems.length === 0) return setErr("Add at least one item");
    if (!cardNonce) return setErr("Payment method not ready");

    setBusy(true);
    try {
      const res = await paymentApi.process({
        email: email.trim(),
        shippingAddress: {
          name: shippingDetails.name.trim(),
          line1: shippingDetails.line1.trim(),
          line2: shippingDetails.line2.trim() || undefined,
          city: shippingDetails.city.trim(),
          state: shippingDetails.state.trim(),
          zip: shippingDetails.zip.trim(),
        },
        items: lineItems,
        taxCents,
        shippingCents,
        currency: "USD",
        sourceId: cardNonce,
      });

      setResult(res.order);
      setPaymentResult(res.payment);
      clearCart();
      setActiveStep("confirm");
      setCardNonce(null);
    } catch (e: any) {
      setErr(String(e?.message ?? e));
      setActiveStep("payment");
    } finally {
      setBusy(false);
    }
  }

  if (!squareApplicationId) {
    return (
      <div style={{ color: "crimson", padding: 20 }}>
        Error: VITE_SQUARE_APPLICATION_ID environment variable not set
      </div>
    );
  }

  if (!squareLocationId) {
    return (
      <div style={{ color: "crimson", padding: 20 }}>
        Error: VITE_SQUARE_LOCATION_ID environment variable not set
      </div>
    );
  }

  if (err && !result) return <div style={{ color: "crimson", padding: 20 }}>Error: {err}</div>;

  return (
    <div>
      <h3>Checkout with Square</h3>

      {cartItems.length === 0 ? (
        <div style={{ padding: "40px 0", textAlign: "center", color: "#999" }}>
          Your cart is empty. <a href="/">Browse items</a>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <div style={{ border: "1px solid #ddd", borderRadius: 8, padding: 12 }}>
            <h4>Your Cart</h4>
            {cartItems.map((item) => (
              <div
                key={item.itemId}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "10px 0",
                  borderBottom: "1px solid #eee",
                }}
              >
                <div>
                  <div style={{ fontWeight: 700 }}>{item.title}</div>
                  <div style={{ opacity: 0.7, fontSize: 13 }}>
                    ${(item.priceCents / 100).toFixed(2)} each
                  </div>
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
                    style={{
                      background: "#ff4444",
                      color: "white",
                      border: "none",
                      padding: "4px 8px",
                      borderRadius: 4,
                      cursor: "pointer",
                    }}
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div style={{ border: "1px solid #ddd", borderRadius: 8, padding: 12 }}>
            {activeStep === "review" && (
              <>
                <h4>Order Review</h4>
                <div style={{ display: "grid", gap: 8 }}>
                  <label>
                    Email *
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        setEmailError(null);
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

                  <div style={{ marginTop: 8, paddingTop: 8, borderTop: "1px solid #eee" }}>
                    <h5 style={{ margin: "0 0 8px 0" }}>Shipping Details</h5>
                    <label>
                      Full Name *
                      <input
                        type="text"
                        value={shippingDetails.name}
                        onChange={(e) => {
                          setShippingDetails((prev) => ({ ...prev, name: e.target.value }));
                          setShippingError(null);
                        }}
                        style={{ width: "100%" }}
                      />
                    </label>
                    <label>
                      Address Line 1 *
                      <input
                        type="text"
                        value={shippingDetails.line1}
                        onChange={(e) => {
                          setShippingDetails((prev) => ({ ...prev, line1: e.target.value }));
                          setShippingError(null);
                        }}
                        style={{ width: "100%" }}
                      />
                    </label>
                    <label>
                      Address Line 2
                      <input
                        type="text"
                        value={shippingDetails.line2}
                        onChange={(e) => setShippingDetails((prev) => ({ ...prev, line2: e.target.value }))}
                        style={{ width: "100%" }}
                      />
                    </label>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
                      <label>
                        City *
                        <input
                          type="text"
                          value={shippingDetails.city}
                          onChange={(e) => {
                            setShippingDetails((prev) => ({ ...prev, city: e.target.value }));
                            setShippingError(null);
                          }}
                          style={{ width: "100%" }}
                        />
                      </label>
                      <label>
                        State *
                        <input
                          type="text"
                          value={shippingDetails.state}
                          onChange={(e) => {
                            setShippingDetails((prev) => ({ ...prev, state: e.target.value }));
                            setShippingError(null);
                          }}
                          style={{ width: "100%" }}
                        />
                      </label>
                      <label>
                        ZIP *
                        <input
                          type="text"
                          value={shippingDetails.zip}
                          onChange={(e) => {
                            setShippingDetails((prev) => ({ ...prev, zip: e.target.value }));
                            setShippingError(null);
                          }}
                          style={{ width: "100%" }}
                        />
                      </label>
                    </div>
                    {shippingError && <span style={{ color: "#ff4444", fontSize: 12 }}>{shippingError}</span>}
                  </div>

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
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        padding: "8px 0",
                        borderTop: "1px solid #eee",
                        marginTop: 4,
                        fontWeight: 600,
                        fontSize: 16,
                      }}
                    >
                      <span>Total:</span>
                      <span>${((subtotalCents + taxCents + shippingCents) / 100).toFixed(2)}</span>
                    </div>
                  </div>

                  <button
                    disabled={!!emailError || cartItems.length === 0}
                    onClick={() => {
                      if (!validateEmail(email)) return;
                      if (!validateShipping(shippingDetails)) return;
                      setActiveStep("payment");
                    }}
                    style={{ padding: 10, marginTop: 8, backgroundColor: "#4CAF50", color: "white", border: "none", borderRadius: 4, cursor: "pointer" }}
                  >
                    Proceed to Payment
                  </button>
                </div>
              </>
            )}

            {activeStep === "payment" && (
              <>
                <SquarePaymentWidget
                  applicationId={squareApplicationId}
                  locationId={squareLocationId}
                  squareEnvironment={squareEnvironment}
                  onPaymentSourceReady={handlePaymentSourceReady}
                  onError={handlePaymentError}
                  isProcessing={busy}
                />
                <button
                  onClick={() => setActiveStep("review")}
                  style={{
                    marginTop: 12,
                    padding: 8,
                    backgroundColor: "#999",
                    color: "white",
                    border: "none",
                    borderRadius: 4,
                    cursor: "pointer",
                    width: "100%",
                  }}
                >
                  Back
                </button>
              </>
            )}

            {activeStep === "confirm" && !result && (
              <>
                <h4>Confirm Payment</h4>
                <div style={{ marginBottom: 12, padding: 12, backgroundColor: "#f0f0f0", borderRadius: 4 }}>
                  <p>
                    <strong>Amount:</strong> ${((subtotalCents + taxCents + shippingCents) / 100).toFixed(2)}
                  </p>
                  <p>
                    <strong>Email:</strong> {email}
                  </p>
                  <p>
                    <strong>Shipping:</strong> {shippingDetails.name}, {shippingDetails.line1}
                    {shippingDetails.line2 ? `, ${shippingDetails.line2}` : ""}, {shippingDetails.city}, {shippingDetails.state} {shippingDetails.zip}
                  </p>
                  <p>
                    <strong>Card:</strong>{" "}
                    {cardSummary?.brand || cardSummary?.last4
                      ? `${cardSummary.brand ?? "Card"} •••• ${cardSummary.last4 ?? ""}${cardSummary.expMonth && cardSummary.expYear ? ` (exp ${cardSummary.expMonth}/${cardSummary.expYear})` : ""}`
                      : "Card tokenized"}
                  </p>
                </div>
                <button
                  disabled={busy}
                  onClick={processPayment}
                  style={{
                    width: "100%",
                    padding: 10,
                    backgroundColor: busy ? "#ccc" : "#4CAF50",
                    color: "white",
                    border: "none",
                    borderRadius: 4,
                    cursor: busy ? "default" : "pointer",
                    marginBottom: 8,
                  }}
                >
                  {busy ? "Processing..." : "Confirm & Pay"}
                </button>
                <button
                  onClick={() => setActiveStep("review")}
                  style={{
                    width: "100%",
                    padding: 10,
                    backgroundColor: "#999",
                    color: "white",
                    border: "none",
                    borderRadius: 4,
                    cursor: "pointer",
                    marginBottom: 8,
                  }}
                >
                  Edit Shipping Details
                </button>
                <button
                  onClick={() => {
                    setActiveStep("payment");
                    setCardNonce(null);
                    setCardSummary(null);
                  }}
                  style={{
                    width: "100%",
                    padding: 10,
                    backgroundColor: "#999",
                    color: "white",
                    border: "none",
                    borderRadius: 4,
                    cursor: "pointer",
                  }}
                >
                  Change Payment Method
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {result ? (
        <div style={{ marginTop: 16, border: "1px solid #ddd", borderRadius: 8, padding: 12 }}>
          <h4 style={{ color: "#4CAF50" }}>✓ Payment Successful!</h4>
          <div style={{ marginBottom: 12 }}>
            <div>
              <strong>Order ID:</strong> {result.orderId}
            </div>
            <div>
              <strong>Total:</strong> {formatMoney(result.totals.totalCents, result.totals.currency)}
            </div>
            <div>
              <strong>Status:</strong> {result.fulfillment.needsShipped > 0 ? "Ready to Ship" : "Completed"}
            </div>
            {paymentResult ? (
              <>
                <div>
                  <strong>Payment ID:</strong> {paymentResult.id}
                </div>
                <div>
                  <strong>Payment Status:</strong> {paymentResult.status}
                </div>
              </>
            ) : null}
            <div>
              <strong>Shipped To:</strong> {shippingDetails.name}, {shippingDetails.line1}
              {shippingDetails.line2 ? `, ${shippingDetails.line2}` : ""}, {shippingDetails.city}, {shippingDetails.state} {shippingDetails.zip}
            </div>
            {cardSummary?.brand || cardSummary?.last4 ? (
              <div>
                <strong>Card:</strong> {cardSummary.brand ?? "Card"} •••• {cardSummary.last4 ?? ""}
                {cardSummary.expMonth && cardSummary.expYear ? ` (exp ${cardSummary.expMonth}/${cardSummary.expYear})` : ""}
              </div>
            ) : null}
          </div>
          <div
            style={{
              backgroundColor: "#f8f9fb",
              border: "1px solid #e5e7eb",
              borderRadius: 8,
              padding: 12,
            }}
          >
            <h5 style={{ margin: "0 0 10px" }}>Order Summary</h5>

            <div style={{ display: "grid", gap: 6, marginBottom: 12 }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span>Subtotal</span>
                <strong>{formatMoney(result.totals.subtotalCents, result.totals.currency)}</strong>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span>Tax</span>
                <strong>{formatMoney(result.totals.taxCents, result.totals.currency)}</strong>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span>Shipping</span>
                <strong>{formatMoney(result.totals.shippingCents, result.totals.currency)}</strong>
              </div>
              <div style={{ borderTop: "1px solid #e5e7eb", paddingTop: 6, display: "flex", justifyContent: "space-between" }}>
                <span>Total</span>
                <strong>{formatMoney(result.totals.totalCents, result.totals.currency)}</strong>
              </div>
            </div>

            <div style={{ marginBottom: 12 }}>
              <h6 style={{ margin: "0 0 8px" }}>Items</h6>
              <div style={{ display: "grid", gap: 8 }}>
                {result.lineItems.map((lineItem) => (
                  <div
                    key={lineItem.id}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      backgroundColor: "white",
                      border: "1px solid #e5e7eb",
                      borderRadius: 6,
                      padding: "8px 10px",
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 600 }}>{lineItem.title}</div>
                      <div style={{ fontSize: 12, color: "#6b7280" }}>Qty {lineItem.quantity}</div>
                    </div>
                    <strong>{formatMoney(lineItem.unitPriceCents * lineItem.quantity, result.totals.currency)}</strong>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h6 style={{ margin: "0 0 8px" }}>Fulfillment</h6>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <span style={{ backgroundColor: "#eef2ff", color: "#3730a3", borderRadius: 999, padding: "4px 10px", fontSize: 12, fontWeight: 600 }}>
                  Needs Created: {result.fulfillment.needsCreated}
                </span>
                <span style={{ backgroundColor: "#ecfdf5", color: "#065f46", borderRadius: 999, padding: "4px 10px", fontSize: 12, fontWeight: 600 }}>
                  Needs Shipped: {result.fulfillment.needsShipped}
                </span>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
