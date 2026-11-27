import { LayoutDashboard, PlusCircle } from "lucide-react";

export const APP_NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/invoices/new", label: "Create invoice", icon: PlusCircle },
] as const;

export function isAppNavItemActive(pathname: string, href: string): boolean {
  if (href === "/invoices/new") {
    return pathname === href;
  }
  return (
    pathname === "/invoices" ||
    (pathname.startsWith("/invoices/") && pathname !== "/invoices/new") ||
    pathname === "/dashboard"
  );
}
