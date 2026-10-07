"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Toast, ToastInput, ToastItem } from "./toast";

const MAX_VISIBLE_TOASTS = 4;
const EXIT_ANIMATION_DURATION_MS = 150;

let toastCounter = 0;
function generateToastId(): string {
  toastCounter += 1;
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return `${crypto.randomUUID()}-${toastCounter}`;
  }
  return `toast-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 7)}-${toastCounter}`;
}

export interface ToastContextValue {
  readonly toast: (input: ToastInput) => string;
  readonly dismiss: (id: string) => void;
  readonly queueToast: (input: ToastInput) => void;
  readonly showPendingToast: () => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export interface ToastProviderProps {
  readonly children: React.ReactNode;
}

export function ToastProvider({ children }: ToastProviderProps) {
  const [toasts, setToasts] = useState<readonly ToastItem[]>([]);
  const pendingToastRef = useRef<ToastInput | null>(null);

  const dismiss = useCallback((id: string) => {
    // Stage 1: Mark toast as exiting to play smooth exit transition
    setToasts((prev) =>
      prev.map((item) => (item.id === id ? { ...item, isExiting: true } : item))
    );

    // Stage 2: Remove from state once exit transition completes
    setTimeout(() => {
      setToasts((prev) => prev.filter((item) => item.id !== id));
    }, EXIT_ANIMATION_DURATION_MS);
  }, []);

  const toast = useCallback((input: ToastInput): string => {
    const id = generateToastId();
    const newToast: ToastItem = {
      id,
      variant: input.variant ?? "info",
      title: input.title,
      description: input.description,
      duration: input.duration,
      createdAt: Date.now(),
    };

    // Prepend newest toast at the top, pruning older active toasts if exceeding threshold
    setToasts((prev) => [newToast, ...prev].slice(0, MAX_VISIBLE_TOASTS));
    return id;
  }, []);

  const queueToast = useCallback((input: ToastInput) => {
    pendingToastRef.current = input;
  }, []);

  const showPendingToast = useCallback(() => {
    if (pendingToastRef.current) {
      const nextToast = pendingToastRef.current;
      pendingToastRef.current = null;
      toast(nextToast);
    }
  }, [toast]);

  const contextValue = useMemo<ToastContextValue>(
    () => ({
      toast,
      dismiss,
      queueToast,
      showPendingToast,
    }),
    [toast, dismiss, queueToast, showPendingToast]
  );

  return (
    <ToastContext.Provider value={contextValue}>
      {children}
      {/* Viewport Toast Container: fixed top-right on desktop, safe margins on mobile */}
      <div
        aria-label="Notifications"
        className="fixed top-5 sm:top-6 right-4 sm:right-6 z-50 pointer-events-none flex flex-col gap-2.5 w-[calc(100vw-32px)] sm:w-[380px] max-w-[400px]"
      >
        {toasts.map((toastItem) => (
          <Toast key={toastItem.id} toast={toastItem} onDismiss={dismiss} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}

/**
 * Lightweight client bridge that signals real destination content has rendered,
 * flushing any deferred navigation toast exactly once.
 */
export function ToastFlushBridge() {
  const { showPendingToast } = useToast();

  useEffect(() => {
    showPendingToast();
  }, [showPendingToast]);

  return null;
}
