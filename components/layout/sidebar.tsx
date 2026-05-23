"use client";
import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useUser } from "@/hooks/use-user";
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
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/spares", label: "Spares Register", icon: Package, exact: true },
  { href: "/abb", label: "ABB Register", icon: Package },
  { href: "/takraf", label: "TAKRAF Register", icon: Package },
  { href: "/construction", label: "Construction Register", icon: HardHat },
  { href: "/transactions", label: "Transactions", icon: ArrowRightLeft },
  { href: "/preservation", label: "Preservation", icon: Shield },
];

const adminItems = [
  { href: "/admin/users", label: "Users", icon: Users },
  { href: "/admin/audit", label: "Audit Trail", icon: ClipboardList },
];

const roleBadgeColor: Record<string, string> = {
  admin: "#dc2626",
  editor: "#2563eb",
  viewer: "#6b7280",
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
  const [hovered, setHovered] = useState(false);
  return (
    <Link
      href={href}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: "flex",
        alignItems: "center",
        gap: "12px",
        padding: "10px 12px",
        borderRadius: "6px",
        fontSize: "14px",
        textDecoration: "none",
        transition: "background-color 0.15s, color 0.15s",
        backgroundColor: active ? "#B45309" : hovered ? "rgba(255,255,255,0.1)" : "transparent",
        color: active ? "#ffffff" : "rgba(255,255,255,0.7)",
        fontWeight: active ? "500" : "normal",
      }}
    >
      <Icon style={{ width: "16px", height: "16px", flexShrink: 0 }} />
      {label}
    </Link>
  );
}

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { profile } = useUser();
  const [signOutHovered, setSignOutHovered] = useState(false);

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
  }

  return (
    <aside
      style={{ backgroundColor: "#0F1117", width: "256px", flexShrink: 0 }}
      className="flex flex-col h-screen text-white"
    >
      {/* Logo */}
      <div
        style={{ borderBottom: "1px solid rgba(255,255,255,0.1)" }}
        className="flex items-center gap-3 px-5 py-5"
      >
        <div
          style={{
            backgroundColor: "#B45309",
            width: "32px",
            height: "32px",
            borderRadius: "6px",
            flexShrink: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <HardHat style={{ width: "20px", height: "20px", color: "white" }} />
        </div>
        <div>
          <div style={{ fontSize: "14px", fontWeight: "bold", color: "white" }}>SIMANDOU MRP</div>
          <div
            style={{
              fontSize: "10px",
              color: "rgba(255,255,255,0.5)",
              textTransform: "uppercase",
              letterSpacing: "0.1em",
            }}
          >
            Materials Management
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav
        style={{ padding: "16px 12px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "2px" }}
        className="flex-1"
      >
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
            <div style={{ paddingTop: "16px", paddingBottom: "4px", paddingLeft: "12px" }}>
              <p
                style={{
                  fontSize: "10px",
                  color: "rgba(255,255,255,0.3)",
                  textTransform: "uppercase",
                  letterSpacing: "0.1em",
                  fontWeight: "500",
                  margin: 0,
                }}
              >
                Administration
              </p>
            </div>
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
      <div style={{ borderTop: "1px solid rgba(255,255,255,0.1)", padding: "12px" }}>
        {profile && (
          <div style={{ padding: "8px 12px", marginBottom: "8px" }}>
            <div
              style={{
                fontSize: "14px",
                fontWeight: "500",
                color: "white",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {profile.full_name ?? profile.email}
            </div>
            <span
              style={{
                display: "inline-block",
                marginTop: "4px",
                fontSize: "10px",
                textTransform: "uppercase",
                letterSpacing: "0.1em",
                fontWeight: "600",
                padding: "2px 8px",
                borderRadius: "4px",
                backgroundColor: roleBadgeColor[profile.role] ?? "#6b7280",
                color: "white",
              }}
            >
              {profile.role}
            </span>
          </div>
        )}
        <button
          onClick={handleSignOut}
          onMouseEnter={() => setSignOutHovered(true)}
          onMouseLeave={() => setSignOutHovered(false)}
          style={{
            width: "100%",
            display: "flex",
            alignItems: "center",
            gap: "12px",
            padding: "10px 12px",
            borderRadius: "6px",
            fontSize: "14px",
            backgroundColor: signOutHovered ? "rgba(255,255,255,0.1)" : "transparent",
            color: signOutHovered ? "white" : "rgba(255,255,255,0.7)",
            border: "none",
            cursor: "pointer",
            transition: "background-color 0.15s, color 0.15s",
          }}
        >
          <LogOut style={{ width: "16px", height: "16px" }} />
          Sign Out
        </button>
      </div>
    </aside>
  );
}
