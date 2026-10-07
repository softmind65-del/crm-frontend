"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { LeadListItem } from "@/types/lead";
import { Button } from "@/components/ui/button";
import { LeadDeleteDialog } from "@/components/crm/leads/lead-delete-dialog";
import { LeadConvertDialog } from "@/components/crm/leads/lead-convert-dialog";

export interface LeadDetailActionsProps {
  readonly lead: LeadListItem;
  readonly isConversionStage?: boolean;
}

export function LeadDetailActions({ lead, isConversionStage }: LeadDetailActionsProps) {
  const router = useRouter();
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isConvertDialogOpen, setIsConvertDialogOpen] = useState(false);

  const isConverted = lead.status === "converted";
  const isEligibleForConversion = isConversionStage !== undefined ? isConversionStage : lead.status === "qualified";

  // Converted leads are finalized historical data: no edit, delete, or convert actions
  if (isConverted) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-xs px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200/80 font-medium">
          Finalized / Converted
        </span>
      </div>
    );
  }

  const handleConvertSuccess = () => {
    setIsConvertDialogOpen(false);
    router.refresh();
  };

  const handleDeleteSuccess = () => {
    setIsDeleteDialogOpen(false);
    router.push("/leads");
  };

  return (
    <>
      <div className="flex items-center gap-2.5 flex-wrap">
        {/* Conversion stage leads show Convert to Deal */}
        {isEligibleForConversion && (
          <Button
            variant="primary"
            onClick={() => setIsConvertDialogOpen(true)}
            leftIcon={
              <svg
                className="w-4 h-4 shrink-0"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
                <polyline points="7 10 12 15 17 10" />
              </svg>
            }
          >
            Convert to Deal
          </Button>
        )}

        {/* Edit Button */}
        <Link href={`/leads/${lead.id}/edit`}>
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
            Edit
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
      <LeadDeleteDialog
        lead={lead}
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        onSuccess={handleDeleteSuccess}
        willNavigate={true}
      />

      {/* Convert to Deal Modal */}
      <LeadConvertDialog
        lead={lead}
        open={isConvertDialogOpen}
        onOpenChange={setIsConvertDialogOpen}
        onSuccess={handleConvertSuccess}
      />
    </>
  );
}
