"use client";

import React, { useState } from "react";
import { SearchInput } from "@/components/ui/search-input";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Modal } from "@/components/ui/modal";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { DataTable, DataTableColumn } from "@/components/data-table/data-table";
import { TablePagination } from "@/components/data-table/table-pagination";
import { TableActions } from "@/components/data-table/table-actions";
import { FilterPanel } from "@/components/filters/filter-panel";
import { useToast } from "@/components/ui/toast";

export function SearchInputClearableDemo() {
  const [query, setQuery] = useState("Acme Corporation");

  return (
    <div className="space-y-1.5">
      <label className="block text-sm font-medium text-foreground-dark">
        Filled with Clear Action
      </label>
      <SearchInput
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onClear={() => setQuery("")}
        placeholder="Search customers..."
      />
      <p className="text-xs text-muted-foreground">
        Click the clear icon (X) to test clearing parent-controlled search state.
      </p>
    </div>
  );
}

export function ModalPreviewDemo() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div>
      <Button variant="secondary" onClick={() => setIsOpen(true)}>
        Open Modal
      </Button>

      <Modal
        open={isOpen}
        onOpenChange={setIsOpen}
        title="Customer Details"
        description="Example reusable modal layout."
        footer={
          <Button variant="secondary" onClick={() => setIsOpen(false)}>
            Close
          </Button>
        }
      >
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <span className="block text-xs font-medium text-muted-foreground">
                Company Name
              </span>
              <span className="text-sm font-medium text-foreground-dark">
                Acme Technologies Inc.
              </span>
            </div>
            <div>
              <span className="block text-xs font-medium text-muted-foreground">
                Account Status
              </span>
              <Badge variant="success" dot className="mt-0.5">
                Active Customer
              </Badge>
            </div>
            <div>
              <span className="block text-xs font-medium text-muted-foreground">
                Primary Contact
              </span>
              <span className="text-sm text-foreground-dark">
                contact@acme.example.com
              </span>
            </div>
            <div>
              <span className="block text-xs font-medium text-muted-foreground">
                Account Owner
              </span>
              <span className="text-sm text-foreground-dark">
                Sarah Jenkins
              </span>
            </div>
          </div>

          <div className="pt-2 border-t border-border-subtle">
            <span className="block text-xs font-medium text-muted-foreground mb-1">
              Internal Note
            </span>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Customer initiated enterprise tier inquiry. Scheduled demonstration for
              next business quarter.
            </p>
          </div>
        </div>
      </Modal>
    </div>
  );
}

export function ConfirmDialogPreviewDemo() {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleConfirm = () => {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      setIsOpen(false);
    }, 600);
  };

  return (
    <div>
      <Button variant="danger" onClick={() => setIsOpen(true)}>
        Open Confirm Dialog
      </Button>

      <ConfirmDialog
        open={isOpen}
        onOpenChange={setIsOpen}
        title="Delete record?"
        description="This action cannot be undone."
        confirmLabel="Delete"
        cancelLabel="Cancel"
        variant="danger"
        isLoading={isLoading}
        onConfirm={handleConfirm}
      />
    </div>
  );
}

export interface PreviewCustomer {
  readonly id: string;
  readonly name: string;
  readonly company: string;
  readonly email: string;
  readonly status: "New" | "Qualified" | "Pending" | "Lost";
}

const sampleCustomers: readonly PreviewCustomer[] = [
  {
    id: "1",
    name: "ABC LLC",
    company: "ABC Technologies Group",
    email: "contact@abc.example.com",
    status: "Qualified",
  },
  {
    id: "2",
    name: "Acme Corp",
    company: "Acme Global Solutions",
    email: "billing@acme.example.com",
    status: "New",
  },
  {
    id: "3",
    name: "Meridian Systems",
    company: "Meridian Tech Ltd",
    email: "support@meridian.example.com",
    status: "Pending",
  },
  {
    id: "4",
    name: "Nova Dynamics",
    company: "Nova Dynamics Corp",
    email: "info@novadynamics.example.com",
    status: "Lost",
  },
  {
    id: "5",
    name: "Pinnacle Media",
    company: "Pinnacle Digital Media",
    email: "accounts@pinnacle.example.com",
    status: "Qualified",
  },
  {
    id: "6",
    name: "Vanguard Systems",
    company: "Vanguard Enterprises",
    email: "operations@vanguard.example.com",
    status: "New",
  },
  {
    id: "7",
    name: "Sterling Partners",
    company: "Sterling Ventures Inc",
    email: "hello@sterling.example.com",
    status: "Pending",
  },
  {
    id: "8",
    name: "Horizon Solutions",
    company: "Horizon Global Tech",
    email: "inquiry@horizon.example.com",
    status: "Qualified",
  },
];

