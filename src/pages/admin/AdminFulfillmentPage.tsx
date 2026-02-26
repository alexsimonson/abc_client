import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { adminFulfillmentApi } from "../../api/endpoints";
import { useAuth } from "../../auth/authProvider";
import type { FulfillmentQueueRow, FulfillmentStateCode } from "../../types";

export function AdminFulfillmentPage() {
  const { user, state: authState } = useAuth();
  const navigate = useNavigate();
  const [state, setState] = useState<FulfillmentStateCode>("NEEDS_CREATED");
  const [rows, setRows] = useState<FulfillmentQueueRow[] | null>(null);
  const [err, setErr] = useState<string | null>(null);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (authState.status === "anon") {
      navigate("/admin/login");
    } else if (authState.status === "authed" && !user?.isAdmin) {
      setErr("You must be an admin to access this page");
    }
  }, [authState, user, navigate]);

  const [carrier, setCarrier] = useState("USPS");
  const [trackingNumber, setTrackingNumber] = useState("");

  async function refresh(s: FulfillmentStateCode) {
    const r = await adminFulfillmentApi.queue(s);
    setRows(r.rows);
  }

  useEffect(() => {
    setRows(null);
    refresh(state).catch((e) => setErr(String(e?.message ?? e)));
  }, [state]);

  async function createdDone(unitId: number) {
    setErr(null);
    try {
      await adminFulfillmentApi.createdDone(unitId);
      await refresh(state);
    } catch (e: any) {
      setErr(String(e?.message ?? e));
    }
  }

  async function ship(unitId: number) {
    setErr(null);
    try {
      await adminFulfillmentApi.ship(unitId, {
        carrier: carrier || null,
        trackingNumber: trackingNumber || null,
      });
      await refresh(state);
    } catch (e: any) {
      setErr(String(e?.message ?? e));
    }
  }

  if (err) return <div style={{ color: "crimson" }}>Error: {err}</div>;

  return (
    <div>
      <h3>Admin Fulfillment</h3>

      <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 12 }}>
        <label>
          Queue:
          <select value={state} onChange={(e) => setState(e.target.value as FulfillmentStateCode)} style={{ marginLeft: 8 }}>
            <option value="NEEDS_CREATED">NEEDS_CREATED</option>
            <option value="NEEDS_SHIPPED">NEEDS_SHIPPED</option>
            <option value="SHIPPED">SHIPPED</option>
          </select>
        </label>

        {state === "NEEDS_SHIPPED" ? (
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

        <button onClick={() => refresh(state)} style={{ marginLeft: "auto" }}>
          Refresh
        </button>
      </div>

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
    </div>
  );
}
