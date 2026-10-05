"use client";

import React, { createContext, useContext, useState, useCallback, useId } from "react";

export type ToastType = "success" | "error" | "info";

export interface ToastItem {
  id: string;
  type: ToastType;
  message: string;
}

interface ToastContextType {
  toast: {
    success: (msg: string) => void;
    error: (msg: string) => void;
    info: (msg: string) => void;
  };
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const addToast = useCallback((type: ToastType, message: string) => {
    const id = `${Date.now()}-${Math.random()}`;
    setToasts((prev) => [...prev, { id, type, message }]);

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toastMethods = {
    success: (msg: string) => addToast("success", msg),
    error: (msg: string) => addToast("error", msg),
    info: (msg: string) => addToast("info", msg),
  };

  return (
    <ToastContext.Provider value={{ toast: toastMethods }}>
      {children}
      <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2.5 max-w-sm w-full pointer-events-none px-4 sm:px-0">
        {toasts.map((item) => (
          <div
            key={item.id}
            className={[
              "pointer-events-auto flex items-start justify-between gap-3 rounded-2xl border p-4 shadow-lg transition-all animate-in fade-in slide-in-from-bottom-3 duration-200",
              item.type === "success"
                ? "border-emerald-200 bg-white text-emerald-950"
                : item.type === "error"
                ? "border-rose-200 bg-white text-rose-950"
                : "border-slate-200 bg-white text-slate-900",
            ].join(" ")}
          >
            <div className="flex items-center gap-2.5">
              <span
                className={[
                  "flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold",
                  item.type === "success"
                    ? "bg-emerald-100 text-emerald-700"
                    : item.type === "error"
                    ? "bg-rose-100 text-rose-700"
                    : "bg-slate-100 text-slate-700",
                ].join(" ")}
              >
                {item.type === "success" ? "✓" : item.type === "error" ? "✕" : "ℹ"}
              </span>
              <p className="text-sm font-medium leading-snug">{item.message}</p>
            </div>
            <button
              type="button"
              onClick={() => removeToast(item.id)}
              className="text-slate-400 hover:text-slate-600 p-1"
              aria-label="Close notification"
            >
              ✕
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    // Graceful fallback if used outside provider
    return {
      toast: {
        success: (msg: string) => console.log("[Success Toast]", msg),
        error: (msg: string) => console.error("[Error Toast]", msg),
        info: (msg: string) => console.log("[Info Toast]", msg),
      },
    };
  }
  return context;
}
