# Admin Panel Phase 2 — UI Redesign

**Codex prompt:** "Implement all tasks in `docs/features/admin-phase-2-ui.md`. Read the file fully before starting. Run `pnpm lint && pnpm tsc --noEmit` after completing all tasks."

**Requires:** Phase 1 complete first.

---

## Responsive Design Rules (apply everywhere in this phase)

Every component and page must work correctly at all 4 breakpoints:

| Breakpoint | Width | Device |
|---|---|---|
| Mobile | < 640px | iPhone, small Android |
| Tablet | 640px–1023px | iPad, large phone landscape |
| Laptop | 1024px–1279px | 13" laptop |
| Desktop | ≥ 1280px | External monitor, large laptop |

**Grid rules:**
- 4-column stat grid: `grid-cols-1 sm:grid-cols-2 lg:grid-cols-4`
- 3-column secondary cards: `grid-cols-1 md:grid-cols-2 lg:grid-cols-3`
- 2-column side-by-side: `grid-cols-1 lg:grid-cols-2`
- Quick actions (2-col icon cards): `grid-cols-2 sm:grid-cols-3 lg:grid-cols-6` OR keep `grid-cols-2` — fine on all sizes
- Dashboard body wrapper: `space-y-4 sm:space-y-6`

**Card padding:**
- All cards: `p-4 sm:p-6` (not a flat `p-6` on mobile — too tight)

**Typography:**
- Page title: `text-lg sm:text-xl font-bold`
- Stat number: `text-2xl sm:text-3xl font-bold`
- Section heading: `text-sm font-semibold`

**Table responsiveness:**
- All pages using `EnhancedTable` MUST pass `mobileCardView={true}` and implement `renderMobileCard` if not already present
- On mobile, tables collapse to card stacks — the `EnhancedTable` component already supports this via `renderMobileCard` prop

**Button + input responsiveness:**
- Action buttons in page headers: `w-full sm:w-auto`
- Inputs in modals/forms: always `w-full`

**AdminPageLayout padding:**
- Topbar: `px-4 sm:px-6`
- Body: `px-4 sm:px-6 py-4 sm:py-6`

**Sidebar:**
- Desktop (≥ 1024px): fixed 256px sidebar, `margin-left: 256px` on main
- Tablet (768px–1023px): fixed 240px sidebar, `margin-left: 240px`
- Mobile (< 768px): hidden sidebar, 58px top bar, slide-in drawer on hamburger tap

---

## Design Reference

Target: Dasher minimal SaaS admin dashboard aesthetic.
GoodHive brand color is `#FFC905` (yellow). Use it as the accent everywhere.

```
Design tokens:
  Page background:   #f4f6f8
  Sidebar bg:        #ffffff
  Card bg:           #ffffff
  Card border:       #e5e7eb  (or border-gray-200)
  Card shadow:       0 1px 3px rgba(0,0,0,0.06)
  Accent:            #FFC905
  Accent light bg:   rgba(255,201,5,0.12)
  Accent text:       #8a6d00
  Text primary:      #111827
  Text secondary:    #6b7280
  Text muted:        #9ca3af
  Card radius:       rounded-2xl  (16px)
  Button radius:     rounded-lg   (8px)
  Badge radius:      rounded-full

Icon tint palettes (for stat cards):
  blue:   bg #eff6ff  icon #2563eb
  green:  bg #f0fdf4  icon #16a34a
  yellow: bg #fefce8  icon #d97706
  purple: bg #f5f3ff  icon #7c3aed
  red:    bg #fef2f2  icon #dc2626
  orange: bg #fff7ed  icon #ea580c
```

---

## UI-001 — Sidebar: Full Replacement [HIGHEST IMPACT]

**Files:**
- `app/components/Sidebar/Sidebar.module.css` — full replacement
- `app/components/Sidebar/Sidebar.tsx` — full replacement

### What changes (vs current)
- Logo: GoodHive honeycomb hex SVG in yellow rounded square + "GoodHive" text + "Admin" pill badge
- Nav grouped into sections with uppercase labels: (none), Approvals, Management, System
- Payouts added to Management group (currently missing)
- Active state: yellow tint pill (already works, keep same logic)
- Bottom: Settings + Support + Logout + Admin card with avatar initials + email
- Admin card reads email from `localStorage.getItem("admin_email")` (set by login page in Phase 1)
- Mobile: 58px top bar, slide-in drawer, dark backdrop

