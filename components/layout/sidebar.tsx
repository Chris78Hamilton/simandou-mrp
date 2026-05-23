"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useUser } from "@/hooks/use-user";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Package,
  ArrowRightLeft,
  Shield,
  Users,
  ClipboardList,
  LogOut,
  HardHat,
} from "lucide-react";

const navItems = [
  { href: "/dashboard",     label: "Dashboard",           icon: LayoutDashboard },
  { href: "/spares",        label: "Spares Register",     icon: Package, exact: true },
  { href: "/abb",           label: "ABB Register",        icon: Package },
  { href: "/takraf",        label: "TAKRAF Register",     icon: Package },
  { href: "/construction",  label: "Construction Register", icon: HardHat },
  { href: "/transactions",  label: "Transactions",        icon: ArrowRightLeft },
  { href: "/preservation",  label: "Preservation",        icon: Shield },
];

const adminItems = [
  { href: "/admin/users", label: "Users",       icon: Users },
  { href: "/admin/audit", label: "Audit Trail", icon: ClipboardList },
];

const roleBadgeClass: Record<string, string> = {
  admin:  "bg-red-600",
  editor: "bg-blue-600",
  viewer: "bg-gray-500",
};

function isActive(itemHref: string, pathname: string, exact?: boolean) {
  if (exact) return pathname === itemHref || pathname.startsWith(itemHref + "/");
  return pathname.startsWith(itemHref);
}

interface NavLinkItemProps {
  href: string;
  label: string;
  icon: React.ElementType;
  active: boolean;
}

function NavLinkItem({ href, label, icon: Icon, active }: NavLinkItemProps) {
  return (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-3 px-3 py-2.5 rounded-md text-sm transition-colors",
        active
          ? "bg-brand text-white font-medium"
          : "text-white/70 hover:bg-white/10 hover:text-white"
      )}
    >
      <Icon className="w-4 h-4 shrink-0" />
      {label}
    </Link>
  );
}

export function Sidebar() {
  const pathname = usePathname();
  const router  = useRouter();
  const { profile } = useUser();

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
  }

  return (
    <aside className="flex flex-col h-screen w-64 shrink-0 bg-sidebar text-white">

      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-5 border-b border-white/10">
        <div className="w-8 h-8 shrink-0 rounded-md bg-brand flex items-center justify-center">
          <HardHat className="w-5 h-5 text-white" />
        </div>
        <div>
          <div className="text-sm font-bold text-white">SIMANDOU MRP</div>
          <div className="text-[10px] text-white/50 uppercase tracking-widest">Materials Management</div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 flex flex-col gap-0.5">
        {navItems.map((item) => (
          <NavLinkItem
            key={item.href}
            href={item.href}
            label={item.label}
            icon={item.icon}
            active={isActive(item.href, pathname, item.exact)}
          />
        ))}

        {profile?.role === "admin" && (
          <>
            <p className="px-3 pt-4 pb-1 text-[10px] text-white/30 uppercase tracking-widest font-medium">
              Administration
            </p>
            {adminItems.map((item) => (
              <NavLinkItem
                key={item.href}
                href={item.href}
                label={item.label}
                icon={item.icon}
                active={pathname.startsWith(item.href)}
              />
            ))}
          </>
        )}
      </nav>

      {/* User + sign out */}
      <div className="border-t border-white/10 p-3">
        {profile && (
          <div className="px-3 py-2 mb-2">
            <div className="text-sm font-medium text-white truncate">
              {profile.full_name ?? profile.email}
            </div>
            <span className={cn(
              "inline-block mt-1 text-[10px] uppercase tracking-widest font-semibold px-2 py-0.5 rounded text-white",
              roleBadgeClass[profile.role] ?? "bg-gray-500"
            )}>
              {profile.role}
            </span>
          </div>
        )}
        <button
          onClick={handleSignOut}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-sm text-white/70 hover:bg-white/10 hover:text-white transition-colors"
        >
          <LogOut className="w-4 h-4" />
          Sign Out
        </button>
      </div>
    </aside>
  );
}
