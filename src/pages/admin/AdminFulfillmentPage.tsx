import { Fragment, useEffect, useMemo, useState } from "react";
import { adminFulfillmentApi } from "../../api/endpoints";
import type {
  AdminFulfillmentOrderDetail,
  AdminFulfillmentOrderSummary,
  FulfillmentQueueRow,
  FulfillmentStateCode,
  OrderStatusCode,
} from "../../types";

type FulfillmentViewMode = "QUEUE" | "ORDERS";
type OrdersSortKey =
  | "orderId"
  | "createdAt"
  | "orderStatus"
  | "orderEmail"
  | "totalUnits"
  | "needsCreatedUnits"
  | "needsShippedUnits"
  | "shippedUnits"
  | "totalCents";
type SortDirection = "asc" | "desc";

function money(cents: number) {
  return `$${(cents / 100).toFixed(2)}`;
}

function stateBadge(state: FulfillmentStateCode) {
  if (state === "SHIPPED") return { bg: "#dcfce7", color: "#166534" };
  if (state === "NEEDS_SHIPPED") return { bg: "#dbeafe", color: "#1d4ed8" };
  return { bg: "#fef3c7", color: "#92400e" };
}

export function AdminFulfillmentPage() {
  const [viewMode, setViewMode] = useState<FulfillmentViewMode>("QUEUE");

  const [state, setState] = useState<FulfillmentStateCode>("NEEDS_CREATED");
  const [rows, setRows] = useState<FulfillmentQueueRow[] | null>(null);
  const [queueErr, setQueueErr] = useState<string | null>(null);

  const [carrier, setCarrier] = useState("USPS");
  const [trackingNumber, setTrackingNumber] = useState("");

  const [orders, setOrders] = useState<AdminFulfillmentOrderSummary[] | null>(null);
  const [ordersErr, setOrdersErr] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<OrderStatusCode | "ALL">("ALL");
  const [sortKey, setSortKey] = useState<OrdersSortKey>("createdAt");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null);
  const [detail, setDetail] = useState<AdminFulfillmentOrderDetail | null>(null);
  const [detailErr, setDetailErr] = useState<string | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const sortedOrders = useMemo(() => {
    if (!orders) return null;

    const getValue = (order: AdminFulfillmentOrderSummary): string | number => {
      switch (sortKey) {
        case "orderId":
          return order.orderId;
        case "createdAt":
          return new Date(order.createdAt).getTime();
        case "orderStatus":
          return order.orderStatus;
        case "orderEmail":
          return order.orderEmail;
        case "totalUnits":
          return order.totalUnits;
        case "needsCreatedUnits":
          return order.needsCreatedUnits;
        case "needsShippedUnits":
          return order.needsShippedUnits;
        case "shippedUnits":
          return order.shippedUnits;
        case "totalCents":
          return order.totalCents;
        default:
          return order.orderId;
      }
    };

    const sorted = [...orders].sort((a, b) => {
      const av = getValue(a);
      const bv = getValue(b);

      let result = 0;
      if (typeof av === "number" && typeof bv === "number") {
        result = av - bv;
      } else {
        result = String(av).localeCompare(String(bv), undefined, { sensitivity: "base" });
      }

      return sortDirection === "asc" ? result : -result;
    });

    return sorted;
  }, [orders, sortKey, sortDirection]);

  function toggleSort(nextKey: OrdersSortKey) {
    if (sortKey === nextKey) {
      setSortDirection((d) => (d === "asc" ? "desc" : "asc"));
      return;
    }
    setSortKey(nextKey);
    setSortDirection("asc");
  }

  function sortIndicator(key: OrdersSortKey) {
    if (sortKey !== key) return "";
    return sortDirection === "asc" ? " ▲" : " ▼";
  }

  function toggleOrderRow(orderId: number) {
    setSelectedOrderId((prev) => (prev === orderId ? null : orderId));
  }

  async function refresh(s: FulfillmentStateCode) {
    const r = await adminFulfillmentApi.queue(s);
    setRows(r.rows);
  }

  async function loadOrders() {
    setOrdersErr(null);
    setOrders(null);

    try {
      const r = await adminFulfillmentApi.listOrders({
        status: statusFilter === "ALL" ? undefined : statusFilter,
      });
      setOrders(r.orders);

      if (r.orders.length === 0) {
        setSelectedOrderId(null);
        setDetail(null);
        return;
      }

      const nextSelected =
        selectedOrderId != null && r.orders.some((o) => o.orderId === selectedOrderId) ? selectedOrderId : null;

      setSelectedOrderId(nextSelected);
    } catch (e: any) {
      setOrdersErr(String(e?.message ?? e));
    }
  }

  async function loadDetail(orderId: number) {
    setDetailLoading(true);
    setDetailErr(null);
    setDetail(null);
    try {
      const r = await adminFulfillmentApi.getOrder(orderId);
      setDetail(r);
    } catch (e: any) {
      setDetailErr(String(e?.message ?? e));
    } finally {
      setDetailLoading(false);
    }
  }

  useEffect(() => {
    setRows(null);
    refresh(state).catch((e) => setQueueErr(String(e?.message ?? e)));
  }, [state]);

  useEffect(() => {
    if (viewMode !== "ORDERS") return;
    loadOrders().catch((e) => setOrdersErr(String(e?.message ?? e)));
  }, [viewMode, statusFilter]);

  useEffect(() => {
    if (viewMode !== "ORDERS") return;
    if (selectedOrderId == null) {
      setDetail(null);
      setDetailErr(null);
      return;
    }

    loadDetail(selectedOrderId).catch((e) => setDetailErr(String(e?.message ?? e)));
  }, [viewMode, selectedOrderId]);

  async function createdDone(unitId: number) {
    setQueueErr(null);
    try {
      await adminFulfillmentApi.createdDone(unitId);
      await refresh(state);
    } catch (e: any) {
      setQueueErr(String(e?.message ?? e));
    }
  }

  async function ship(unitId: number) {
    setQueueErr(null);
    try {
      await adminFulfillmentApi.ship(unitId, {
        carrier: carrier || null,
        trackingNumber: trackingNumber || null,
      });
      await refresh(state);
    } catch (e: any) {
      setQueueErr(String(e?.message ?? e));
    }
  }

  return (
    <div>
      <h3>Admin Fulfillment</h3>

      <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 12 }}>
        <label>
          View:
          <select value={viewMode} onChange={(e) => setViewMode(e.target.value as FulfillmentViewMode)} style={{ marginLeft: 8 }}>
            <option value="QUEUE">Queue</option>
            <option value="ORDERS">Orders</option>
          </select>
        </label>

        {viewMode === "QUEUE" ? (
          <label>
            Queue:
            <select value={state} onChange={(e) => setState(e.target.value as FulfillmentStateCode)} style={{ marginLeft: 8 }}>
              <option value="NEEDS_CREATED">NEEDS_CREATED</option>
              <option value="NEEDS_SHIPPED">NEEDS_SHIPPED</option>
              <option value="SHIPPED">SHIPPED</option>
            </select>
          </label>
        ) : null}

        {viewMode === "QUEUE" && state === "NEEDS_SHIPPED" ? (
          <>
            <label style={{ marginLeft: 12 }}>
              Carrier
              <input value={carrier} onChange={(e) => setCarrier(e.target.value)} style={{ marginLeft: 8 }} />
            </label>
            <label>
              Tracking
              <input value={trackingNumber} onChange={(e) => setTrackingNumber(e.target.value)} style={{ marginLeft: 8 }} />
            </label>
          </>
        ) : null}

        {viewMode === "QUEUE" ? (
          <button onClick={() => refresh(state)} style={{ marginLeft: "auto" }}>
            Refresh
          </button>
        ) : (
          <button onClick={() => loadOrders().catch((e) => setOrdersErr(String(e?.message ?? e)))} style={{ marginLeft: "auto" }}>
            Refresh
          </button>
        )}
      </div>

      {viewMode === "QUEUE" ? (
        <>
          {queueErr ? <div style={{ color: "crimson", marginBottom: 12 }}>Error: {queueErr}</div> : null}

          {!rows ? (
            <div>Loading…</div>
          ) : (
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ textAlign: "left" }}>
                  <th style={{ borderBottom: "1px solid #ddd", padding: 8 }}>Unit</th>
                  <th style={{ borderBottom: "1px solid #ddd", padding: 8 }}>Item</th>
                  <th style={{ borderBottom: "1px solid #ddd", padding: 8 }}>Order</th>
                  <th style={{ borderBottom: "1px solid #ddd", padding: 8 }}>Queued</th>
                  <th style={{ borderBottom: "1px solid #ddd", padding: 8 }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.unitId}>
                    <td style={{ borderBottom: "1px solid #eee", padding: 8 }}>{r.unitId}</td>
                    <td style={{ borderBottom: "1px solid #eee", padding: 8 }}>
                      <div style={{ fontWeight: 700 }}>{r.itemTitle}</div>
                      <div style={{ opacity: 0.7, fontSize: 12 }}>itemId={r.itemId}</div>
                    </td>
                    <td style={{ borderBottom: "1px solid #eee", padding: 8 }}>
                      <div>orderId={r.orderId}</div>
                      <div style={{ opacity: 0.7, fontSize: 12 }}>{r.orderEmail}</div>
                    </td>
                    <td style={{ borderBottom: "1px solid #eee", padding: 8 }}>{r.queuedAt}</td>
                    <td style={{ borderBottom: "1px solid #eee", padding: 8 }}>
                      {r.stateCode === "NEEDS_CREATED" ? (
                        <button onClick={() => createdDone(r.unitId)}>Mark Created → Needs Shipped</button>
                      ) : r.stateCode === "NEEDS_SHIPPED" ? (
                        <button onClick={() => ship(r.unitId)}>Ship</button>
                      ) : (
                        <span style={{ opacity: 0.7 }}>Shipped</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {rows && rows.length === 0 ? <div style={{ opacity: 0.7, marginTop: 12 }}>No rows in this queue.</div> : null}
        </>
      ) : (
        <>
          <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap", marginBottom: 12 }}>
            <label>
              Status
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as OrderStatusCode | "ALL")}
                style={{ marginLeft: 8 }}
              >
                <option value="ALL">ALL</option>
                <option value="RECEIVED">RECEIVED</option>
                <option value="COMPLETE">COMPLETE</option>
              </select>
            </label>
          </div>

          {ordersErr ? <div style={{ color: "crimson", marginBottom: 12 }}>Error: {ordersErr}</div> : null}

          {!orders ? (
            <div>Loading orders…</div>
          ) : orders.length === 0 ? (
            <div style={{ opacity: 0.7 }}>No orders found for the current filters.</div>
          ) : (
            <>
              <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: 12 }}>
                <thead>
                  <tr style={{ textAlign: "left" }}>
                    <th style={{ borderBottom: "1px solid #ddd", padding: 8, width: 50 }}>Open</th>
                    <th style={{ borderBottom: "1px solid #ddd", padding: 8 }}>
                      <button onClick={() => toggleSort("orderId")}>Order{sortIndicator("orderId")}</button>
                    </th>
                    <th style={{ borderBottom: "1px solid #ddd", padding: 8 }}>
                      <button onClick={() => toggleSort("createdAt")}>Created{sortIndicator("createdAt")}</button>
                    </th>
                    <th style={{ borderBottom: "1px solid #ddd", padding: 8 }}>
                      <button onClick={() => toggleSort("orderStatus")}>Status{sortIndicator("orderStatus")}</button>
                    </th>
                    <th style={{ borderBottom: "1px solid #ddd", padding: 8 }}>
                      <button onClick={() => toggleSort("orderEmail")}>Customer{sortIndicator("orderEmail")}</button>
                    </th>
                    <th style={{ borderBottom: "1px solid #ddd", padding: 8 }}>
                      <button onClick={() => toggleSort("totalUnits")}>Units{sortIndicator("totalUnits")}</button>
                    </th>
                    <th style={{ borderBottom: "1px solid #ddd", padding: 8 }}>
                      <button onClick={() => toggleSort("needsCreatedUnits")}>Needs Created{sortIndicator("needsCreatedUnits")}</button>
                    </th>
                    <th style={{ borderBottom: "1px solid #ddd", padding: 8 }}>
                      <button onClick={() => toggleSort("needsShippedUnits")}>Needs Shipped{sortIndicator("needsShippedUnits")}</button>
                    </th>
                    <th style={{ borderBottom: "1px solid #ddd", padding: 8 }}>
                      <button onClick={() => toggleSort("shippedUnits")}>Shipped{sortIndicator("shippedUnits")}</button>
                    </th>
                    <th style={{ borderBottom: "1px solid #ddd", padding: 8 }}>
                      <button onClick={() => toggleSort("totalCents")}>Total{sortIndicator("totalCents")}</button>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {sortedOrders?.map((o) => {
                    const isExpanded = selectedOrderId === o.orderId;
                    const hasLoadedDetail = detail?.order.orderId === o.orderId;

                    return (
                      <Fragment key={o.orderId}>
                        <tr
                          onClick={() => toggleOrderRow(o.orderId)}
                          style={{
                            cursor: "pointer",
                            background: isExpanded ? "#f8fafc" : "transparent",
                          }}
                          title={`${isExpanded ? "Collapse" : "Expand"} order #${o.orderId} detail`}
                        >
                          <td style={{ borderBottom: "1px solid #eee", padding: 8 }}>
                            <span
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleOrderRow(o.orderId);
                              }}
                              style={{
                                display: "inline-flex",
                                alignItems: "center",
                                justifyContent: "center",
                                width: 24,
                                height: 24,
                                padding: 0,
                                borderRadius: 999,
                                border: "1px solid #cbd5e1",
                                background: isExpanded ? "#e2e8f0" : "#fff",
                                fontSize: 16,
                                fontWeight: 700,
                                lineHeight: 1,
                                userSelect: "none",
                              }}
                            >
                              {isExpanded ? "−" : "+"}
                            </span>
                          </td>
                          <td style={{ borderBottom: "1px solid #eee", padding: 8 }}>
                            <div style={{ fontWeight: 700 }}>#{o.orderId}</div>
                          </td>
                          <td style={{ borderBottom: "1px solid #eee", padding: 8 }}>{new Date(o.createdAt).toLocaleString()}</td>
                          <td style={{ borderBottom: "1px solid #eee", padding: 8 }}>{o.orderStatus}</td>
                          <td style={{ borderBottom: "1px solid #eee", padding: 8 }}>{o.orderEmail}</td>
                          <td style={{ borderBottom: "1px solid #eee", padding: 8 }}>{o.totalUnits}</td>
                          <td style={{ borderBottom: "1px solid #eee", padding: 8 }}>{o.needsCreatedUnits}</td>
                          <td style={{ borderBottom: "1px solid #eee", padding: 8 }}>{o.needsShippedUnits}</td>
                          <td style={{ borderBottom: "1px solid #eee", padding: 8 }}>{o.shippedUnits}</td>
                          <td style={{ borderBottom: "1px solid #eee", padding: 8 }}>{money(o.totalCents)}</td>
                        </tr>

                        {isExpanded ? (
                          <tr>
                            <td colSpan={10} style={{ borderBottom: "1px solid #eee", padding: 10, background: "#f8fafc" }}>
                              {detailLoading && !hasLoadedDetail ? <div>Loading detail…</div> : null}
                              {detailErr && !hasLoadedDetail ? <div style={{ color: "crimson" }}>Error: {detailErr}</div> : null}

                              {hasLoadedDetail ? (
                                <div style={{ border: "1px solid #ddd", borderRadius: 8, padding: 12, background: "white" }}>
                                  <div style={{ marginBottom: 12 }}>
                                    <div style={{ fontWeight: 700 }}>Order #{detail.order.orderId}</div>
                                    <div style={{ fontSize: 13, opacity: 0.8 }}>{detail.order.orderEmail}</div>
                                    <div style={{ fontSize: 13, opacity: 0.8 }}>
                                      Placed {new Date(detail.order.createdAt).toLocaleString()}
                                    </div>
                                    <div style={{ fontSize: 13, opacity: 0.8 }}>
                                      Updated {new Date(detail.order.updatedAt).toLocaleString()}
                                    </div>
                                  </div>

                                  <div style={{ marginBottom: 12, fontSize: 13 }}>
                                    <div>Subtotal: {money(detail.order.subtotalCents)}</div>
                                    <div>Tax: {money(detail.order.taxCents)}</div>
                                    <div>Shipping: {money(detail.order.shippingCents)}</div>
                                    <div style={{ fontWeight: 700 }}>Total: {money(detail.order.totalCents)}</div>
                                  </div>

                                  <div style={{ marginBottom: 12, fontSize: 13 }}>
                                    <div>Needs Created: {detail.order.needsCreatedUnits}</div>
                                    <div>Needs Shipped: {detail.order.needsShippedUnits}</div>
                                    <div>Shipped: {detail.order.shippedUnits}</div>
                                  </div>

                                  <div style={{ marginBottom: 12 }}>
                                    <div style={{ fontWeight: 700, marginBottom: 4 }}>Shipping Address</div>
                                    <pre
                                      style={{
                                        margin: 0,
                                        background: "#f8fafc",
                                        border: "1px solid #e5e7eb",
                                        borderRadius: 6,
                                        padding: 8,
                                        fontSize: 12,
                                        whiteSpace: "pre-wrap",
                                        wordBreak: "break-word",
                                      }}
                                    >
                                      {JSON.stringify(detail.order.shippingAddress ?? {}, null, 2)}
                                    </pre>
                                  </div>

                                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                                    {detail.lineItems.map((li) => (
                                      <div key={li.lineItemId} style={{ border: "1px solid #eee", borderRadius: 6, padding: 8 }}>
                                        <div style={{ fontWeight: 600 }}>{li.titleSnapshot}</div>
                                        <div style={{ fontSize: 12, opacity: 0.75, marginBottom: 8 }}>
                                          lineItemId={li.lineItemId} • qty={li.quantity} • unit={money(li.unitPriceCentsSnapshot)}
                                        </div>

                                        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                                          {li.units.map((u) => {
                                            const badge = stateBadge(u.stateCode);
                                            return (
                                              <div
                                                key={u.unitId}
                                                style={{
                                                  display: "grid",
                                                  gridTemplateColumns: "auto 1fr",
                                                  gap: 8,
                                                  alignItems: "start",
                                                  border: "1px solid #f1f5f9",
                                                  borderRadius: 6,
                                                  padding: 6,
                                                }}
                                              >
                                                <span
                                                  style={{
                                                    fontSize: 11,
                                                    padding: "2px 8px",
                                                    borderRadius: 999,
                                                    background: badge.bg,
                                                    color: badge.color,
                                                    fontWeight: 700,
                                                    height: "fit-content",
                                                  }}
                                                >
                                                  {u.stateCode}
                                                </span>
                                                <div style={{ fontSize: 12 }}>
                                                  <div style={{ fontWeight: 600 }}>unitId={u.unitId}</div>
                                                  <div>item: {u.itemTitle}</div>
                                                  <div>queued: {new Date(u.queuedAt).toLocaleString()}</div>
                                                  {u.shippedAt ? <div>shipped: {new Date(u.shippedAt).toLocaleString()}</div> : null}
                                                  {u.carrier || u.trackingNumber ? (
                                                    <div>
                                                      tracking: {u.carrier ?? ""} {u.trackingNumber ?? ""}
                                                    </div>
                                                  ) : null}
                                                </div>
                                              </div>
                                            );
                                          })}
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              ) : null}
                            </td>
                          </tr>
                        ) : null}
                      </Fragment>
                    );
                  })}
                </tbody>
              </table>
            </>
          )}
        </>
      )}
    </div>
  );
}