### New `Sidebar.module.css` — paste this entire file:

```css
/* ─── Layout ──────────────────────────────────────────────── */
.layout {
  display: flex;
  min-height: 100vh;
  background: #f4f6f8;
}

/* ─── Sidebar ─────────────────────────────────────────────── */
.sidebar {
  --accent:       #ffc905;
  --accent-light: rgba(255, 201, 5, 0.12);
  --accent-text:  #8a6d00;
  --text-primary: #111827;
  --text-muted:   #6b7280;
  --border:       #e5e7eb;

  position: fixed;
  top: 0; left: 0;
  width: 256px;
  height: 100vh;
  background: #ffffff;
  display: flex;
  flex-direction: column;
  border-right: 1px solid var(--border);
  z-index: 40;
  transition: transform 0.25s ease;
}

/* ─── Logo / Header ───────────────────────────────────────── */
.sidebarHeader {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 20px 20px 16px;
  border-bottom: 1px solid var(--border);
  flex-shrink: 0;
}

.logoMark {
  width: 34px; height: 34px;
  background: var(--accent);
  border-radius: 8px;
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
}
.logoMark svg { width: 20px; height: 20px; color: #000; }

.logoText {
  font-size: 1rem;
  font-weight: 700;
  color: var(--text-primary);
  letter-spacing: -0.02em;
}

.logoBadge {
  font-size: 0.6rem;
  font-weight: 700;
  background: var(--accent);
  color: #000;
  padding: 2px 6px;
  border-radius: 4px;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  align-self: flex-start;
  margin-top: 2px;
}

/* ─── Scrollable nav ──────────────────────────────────────── */
.sidebarContent {
  flex: 1;
  overflow-y: auto;
  scrollbar-width: none;
  padding: 14px 10px;
}
.sidebarContent::-webkit-scrollbar { display: none; }

/* ─── Nav section ─────────────────────────────────────────── */
.navSection { margin-bottom: 18px; }

.sectionLabel {
  font-size: 0.68rem;
  font-weight: 600;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.08em;
  padding: 0 10px 6px;
  display: block;
}

.navList {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

/* ─── Nav item ────────────────────────────────────────────── */
.navItem {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 9px 10px;
  border-radius: 8px;
  color: var(--text-muted);
  font-size: 0.875rem;
  font-weight: 500;
  text-decoration: none;
  transition: background 0.15s, color 0.15s;
  cursor: pointer;
  border: none;
  background: none;
  width: 100%;
  text-align: left;
}
.navItem:hover { background: #f3f4f6; color: var(--text-primary); }
.navItem:hover .navIcon { color: var(--text-primary); }

.navItemActive {
  background: var(--accent-light) !important;
  color: var(--accent-text) !important;
  font-weight: 600;
}
.navItemActive .navIcon { color: var(--accent-text) !important; }

.navIcon {
  width: 17px; height: 17px;
  flex-shrink: 0;
  color: #9ca3af;
  transition: color 0.15s;
}

.navLabel { flex: 1; white-space: nowrap; }

.navBadge {
  min-width: 20px; height: 20px;
  background: #ef4444; color: #fff;
  font-size: 0.65rem; font-weight: 700;
  border-radius: 10px;
  display: flex; align-items: center; justify-content: center;
  padding: 0 5px;
}

/* ─── Bottom section ──────────────────────────────────────── */
.bottomSection {
  border-top: 1px solid var(--border);
  padding: 12px 10px;
  flex-shrink: 0;
}

.bottomNav { display: flex; flex-direction: column; gap: 2px; margin-bottom: 12px; }

.logoutItem { color: #ef4444 !important; }
.logoutItem:hover { background: rgba(239,68,68,0.08) !important; color: #ef4444 !important; }
.logoutItem .navIcon { color: #ef4444 !important; }

/* ─── Admin card ──────────────────────────────────────────── */
.adminCard {
  display: flex; align-items: center; gap: 10px;
  padding: 10px 12px;
  background: #f9fafb;
  border-radius: 10px;
  border: 1px solid var(--border);
}

.adminAvatar {
  width: 34px; height: 34px;
  background: var(--accent);
  border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  font-size: 0.8rem; font-weight: 700; color: #000;
  flex-shrink: 0;
}

.adminInfo { flex: 1; min-width: 0; }

.adminName {
  font-size: 0.8rem; font-weight: 600; color: var(--text-primary);
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}

.adminRole { font-size: 0.7rem; color: var(--text-muted); margin-top: 1px; }

/* ─── Main content ────────────────────────────────────────── */
.mainContent { flex: 1; margin-left: 256px; min-width: 0; }
.contentWrapper { min-height: 100vh; }

/* ─── Mobile header ───────────────────────────────────────── */
.mobileHeader {
  display: none;
  position: fixed; top: 0; left: 0; right: 0;
  height: 58px; background: #fff;
  border-bottom: 1px solid var(--border);
  z-index: 50; align-items: center;
  padding: 0 16px; gap: 12px;
}

.hamburger {
  display: flex; align-items: center; justify-content: center;
  width: 36px; height: 36px;
  background: none; border: none; cursor: pointer;
  color: var(--text-primary); border-radius: 8px;
  transition: background 0.15s;
}
.hamburger:hover { background: #f3f4f6; }
.hamburgerIcon { width: 22px; height: 22px; }

.mobileTitle { font-size: 1rem; font-weight: 700; color: var(--text-primary); margin: 0; }

.backdrop {
  display: none; position: fixed; inset: 0;
  background: rgba(0,0,0,0.4); z-index: 39;
}

/* ─── Responsive ──────────────────────────────────────────── */
@media (max-width: 1024px) {
  .sidebar { width: 240px; }
  .mainContent { margin-left: 240px; }
}

@media (max-width: 768px) {
  .mobileHeader { display: flex; }
  .backdrop { display: block; }
  .sidebar { transform: translateX(-100%); width: 260px; }
  .sidebarOpen { transform: translateX(0); }
  .mainContent { margin-left: 0; padding-top: 58px; }
}
```