export function DataTablePreviewDemo() {
  const [currentPage, setCurrentPage] = useState(2);
  const [pageSize, setPageSize] = useState(10);
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  // Controlled demo-state calculation:
  const totalRecords = 118;
  const totalPages = Math.ceil(totalRecords / pageSize);

  const handlePageSizeChange = (newSize: number) => {
    setPageSize(newSize);
    setCurrentPage(1); // Reset page to 1 upon page-size change
  };

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
  };

  const handleAction = (actionName: string, customerName: string) => {
    setActionNotice(`${actionName} action selected for ${customerName}`);
    setTimeout(() => setActionNotice(null), 3000);
  };

  const columns: readonly DataTableColumn<PreviewCustomer>[] = [
    {
      key: "customer",
      header: "Customer",
      render: (row) => (
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-full bg-blue-50 text-brand flex items-center justify-center font-semibold text-xs shrink-0 select-none">
            {row.name.substring(0, 2).toUpperCase()}
          </div>
          <span className="font-medium text-foreground-dark">{row.name}</span>
        </div>
      ),
    },
    {
      key: "company",
      header: "Company",
      render: (row) => (
        <span className="text-muted-foreground">{row.company}</span>
      ),
    },
    {
      key: "email",
      header: "Email",
      render: (row) => (
        <span className="text-foreground-dark">{row.email}</span>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (row) => {
        const variantMap = {
          New: "info" as const,
          Qualified: "success" as const,
          Pending: "warning" as const,
          Lost: "danger" as const,
        };
        return (
          <Badge variant={variantMap[row.status]} dot>
            {row.status}
          </Badge>
        );
      },
    },
    {
      key: "actions",
      header: "Actions",
      align: "right",
      headerClassName: "text-right",
      render: (row) => (
        <TableActions
          actions={[
            {
              label: "View",
              onSelect: () => handleAction("View", row.name),
            },
            {
              label: "Edit",
              onSelect: () => handleAction("Edit", row.name),
            },
            {
              label: "Delete",
              variant: "danger",
              onSelect: () => handleAction("Delete", row.name),
            },
          ]}
        />
      ),
    },
  ];

  return (
    <div className="space-y-3">
      {actionNotice && (
        <div className="px-3.5 py-2 text-xs font-medium rounded-lg bg-blue-50 text-brand border border-blue-200">
          {actionNotice}
        </div>
      )}
      <div className="bg-white border border-border-subtle rounded-xl overflow-hidden shadow-xs">
        <DataTable
          data={sampleCustomers}
          columns={columns}
          getRowKey={(row) => row.id}
          className="border-none rounded-none"
        />
        <TablePagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalRecords={totalRecords}
          pageSize={pageSize}
          pageSizeOptions={[10, 20, 50]}
          onPageChange={handlePageChange}
          onPageSizeChange={handlePageSizeChange}
        />
      </div>
    </div>
  );
}

export function DataTableEmptyPreviewDemo() {
  const emptyColumns: readonly DataTableColumn<PreviewCustomer>[] = [
    {
      key: "customer",
      header: "Customer",
      render: (row) => row.name,
    },
    {
      key: "company",
      header: "Company",
      render: (row) => row.company,
    },
    {
      key: "email",
      header: "Email",
      render: (row) => row.email,
    },
    {
      key: "status",
      header: "Status",
      render: (row) => row.status,
    },
  ];

  return (
    <div className="bg-white border border-border-subtle rounded-xl overflow-hidden shadow-xs">
      <DataTable
        data={[]}
        columns={emptyColumns}
        getRowKey={(row) => row.id}
        emptyState={
          <EmptyState
            title="No records found"
            description="No customer records match your filter criteria."
            className="border-none p-8"
          />
        }
      />
    </div>
  );
}

