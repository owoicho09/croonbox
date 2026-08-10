import { requireOrgContext } from "@/lib/org/context";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { AppTopbar } from "@/components/layout/app-topbar";
import { MobileBottomNav } from "@/components/layout/mobile-bottom-nav";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, organization, subscription } = await requireOrgContext();

  return (
    <div className="flex min-h-full">
      <AppSidebar organizationName={organization.name} />
      <div className="flex min-w-0 flex-1 flex-col">
        <AppTopbar userName={user.name} plan={subscription?.plan ?? "starter"} />
        <main className="flex-1 bg-background p-4 pb-20 sm:p-6 md:pb-6">{children}</main>
      </div>
      <MobileBottomNav />
    </div>
  );
}
