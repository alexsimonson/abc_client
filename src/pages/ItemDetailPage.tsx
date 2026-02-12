import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { itemsApi } from "../api/endpoints";
import type { Item } from "../types";

export function ItemDetailPage() {
  const id = Number(useParams().id);
  const [item, setItem] = useState<Item | null>(null);
  const [err, setErr] = useState<string | null>(null);

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
      <div style={{ opacity: 0.7 }}>${(item.priceCents / 100).toFixed(2)} • Stock: {item.quantityAvailable}</div>
      {item.description ? <p>{item.description}</p> : null}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 10 }}>
        {item.images.map((img) => (
          <div key={img.id} style={{ background: "#f6f6f6", borderRadius: 8, overflow: "hidden", height: 200 }}>
            <img src={img.url} alt={img.altText ?? item.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          </div>
        ))}
      </div>
    </div>
  );
}