export function FilterPanelPreviewDemo() {
  const [isOpen, setIsOpen] = useState(true);
  const [isApplying, setIsApplying] = useState(false);

  const defaultFilters = {
    name: "",
    account: "all",
    status: "all",
    lastUpdated: "any",
    type: "all",
  };

  const [filters, setFilters] = useState(defaultFilters);
  const [appliedFiltersSummary, setAppliedFiltersSummary] = useState<string | null>(
    null
  );

  const handleClear = () => {
    setFilters(defaultFilters);
    setAppliedFiltersSummary(null);
  };

  const handleCancel = () => {
    setIsOpen(false);
  };

  const handleApply = () => {
    setIsApplying(true);
    setTimeout(() => {
      setIsApplying(false);
      setIsOpen(false);
      const activeCount = Object.entries(filters).filter(
        ([, val]) => val !== "" && val !== "all" && val !== "any"
      ).length;
      setAppliedFiltersSummary(
        activeCount > 0
          ? `${activeCount} filter(s) active`
          : "Filters applied"
      );
    }, 400);
  };

  return (
    <div className="space-y-4">
      {/* Trigger & status bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Button
          variant="secondary"
          onClick={() => setIsOpen((prev) => !prev)}
          leftIcon={
            <svg
              className="w-4 h-4 text-muted-foreground shrink-0"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <line x1="4" y1="6" x2="20" y2="6" />
              <line x1="7" y1="12" x2="17" y2="12" />
              <line x1="10" y1="18" x2="14" y2="18" />
            </svg>
          }
        >
          {isOpen ? "Hide Filters" : "Filters"}
        </Button>

        {appliedFiltersSummary && (
          <span className="text-xs font-medium text-brand bg-blue-50 border border-blue-200 px-2.5 py-1 rounded-md">
            {appliedFiltersSummary}
          </span>
        )}
      </div>

      {/* FilterPanel */}
      <FilterPanel
        open={isOpen}
        title="Filter Products"
        onClear={handleClear}
        onCancel={handleCancel}
        onApply={handleApply}
        isApplying={isApplying}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          {/* 1. Name */}
          <Input
            label="Name"
            placeholder="Starts with"
            value={filters.name}
            onChange={(e) =>
              setFilters((prev) => ({ ...prev, name: e.target.value }))
            }
          />

          {/* 2. Account */}
          <Select
            label="Income account"
            value={filters.account}
            onChange={(e) =>
              setFilters((prev) => ({ ...prev, account: e.target.value }))
            }
          >
            <option value="all">All accounts</option>
            <option value="retail">Retail</option>
            <option value="enterprise">Enterprise</option>
          </Select>

          {/* 3. Status */}
          <Select
            label="Status"
            value={filters.status}
            onChange={(e) =>
              setFilters((prev) => ({ ...prev, status: e.target.value }))
            }
          >
            <option value="all">All</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </Select>

          {/* 4. Last updated */}
          <Select
            label="Last updated"
            value={filters.lastUpdated}
            onChange={(e) =>
              setFilters((prev) => ({ ...prev, lastUpdated: e.target.value }))
            }
          >
            <option value="any">Any time</option>
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
          </Select>

          {/* 5. Type */}
          <Select
            label="Type"
            value={filters.type}
            onChange={(e) =>
              setFilters((prev) => ({ ...prev, type: e.target.value }))
            }
          >
            <option value="all">All types</option>
            <option value="individual">Individual</option>
            <option value="business">Business</option>
            <option value="organization">Organization</option>
          </Select>
        </div>
      </FilterPanel>
    </div>
  );
}

export function ToastPreviewDemo() {
  const { toast } = useToast();

  const handleSuccess = () => {
    toast({
      variant: "success",
      title: "Customer created",
      description: "The customer was added successfully.",
    });
  };

  const handleError = () => {
    toast({
      variant: "error",
      title: "Unable to save customer",
      description: "Please check the information and try again.",
    });
  };

  const handleWarning = () => {
    toast({
      variant: "warning",
      title: "Check customer details",
      description: "Some information may need your attention.",
    });
  };

  const handleInfo = () => {
    toast({
      variant: "info",
      title: "Customer data refreshed",
      description: "The latest customer information is now available.",
    });
  };

  const handleMultiple = () => {
    toast({
      variant: "info",
      title: "Customer data refreshed",
      description: "The latest customer information is now available.",
    });

    setTimeout(() => {
      toast({
        variant: "warning",
        title: "Check customer details",
        description: "Some information may need your attention.",
      });
    }, 150);

    setTimeout(() => {
      toast({
        variant: "success",
        title: "Customer created",
        description: "The customer was added successfully.",
      });
    }, 300);
  };

  return (
    <div className="flex flex-wrap items-center gap-3">
      <Button variant="secondary" onClick={handleSuccess}>
        Show Success
      </Button>
      <Button variant="secondary" onClick={handleError}>
        Show Error
      </Button>
      <Button variant="secondary" onClick={handleWarning}>
        Show Warning
      </Button>
      <Button variant="secondary" onClick={handleInfo}>
        Show Info
      </Button>
      <Button variant="primary" onClick={handleMultiple}>
        Show Multiple Toasts
      </Button>
    </div>
  );
}