### New `Sidebar.tsx` — paste this entire file:

```tsx
"use client";

import React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  BarChart3, Briefcase, Building2, CreditCard,
  HelpCircle, Home, LogOut, Network,
  Settings, Shield, UserCheck, Users,
} from "lucide-react";
import toast from "react-hot-toast";
import styles from "./Sidebar.module.css";

interface SidebarProps { children?: React.ReactNode; }

type NavDef = { href: string; icon: React.ElementType; label: string; dataE2e?: string };

const mainNav: NavDef[] = [
  { href: "/admin", icon: Home, label: "Dashboard", dataE2e: "admin-dashboard-menu" },
];
const approvalNav: NavDef[] = [
  { href: "/admin/talent-approval",  icon: UserCheck, label: "Approve Talents",   dataE2e: "talent-approval-menu" },
  { href: "/admin/company-approval", icon: Building2, label: "Approve Companies", dataE2e: "company-approval-menu" },
];
const mgmtNav: NavDef[] = [
  { href: "/admin/talents",   icon: Network,   label: "All Talents",   dataE2e: "talents-menu" },
  { href: "/admin/companies", icon: Building2, label: "All Companies", dataE2e: "companies-menu" },
  { href: "/admin/users",     icon: Users,     label: "All Users",     dataE2e: "users-menu" },
  { href: "/admin/all-jobs",  icon: Briefcase, label: "All Jobs",      dataE2e: "all-jobs-menu" },
  { href: "/admin/payouts",   icon: CreditCard, label: "Payouts" },
];
const systemNav: NavDef[] = [
  { href: "/admin/manage-admins", icon: Shield,   label: "Manage Admins", dataE2e: "manage-admins-menu" },
  { href: "/admin/analytics",     icon: BarChart3, label: "Analytics",     dataE2e: "analytics-menu" },
];
const bottomNav: NavDef[] = [
  { href: "/admin/settings", icon: Settings,   label: "Settings" },
  { href: "/admin/support",  icon: HelpCircle, label: "Support" },
];

const Sidebar = ({ children }: SidebarProps) => {
  const pathname = usePathname();
  const router   = useRouter();
  const [open, setOpen]        = React.useState(false);
  const [adminEmail, setEmail] = React.useState("");

  React.useEffect(() => {
    setEmail(
      typeof window !== "undefined"
        ? (localStorage.getItem("admin_email") ?? "")
        : ""
    );
  }, []);

  if (pathname === "/admin/login") return <>{children}</>;

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
      {/* Mobile top bar */}
      <div className={styles.mobileHeader}>
        <button className={styles.hamburger} onClick={() => setOpen(!open)} aria-label="Toggle menu">
          <svg className={styles.hamburgerIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {open
              ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            }
          </svg>
        </button>
        <span className={styles.mobileTitle}>GoodHive Admin</span>
      </div>

      {open && <div className={styles.backdrop} onClick={() => setOpen(false)} />}

      <aside className={`${styles.sidebar} ${open ? styles.sidebarOpen : ""}`}>
        {/* Logo */}
        <div className={styles.sidebarHeader}>
          <div className={styles.logoMark}>
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2L4 6.5v11L12 22l8-4.5v-11L12 2zm6 14.27L12 19.9l-6-3.63V7.73L12 4.1l6 3.63v8.54z" />
            </svg>
          </div>
          <span className={styles.logoText}>GoodHive</span>
          <span className={styles.logoBadge}>Admin</span>
        </div>

        {/* Nav */}
        <div className={styles.sidebarContent}>
          <div className={styles.navSection}>
            <div className={styles.navList}>
              {mainNav.map((i) => <NavItem key={i.href} {...i} />)}
            </div>
          </div>

          <div className={styles.navSection}>
            <span className={styles.sectionLabel}>Approvals</span>
            <div className={styles.navList}>
              {approvalNav.map((i) => <NavItem key={i.href} {...i} />)}
            </div>
          </div>

          <div className={styles.navSection}>
            <span className={styles.sectionLabel}>Management</span>
            <div className={styles.navList}>
              {mgmtNav.map((i) => <NavItem key={i.href} {...i} />)}
            </div>
          </div>

          <div className={styles.navSection}>
            <span className={styles.sectionLabel}>System</span>
            <div className={styles.navList}>
              {systemNav.map((i) => <NavItem key={i.href} {...i} />)}
            </div>
          </div>
        </div>

        {/* Bottom */}
        <div className={styles.bottomSection}>
          <div className={styles.bottomNav}>
            {bottomNav.map((i) => <NavItem key={i.href} {...i} />)}
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
```

