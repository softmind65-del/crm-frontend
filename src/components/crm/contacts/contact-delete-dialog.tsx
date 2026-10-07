"use client";

import React, { useState } from "react";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useToast } from "@/components/ui/toast";
import { extractErrorMessage } from "@/lib/api/error-extractor";

export interface ContactDeleteDialogProps {
  readonly contact: { readonly id: string; readonly name: string } | null;
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
  readonly onSuccess?: () => void;
  readonly willNavigate?: boolean;
}

export function ContactDeleteDialog({
  contact,
  open,
  onOpenChange,
  onSuccess,
  willNavigate = false,
}: ContactDeleteDialogProps) {
  const { toast, queueToast } = useToast();
  const [isDeleting, setIsDeleting] = useState(false);
  const [hasError, setHasError] = useState(false);

  const handleClose = () => {
    if (isDeleting) return;
    setHasError(false);
    onOpenChange(false);
  };

  const handleConfirm = async () => {
    if (!contact || isDeleting) return;

    setIsDeleting(true);
    setHasError(false);

    try {
      const response = await fetch(
        `/api/crm/contacts/${encodeURIComponent(contact.id)}`,
        {
          method: "DELETE",
        }
      );

      const result: unknown = await response.json();

      if (!response.ok) {
        const errorMessage =
          response.status === 404
            ? "This contact is no longer available."
            : extractErrorMessage(result, "Please try again.");

        toast({
          variant: "error",
          title: "Unable to delete contact",
          description: errorMessage,
        });

        setHasError(true);
        setIsDeleting(false);
        return;
      }

      setIsDeleting(false);
      setHasError(false);
      onOpenChange(false);

      const successToast = {
        variant: "success" as const,
        title: "Contact deleted",
        description: "The contact was removed from the active contact list.",
      };

      if (willNavigate) {
        queueToast(successToast);
      } else {
        toast(successToast);
      }

      onSuccess?.();
    } catch {
      toast({
        variant: "error",
        title: "Unable to delete contact",
        description: "Please check your connection and try again.",
      });
      setHasError(true);
      setIsDeleting(false);
    }
  };

  const contactName = contact?.name ?? "this contact";

  return (
    <ConfirmDialog
      open={open && Boolean(contact)}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) handleClose();
      }}
      title="Delete contact?"
      description={`Are you sure you want to delete “${contactName}”? This contact will be removed from your active contact list.`}
      confirmLabel="Delete Contact"
      loadingText="Deleting..."
      cancelLabel="Cancel"
      variant="danger"
      isLoading={isDeleting}
      onConfirm={handleConfirm}
    >
      {hasError && (
        <div
          role="alert"
          className="mt-3 p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700 flex items-start gap-2 shadow-xs"
        >
          <svg
            className="w-4 h-4 text-red-500 shrink-0 mt-0.5"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <p className="leading-snug">The contact was not deleted.</p>
        </div>
      )}
    </ConfirmDialog>
  );
}
