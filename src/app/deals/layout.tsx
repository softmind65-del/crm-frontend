import React from "react";
import { AppShell } from "@/components/layout/app-shell";
import { getDevSession } from "@/lib/auth/dev-session";

export interface DealsLayoutProps {
  readonly children: React.ReactNode;
}

export default async function DealsLayout({
  children,
}: DealsLayoutProps) {
  const session = await getDevSession();

  return (
    <AppShell topbarVariant="page" userName={session?.displayName}>
      {children}
    </AppShell>
  );
}
