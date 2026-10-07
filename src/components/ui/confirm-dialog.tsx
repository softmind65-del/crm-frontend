"use client";

import React, { useRef } from "react";
import { Modal, ModalSize } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";

export interface ConfirmDialogProps {
  readonly open: boolean;
  readonly onOpenChange?: (open: boolean) => void;
  readonly onClose?: () => void;
  readonly title: React.ReactNode;
  readonly description: React.ReactNode;
  readonly confirmLabel?: string;
  readonly cancelLabel?: string;
  readonly loadingText?: string;
  readonly variant?: "default" | "danger";
  readonly isLoading?: boolean;
  readonly onConfirm: () => void | Promise<void>;
  readonly size?: ModalSize;
  readonly children?: React.ReactNode;
}

export function ConfirmDialog({
  open,
  onOpenChange,
  onClose,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  loadingText,
  variant = "default",
  isLoading = false,
  onConfirm,
  size = "sm",
  children,
}: ConfirmDialogProps) {
  const cancelButtonRef = useRef<HTMLButtonElement | null>(null);

  const handleClose = () => {
    if (!isLoading) {
      onOpenChange?.(false);
      onClose?.();
    }
  };

  const footer = (
    <div className="flex items-center justify-end gap-3 w-full">
      <Button
        ref={cancelButtonRef}
        variant="secondary"
        onClick={handleClose}
        disabled={isLoading}
      >
        {cancelLabel}
      </Button>
      <Button
        variant={variant === "danger" ? "danger" : "primary"}
        onClick={onConfirm}
        isLoading={isLoading}
        loadingText={loadingText ?? confirmLabel}
      >
        {confirmLabel}
      </Button>
    </div>
  );

  return (
    <Modal
      open={open}
      onOpenChange={handleClose}
      title={title}
      description={description}
      footer={footer}
      size={size}
      closeButton={!isLoading}
      initialFocusRef={cancelButtonRef}
    >
      {children}
    </Modal>
  );
}