**Acceptance:** Sidebar shows GoodHive logo, grouped nav sections with labels, admin card at bottom with email initials. Active item has yellow tint. Logout calls `/api/auth/admin/logout`.

---

## UI-002 — StatCard: Full Replacement [HIGH IMPACT]

**File:** `app/components/admin/StatCard.tsx` — full replacement

Design: Large bold number on the left, icon in a tinted rounded square on the top-right. No border on the icon box — just the tinted background. `rounded-2xl` card.

```tsx
"use client";

import { LucideIcon } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: { value: number; isPositive: boolean };
  description?: string;
  color?: "blue" | "green" | "yellow" | "purple" | "red" | "orange";
}

const palette = {
  blue:   { bg: "#eff6ff", icon: "#2563eb" },
  green:  { bg: "#f0fdf4", icon: "#16a34a" },
  yellow: { bg: "#fefce8", icon: "#d97706" },
  purple: { bg: "#f5f3ff", icon: "#7c3aed" },
  red:    { bg: "#fef2f2", icon: "#dc2626" },
  orange: { bg: "#fff7ed", icon: "#ea580c" },
};

export function StatCard({ title, value, icon: Icon, trend, description, color = "blue" }: StatCardProps) {
  const { bg, icon: iconColor } = palette[color];
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-4 sm:p-5 shadow-sm hover:shadow-md transition-shadow duration-200">
      <div className="flex items-start justify-between gap-3 sm:gap-4">
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1.5 sm:mb-2">{title}</p>
          <p className="text-2xl sm:text-3xl font-bold text-gray-900 leading-none mb-1.5 sm:mb-2">{value}</p>
          {trend && (
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className={`text-xs font-semibold ${trend.isPositive ? "text-green-600" : "text-red-500"}`}>
                {trend.isPositive ? "↑" : "↓"} {Math.abs(trend.value)}
              </span>
              {description && <span className="text-xs text-gray-400">{description}</span>}
            </div>
          )}
          {description && !trend && (
            <p className="text-xs text-gray-400">{description}</p>
          )}
        </div>
        <div className="rounded-xl p-2 sm:p-2.5 flex-shrink-0" style={{ backgroundColor: bg }}>
          <Icon className="h-4 w-4 sm:h-5 sm:w-5" style={{ color: iconColor }} />
        </div>
      </div>
    </div>
  );
}
```

