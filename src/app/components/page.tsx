import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/layout/page-header";
import { HOME_BREADCRUMB_ITEM } from "@/components/layout/breadcrumbs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { SearchInput } from "@/components/ui/search-input";
import { EmptyState } from "@/components/ui/empty-state";
import { FormField } from "@/components/forms/form-field";
import { FormSection } from "@/components/forms/form-section";
import {
  SearchInputClearableDemo,
  ModalPreviewDemo,
  ConfirmDialogPreviewDemo,
  DataTablePreviewDemo,
  DataTableEmptyPreviewDemo,
  FilterPanelPreviewDemo,
  ToastPreviewDemo,
} from "./component-preview-interactions";
import { getDevSession } from "@/lib/auth/dev-session";

export default async function ComponentsPreviewPage() {
  const session = await getDevSession();

  const searchIcon = (
    <svg
      className="w-4 h-4 text-muted-foreground"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  );

  const emptyUsersIcon = (
    <svg
      className="w-6 h-6"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );

  return (
    <AppShell
      topbarVariant="page"
      topbarBreadcrumbs={[
        HOME_BREADCRUMB_ITEM,
        { label: "Components" },
      ]}
      userName={session?.displayName}
    >

      {/* Page Header */}
      <PageHeader
        title="CRM Components"
        description="Reusable interface components for the AccDoo CRM frontend."
        action={<Button variant="primary">Add Customer</Button>}
      />

      {/* ============================================================== */}
      {/* BATCH 1 COMPONENTS                                            */}
      {/* ============================================================== */}

      {/* Button Showcase */}
      <section className="bg-white border border-border-subtle rounded-xl p-6 space-y-6">
        <div>
          <h2 className="text-lg font-semibold text-foreground-dark">
            Button Component
          </h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Visual testing for variants, sizes, and loading states.
          </p>
        </div>

        {/* Variants */}
        <div className="space-y-3">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Variants
          </h3>
          <div className="flex flex-wrap items-center gap-3">
            <Button variant="primary">Primary</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="ghost">Ghost</Button>
            <Button variant="danger">Danger</Button>
          </div>
        </div>

        {/* Sizes */}
        <div className="space-y-3">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Sizes
          </h3>
          <div className="flex flex-wrap items-center gap-3">
            <Button size="sm">Small</Button>
            <Button size="md">Medium</Button>
            <Button size="lg">Large</Button>
          </div>
        </div>

        {/* States */}
        <div className="space-y-3">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            States
          </h3>
          <div className="flex flex-wrap items-center gap-3">
            <Button disabled>Disabled</Button>
            <Button isLoading>Save Changes</Button>
            <Button isLoading loadingText="Saving...">
              Save Changes
            </Button>
          </div>
        </div>
      </section>

      {/* Input Showcase */}
      <section className="bg-white border border-border-subtle rounded-xl p-6 space-y-6">
        <div>
          <h2 className="text-lg font-semibold text-foreground-dark">
            Input Component
          </h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Field layouts with validation states, helper text, and icon slots.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* 1. Normal Input */}
          <Input
            label="Customer Name"
            placeholder="Enter customer name"
          />

          {/* 2. Helper Text */}
          <Input
            label="Email Address"
            type="email"
            placeholder="customer@example.com"
            helperText="Used for customer communication."
          />

          {/* 3. Error State */}
          <Input
            label="Contact Number"
            placeholder="+94 77 123 4567"
            error="Contact number is required."
          />

          {/* 4. Disabled State */}
          <Input
            label="Customer ID"
            placeholder="Generated automatically"
            disabled
          />

          {/* 5. Leading Icon Slot */}
          <Input
            label="Search Customers"
            placeholder="Search by name, company..."
            leadingIcon={searchIcon}
            containerClassName="md:col-span-2"
          />
        </div>
      </section>

      {/* Badge Showcase */}
      <section className="bg-white border border-border-subtle rounded-xl p-6 space-y-6">
        <div>
          <h2 className="text-lg font-semibold text-foreground-dark">
            Badge Component
          </h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Compact status pills for records, pipelines, and tags.
          </p>
        </div>

        {/* Standard Badges */}
        <div className="space-y-3">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Standard Variants
          </h3>
          <div className="flex flex-wrap gap-3">
            <Badge variant="neutral">Draft</Badge>
            <Badge variant="info">New</Badge>
            <Badge variant="success">Qualified</Badge>
            <Badge variant="warning">Pending</Badge>
            <Badge variant="danger">Lost</Badge>
          </div>
        </div>

        {/* Badges with Indicator Dot */}
        <div className="space-y-3">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            With Status Dot
          </h3>
          <div className="flex flex-wrap gap-3">
            <Badge variant="neutral" dot>
              Draft
            </Badge>
            <Badge variant="info" dot>
              New
            </Badge>
            <Badge variant="success" dot>
              Qualified
            </Badge>
            <Badge variant="warning" dot>
              Pending
            </Badge>
            <Badge variant="danger" dot>
              Lost
            </Badge>
          </div>
        </div>
      </section>

      {/* ============================================================== */}
      {/* BATCH 2 COMPONENTS                                            */}
      {/* ============================================================== */}

      {/* Select Showcase */}
      <section className="bg-white border border-border-subtle rounded-xl p-6 space-y-6">
        <div>
          <h2 className="text-lg font-semibold text-foreground-dark">
            Select Component
          </h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Native dropdown selection with validation states, helper text, and custom styled arrow.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* 1. Normal State */}
          <Select label="Customer Type" defaultValue="individual">
            <option value="individual">Individual</option>
            <option value="business">Business</option>
            <option value="organization">Organization</option>
          </Select>

          {/* 2. Helper State */}
          <Select
            label="Lead Status"
            helperText="Select the current lead status."
            defaultValue="new"
          >
            <option value="new">New</option>
            <option value="contacted">Contacted</option>
            <option value="qualified">Qualified</option>
            <option value="unqualified">Unqualified</option>
          </Select>

          {/* 3. Error State */}
          <Select
            label="Deal Stage"
            error="Deal stage is required."
            defaultValue=""
          >
            <option value="" disabled>
              Select deal stage...
            </option>
            <option value="discovery">Discovery</option>
            <option value="proposal">Proposal</option>
            <option value="negotiation">Negotiation</option>
            <option value="won">Closed Won</option>
            <option value="lost">Closed Lost</option>
          </Select>

          {/* 4. Disabled State */}
          <Select
            label="Assigned User"
            disabled
            defaultValue="sarah"
          >
            <option value="sarah">Sarah Jenkins</option>
            <option value="alex">Alex Rivera</option>
          </Select>
        </div>
      </section>

      {/* Textarea Showcase */}
      <section className="bg-white border border-border-subtle rounded-xl p-6 space-y-6">
        <div>
          <h2 className="text-lg font-semibold text-foreground-dark">
            Textarea Component
          </h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Multiline input for CRM records, notes, and activity logs.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* 1. Normal Textarea */}
          <Textarea
            label="Notes"
            placeholder="Add notes..."
          />

          {/* 2. Helper Example */}
          <Textarea
            label="Description"
            helperText="Add a short internal description."
            placeholder="Enter a detailed description..."
          />

          {/* 3. Error Example */}
          <Textarea
            label="Reason"
            error="A reason is required."
            placeholder="Provide the reason for this action..."
            containerClassName="md:col-span-2"
          />
        </div>
      </section>

      {/* SearchInput Showcase */}
      <section className="bg-white border border-border-subtle rounded-xl p-6 space-y-6">
        <div>
          <h2 className="text-lg font-semibold text-foreground-dark">
            SearchInput Component
          </h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Dedicated search bar with search icon and optional accessible clear button.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Normal Search Input */}
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-foreground-dark">
              Default Search
            </label>
            <SearchInput placeholder="Search customers..." />
            <p className="text-xs text-muted-foreground">
              Uncontrolled or standard search field with embedded search icon.
            </p>
          </div>

          {/* Filled with Clear Action (Client Demo) */}
          <SearchInputClearableDemo />
        </div>
      </section>

      {/* EmptyState Showcase */}
      <section className="bg-white border border-border-subtle rounded-xl p-6 space-y-6">
        <div>
          <h2 className="text-lg font-semibold text-foreground-dark">
            EmptyState Component
          </h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Zero-data states for empty tables, filtered views, and new accounts.
          </p>
        </div>

        <EmptyState
          icon={emptyUsersIcon}
          title="No customers found"
          description="Try adjusting your search or create a new customer."
          action={<Button variant="primary">Add Customer</Button>}
        />
      </section>

      {/* Modal & Dialog Showcase */}
      <section className="bg-white border border-border-subtle rounded-xl p-6 space-y-6">
        <div>
          <h2 className="text-lg font-semibold text-foreground-dark">
            Modal & ConfirmDialog Components
          </h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Accessible dialogs with keyboard trap, backdrop dismiss, and danger variants.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Modal Demo */}
          <div className="p-5 border border-border-subtle rounded-lg space-y-3">
            <div>
              <h3 className="text-sm font-semibold text-foreground-dark">
                Standard Modal
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Generic dialog with title, description, scrollable body, and action footer.
              </p>
            </div>
            <ModalPreviewDemo />
          </div>

          {/* ConfirmDialog Demo */}
          <div className="p-5 border border-border-subtle rounded-lg space-y-3">
            <div>
              <h3 className="text-sm font-semibold text-foreground-dark">
                Confirm Dialog (Danger Variant)
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Built on top of Modal for destructive actions with simulated loading state.
              </p>
            </div>
            <ConfirmDialogPreviewDemo />
          </div>
        </div>
      </section>

      {/* ============================================================== */}
      {/* BATCH 3 COMPONENTS                                            */}
      {/* ============================================================== */}

      {/* DataTable & Pagination Showcase */}
      <section className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold text-foreground-dark">
            DataTable & Pagination
          </h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Compact enterprise data table with status pills, portal-rendered row action menus, and controlled pagination with page-size selection.
          </p>
        </div>

        {/* Unified Table + Pagination Demo */}
        <DataTablePreviewDemo />

        {/* Zero-Row / Empty State Demonstration */}
        <div className="space-y-2 pt-4">
          <h3 className="text-sm font-semibold text-foreground-dark">
            Empty Table State
          </h3>
          <p className="text-xs text-muted-foreground">
            Verifying zero-row fallback rendering safely spanning all defined table columns.
          </p>
          <DataTableEmptyPreviewDemo />
        </div>
      </section>

      {/* FormSection & FormField Showcase */}
      <section className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold text-foreground-dark">
            FormSection & FormField Components
          </h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Composed enterprise forms with semantic field wrappers and grouped section cards.
          </p>
        </div>

        <FormSection
          title="General Information"
          description="Basic customer information."
          action={
            <Button size="sm" variant="secondary">
              Save Draft
            </Button>
          }
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField
              label="Customer Name"
              htmlFor="composed-customer-name"
              required
            >
              <Input
                id="composed-customer-name"
                placeholder="Enter customer name"
              />
            </FormField>

            <FormField
              label="Customer Type"
              htmlFor="composed-customer-type"
              required
            >
              <Select id="composed-customer-type" defaultValue="business">
                <option value="individual">Individual</option>
                <option value="business">Business</option>
                <option value="organization">Organization</option>
              </Select>
            </FormField>

            <FormField
              label="Notes"
              htmlFor="composed-notes"
              helperText="Internal notes for CRM account executives."
              className="md:col-span-2"
            >
              <Textarea
                id="composed-notes"
                placeholder="Enter account notes..."
              />
            </FormField>
          </div>
        </FormSection>
      </section>

      {/* FilterPanel Showcase */}
      <section className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold text-foreground-dark">
            FilterPanel Component
          </h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Collapsible in-page filter panel with header icon, clear-all action, responsive filter grid, and right-aligned footer controls.
          </p>
        </div>

        <FilterPanelPreviewDemo />
      </section>

      {/* Toast Notifications Showcase */}
      <section className="bg-white border border-border-subtle rounded-xl p-6 space-y-6">
        <div>
          <h2 className="text-lg font-semibold text-foreground-dark">
            Toast Notifications
          </h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Temporary feedback messages for successful actions, errors, warnings, and informational updates.
          </p>
        </div>

        <ToastPreviewDemo />
      </section>
    </AppShell>
  );
}
