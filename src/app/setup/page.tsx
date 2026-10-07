import { Suspense } from "react";
import type { Metadata } from "next";
import { DevSetupForm } from "@/components/auth/dev-setup-form";

export const metadata: Metadata = {
  title: "Setup Session - AccDoo CRM",
  description: "Temporary development session onboarding for AccDoo CRM",
};

export default function SetupPage() {
  return (
    <main className="min-h-screen w-full flex items-center justify-center p-4 bg-surface-soft">
      <div className="w-full max-w-sm sm:max-w-md bg-white border border-border-subtle rounded-2xl p-6 sm:p-8 shadow-xs space-y-6">
        {/* Brand Header */}
        <div className="space-y-1.5 text-center select-none">
          <div className="inline-flex items-center gap-1.5 justify-center mb-1">
            <span className="text-2xl font-bold tracking-tight text-foreground-dark">
              AccDoo
            </span>
          </div>
          <h1 className="text-xl font-bold tracking-tight text-foreground-dark">
            Welcome to AccDoo CRM
          </h1>
          <p className="text-sm text-muted-foreground">
            Enter your development user to start session.
          </p>
        </div>

        {/* Form Container */}
        <Suspense
          fallback={
            <div className="h-40 flex items-center justify-center text-sm text-muted-foreground">
              Loading...
            </div>
          }
        >
          <DevSetupForm />
        </Suspense>
      </div>
    </main>
  );
}
