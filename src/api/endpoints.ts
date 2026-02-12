import { api } from "./http";
import type {
  Item,
  CreateOrderInput,
  CreateOrderResult,
  AdminItem,
  AdminItemImage,
  FulfillmentQueueRow,
  FulfillmentStateCode,
} from "../types";

export const itemsApi = {
  list: () => api<{ items: Item[] }>("/api/items"),
  get: (id: number) => api<{ item: Item }>(`/api/items/${id}`),
};

export const ordersApi = {
  create: (payload: CreateOrderInput) =>
    api<CreateOrderResult>("/api/orders", { method: "POST", body: JSON.stringify(payload) }),
};

export const adminItemsApi = {
  list: () => api<{ items: AdminItem[] }>("/api/admin/items"),
  get: (id: number) => api<{ item: AdminItem; images: AdminItemImage[] }>(`/api/admin/items/${id}`),

  create: (payload: Partial<AdminItem> & { title: string; priceCents: number }) =>
    api<{ item: AdminItem }>("/api/admin/items", { method: "POST", body: JSON.stringify(payload) }),

  patch: (id: number, patch: any) =>
    api<{ item: AdminItem }>(`/api/admin/items/${id}`, { method: "PATCH", body: JSON.stringify(patch) }),

  del: (id: number) => api<void>(`/api/admin/items/${id}`, { method: "DELETE" }),

  listImages: (itemId: number) => api<{ images: AdminItemImage[] }>(`/api/admin/items/${itemId}/images`),

  addImage: (itemId: number, payload: { url: string; sortOrder?: number | null; altText?: string | null }) =>
    api<{ image: AdminItemImage }>(`/api/admin/items/${itemId}/images`, {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  patchImage: (imageId: number, patch: any) =>
    api<{ image: AdminItemImage }>(`/api/admin/items/images/${imageId}`, {
      method: "PATCH",
      body: JSON.stringify(patch),
    }),

  delImage: (imageId: number) => api<void>(`/api/admin/items/images/${imageId}`, { method: "DELETE" }),
};

export const adminFulfillmentApi = {
  queue: (state: FulfillmentStateCode) =>
    api<{ state: FulfillmentStateCode; count: number; rows: FulfillmentQueueRow[] }>(
      `/api/admin/fulfillment/queue?state=${encodeURIComponent(state)}`
    ),

  createdDone: (unitId: number) =>
    api<{ unitId: number; newState: FulfillmentStateCode }>(`/api/admin/fulfillment/units/${unitId}/created-done`, {
      method: "PATCH",
    }),

  ship: (unitId: number, payload: { carrier?: string | null; trackingNumber?: string | null }) =>
    api<{ unitId: number; newState: FulfillmentStateCode; orderId: number; orderStatus: "RECEIVED" | "COMPLETE" }>(
      `/api/admin/fulfillment/units/${unitId}/ship`,
      { method: "PATCH", body: JSON.stringify(payload) }
    ),
};
