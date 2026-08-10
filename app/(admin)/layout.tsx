import Link from "next/link";
import { ShieldAlert } from "lucide-react";
import { requirePlatformAdmin } from "@/lib/org/admin";

const navItems = [
  { href: "/admin", label: "Overview" },
  { href: "/admin/organizations", label: "Organizations" },
  { href: "/admin/processing", label: "Processing" },
  { href: "/admin/emails", label: "Emails" },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requirePlatformAdmin();

  return (
    <div className="min-h-full bg-background">
      <header className="border-b border-border bg-navy text-navy-foreground">
        <div className="mx-auto flex h-14 max-w-6xl items-center gap-4 overflow-x-auto px-4 sm:gap-8 sm:px-6">
          <span className="flex shrink-0 items-center gap-2 text-sm font-semibold">
            <ShieldAlert className="h-4 w-4" /> Croonbox Admin
          </span>
          <nav className="flex shrink-0 gap-4 whitespace-nowrap text-sm text-slate-300 sm:gap-6">
            {navItems.map((item) => (
              <Link key={item.href} href={item.href} className="transition-colors hover:text-white">
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8">{children}</main>
    </div>
  );
}
