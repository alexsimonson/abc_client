import { useState } from "react";
import { adminItemsApi } from "../../api/endpoints";
import { resolveImageUrl } from "../../api/http";
import type { AdminItemImage } from "../../types";

export function ImageGalleryModal({
  itemId,
  images: initialImages,
  onClose,
  onImagesChanged,
}: {
  itemId: number;
  images: AdminItemImage[];
  onClose: () => void;
  onImagesChanged: () => void;
}) {
  const [images, setImages] = useState<AdminItemImage[]>(initialImages);
  const [err, setErr] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editAltText, setEditAltText] = useState("");

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setErr(null);
    setUploading(true);
    try {
      const result = await adminItemsApi.uploadImage(itemId, file);
      setImages([...images, result.image]);
      e.target.value = ""; // Reset input
      onImagesChanged();
    } catch (error: any) {
      setErr(String(error?.message ?? error));
    } finally {
      setUploading(false);
    }
  }

  async function startEditAltText(image: AdminItemImage) {
    setEditingId(image.id);
    setEditAltText(image.altText || "");
  }

  async function saveAltText(imageId: number) {
    setErr(null);
    try {
      const result = await adminItemsApi.patchImage(imageId, { altText: editAltText });
      setImages(images.map((img) => (img.id === imageId ? result.image : img)));
      setEditingId(null);
      onImagesChanged();
    } catch (error: any) {
      setErr(String(error?.message ?? error));
    }
  }

  async function deleteImage(imageId: number) {
    if (!confirm("Delete this image?")) return;
    setErr(null);
    try {
      await adminItemsApi.delImage(imageId);
      setImages(images.filter((img) => img.id !== imageId));
      onImagesChanged();
    } catch (error: any) {
      setErr(String(error?.message ?? error));
    }
  }

  async function reorder(imageId: number, newSortOrder: number) {
    if (newSortOrder < 0) return;
    setErr(null);
    try {
      const result = await adminItemsApi.patchImage(imageId, { sortOrder: newSortOrder });
      setImages(images.map((img) => (img.id === imageId ? result.image : img)));
      onImagesChanged();
    } catch (error: any) {
      setErr(String(error?.message ?? error));
    }
  }

  const sortedImages = [...images].sort(
    (a, b) =>
      (a.sortOrder ?? Number.MAX_VALUE) - (b.sortOrder ?? Number.MAX_VALUE) ||
      a.id - b.id
  );

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(0,0,0,0.5)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
      }}
      onClick={() => onClose()}
    >
      <div
        style={{
          backgroundColor: "white",
          borderRadius: 8,
          padding: 24,
          maxWidth: 700,
          width: "90%",
          maxHeight: "90vh",
          overflowY: "auto",
          boxShadow: "0 20px 25px rgba(0,0,0,0.15)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 style={{ marginTop: 0 }}>Manage Images for Item {itemId}</h2>

        {err && <div style={{ color: "crimson", marginBottom: 16 }}>Error: {err}</div>}

        <div
          style={{
            border: "2px dashed #ccc",
            borderRadius: 8,
            padding: 16,
            textAlign: "center",
            marginBottom: 24,
            cursor: uploading ? "not-allowed" : "pointer",
            backgroundColor: "#f9f9f9",
          }}
        >
          <input
            type="file"
            accept="image/*"
            onChange={handleFileUpload}
            disabled={uploading}
            style={{ display: "none" }}
            id="file-input"
          />
          <label htmlFor="file-input" style={{ cursor: uploading ? "not-allowed" : "pointer", display: "block" }}>
            <strong>{uploading ? "Uploading..." : "Click to upload or drag files"}</strong>
            <div style={{ opacity: 0.6, fontSize: 12, marginTop: 4 }}>
              Max 5MB. Supported: JPG, PNG, WebP, GIF
            </div>
          </label>
        </div>

        <div>
          <h3 style={{ marginBottom: 12 }}>Current Images ({images.length})</h3>
          {images.length === 0 ? (
            <div style={{ opacity: 0.6 }}>No images yet. Upload to add.</div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))", gap: 12 }}>
              {sortedImages.map((img, idx) => (
                <div
                  key={img.id}
                  style={{
                    border: "1px solid #ddd",
                    borderRadius: 4,
                    overflow: "hidden",
                    backgroundColor: "#f5f5f5",
                  }}
                >
                  <img
                    src={resolveImageUrl(img.url)}
                    alt={img.altText || `Image ${idx}`}
                    style={{ width: "100%", height: 120, objectFit: "cover", display: "block" }}
                  />
                  <div style={{ padding: 8, fontSize: 12 }}>
                    {editingId === img.id ? (
                      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                        <input
                          type="text"
                          placeholder="Alt text"
                          value={editAltText}
                          onChange={(e) => setEditAltText(e.target.value)}
                          style={{ fontSize: 11, padding: 4 }}
                        />
                        <div style={{ display: "flex", gap: 4 }}>
                          <button onClick={() => saveAltText(img.id)} style={{ flex: 1, fontSize: 11, padding: 4 }}>
                            Save
                          </button>
                          <button onClick={() => setEditingId(null)} style={{ flex: 1, fontSize: 11, padding: 4 }}>
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div>
                        <div style={{ marginBottom: 6 }}>
                          <strong>Order: {img.sortOrder ?? "—"}</strong>
                        </div>
                        {img.altText && (
                          <div style={{ marginBottom: 6, color: "#666", fontSize: 10 }}>
                            Alt: {img.altText}
                          </div>
                        )}
                        <div style={{ display: "flex", gap: 4 }}>
                          <button
                            onClick={() => reorder(img.id, (img.sortOrder ?? 0) - 1)}
                            title="Move up"
                            style={{ flex: 1, padding: 4, fontSize: 11 }}
                          >
                            ↑
                          </button>
                          <button
                            onClick={() => reorder(img.id, (img.sortOrder ?? 0) + 1)}
                            title="Move down"
                            style={{ flex: 1, padding: 4, fontSize: 11 }}
                          >
                            ↓
                          </button>
                        </div>
                        <div style={{ display: "flex", gap: 4, marginTop: 4 }}>
                          <button
                            onClick={() => startEditAltText(img)}
                            style={{ flex: 1, padding: 4, fontSize: 11 }}
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => deleteImage(img.id)}
                            style={{ flex: 1, padding: 4, fontSize: 11, color: "crimson" }}
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <button
          onClick={() => onClose()}
          style={{
            marginTop: 24,
            padding: "8px 16px",
            backgroundColor: "#f0f0f0",
            border: "1px solid #ccc",
            borderRadius: 4,
            cursor: "pointer",
          }}
        >
          Close
        </button>
      </div>
    </div>
  );
}
