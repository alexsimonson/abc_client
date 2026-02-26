import { useEffect, useState } from "react";
import { adminTicketsApi } from "../../api";
import { useToast } from "../../components/Toast";
import type { SupportTicket, TicketStatusCode } from "../../types";

const STATUS_LABELS: Record<TicketStatusCode, string> = {
  NEW: "New",
  IN_PROGRESS: "In Progress",
  RESOLVED: "Resolved",
  CLOSED: "Closed",
};

const STATUS_COLORS: Record<TicketStatusCode, string> = {
  NEW: "#f59e0b",
  IN_PROGRESS: "#3b82f6",
  RESOLVED: "#10b981",
  CLOSED: "#6b7280",
};

export function AdminTicketsPage() {
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editStatus, setEditStatus] = useState<TicketStatusCode>("NEW");
  const [editNotes, setEditNotes] = useState("");
  const { showToast } = useToast();

  useEffect(() => {
    loadTickets();
  }, []);

  const loadTickets = async () => {
    try {
      const data = await adminTicketsApi.list();
      setTickets(data);
    } catch (error) {
      showToast("Failed to load tickets", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (ticket: SupportTicket) => {
    setEditingId(ticket.id);
    setEditStatus(ticket.statusCode);
    setEditNotes(ticket.adminNotes || "");
  };

  const handleSave = async (id: number) => {
    try {
      await adminTicketsApi.patch(id, {
        statusCode: editStatus,
        adminNotes: editNotes.trim() || undefined,
      });
      showToast("Ticket updated successfully", "success");
      setEditingId(null);
      loadTickets();
    } catch (error) {
      showToast("Failed to update ticket", "error");
    }
  };

  const handleCancel = () => {
    setEditingId(null);
    setEditStatus("NEW");
    setEditNotes("");
  };

  if (loading) {
    return <div>Loading tickets...</div>;
  }

  return (
    <div>
      <h2>Support Tickets</h2>
      <p style={{ color: "#666", marginBottom: 16 }}>
        {tickets.length} {tickets.length === 1 ? "ticket" : "tickets"} total
      </p>

      {tickets.length === 0 ? (
        <p style={{ color: "#666", fontStyle: "italic" }}>No tickets yet</p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {tickets.map((ticket) => {
            const isExpanded = expandedId === ticket.id;
            const isEditing = editingId === ticket.id;

            return (
              <div
                key={ticket.id}
                style={{
                  border: "1px solid #ddd",
                  borderRadius: 8,
                  padding: 16,
                  background: ticket.statusCode === "NEW" ? "#fffbeb" : "white",
                }}
              >
                {/* Header */}
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "start",
                    marginBottom: isExpanded ? 16 : 0,
                    cursor: "pointer",
                  }}
                  onClick={() => setExpandedId(isExpanded ? null : ticket.id)}
                >
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                      <span
                        style={{
                          fontSize: 11,
                          fontWeight: 600,
                          color: "white",
                          background: STATUS_COLORS[ticket.statusCode],
                          padding: "2px 8px",
                          borderRadius: 12,
                        }}
                      >
                        {STATUS_LABELS[ticket.statusCode]}
                      </span>
                      <span style={{ fontSize: 12, color: "#666" }}>
                        #{ticket.id} • {new Date(ticket.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <div style={{ fontWeight: 600, marginBottom: 2 }}>{ticket.subject}</div>
                    <div style={{ fontSize: 13, color: "#666 " }}>{ticket.email}</div>
                  </div>
                  <div style={{ fontSize: 12, color: "#999" }}>
                    {isExpanded ? "▼" : "▶"}
                  </div>
                </div>

                {/* Expanded content */}
                {isExpanded && (
                  <div onClick={(e) => e.stopPropagation()}>
                    <div style={{ borderTop: "1px solid #eee", paddingTop: 16, marginBottom: 16 }}>
                      <div style={{ fontWeight: 600, marginBottom: 8 }}>Message:</div>
                      <div
                        style={{
                          whiteSpace: "pre-wrap",
                          padding: 12,
                          background: "#f9f9f9",
                          borderRadius: 4,
                          fontSize: 14,
                        }}
                      >
                        {ticket.message}
                      </div>
                    </div>

                    {isEditing ? (
                      <div>
                        <div style={{ marginBottom: 12 }}>
                          <label style={{ display: "block", fontWeight: 600, marginBottom: 4 }}>
                            Status:
                          </label>
                          <select
                            value={editStatus}
                            onChange={(e) => setEditStatus(e.target.value as TicketStatusCode)}
                            style={{
                              padding: "6px 12px",
                              fontSize: 14,
                              border: "1px solid #ccc",
                              borderRadius: 4,
                            }}
                          >
                            <option value="NEW">New</option>
                            <option value="IN_PROGRESS">In Progress</option>
                            <option value="RESOLVED">Resolved</option>
                            <option value="CLOSED">Closed</option>
                          </select>
                        </div>

                        <div style={{ marginBottom: 12 }}>
                          <label style={{ display: "block", fontWeight: 600, marginBottom: 4 }}>
                            Admin Notes:
                          </label>
                          <textarea
                            value={editNotes}
                            onChange={(e) => setEditNotes(e.target.value)}
                            rows={4}
                            placeholder="Add internal notes about this ticket..."
                            style={{
                              width: "100%",
                              padding: "8px 12px",
                              fontSize: 14,
                              border: "1px solid #ccc",
                              borderRadius: 4,
                              fontFamily: "system-ui",
                              boxSizing: "border-box",
                              resize: "vertical",
                            }}
                          />
                        </div>

                        <div style={{ display: "flex", gap: 8 }}>
                          <button
                            onClick={() => handleSave(ticket.id)}
                            style={{
                              padding: "8px 16px",
                              fontSize: 14,
                              background: "#22c55e",
                              color: "white",
                              border: "none",
                              borderRadius: 4,
                              cursor: "pointer",
                              fontWeight: 500,
                            }}
                          >
                            Save
                          </button>
                          <button
                            onClick={handleCancel}
                            style={{
                              padding: "8px 16px",
                              fontSize: 14,
                              background: "#fff",
                              color: "#333",
                              border: "1px solid #ccc",
                              borderRadius: 4,
                              cursor: "pointer",
                            }}
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div>
                        {ticket.adminNotes && (
                          <div style={{ marginBottom: 12 }}>
                            <div style={{ fontWeight: 600, marginBottom: 4 }}>Admin Notes:</div>
                            <div
                              style={{
                                whiteSpace: "pre-wrap",
                                padding: 12,
                                background: "#f0f9ff",
                                borderRadius: 4,
                                fontSize: 14,
                              }}
                            >
                              {ticket.adminNotes}
                            </div>
                          </div>
                        )}

                        <button
                          onClick={() => handleEdit(ticket)}
                          style={{
                            padding: "8px 16px",
                            fontSize: 14,
                            background: "#3b82f6",
                            color: "white",
                            border: "none",
                            borderRadius: 4,
                            cursor: "pointer",
                            fontWeight: 500,
                          }}
                        >
                          Edit
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
