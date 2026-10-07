"use client";

import React, { useEffect, useRef, useId } from "react";

export type ModalSize = "sm" | "md" | "lg";

export interface ModalProps {
  readonly open: boolean;
  readonly onOpenChange?: (open: boolean) => void;
  readonly onClose?: () => void;
  readonly title: React.ReactNode;
  readonly description?: React.ReactNode;
  readonly children?: React.ReactNode;
  readonly footer?: React.ReactNode;
  readonly size?: ModalSize;
  readonly closeButton?: boolean;
  readonly className?: string;
  readonly initialFocusRef?: React.RefObject<HTMLElement | null>;
}

const sizeStyles: Record<ModalSize, string> = {
  sm: "max-w-md",
  md: "max-w-lg",
  lg: "max-w-2xl",
};

export function Modal({
  open,
  onOpenChange,
  onClose,
  title,
  description,
  children,
  footer,
  size = "md",
  closeButton = true,
  className = "",
  initialFocusRef,
}: ModalProps) {
  const dialogRef = useRef<HTMLDialogElement | null>(null);
  const generatedId = useId();
  const titleId = `${generatedId}-title`;
  const descriptionId = description ? `${generatedId}-description` : undefined;

  const handleClose = () => {
    onOpenChange?.(false);
    onClose?.();
  };

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (open) {
      if (!dialog.open) {
        dialog.showModal();
      }

      if (!dialog.open) {
        return;
      }

      if (initialFocusRef?.current) {
        initialFocusRef.current.focus();
      }

      const previousOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";

      return () => {
        document.body.style.overflow = previousOverflow;
        if (dialog.open) {
          dialog.close();
        }
      };
    } else {
      if (dialog.open) {
        dialog.close();
      }
    }
  }, [open, initialFocusRef]);

  const handleBackdropClick = (e: React.MouseEvent<HTMLDialogElement>) => {
    if (e.target === dialogRef.current) {
      handleClose();
    }
  };

  const handleCancel = (e: React.SyntheticEvent<HTMLDialogElement, Event>) => {
    e.preventDefault();
    handleClose();
  };

  return (
    <dialog
      ref={dialogRef}
      onCancel={handleCancel}
      onClick={handleBackdropClick}
      aria-modal="true"
      aria-labelledby={titleId}
      aria-describedby={descriptionId}
      className="fixed inset-0 z-50 m-0 p-4 sm:p-6 w-full h-full max-w-none max-h-none bg-slate-900/40 backdrop-blur-xs flex items-center justify-center border-none outline-none backdrop:bg-transparent [&:not([open])]:hidden"
    >
      <div
        className={`w-full ${sizeStyles[size]} bg-white border border-border-subtle rounded-xl shadow-xl flex flex-col max-h-[calc(100vh-2rem)] sm:max-h-[calc(100vh-4rem)] overflow-hidden ${className}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between p-5 sm:p-6 pb-4 border-b border-border-subtle shrink-0">
          <div className="space-y-1 pr-4">
            <h2
              id={titleId}
              className="text-lg font-semibold text-foreground-dark leading-snug"
            >
              {title}
            </h2>
            {description && (
              <p id={descriptionId} className="text-sm text-muted-foreground">
                {description}
              </p>
            )}
          </div>
          {closeButton && (
            <button
              type="button"
              onClick={handleClose}
              aria-label="Close modal"
              className="text-muted-foreground hover:text-foreground-dark rounded-lg p-1.5 hover:bg-slate-100 transition-colors focus:outline-none focus:ring-0 focus-visible:outline-none focus-visible:ring-0 focus-visible:bg-slate-100 focus-visible:text-foreground-dark cursor-pointer -mr-1.5 -mt-1.5 shrink-0"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="2"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          )}
        </div>

        {children && (
          <div className="p-5 sm:p-6 overflow-y-auto text-sm text-foreground-dark">
            {children}
          </div>
        )}

        {footer && (
          <div className="flex items-center justify-end gap-3 px-5 sm:px-6 py-4 border-t border-border-subtle shrink-0 bg-surface-soft/60 rounded-b-xl">
            {footer}
          </div>
        )}
      </div>
    </dialog>
  );
}
