"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { LayoutDashboard, Briefcase, Users, Settings, Video, BarChart3, UsersRound, CreditCard } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/jobs", label: "Jobs", icon: Briefcase },
  { href: "/candidates", label: "Candidates", icon: Users },
  { href: "/reports", label: "Reports", icon: BarChart3 },
  { href: "/settings?tab=team", label: "Team", icon: UsersRound, matchTab: "team" },
  { href: "/settings?tab=billing", label: "Billing", icon: CreditCard, matchTab: "billing" },
  { href: "/settings", label: "Settings", icon: Settings, matchTab: "profile" },
];

export function AppSidebar({ organizationName }: { organizationName: string }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentTab = searchParams.get("tab") ?? "profile";

  return (
    <aside className="hidden w-64 shrink-0 bg-navy text-navy-foreground md:flex md:flex-col">
      <div className="flex h-16 items-center gap-2 border-b border-white/10 px-6 font-semibold text-white">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          <Video className="h-4 w-4" />
        </span>
        Croonbox
      </div>

      <nav className="flex-1 space-y-1 px-3 py-4">
        {navItems.map((item) => {
          // The three /settings entries share a pathname, so they're disambiguated by ?tab= instead.
          const active =
            item.matchTab !== undefined
              ? pathname === "/settings" && currentTab === item.matchTab
              : pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                active ? "bg-primary text-primary-foreground" : "text-slate-300 hover:bg-white/5 hover:text-white",
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="truncate border-t border-white/10 px-6 py-4 text-xs text-slate-400">{organizationName}</div>
    </aside>
  );
}
