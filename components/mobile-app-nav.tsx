"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Suspense } from "react";
import { APP_NAV_ITEMS, isAppNavItemActive } from "@/components/app-nav";
import { UserMenu } from "@/components/auth/user-menu";
import { cn } from "@/lib/utils";

function MobileAppNavInner() {
  const pathname = usePathname();

  return (
    <nav className="border-b border-black/10 bg-white px-4 py-2 dark:border-white/10 dark:bg-black md:hidden">
      <div className="flex items-center justify-between gap-3">
        <div className="flex gap-2 overflow-x-auto">
          {APP_NAV_ITEMS.map((item) => {
            const active = isAppNavItemActive(pathname, item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "inline-flex shrink-0 items-center gap-2 rounded-full px-3 py-2 text-sm font-medium",
                  active
                    ? "bg-black text-white dark:bg-white dark:text-black"
                    : "bg-zinc-100 text-zinc-700 dark:bg-white/10 dark:text-zinc-200",
                )}
              >
                <Icon className="size-4" />
                {item.label}
              </Link>
            );
          })}
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <UserMenu compact />
        </div>
      </div>
    </nav>
  );
}

export function MobileAppNav() {
  return (
    <Suspense fallback={null}>
      <MobileAppNavInner />
    </Suspense>
  );
}
