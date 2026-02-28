export type ItemImage = {
  id: number;
  itemId: number;
  url: string;
  sortOrder: number | null;
  altText: string | null;
};

export type User = {
  id: string;
  email: string;
  username: string;
  displayName: string | null;
  isAdmin: boolean;
};

export type Item = {
  id: number;
  title: string;
  description: string | null;
  priceCents: number;
  currency: string;
  quantityAvailable: number;
  makeTimeMinutes: number | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  images: ItemImage[];
};

export type CreateOrderInput = {
  email: string;
  shippingAddress: Record<string, unknown> | null;
  items: Array<{ itemId: number; quantity: number }>;
  taxCents?: number;
  shippingCents?: number;
  currency?: string;
};

export type CreateOrderResult = {
  orderId: number;
  totals: {
    subtotalCents: number;
    taxCents: number;
    shippingCents: number;
    totalCents: number;
    currency: string;
  };
  lineItems: Array<{
    id: number;
    itemId: number | null;
    quantity: number;
    unitPriceCents: number;
    title: string;
  }>;
  fulfillment: { needsCreated: number; needsShipped: number };
};

export type FulfillmentStateCode = "NEEDS_CREATED" | "NEEDS_SHIPPED" | "SHIPPED";
export type OrderStatusCode = "RECEIVED" | "COMPLETE";

export type FulfillmentQueueRow = {
  unitId: number;
  stateCode: FulfillmentStateCode;
  queuedAt: string;
  shippedAt: string | null;
  itemId: number;
  itemTitle: string;
  orderId: number;
  orderEmail: string;
  shippingAddress: any;
  lineItemId: number;
  lineItemTitleSnapshot: string;
};

export type AdminFulfillmentOrderSummary = {
  orderId: number;
  orderStatus: OrderStatusCode;
  orderEmail: string;
  shippingAddress: any;
  subtotalCents: number;
  taxCents: number;
  shippingCents: number;
  totalCents: number;
  createdAt: string;
  updatedAt: string;
  totalUnits: number;
  needsCreatedUnits: number;
  needsShippedUnits: number;
  shippedUnits: number;
};

export type AdminFulfillmentUnitDetail = {
  unitId: number;
  stateCode: FulfillmentStateCode;
  queuedAt: string;
  shippedAt: string | null;
  carrier: string | null;
  trackingNumber: string | null;
  itemId: number;
  itemTitle: string;
  lineItemId: number;
  lineItemTitleSnapshot: string;
};

export type AdminOrderLineItemDetail = {
  lineItemId: number;
  itemId: number | null;
  titleSnapshot: string;
  unitPriceCentsSnapshot: number;
  quantity: number;
  units: AdminFulfillmentUnitDetail[];
};

export type AdminFulfillmentOrderDetail = {
  order: AdminFulfillmentOrderSummary;
  lineItems: AdminOrderLineItemDetail[];
};

export type AdminItem = {
  id: number;
  title: string;
  description: string | null;
  priceCents: number;
  currency: string;
  quantityAvailable: number;
  makeTimeMinutes: number | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type AdminItemImage = {
  id: number;
  itemId: number;
  url: string;
  sortOrder: number | null;
  altText: string | null;
};

export type TicketStatusCode = "NEW" | "IN_PROGRESS" | "RESOLVED" | "CLOSED";

export type SupportTicket = {
  id: number;
  email: string;
  subject: string;
  message: string;
  statusCode: TicketStatusCode;
  adminNotes: string | null;
  createdAt: string;
  updatedAt: string;
};

export type CreateTicketInput = {
  email: string;
  subject: string;
  message: string;
};

export type UpdateTicketInput = {
  statusCode?: TicketStatusCode;
  adminNotes?: string;
};
