import { useState } from "react";
import { Link } from "react-router-dom";
import { useCart } from "./CartContext";

export function CartWidget() {
  const { items, removeFromCart, updateQuantity, totalItems, subtotalCents } = useCart();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Cart Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          position: "fixed",
          bottom: 20,
          right: 20,
          width: 60,
          height: 60,
          borderRadius: "50%",
          background: "#0066cc",
          color: "white",
          border: "none",
          cursor: "pointer",
          fontSize: 24,
          boxShadow: "0 4px 8px rgba(0,0,0,0.2)",
          zIndex: 999,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        🛒
        {totalItems > 0 && (
          <span
            style={{
              position: "absolute",
              top: -5,
              right: -5,
              background: "#ff4444",
              color: "white",
              borderRadius: "50%",
              width: 24,
              height: 24,
              fontSize: 12,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: 700,
            }}
          >
            {totalItems}
          </span>
        )}
      </button>

      {/* Cart Panel */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            onClick={() => setIsOpen(false)}
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: "rgba(0,0,0,0.3)",
              zIndex: 1000,
            }}
          />

          {/* Panel */}
          <div
            style={{
              position: "fixed",
              top: 0,
              right: 0,
              bottom: 0,
              width: "min(400px, 90vw)",
              background: "white",
              boxShadow: "-4px 0 8px rgba(0,0,0,0.1)",
              zIndex: 1001,
              display: "flex",
              flexDirection: "column",
            }}
          >
            <div
              style={{
                padding: "16px 20px",
                borderBottom: "1px solid #ddd",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <h3 style={{ margin: 0 }}>Your Cart ({totalItems})</h3>
              <button
                onClick={() => setIsOpen(false)}
                style={{
                  background: "none",
                  border: "none",
                  fontSize: 24,
                  cursor: "pointer",
                  padding: 0,
                  color: "#666",
                }}
              >
                ×
              </button>
            </div>

            <div style={{ flex: 1, overflowY: "auto", padding: 20 }}>
              {items.length === 0 ? (
                <div style={{ textAlign: "center", padding: "40px 20px", color: "#999" }}>
                  Your cart is empty
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {items.map((item) => (
                    <div
                      key={item.itemId}
                      style={{
                        border: "1px solid #eee",
                        borderRadius: 8,
                        padding: 12,
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                        <div style={{ fontWeight: 600 }}>{item.title}</div>
                        <button
                          onClick={() => removeFromCart(item.itemId)}
                          style={{
                            background: "none",
                            border: "none",
                            color: "#ff4444",
                            cursor: "pointer",
                            fontSize: 18,
                            padding: 0,
                          }}
                        >
                          ×
                        </button>
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <div style={{ fontSize: 14, opacity: 0.7 }}>
                          ${(item.priceCents / 100).toFixed(2)} each
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <button
                            onClick={() => updateQuantity(item.itemId, item.quantity - 1)}
                            style={{
                              background: "#f0f0f0",
                              border: "none",
                              borderRadius: 4,
                              width: 28,
                              height: 28,
                              cursor: "pointer",
                            }}
                          >
                            −
                          </button>
                          <span style={{ minWidth: 30, textAlign: "center", fontWeight: 600 }}>
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => updateQuantity(item.itemId, item.quantity + 1)}
                            style={{
                              background: "#f0f0f0",
                              border: "none",
                              borderRadius: 4,
                              width: 28,
                              height: 28,
                              cursor: "pointer",
                            }}
                          >
                            +
                          </button>
                        </div>
                      </div>
                      <div style={{ marginTop: 8, textAlign: "right", fontWeight: 600 }}>
                        ${((item.priceCents * item.quantity) / 100).toFixed(2)}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {items.length > 0 && (
              <div
                style={{
                  borderTop: "1px solid #ddd",
                  padding: 20,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    fontSize: 18,
                    fontWeight: 700,
                    marginBottom: 12,
                  }}
                >
                  <span>Subtotal:</span>
                  <span>${(subtotalCents / 100).toFixed(2)}</span>
                </div>
                <Link
                  to="/checkout"
                  onClick={() => setIsOpen(false)}
                  style={{
                    display: "block",
                    width: "100%",
                    padding: "12px 20px",
                    background: "#0066cc",
                    color: "white",
                    textAlign: "center",
                    textDecoration: "none",
                    borderRadius: 8,
                    fontWeight: 600,
                  }}
                >
                  Proceed to Checkout
                </Link>
              </div>
            )}
          </div>
        </>
      )}
    </>
  );
}
