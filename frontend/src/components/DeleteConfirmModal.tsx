import React from "react";

interface DeleteConfirmModalProps {
  open: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export const DeleteConfirmModal: React.FC<DeleteConfirmModalProps> = ({
  open,
  title,
  message,
  onConfirm,
  onCancel,
}) => {
  if (!open) return null;

  return (
    <>
      <div
        onClick={onCancel}
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(15, 23, 42, 0.4)",
          backdropFilter: "blur(2px)",
          zIndex: 2200,
        }}
      />
      <div
        dir="rtl"
        role="dialog"
        aria-modal="true"
        style={{
          position: "fixed",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: 380,
          maxWidth: "calc(100vw - 32px)",
          background: "#ffffff",
          borderRadius: 14,
          padding: "24px",
          boxShadow: "0 20px 45px rgba(15, 23, 42, 0.25)",
          border: "1px solid #e2e8f0",
          zIndex: 2300,
          fontFamily: "Inter, Arial, Helvetica, sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: "50%",
              background: "#fee2e2",
              color: "#dc2626",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 20,
              flexShrink: 0,
            }}
          >
            ⚠️
          </div>
          <div>
            <h3 style={{ margin: 0, fontSize: 16, color: "#1e293b", fontWeight: 700 }}>
              {title}
            </h3>
          </div>
        </div>

        <p style={{ margin: "0 0 20px 0", color: "#64748b", fontSize: 13, lineHeight: 1.5 }}>
          {message}
        </p>

        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
          <button
            type="button"
            onClick={onCancel}
            style={{
              padding: "9px 16px",
              borderRadius: 8,
              border: "1px solid #cbd5e1",
              background: "#ffffff",
              color: "#475569",
              fontSize: 13,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            ביטול
          </button>
          <button
            type="button"
            onClick={onConfirm}
            style={{
              padding: "9px 18px",
              borderRadius: 8,
              border: "none",
              background: "linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)",
              color: "#ffffff",
              fontSize: 13,
              fontWeight: 700,
              cursor: "pointer",
              boxShadow: "0 4px 10px rgba(220, 38, 38, 0.3)",
            }}
          >
            אישור ומחיקה
          </button>
        </div>
      </div>
    </>
  );
};