**Acceptance:** Stat cards show bold number left, tinted icon box top-right, no border on the icon box.

---

## UI-003 — AdminPageLayout: Add topbar + actions slot [HIGH IMPACT]

**File:** `app/components/admin/AdminPageLayout.tsx` — full replacement

Adds:
- White sticky topbar with breadcrumbs + page title + optional `actions` prop
- `#f4f6f8` page background
- Standard `px-6 py-6` body padding

```tsx
"use client";

import { ReactNode } from "react";
import { Breadcrumbs } from "./Breadcrumbs";

interface AdminPageLayoutProps {
  title: string;
  subtitle?: string;
  children: ReactNode;
  actions?: ReactNode;
  breadcrumbLabels?: Record<string, string>;
}

export function AdminPageLayout({
  title,
  subtitle,
  children,
  actions,
  breadcrumbLabels,
}: AdminPageLayoutProps) {
  return (
    <div className="min-h-screen bg-[#f4f6f8]">
      {/* White topbar */}
      <div className="bg-white border-b border-gray-100 px-4 sm:px-6 py-3 sm:py-4">
        <Breadcrumbs customLabels={breadcrumbLabels} />
        <div className="flex items-start sm:items-center justify-between mt-1 gap-3">
          <div className="min-w-0">
            <h1 className="text-lg sm:text-xl font-bold text-gray-900 leading-tight truncate">{title}</h1>
            {subtitle && (
              <p className="text-xs sm:text-sm text-gray-400 mt-0.5">{subtitle}</p>
            )}
          </div>
          {actions && (
            <div className="flex items-center gap-2 flex-shrink-0">{actions}</div>
          )}
        </div>
      </div>

      {/* Page body */}
      <div className="px-4 sm:px-6 py-4 sm:py-6 max-w-[1480px] mx-auto space-y-4 sm:space-y-6">
        {children}
      </div>
    </div>
  );
}
```

Now update all pages that use `AdminPageLayout` to pass a `actions` prop where it makes sense:

- `app/admin/page.tsx` — pass `actions={<Button onClick={fetchStatistics} variant="outline" size="sm">Refresh</Button>}`
- `app/admin/talent-approval/page.tsx` — if it has an Export or bulk action button, move it to `actions`
- `app/admin/company-approval/page.tsx` — same

**Acceptance:** Every admin page has a white topbar with title, breadcrumbs, and optional action button on the right. Page body is on `#f4f6f8` background.

---

## UI-004 — Dashboard: Visual Polish [HIGH IMPACT]

**File:** `app/admin/page.tsx`

Apply the new card + layout language throughout the dashboard.

### Card wrapper — apply to ALL secondary cards (Pending Approvals, Jobs Status, Profile Stats, Quick Actions, System Overview):

```tsx
<div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
  <div className="flex items-center justify-between mb-5">
    <h3 className="text-sm font-semibold text-gray-600 uppercase tracking-wide">{title}</h3>
    <Icon className="h-4 w-4 text-gray-300" />
  </div>
  {/* content */}
</div>
```

### Pending Approval rows — replace `bg-orange-50 rounded-lg` rows:

```tsx
<div className="flex items-center justify-between py-3.5 border-b border-gray-50 last:border-0">
  <div className="flex items-center gap-3">
    <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-content-center flex items-center justify-center">
      <UserCheck className="h-4 w-4 text-amber-600" />
    </div>
    <span className="text-sm font-medium text-gray-700">Talents</span>
  </div>
  <div className="flex items-center gap-3">
    <span className="text-2xl font-bold text-gray-900">{statistics.approvals.pendingTalents}</span>
    <Link href="/admin/talent-approval">
      <button className="text-xs font-semibold text-[#8a6d00] bg-[rgba(255,201,5,0.12)] px-3 py-1.5 rounded-lg hover:bg-[rgba(255,201,5,0.2)] transition-colors whitespace-nowrap">
        Review
      </button>
    </Link>
  </div>
</div>
```

