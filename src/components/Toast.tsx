import React, { createContext, useContext, useState, useCallback, useRef } from "react";
import { Link } from "react-router-dom";

type ToastType = "info" | "error" | "success" | "warning";

type Toast = {
  id: number;
  message: string;
  type: ToastType;
  linkTo?: string;
};

type ToastContextType = {
  showToast: (message: string, type?: ToastType, linkTo?: string) => void;
};

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const nextIdRef = useRef(0);

  const showToast = useCallback((message: string, type: ToastType = "info", linkTo?: string) => {
    setToasts((prev) => {
      // Prevent duplicate toasts with the same message
      const duplicate = prev.find((t) => t.message === message && t.type === type);
      if (duplicate) {
        return prev; // Don't add duplicate
      }
      
      const id = nextIdRef.current++;
      const newToast = { id, message, type, linkTo };
      
      // Auto-remove after 4 seconds
      setTimeout(() => {
        setToasts((current) => current.filter((t) => t.id !== id));
      }, 4000);
      
      return [...prev, newToast];
    });
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div
        style={{
          position: "fixed",
          top: 16,
          right: 16,
          zIndex: 9999,
          display: "flex",
          flexDirection: "column",
          gap: 8,
          maxWidth: 400,
        }}
      >
        {toasts.map((toast) => (
          <ToastMessage
            key={toast.id}
            message={toast.message}
            type={toast.type}
            linkTo={toast.linkTo}
            onClose={() => setToasts((prev) => prev.filter((t) => t.id !== toast.id))}
          />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

function ToastMessage({
  message,
  type,
  linkTo,
  onClose,
}: {
  message: string;
  type: ToastType;
  linkTo?: string;
  onClose: () => void;
}) {
  const colors = {
    info: { bg: "#3b82f6", border: "#2563eb" },
    error: { bg: "#ef4444", border: "#dc2626" },
    success: { bg: "#10b981", border: "#059669" },
    warning: { bg: "#f59e0b", border: "#d97706" },
  };

  const { bg, border } = colors[type];

  const content = (
    <div
      style={{
        background: bg,
        color: "white",
        padding: "12px 16px",
        borderRadius: 8,
        boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
        border: `2px solid ${border}`,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 12,
        animation: "slideIn 0.3s ease-out",
        cursor: linkTo ? "pointer" : "default",
        textDecoration: "none",
      }}
    >
      <span style={{ fontSize: 14, lineHeight: 1.4, flex: 1 }}>
        {message}
        {linkTo && (
          <span style={{ fontSize: 12, opacity: 0.9, marginLeft: 8 }}>→ Click to contact us</span>
        )}
      </span>
      <button
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onClose();
        }}
        style={{
          background: "rgba(255,255,255,0.2)",
          border: "none",
          color: "white",
          cursor: "pointer",
          borderRadius: 4,
          width: 24,
          height: 24,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 16,
          fontWeight: "bold",
          padding: 0,
          flexShrink: 0,
        }}
        aria-label="Close"
      >
        ×
      </button>
    </div>
  );

  if (linkTo) {
    return (
      <Link to={linkTo} style={{ textDecoration: "none" }} onClick={onClose}>
        {content}
      </Link>
    );
  }

  return content;
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within ToastProvider");
  }
  return context;
}

// Add CSS animation
const style = document.createElement("style");
style.textContent = `
  @keyframes slideIn {
    from {
      transform: translateX(100%);
      opacity: 0;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  }
`;
document.head.appendChild(style);
