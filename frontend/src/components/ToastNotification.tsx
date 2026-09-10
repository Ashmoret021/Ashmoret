export type ToastType = "success" | "error" | "info";

export interface ToastState {
  message: string;
  type: ToastType;
}

interface ToastNotificationProps {
  toast: ToastState;
}

export const ToastNotification = ({ toast }: ToastNotificationProps) => {
  return (
    <div
      dir="rtl"
      style={{
        position: "fixed",
        bottom: 24,
        left: "50%",
        transform: "translateX(-50%)",
        zIndex: 2500,
        background:
          toast.type === "success"
            ? "linear-gradient(135deg, #065f46 0%, #047857 100%)"
            : toast.type === "error"
              ? "linear-gradient(135deg, #991b1b 0%, #b91c1c 100%)"
              : "linear-gradient(135deg, #1e293b 0%, #334155 100%)",
        color: "#ffffff",
        padding: "10px 22px",
        borderRadius: 30,
        boxShadow: "0 10px 25px rgba(0, 0, 0, 0.25)",
        fontSize: 13,
        fontWeight: 700,
        display: "flex",
        alignItems: "center",
        gap: 10,
        fontFamily: "Inter, Arial, Helvetica, sans-serif",
        animation: "fadeIn 0.2s ease-out",
      }}
    >
      <span>
        {toast.type === "success"
          ? "✓"
          : toast.type === "error"
            ? "⚠️"
            : "ℹ️"}
      </span>
      <span>{toast.message}</span>
    </div>
  );
};