Repeat for Companies row (same pattern, use `Building2` icon with `text-amber-600`).

### Quick Actions grid — replace Button grid with icon-card grid:

```tsx
<div className="grid grid-cols-2 gap-3">
  {[
    { href: "/admin/talent-approval",  icon: UserCheck, label: "Approve Talents",   bg: "bg-blue-50",   text: "text-blue-600" },
    { href: "/admin/company-approval", icon: Building2, label: "Approve Companies", bg: "bg-purple-50", text: "text-purple-600" },
    { href: "/admin/talents",          icon: Users,     label: "All Talents",       bg: "bg-green-50",  text: "text-green-600" },
    { href: "/admin/companies",        icon: Building2, label: "All Companies",     bg: "bg-orange-50", text: "text-orange-600" },
    { href: "/admin/all-jobs",         icon: Briefcase, label: "All Jobs",          bg: "bg-yellow-50", text: "text-yellow-600" },
    { href: "/admin/users",            icon: Users,     label: "All Users",         bg: "bg-red-50",    text: "text-red-600" },
  ].map(({ href, icon: Icon, label, bg, text }) => (
    <Link key={href} href={href as any}>
      <div className="flex flex-col items-center gap-2.5 p-4 rounded-xl border border-gray-100 hover:border-gray-200 hover:shadow-sm transition-all cursor-pointer group">
        <div className={`w-10 h-10 ${bg} rounded-xl flex items-center justify-center group-hover:scale-105 transition-transform`}>
          <Icon className={`h-5 w-5 ${text}`} />
        </div>
        <span className="text-xs font-medium text-gray-600 text-center leading-tight">{label}</span>
      </div>
    </Link>
  ))}
</div>
```

### System Overview rows — update the `bg-gray-50 rounded-lg` rows to use the same row pattern (no bg, just border-b dividers):

```tsx
<div className="flex items-center justify-between py-3.5 border-b border-gray-50 last:border-0">
  <div className="flex items-center gap-3">
    <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center">
      <Shield className="h-4 w-4 text-gray-500" />
    </div>
    <span className="text-sm font-medium text-gray-700">Total Admins</span>
  </div>
  <span className="text-xl font-bold text-gray-900">{statistics.overview.totalAdmins}</span>
</div>
```

**Acceptance:** Dashboard looks clean — white rounded-2xl cards, tinted icon rows, icon-card quick actions grid.

---

## UI-005 — Login Page: Redesign [MEDIUM IMPACT]

**File:** `app/admin/login/page.tsx`

Redesign to a centered card on gray background.

Replace the outer wrapper and card structure:

```tsx
// Outer container:
<div className="min-h-screen bg-[#f4f6f8] flex items-center justify-center p-4">
  <div className="w-full max-w-sm">
    {/* Logo */}
    <div className="flex items-center justify-center gap-3 mb-8">
      <div className="w-10 h-10 bg-[#FFC905] rounded-xl flex items-center justify-center">
        <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6 text-black">
          <path d="M12 2L4 6.5v11L12 22l8-4.5v-11L12 2zm6 14.27L12 19.9l-6-3.63V7.73L12 4.1l6 3.63v8.54z" />
        </svg>
      </div>
      <span className="text-xl font-bold text-gray-900">GoodHive Admin</span>
    </div>

    {/* Card */}
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
      <h2 className="text-lg font-bold text-gray-900 mb-1">Sign in</h2>
      <p className="text-sm text-gray-400 mb-6">Access your admin dashboard</p>

      {/* Keep existing form fields but update className: */}
      {/* Input className: "w-full h-11 rounded-xl border border-gray-200 px-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#FFC905] focus:border-transparent" */}
      {/* Submit button className: "w-full h-11 bg-[#FFC905] hover:bg-[#e6b400] text-black font-semibold rounded-xl transition-colors" */}
    </div>
  </div>
</div>
```

Keep all the existing form logic (state, submit handler, error display) unchanged — only update the visual wrapper and className strings.

