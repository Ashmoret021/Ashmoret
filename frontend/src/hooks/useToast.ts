import { useCallback, useState } from "react";
import type { ToastState, ToastType } from "../components/ToastNotification";

export const useToast = () => {
  const [toast, setToast] = useState<ToastState | null>(null);

  const showToast = useCallback(
    (message: string, type: ToastType = "info") => {
      setToast({ message, type });
      setTimeout(() => {
        setToast((curr) => (curr?.message === message ? null : curr));
      }, 4000);
    },
    [],
  );

  return { toast, showToast };
};
