"use client";

import React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  BarChart3,
  Briefcase,
  Building2,
  CreditCard,
  HelpCircle,
  Home,
  LogOut,
  Network,
  Settings,
  Shield,
  UserCheck,
  Users,
} from "lucide-react";
import toast from "react-hot-toast";
import styles from "./Sidebar.module.css";

interface SidebarProps {
  children?: React.ReactNode;
}

type NavDef = {
  href: string;
  icon: React.ElementType;
  label: string;
  dataE2e?: string;
};

const mainNav: NavDef[] = [
  {
    href: "/admin",
    icon: Home,
    label: "Dashboard",
    dataE2e: "admin-dashboard-menu",
  },
];

const approvalNav: NavDef[] = [
  {
    href: "/admin/talent-approval",
    icon: UserCheck,
    label: "Approve Talents",
    dataE2e: "talent-approval-menu",
  },
  {
    href: "/admin/company-approval",
    icon: Building2,
    label: "Approve Companies",
    dataE2e: "company-approval-menu",
  },
];

const managementNav: NavDef[] = [
  {
    href: "/admin/talents",
    icon: Network,
    label: "All Talents",
    dataE2e: "talents-menu",
  },
  {
    href: "/admin/companies",
    icon: Building2,
    label: "All Companies",
    dataE2e: "companies-menu",
  },
  {
    href: "/admin/users",
    icon: Users,
    label: "All Users",
    dataE2e: "users-menu",
  },
  {
    href: "/admin/all-jobs",
    icon: Briefcase,
    label: "All Jobs",
    dataE2e: "all-jobs-menu",
  },
  {
    href: "/admin/payouts",
    icon: CreditCard,
    label: "Payouts",
    dataE2e: "payouts-menu",
  },
];

const systemNav: NavDef[] = [
  {
    href: "/admin/manage-admins",
    icon: Shield,
    label: "Manage Admins",
    dataE2e: "manage-admins-menu",
  },
  {
    href: "/admin/analytics",
    icon: BarChart3,
    label: "Analytics",
    dataE2e: "analytics-menu",
  },
];

const bottomNav: NavDef[] = [
  { href: "/admin/settings", icon: Settings, label: "Settings" },
  { href: "/admin/support", icon: HelpCircle, label: "Support" },
];

const Sidebar = ({ children }: SidebarProps) => {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [adminEmail, setAdminEmail] = React.useState("");

  React.useEffect(() => {
    setAdminEmail(
      typeof window !== "undefined"
        ? (localStorage.getItem("admin_email") ?? "")
        : "",
    );
  }, []);

  if (pathname === "/admin/login") {
    return <>{children}</>;
  }

  const handleLogout = async () => {
    await fetch("/api/auth/admin/logout", { method: "POST" });
    localStorage.removeItem("admin_email");
    toast.success("Logged out successfully");
    router.push("/admin/login");
  };

  const isActive = (href: string) =>
    href === "/admin"
      ? pathname === "/admin" || pathname === "/admin/"
      : pathname === href || pathname.startsWith(href + "/");

  const initials = adminEmail ? adminEmail.slice(0, 2).toUpperCase() : "AD";

  const NavItem = ({ href, icon: Icon, label, dataE2e }: NavDef) => (
    <Link
      href={href as any}
      data-e2e={dataE2e}
      className={`${styles.navItem} ${isActive(href) ? styles.navItemActive : ""}`}
      onClick={() => setOpen(false)}
    >
      <Icon className={styles.navIcon} />
      <span className={styles.navLabel}>{label}</span>
    </Link>
  );

  return (
    <div className={styles.layout}>
      <div className={styles.mobileHeader}>
        <button
          className={styles.hamburger}
          onClick={() => setOpen(!open)}
          aria-label="Toggle menu"
        >
          <svg
            className={styles.hamburgerIcon}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            {open ? (
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            ) : (
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h16"
              />
            )}
          </svg>
        </button>
        <span className={styles.mobileTitle}>GoodHive Admin</span>
      </div>

      {open && <div className={styles.backdrop} onClick={() => setOpen(false)} />}

      <aside className={`${styles.sidebar} ${open ? styles.sidebarOpen : ""}`}>
        <div className={styles.sidebarHeader}>
          <div className={styles.logoMark}>
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2L4 6.5v11L12 22l8-4.5v-11L12 2zm6 14.27L12 19.9l-6-3.63V7.73L12 4.1l6 3.63v8.54z" />
            </svg>
          </div>
          <span className={styles.logoText}>GoodHive</span>
          <span className={styles.logoBadge}>Admin</span>
        </div>

        <div className={styles.sidebarContent}>
          <div className={styles.navSection}>
            <div className={styles.navList}>
              {mainNav.map((item) => (
                <NavItem key={item.href} {...item} />
              ))}
            </div>
          </div>

          <div className={styles.navSection}>
            <span className={styles.sectionLabel}>Approvals</span>
            <div className={styles.navList}>
              {approvalNav.map((item) => (
                <NavItem key={item.href} {...item} />
              ))}
            </div>
          </div>

          <div className={styles.navSection}>
            <span className={styles.sectionLabel}>Management</span>
            <div className={styles.navList}>
              {managementNav.map((item) => (
                <NavItem key={item.href} {...item} />
              ))}
            </div>
          </div>

          <div className={styles.navSection}>
            <span className={styles.sectionLabel}>System</span>
            <div className={styles.navList}>
              {systemNav.map((item) => (
                <NavItem key={item.href} {...item} />
              ))}
            </div>
          </div>
        </div>

        <div className={styles.bottomSection}>
          <div className={styles.bottomNav}>
            {bottomNav.map((item) => (
              <NavItem key={item.href} {...item} />
            ))}
            <button
              onClick={handleLogout}
              className={`${styles.navItem} ${styles.logoutItem}`}
            >
              <LogOut className={styles.navIcon} />
              <span className={styles.navLabel}>Logout</span>
            </button>
          </div>

          <div className={styles.adminCard}>
            <div className={styles.adminAvatar}>{initials}</div>
            <div className={styles.adminInfo}>
              <p className={styles.adminName}>{adminEmail || "Administrator"}</p>
              <p className={styles.adminRole}>Admin</p>
            </div>
          </div>
        </div>
      </aside>

      <main className={styles.mainContent}>
        <div className={styles.contentWrapper}>{children}</div>
      </main>
    </div>
  );
};

export default Sidebar;
