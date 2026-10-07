"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { CustomerDeleteDialog } from "@/components/crm/customers/customer-delete-dialog";

export interface CustomerDetailActionsProps {
  readonly customerId: string;
  readonly customerName: string;
}

export function CustomerDetailActions({
  customerId,
  customerName,
}: CustomerDetailActionsProps) {
  const router = useRouter();
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const handleDeleteSuccess = () => {
    router.push("/customers");
    router.refresh();
  };

  return (
    <>
      <div className="flex items-center gap-2.5 shrink-0">
        <Link href={`/customers/${customerId}/edit`}>
          <Button
            variant="secondary"
            leftIcon={
              <svg
                className="w-4 h-4 shrink-0 text-muted-foreground"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
              </svg>
            }
          >
            Edit Customer
          </Button>
        </Link>

        <Button
          variant="secondary"
          onClick={() => setIsDeleteDialogOpen(true)}
          className="text-red-600 hover:text-red-700 hover:bg-red-50 hover:border-red-200 border-border-subtle"
          leftIcon={
            <svg
              className="w-4 h-4 shrink-0 text-red-500"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <polyline points="3 6 5 6 21 6" />
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
              <line x1="10" y1="11" x2="10" y2="17" />
              <line x1="14" y1="11" x2="14" y2="17" />
            </svg>
          }
        >
          Delete Customer
        </Button>
      </div>

      <CustomerDeleteDialog
        customer={{ id: customerId, name: customerName }}
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        onSuccess={handleDeleteSuccess}
        willNavigate={true}
      />
    </>
  );
}
