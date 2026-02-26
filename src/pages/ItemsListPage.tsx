import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { itemsApi } from "../api/endpoints";
import { resolveImageUrl } from "../api/http";
import { useCart } from "../cart/CartContext";
import type { Item } from "../types";

export function ItemsListPage() {
  const [items, setItems] = useState<Item[] | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const { addToCart } = useCart();

  useEffect(() => {
    itemsApi
      .list()
      .then((r) => setItems(r.items))
      .catch((e) => setErr(String(e?.message ?? e)));
  }, []);

  if (err) return <div style={{ color: "crimson" }}>Error: {err}</div>;
  if (!items) return <div>Loading…</div>;

  return (
    <div>
      <h3>Items</h3>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 12 }}>
        {items.map((it) => {
          const img = it.images[0]?.url;
          return (
            <div key={it.id} style={{ border: "1px solid #ddd", borderRadius: 8, padding: 12 }}>
              <div style={{ height: 180, background: "#f6f6f6", borderRadius: 6, overflow: "hidden" }}>
                {img ? <img src={resolveImageUrl(img)} alt={it.images[0]?.altText ?? it.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : null}
              </div>
              <div style={{ marginTop: 10 }}>
                <div style={{ fontWeight: 700 }}>{it.title}</div>
                <div style={{ opacity: 0.7, fontSize: 13 }}>
                  ${(it.priceCents / 100).toFixed(2)}
                </div>
                <div style={{ marginTop: 8, display: "flex", gap: 8 }}>
                  <button
                    onClick={() => addToCart(it.id, 1, it.title, it.priceCents)}
                    style={{
                      flex: 1,
                      padding: "6px 12px",
                      background: "#0066cc",
                      color: "white",
                      border: "none",
                      borderRadius: 4,
                      cursor: "pointer",
                      fontSize: 13,
                      fontWeight: 600,
                    }}
                  >
                    Add to Cart
                  </button>
                  <Link to={`/items/${it.id}`} style={{ padding: "6px 12px", fontSize: 13, textDecoration: "none", border: "1px solid #ddd", borderRadius: 4, display: "flex", alignItems: "center" }}>View</Link>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
