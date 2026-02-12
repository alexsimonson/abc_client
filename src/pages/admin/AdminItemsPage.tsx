import { useEffect, useState } from "react";
import { adminItemsApi } from "../../api/endpoints";
import type { AdminItem } from "../../types";

export function AdminItemsPage() {
  const [items, setItems] = useState<AdminItem[] | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const [newTitle, setNewTitle] = useState("");
  const [newPriceCents, setNewPriceCents] = useState(1000);

  async function refresh() {
    const r = await adminItemsApi.list();
    setItems(r.items);
  }

  useEffect(() => {
    refresh().catch((e) => setErr(String(e?.message ?? e)));
  }, []);

  async function create() {
    setErr(null);
    try {
      if (!newTitle.trim()) return setErr("Title required");
      await adminItemsApi.create({ title: newTitle.trim(), priceCents: newPriceCents });
      setNewTitle("");
      await refresh();
    } catch (e: any) {
      setErr(String(e?.message ?? e));
    }
  }

  async function patch(id: number, patch: any) {
    setErr(null);
    try {
      await adminItemsApi.patch(id, patch);
      await refresh();
    } catch (e: any) {
      setErr(String(e?.message ?? e));
    }
  }

  async function del(id: number) {
    setErr(null);
    try {
      await adminItemsApi.del(id);
      await refresh();
    } catch (e: any) {
      setErr(String(e?.message ?? e));
    }
  }

  if (err) return <div style={{ color: "crimson" }}>Error: {err}</div>;
  if (!items) return <div>Loading…</div>;

  return (
    <div>
      <h3>Admin Items</h3>

      <div style={{ border: "1px solid #ddd", borderRadius: 8, padding: 12, marginBottom: 16 }}>
        <h4>Create</h4>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <input placeholder="Title" value={newTitle} onChange={(e) => setNewTitle(e.target.value)} style={{ flex: 1 }} />
          <input type="number" value={newPriceCents} onChange={(e) => setNewPriceCents(Number(e.target.value || 0))} style={{ width: 140 }} />
          <button onClick={create}>Create</button>
        </div>
        <div style={{ opacity: 0.7, fontSize: 12, marginTop: 6 }}>Price is in cents.</div>
      </div>

      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr style={{ textAlign: "left" }}>
            <th style={{ borderBottom: "1px solid #ddd", padding: 8 }}>ID</th>
            <th style={{ borderBottom: "1px solid #ddd", padding: 8 }}>Title</th>
            <th style={{ borderBottom: "1px solid #ddd", padding: 8 }}>Price</th>
            <th style={{ borderBottom: "1px solid #ddd", padding: 8 }}>Stock</th>
            <th style={{ borderBottom: "1px solid #ddd", padding: 8 }}>Active</th>
            <th style={{ borderBottom: "1px solid #ddd", padding: 8 }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {items.map((it) => (
            <tr key={it.id}>
              <td style={{ borderBottom: "1px solid #eee", padding: 8 }}>{it.id}</td>
              <td style={{ borderBottom: "1px solid #eee", padding: 8 }}>
                <input
                  value={it.title}
                  onChange={(e) => patch(it.id, { title: e.target.value })}
                  style={{ width: "100%" }}
                />
              </td>
              <td style={{ borderBottom: "1px solid #eee", padding: 8 }}>
                <input
                  type="number"
                  value={it.priceCents}
                  onChange={(e) => patch(it.id, { priceCents: Number(e.target.value || 0) })}
                  style={{ width: 140 }}
                />
              </td>
              <td style={{ borderBottom: "1px solid #eee", padding: 8 }}>
                <input
                  type="number"
                  value={it.quantityAvailable}
                  onChange={(e) => patch(it.id, { quantityAvailable: Number(e.target.value || 0) })}
                  style={{ width: 120 }}
                />
              </td>
              <td style={{ borderBottom: "1px solid #eee", padding: 8 }}>
                <input type="checkbox" checked={it.isActive} onChange={(e) => patch(it.id, { isActive: e.target.checked })} />
              </td>
              <td style={{ borderBottom: "1px solid #eee", padding: 8 }}>
                <button onClick={() => del(it.id)}>Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <p style={{ opacity: 0.7, marginTop: 12 }}>
        Images CRUD is supported by the API too; if you want, I’ll add a modal/section per item to add/edit/remove images.
      </p>
    </div>
  );
}