**Acceptance:** Login page is a centered white card on gray background with GoodHive logo above the card.

---

## UI-006 — Table & Badge Styling [MEDIUM IMPACT]

**File:** `app/components/admin/EnhancedTable.tsx`

Update className strings throughout:

**Table container wrapper** — find the outermost table wrapper div and ensure it has:
```tsx
className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden"
```

**`<thead>`:**
```tsx
className="bg-gray-50 border-b border-gray-100"
```

**`<th>` cells:**
```tsx
className="text-xs font-semibold text-gray-500 uppercase tracking-wide py-3 px-4 text-left"
```

**`<tbody> <tr>` rows:**
```tsx
className="hover:bg-gray-50 transition-colors border-b border-gray-50 last:border-0"
```

**`<td>` cells:**
```tsx
className="text-sm text-gray-700 py-3 px-4"
```

**Status badge helper** — find wherever status badges are rendered (search for `Badge` component or inline badge spans) and apply this consistent pattern:

```tsx
// Utility — create a helper getStatusBadge(status: string) or apply inline:
const badgeClasses: Record<string, string> = {
  approved:   "bg-green-50 text-green-700",
  active:     "bg-green-50 text-green-700",
  published:  "bg-blue-50 text-blue-700",
  pending:    "bg-amber-50 text-amber-700",
  in_review:  "bg-amber-50 text-amber-700",
  deferred:   "bg-gray-100 text-gray-600",
  rejected:   "bg-red-50 text-red-700",
  unpublished:"bg-gray-100 text-gray-500",
};

// Badge JSX:
<span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${badgeClasses[status] ?? "bg-gray-100 text-gray-600"}`}>
  {status.replace(/_/g, " ")}
</span>
```

Apply this badge pattern in these files too:
- `app/admin/talent-approval/page.tsx`
- `app/admin/company-approval/page.tsx`
- `app/admin/talents/page.tsx`
- `app/admin/companies/page.tsx`

**Acceptance:** All admin tables have rounded-2xl white card wrapper, clean header, and pill status badges.

---

## UI-007 — Page Background Consistency [LOW EFFORT]

**Scope:** Find any admin page that sets its own background color on the outer container and ensure it's consistent with `#f4f6f8`. Since `AdminPageLayout` now handles this, per-page fixes are minimal.

Search for and update in these specific files:
- Any `className="min-h-screen bg-white"` outer div in admin pages → change `bg-white` to `bg-[#f4f6f8]`
- Any `className="p-6 bg-white"` or `className="p-8 bg-gray-50"` outer wrapper → let `AdminPageLayout` handle padding instead

Files most likely to need this:
- `app/admin/analytics/page.tsx` — check if outer div has `bg-white` or `bg-gray-50`
- `app/admin/company/[user_id]/page.tsx`
- `app/admin/talent/[user_id]/page.tsx`

**Acceptance:** All admin pages share the same `#f4f6f8` page background. No jarring white-to-gray transitions between pages.

---

## UI-008 — Responsive Grid & Spacing Fix (apply to ALL admin pages) [REQUIRED]

The responsive design rules at the top of this file apply everywhere. Here is the exact grid structure to use on each page — Codex must apply these responsive classes even if the current classes differ.

### `app/admin/page.tsx` (Dashboard)
```
Outer body wrapper:        space-y-4 sm:space-y-6
Stat cards grid:           grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6
Secondary 3-col grid:      grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6
Bottom 2-col grid:         grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6
Card padding:              p-4 sm:p-6
Quick actions inner grid:  grid grid-cols-2 gap-3  (2-col always — fine on all sizes)
Pending row layout:        flex items-center justify-between (flex never stacks)
Review button:             whitespace-nowrap (never wraps)
```

### `app/admin/talent-approval/page.tsx`
```
Page body:                 space-y-4 sm:space-y-6
EnhancedTable:             mobileCardView={true} required — implement renderMobileCard showing name, status, date, action button stacked in a card
Filter bar:                flex-col sm:flex-row gap-2
Bulk action buttons:       w-full sm:w-auto
```

### `app/admin/company-approval/page.tsx`
```
Same responsive requirements as talent-approval above
```

