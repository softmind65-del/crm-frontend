import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/layout/page-header";
import { getDevSession } from "@/lib/auth/dev-session";

export default async function DashboardPage() {
  const session = await getDevSession();

  return (
    <AppShell topbarVariant="dashboard" userName={session?.displayName}>
      <PageHeader
        title="Dashboard"
        description="Overview of your CRM workspace."
      />
    </AppShell>
  );
}