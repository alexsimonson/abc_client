import { useEffect, useMemo, useState } from "react";
import { itemsApi, ordersApi } from "../api/endpoints";
import type { CreateOrderResult, Item } from "../types";

export function CheckoutTestPage() {
  const [items, setItems] = useState<Item[] | null>(null);
  const [cart, setCart] = useState<Record<number, number>>({});
  const [email, setEmail] = useState("test@example.com");
  const [shippingCents, setShippingCents] = useState(500);
  const [taxCents, setTaxCents] = useState(0);
  const [result, setResult] = useState<CreateOrderResult | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    itemsApi.list().then((r) => setItems(r.items)).catch((e) => setErr(String(e?.message ?? e)));
  }, []);

  const lineItems = useMemo(() => {
    return Object.entries(cart)
      .map(([id, qty]) => ({ itemId: Number(id), quantity: qty }))
      .filter((x) => x.quantity > 0);
  }, [cart]);

  const subtotalCents = useMemo(() => {
    if (!items) return 0;
    const map = new Map(items.map((i) => [i.id, i]));
    return lineItems.reduce((sum, li) => sum + (map.get(li.itemId)?.priceCents ?? 0) * li.quantity, 0);
  }, [items, lineItems]);

  async function placeOrder() {
    setErr(null);
    setResult(null);

    if (!email) return setErr("Email required");
    if (lineItems.length === 0) return setErr("Add at least one item");

    setBusy(true);
    try {
      const res = await ordersApi.create({
        email,
        shippingAddress: { name: "Test User", line1: "123 Main", city: "NYC", state: "NY", zip: "10001" },
        items: lineItems,
        taxCents,
        shippingCents,
        currency: "USD",
      });
      setResult(res);
      setCart({});
    } catch (e: any) {
      setErr(String(e?.message ?? e));
    } finally {
      setBusy(false);
    }
  }

  if (err) return <div style={{ color: "crimson" }}>Error: {err}</div>;
  if (!items) return <div>Loading…</div>;

  return (
    <div>
      <h3>Checkout Test</h3>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <div style={{ border: "1px solid #ddd", borderRadius: 8, padding: 12 }}>
          <h4>Pick quantities</h4>
          {items.map((it) => (
            <div key={it.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "6px 0" }}>
              <div>
                <div style={{ fontWeight: 700 }}>{it.title}</div>
                <div style={{ opacity: 0.7, fontSize: 13 }}>${(it.priceCents / 100).toFixed(2)} • Stock: {it.quantityAvailable}</div>
              </div>
              <input
                type="number"
                min={0}
                value={cart[it.id] ?? 0}
                onChange={(e) => setCart((c) => ({ ...c, [it.id]: Math.max(0, Number(e.target.value || 0)) }))}
                style={{ width: 80 }}
              />
            </div>
          ))}
        </div>

        <div style={{ border: "1px solid #ddd", borderRadius: 8, padding: 12 }}>
          <h4>Order</h4>
          <div style={{ display: "grid", gap: 8 }}>
            <label>
              Email
              <input value={email} onChange={(e) => setEmail(e.target.value)} style={{ width: "100%" }} />
            </label>
            <label>
              Shipping (cents)
              <input type="number" value={shippingCents} onChange={(e) => setShippingCents(Number(e.target.value || 0))} style={{ width: "100%" }} />
            </label>
            <label>
              Tax (cents)
              <input type="number" value={taxCents} onChange={(e) => setTaxCents(Number(e.target.value || 0))} style={{ width: "100%" }} />
            </label>

            <div style={{ paddingTop: 8 }}>
              <div>Subtotal: ${(subtotalCents / 100).toFixed(2)}</div>
              <div>Total: ${((subtotalCents + taxCents + shippingCents) / 100).toFixed(2)}</div>
            </div>

            <button disabled={busy} onClick={placeOrder} style={{ padding: 10 }}>
              {busy ? "Placing…" : "Place Order (Test)"}
            </button>
          </div>
        </div>
      </div>

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