### `app/admin/talents/page.tsx`
```
EnhancedTable:             mobileCardView={true} — renderMobileCard shows name, email, status, phone stacked
Filter/search bar:         flex-col sm:flex-row gap-2
Export button:             w-full sm:w-auto
```

### `app/admin/companies/page.tsx`
```
Same as talents page above
```

### `app/admin/users/page.tsx`
```
EnhancedTable:             mobileCardView={true} — renderMobileCard shows email, roles, joined date
```

### `app/admin/all-jobs/page.tsx`
```
EnhancedTable:             mobileCardView={true} — renderMobileCard shows title, company, status, budget
```

### `app/admin/analytics/page.tsx`
```
Charts grid:               grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6
Date range inputs:         flex-col sm:flex-row gap-2
Report generator button:   w-full sm:w-auto
```

### `app/admin/settings/page.tsx`
```
Settings sections:         space-y-4 sm:space-y-6
Form rows:                 flex-col sm:flex-row gap-3
Toggle rows:               flex items-center justify-between (never stacks)
Save button:               w-full sm:w-auto
```

### `app/admin/manage-admins/page.tsx`
```
EnhancedTable:             mobileCardView={true}
Add admin form:            flex-col gap-3 (inputs stack on all sizes — fine)
```

### `app/admin/payouts/page.tsx`
```
Stats row (if any):        grid grid-cols-1 sm:grid-cols-3 gap-4
Table:                     mobileCardView={true} — renderMobileCard shows talent, amount, status, date
```

### `app/admin/company/[user_id]/page.tsx`
```
Two-column layout:         grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6
Detail sections:           space-y-4 sm:space-y-6
Edit button:               w-full sm:w-auto
```

### `app/admin/talent/[user_id]/page.tsx`
```
Same two-column layout as company detail above
```

### `app/admin/login/page.tsx`
```
Outer:                     min-h-screen flex items-center justify-center p-4
Card:                      w-full max-w-sm  (fits any screen, centered)
Card padding:              p-6 sm:p-8
Inputs:                    w-full h-11
Submit button:             w-full h-11
```

---

## Final checklist before marking Phase 2 complete

### Components
- [ ] Sidebar: GoodHive logo, grouped nav with section labels, admin card at bottom
- [ ] Sidebar: active state = yellow tint, correct hover states
- [ ] Sidebar: Payouts link in Management section
- [ ] Sidebar: 256px desktop → 240px tablet → drawer on mobile with 58px top bar
- [ ] StatCard: bold number left, tinted icon box right, `p-4 sm:p-5`, `text-2xl sm:text-3xl`
- [ ] AdminPageLayout: white topbar `px-4 sm:px-6`, body `px-4 sm:px-6 py-4 sm:py-6`
- [ ] AdminPageLayout: title + breadcrumbs + optional actions slot

### Pages
- [ ] Dashboard: `grid-cols-1 sm:grid-cols-2 lg:grid-cols-4` stat grid; `grid-cols-1 md:grid-cols-2 lg:grid-cols-3` secondary; icon-card quick actions
- [ ] Dashboard: rounded-2xl cards with `p-4 sm:p-6`, tinted icon rows, no bg-orange-50 rows
- [ ] Login: centered card on `#f4f6f8`, `max-w-sm w-full`, GoodHive logo above
- [ ] Talent approval: `mobileCardView={true}` on table
- [ ] Company approval: `mobileCardView={true}` on table
- [ ] Talents list: `mobileCardView={true}` on table
- [ ] Companies list: `mobileCardView={true}` on table
- [ ] Users list: `mobileCardView={true}` on table
- [ ] All jobs: `mobileCardView={true}` on table
- [ ] Payouts: wrapped in `AdminPageLayout`, `mobileCardView={true}` on table
- [ ] Analytics: `grid-cols-1 lg:grid-cols-2` chart grid
- [ ] All pages: consistent `#f4f6f8` background

### Global
- [ ] All tables have rounded-2xl wrapper, clean header, pill status badges
- [ ] No flat `p-6` without responsive variant — always `p-4 sm:p-6`
- [ ] No `w-full` buttons in headers without `sm:w-auto` variant
- [ ] `pnpm lint` passes
- [ ] `pnpm tsc --noEmit` passes
