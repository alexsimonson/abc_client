import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { itemsApi } from "../api/endpoints";
import { resolveImageUrl } from "../api/http";
import type { Item } from "../types";

export function ItemsListPage() {
  const [items, setItems] = useState<Item[] | null>(null);
  const [err, setErr] = useState<string | null>(null);

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
              <div style={{ marginTop: 10, display: "flex", justifyContent: "space-between", gap: 10 }}>
                <div>
                  <div style={{ fontWeight: 700 }}>{it.title}</div>
                  <div style={{ opacity: 0.7, fontSize: 13 }}>
                    ${(it.priceCents / 100).toFixed(2)} • Stock: {it.quantityAvailable}
                  </div>
                </div>
                <Link to={`/items/${it.id}`}>Open</Link>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
