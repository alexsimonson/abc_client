import { api } from "./http";
import type {
  User,
  Item,
  CreateOrderInput,
  CreateOrderResult,
  AdminItem,
  AdminItemImage,
  FulfillmentQueueRow,
  FulfillmentStateCode,
  OrderStatusCode,
  AdminFulfillmentOrderSummary,
  AdminFulfillmentOrderDetail,
  SupportTicket,
  CreateTicketInput,
  UpdateTicketInput,
} from "../types";

export const authApi = {
  me: () => api<{ user: User }>("/api/auth/me", { credentials: "include" }),
  login: (email: string, password: string) =>
    api<{ user: User }>("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
      credentials: "include",
    }),
  logout: () =>
    api<void>("/api/auth/logout", {
      method: "POST",
      credentials: "include",
    }),
  updateProfile: (payload: { username?: string; displayName?: string; email?: string }) =>
    api<{ user: User }>("/api/auth/me", {
      method: "PUT",
      body: JSON.stringify(payload),
      credentials: "include",
    }),
};

export const itemsApi = {
  list: () => api<{ items: Item[] }>("/api/items"),
  get: (id: number) => api<{ item: Item }>(`/api/items/${id}`),
};

export const ordersApi = {
  create: (payload: CreateOrderInput) =>
    api<CreateOrderResult>("/api/orders", { method: "POST", body: JSON.stringify(payload) }),
};

export const paymentApi = {
  process: (payload: {
    email: string;
    shippingAddress: Record<string, unknown> | null;
    items: Array<{ itemId: number; quantity: number }>;
    taxCents: number;
    shippingCents: number;
    currency: string;
    sourceId: string;
  }) =>
    api<{
      success: boolean;
      order: CreateOrderResult;
      payment: { id: string; status: string; receiptUrl?: string };
    }>("/api/payment/process", { method: "POST", body: JSON.stringify(payload) }),
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

  uploadImage: (itemId: number, file: File, altText?: string, sortOrder?: number) => {
    const formData = new FormData();
    formData.append("file", file);
    if (altText) formData.append("altText", altText);
    if (sortOrder !== undefined) formData.append("sortOrder", String(sortOrder));
    return api<{ image: AdminItemImage }>(`/api/admin/items/${itemId}/images/upload`, {
      method: "POST",
      body: formData,
    });
  },

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

  listOrders: (params?: { status?: OrderStatusCode; orderId?: number; email?: string }) => {
    const search = new URLSearchParams();
    if (params?.status) search.set("status", params.status);
    if (params?.orderId != null) search.set("orderId", String(params.orderId));
    if (params?.email) search.set("email", params.email);

    const query = search.toString();
    return api<{ count: number; orders: AdminFulfillmentOrderSummary[] }>(
      `/api/admin/fulfillment/orders${query ? `?${query}` : ""}`
    );
  },

  getOrder: (orderId: number) => api<AdminFulfillmentOrderDetail>(`/api/admin/fulfillment/orders/${orderId}`),

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

export const ticketsApi = {
  create: (payload: CreateTicketInput) =>
    api<SupportTicket>("/api/tickets", { method: "POST", body: JSON.stringify(payload) }),
};

export const adminTicketsApi = {
  list: () => api<SupportTicket[]>("/api/admin/tickets"),
  get: (id: number) => api<SupportTicket>(`/api/admin/tickets/${id}`),
  patch: (id: number, payload: UpdateTicketInput) =>
    api<SupportTicket>(`/api/admin/tickets/${id}`, { method: "PATCH", body: JSON.stringify(payload) }),
};
