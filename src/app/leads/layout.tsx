import React from "react";
import { AppShell } from "@/components/layout/app-shell";
import { getDevSession } from "@/lib/auth/dev-session";

export interface LeadsLayoutProps {
  readonly children: React.ReactNode;
}

export default async function LeadsLayout({
  children,
}: LeadsLayoutProps) {
  const session = await getDevSession();

  return (
    <AppShell topbarVariant="page" userName={session?.displayName}>
      {children}
    </AppShell>
  );
}
