import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { itemsApi } from "../api/endpoints";
import { resolveImageUrl } from "../api/http";
import { useCart } from "../cart/CartContext";
import type { Item } from "../types";

export function ItemDetailPage() {
  const id = Number(useParams().id);
  const [item, setItem] = useState<Item | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const { addToCart } = useCart();

  const validId = useMemo(() => Number.isInteger(id) && id > 0, [id]);

  useEffect(() => {
    if (!validId) return;
    itemsApi
      .get(id)
      .then((r) => setItem(r.item))
      .catch((e) => setErr(String(e?.message ?? e)));
  }, [id, validId]);

  if (!validId) return <div>Invalid item id</div>;
  if (err) return <div style={{ color: "crimson" }}>Error: {err}</div>;
  if (!item) return <div>Loading…</div>;

  return (
    <div>
      <Link to="/">← Back</Link>
      <h3 style={{ marginTop: 10 }}>{item.title}</h3>
      <div style={{ opacity: 0.7, fontSize: 18, fontWeight: 600 }}>${(item.priceCents / 100).toFixed(2)}</div>
      {item.description ? <p>{item.description}</p> : null}

      <div style={{ marginTop: 16 }}>
        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
            Quantity:
            <input
              type="number"
              min={1}
              value={quantity}
              onChange={(e) => setQuantity(Math.max(1, Number(e.target.value) || 1))}
              style={{ width: 80, padding: "8px 12px", fontSize: 14 }}
            />
          </label>
          <button
            onClick={() => {
              addToCart(item.id, quantity, item.title, item.priceCents);
              setQuantity(1);
            }}
            style={{
              padding: "10px 24px",
              background: "#0066cc",
              color: "white",
              border: "none",
              borderRadius: 6,
              cursor: "pointer",
              fontSize: 16,
              fontWeight: 600,
            }}
          >
            Add to Cart
          </button>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 10 }}>
        {item.images.map((img) => (
          <div key={img.id} style={{ background: "#f6f6f6", borderRadius: 8, overflow: "hidden", height: 200 }}>
            <img src={resolveImageUrl(img.url)} alt={img.altText ?? item.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          </div>
        ))}
      </div>
    </div>
  );
}
