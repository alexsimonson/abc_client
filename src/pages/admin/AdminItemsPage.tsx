import { useEffect, useState } from "react";
import { adminItemsApi } from "../../api/endpoints";
import type { AdminItem } from "../../types";
import { ImageGalleryModal } from "./ImageGalleryModal";

export function AdminItemsPage() {
  const [items, setItems] = useState<AdminItem[] | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const [newTitle, setNewTitle] = useState("");
  const [newPriceCents, setNewPriceCents] = useState(1000);
  const [newImageFiles, setNewImageFiles] = useState<File[]>([]);
  const [isCreating, setIsCreating] = useState(false);

  const [selectedItemForImages, setSelectedItemForImages] = useState<number | null>(null);
  const [selectedItemImages, setSelectedItemImages] = useState<any[]>([]);

  async function refresh() {
    const r = await adminItemsApi.list();
    setItems(r.items);
  }

  useEffect(() => {
    refresh().catch((e) => setErr(String(e?.message ?? e)));
  }, []);

  async function create() {
    setErr(null);
    setIsCreating(true);
    try {
      if (!newTitle.trim()) return setErr("Title required");
      
      const item = await adminItemsApi.create({ title: newTitle.trim(), priceCents: newPriceCents });
      
      // Upload images if any were selected
      if (newImageFiles.length > 0) {
        for (let i = 0; i < newImageFiles.length; i++) {
          const file = newImageFiles[i];
          try {
            await adminItemsApi.uploadImage(item.item.id, file, "", i);
          } catch (e: any) {
            console.error(`Failed to upload image ${i}: ${e?.message ?? e}`);
            // Continue uploading remaining images even if one fails
          }
        }
      }
      
      setNewTitle("");
      setNewPriceCents(1000);
      setNewImageFiles([]);
      await refresh();
    } catch (e: any) {
      setErr(String(e?.message ?? e));
    } finally {
      setIsCreating(false);
    }
  }

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.currentTarget.files;
    if (files) {
      setNewImageFiles(Array.from(files));
    }
  }

  function removeImageFile(index: number) {
    setNewImageFiles(newImageFiles.filter((_, i) => i !== index));
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

  async function openImageGallery(itemId: number) {
    setErr(null);
    try {
      const result = await adminItemsApi.get(itemId);
      setSelectedItemImages(result.images);
      setSelectedItemForImages(itemId);
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
        <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 12 }}>
          <input 
            placeholder="Title" 
            value={newTitle} 
            onChange={(e) => setNewTitle(e.target.value)}
            disabled={isCreating}
            style={{ flex: 1 }} 
          />
          <input 
            type="number" 
            value={newPriceCents} 
            onChange={(e) => setNewPriceCents(Number(e.target.value || 0))}
            disabled={isCreating}
            style={{ width: 140 }} 
          />
          <button onClick={create} disabled={isCreating}>
            {isCreating ? "Creating..." : "Create"}
          </button>
        </div>
        
        <div style={{ marginBottom: 12 }}>
          <label style={{ display: "block", marginBottom: 6, fontSize: 14 }}>
            Upload Images (optional)
          </label>
          <input 
            type="file" 
            multiple 
            accept="image/*"
            onChange={handleFileSelect}
            disabled={isCreating}
            id="create-file-input"
          />
        </div>

        {newImageFiles.length > 0 && (
          <div style={{ marginBottom: 12, padding: 12, backgroundColor: "#f5f5f5", borderRadius: 4 }}>
            <div style={{ marginBottom: 8, fontSize: 14 }}>
              <strong>Selected images ({newImageFiles.length}):</strong>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(100px, 1fr))", gap: 8 }}>
              {newImageFiles.map((file, idx) => (
                <div
                  key={idx}
                  style={{
                    border: "1px solid #ddd",
                    borderRadius: 4,
                    overflow: "hidden",
                    position: "relative",
                    backgroundColor: "#ddd",
                  }}
                >
                  <img
                    src={URL.createObjectURL(file)}
                    alt={file.name}
                    style={{ width: "100%", height: 100, objectFit: "cover", display: "block" }}
                  />
                  <button
                    onClick={() => removeImageFile(idx)}
                    disabled={isCreating}
                    title="Remove"
                    style={{
                      position: "absolute",
                      top: 2,
                      right: 2,
                      background: "rgba(0,0,0,0.6)",
                      color: "white",
                      border: "none",
                      borderRadius: 3,
                      padding: "2px 6px",
                      cursor: isCreating ? "not-allowed" : "pointer",
                      fontSize: 12,
                    }}
                  >
                    ✕
                  </button>
                  <div style={{ padding: 4, fontSize: 10, color: "#666", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {file.name}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div style={{ opacity: 0.7, fontSize: 12 }}>Price is in cents. Images will be uploaded after item creation.</div>
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
                <div style={{ display: "flex", gap: 6 }}>
                  <button onClick={() => openImageGallery(it.id)}>Images</button>
                  <button onClick={() => del(it.id)}>Delete</button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {selectedItemForImages !== null && (
        <ImageGalleryModal
          itemId={selectedItemForImages}
          images={selectedItemImages}
          onClose={() => setSelectedItemForImages(null)}
          onImagesChanged={() => refresh()}
        />
      )}

    </div>
  );
}
