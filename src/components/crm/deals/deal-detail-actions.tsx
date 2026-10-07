"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Deal } from "@/types/deal";
import { Button } from "@/components/ui/button";
import { DealDeleteDialog } from "@/components/crm/deals/deal-delete-dialog";

export interface DealDetailActionsProps {
  readonly deal: Deal;
}

export function DealDetailActions({ deal }: DealDetailActionsProps) {
  const router = useRouter();
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const handleDeleteSuccess = () => {
    setIsDeleteDialogOpen(false);
    router.push("/deals");
  };

  return (
    <>
      <div className="flex items-center gap-2.5 flex-wrap">
        {/* Back to Pipeline */}
        <Link href="/deals/pipeline">
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
                <rect x="3" y="3" width="7" height="7" />
                <rect x="14" y="3" width="7" height="7" />
                <rect x="14" y="14" width="7" height="7" />
                <rect x="3" y="14" width="7" height="7" />
              </svg>
            }
          >
            Back to Pipeline
          </Button>
        </Link>

        {/* Edit Deal Button */}
        <Link href={`/deals/${deal.id}/edit`}>
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
            Edit Deal
          </Button>
        </Link>

        {/* Delete Button */}
        <Button
          variant="secondary"
          onClick={() => setIsDeleteDialogOpen(true)}
          className="hover:text-rose-600 hover:border-rose-200"
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
              <polyline points="3 6 5 6 21 6" />
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
            </svg>
          }
        >
          Delete
        </Button>
      </div>

      {/* Delete Confirmation Dialog */}
      <DealDeleteDialog
        deal={deal}
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        onSuccess={handleDeleteSuccess}
        willNavigate={true}
      />
    </>
  );
}
