# Admin Panel Phase 1 — Bug Fixes

**Codex prompt:** "Implement all tasks in `docs/features/admin-phase-1-fixes.md`. Read the file fully before starting. Run `pnpm lint && pnpm tsc --noEmit` after completing all tasks."

**Dependencies:** Run the DB migration (Step 0) before implementing BUG-003 and BUG-004.

**Responsive note:** Phase 1 is backend/logic fixes — no layout changes. Do NOT remove or change any existing responsive Tailwind classes (`sm:`, `md:`, `lg:`) while making these fixes. Preserve all existing responsive classes exactly as-is. Full responsive redesign is handled in Phase 2.

---

## Step 0 — Create and run DB migration [DO THIS FIRST]

Create file `app/db/migrations/admin_infrastructure.sql`:

```sql
-- Admin settings key-value store
CREATE TABLE IF NOT EXISTS goodhive.admin_settings (
  key        TEXT        PRIMARY KEY,
  value      JSONB       NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_by TEXT
);

INSERT INTO goodhive.admin_settings (key, value) VALUES
  ('notifications', '{"emailNotifications":true,"approvalAlerts":true,"weeklyReports":false,"errorAlerts":true}'::jsonb),
  ('system',        '{"maintenanceMode":false,"allowRegistrations":true,"requireEmailVerification":true}'::jsonb),
  ('security',      '{"sessionTimeout":30,"maxLoginAttempts":5}'::jsonb)
ON CONFLICT (key) DO NOTHING;

-- Admin audit log
CREATE TABLE IF NOT EXISTS goodhive.admin_audit_log (
  id          BIGSERIAL   PRIMARY KEY,
  admin_email TEXT        NOT NULL,
  action      TEXT        NOT NULL,
  target_type TEXT,
  target_id   TEXT,
  details     JSONB,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS admin_audit_log_target_idx
  ON goodhive.admin_audit_log (target_type, target_id, created_at DESC);
CREATE INDEX IF NOT EXISTS admin_audit_log_admin_idx
  ON goodhive.admin_audit_log (admin_email, created_at DESC);
```

Run on dev DB: use the existing migration pattern in the project (check `package.json` scripts or run directly via `psql $DATABASE_URL -f app/db/migrations/admin_infrastructure.sql`).

---

## BUG-001 — Analytics SQL UNION ALL crash [P0]

**File:** `app/api/admin/analytics/route.ts`

**Problem:** Lines 112–128 use `UNION ALL` with 4 columns (talents) vs 6 columns (companies) → PostgreSQL throws an error and the entire analytics page fails with 500.

**Fix:** Replace the single `approvalRates` query (lines 112–128) with two separate queries:

```ts
// REPLACE lines 112–128 entirely with:
const talentRates = await sql`
  SELECT
    'talents' AS type,
    COUNT(*) FILTER (WHERE approved = true)  AS approved,
    COUNT(*) FILTER (WHERE approved = false) AS pending,
    0::bigint                                AS published,
    0::bigint                                AS unpublished,
    COUNT(*)                                 AS total
  FROM goodhive.talents
`;
const companyRates = await sql`
  SELECT
    'companies'                                   AS type,
    COUNT(*) FILTER (WHERE approved = true)       AS approved,
    COUNT(*) FILTER (WHERE approved = false)      AS pending,
    COUNT(*) FILTER (WHERE published = true)      AS published,
    COUNT(*) FILTER (WHERE published = false)     AS unpublished,
    COUNT(*)                                      AS total
  FROM goodhive.companies
`;
const approvalRates = [...talentRates, ...companyRates];
```

The JS mapping block that follows (lines ~180–190) already handles all 6 fields — no other changes needed in this file.

**Acceptance:** `GET /api/admin/analytics` returns 200 with valid data. Analytics page loads without error.

---

## BUG-002 — Admin JWT tokens never expire [P0]

**File:** `app/api/auth/admin/login/route.ts`

**Problem:** `sign({ email, role }, secret)` on lines 50–53 has no `expiresIn` option → admin tokens are valid forever.

**Fix:** Add `{ expiresIn: "8h" }` as the third argument:

```ts
// CHANGE:
const token = sign(
  { email: admin.email, role: admin.role },
  getAdminJWTSecret(),
);
// TO:
const token = sign(
  { email: admin.email, role: admin.role },
  getAdminJWTSecret(),
  { expiresIn: "8h" },
);
```

**Acceptance:** Decoded JWT has an `exp` claim set to 8 hours from login time.

---

## BUG-003 — Settings are never persisted [P1]

**Requires:** Step 0 migration must have run.

**File:** `app/api/admin/settings/route.ts`

**Problem:** GET always returns hardcoded defaults. PUT returns 200 but saves nothing (SQL is commented out with a TODO).

### Fix — GET handler

Add `import sql from "@/lib/db";` at the top if not already there.

Replace the hardcoded `const settings = { ... }` object with a real DB query:

```ts
// Inside GET handler, replace the hardcoded settings object:
const rows = await sql`SELECT key, value FROM goodhive.admin_settings`;
const settings = rows.reduce(
  (acc: Record<string, unknown>, row: { key: string; value: unknown }) => ({
    ...acc,
    [row.key]: row.value,
  }),
  {},
);
```

### Fix — PUT handler

Replace the entire TODO block (lines ~91–107) with real DB writes:

```ts
// After verifyAdminToken(req) and parsing req.json():
const decoded = await verifyAdminToken(req);
const adminEmail = (decoded as { email?: string }).email ?? "unknown";

if (!settings.notifications || !settings.system || !settings.security) {
  return new Response(JSON.stringify({ message: "Invalid settings structure" }), { status: 400 });
}

for (const [key, value] of Object.entries(settings)) {
  await sql`
    INSERT INTO goodhive.admin_settings (key, value, updated_at, updated_by)
    VALUES (${key}, ${JSON.stringify(value)}, NOW(), ${adminEmail})
    ON CONFLICT (key) DO UPDATE
      SET value      = ${JSON.stringify(value)},
          updated_at = NOW(),
          updated_by = ${adminEmail}
  `;
}

return new Response(JSON.stringify({ message: "Settings saved successfully" }), { status: 200 });
```

Note: `verifyAdminToken` already returns the decoded payload — use it for `adminEmail`.

**Acceptance:** Save any setting → reload the settings page → saved value persists.

---

## BUG-004 — Action history always empty [P1]

**Requires:** Step 0 migration must have run.

**Files:**
- `app/api/admin/action-history/route.ts`
- `app/api/admin/talents/status/route.ts`
- `app/api/admin/companies/[userId]/route.ts`

### Fix 1 — `action-history/route.ts`

Add `import sql from "@/lib/db";` if not already there.

Replace `const history: ActionHistory[] = []` stub with a real query:

```ts
// Inside GET handler, replace the mock history block:
const rows = await sql`
  SELECT id, admin_email, action, target_type, target_id, details, created_at
  FROM goodhive.admin_audit_log
  WHERE target_type = ${targetType}
    AND target_id   = ${targetId}
  ORDER BY created_at DESC
  LIMIT ${limit}
`;
return new Response(
  JSON.stringify({ history: rows, message: "Action history retrieved successfully" }),
  { status: 200, headers: { "Content-Type": "application/json" } },
);
```

### Fix 2 — `talents/status/route.ts`

`verifyAdminToken()` in this file returns the decoded payload. Add this after every successful status UPDATE (both the approval and rejection branches), before the final return:

```ts
// After UPDATE queries, before final return:
const adminEmail = (decoded as { email?: string }).email ?? "unknown";
sql`
  INSERT INTO goodhive.admin_audit_log (admin_email, action, target_type, target_id, details)
  VALUES (
    ${adminEmail},
    ${"talent." + status},
    'talent',
    ${userId},
    ${JSON.stringify({ status, rejectionReason: rejectionReason ?? null })}
  )
`.catch(() => {}); // fire-and-forget, don't block the response
```

Note: `verifyAdminToken()` currently doesn't return the decoded value — update it to `return decoded` at the end of the function and capture it: `const decoded = await verifyAdminToken();`

### Fix 3 — `companies/[userId]/route.ts`

In the PUT handler, after a successful company update, write an audit entry. Add the necessary imports at the top of the file:

```ts
import { getAdminJWTSecret } from "@/app/lib/admin-auth";
import { verify } from "jsonwebtoken";
import { cookies } from "next/headers";
```

Then after the successful update query:

```ts
try {
  const cookieStore = cookies();
  const token = cookieStore.get("admin_token")?.value;
  const decoded = token
    ? (verify(token, getAdminJWTSecret()) as { email?: string })
    : null;
  const adminEmail = decoded?.email ?? "unknown";
  sql`
    INSERT INTO goodhive.admin_audit_log (admin_email, action, target_type, target_id, details)
    VALUES (${adminEmail}, 'company.updated', 'company', ${userId},
      ${JSON.stringify({ fields: Object.keys(body ?? {}) })})
  `.catch(() => {});
} catch {}
```

**Acceptance:** Approve or reject a talent → navigate to their detail page → action history section shows the event with timestamp and admin email.

---

## BUG-005 — usersLast7Days always shows 0 [P1]

**File:** `app/api/admin/statistics/route.ts`

**Problem:** Lines 97–98 hardcode `recentUsersCount = { count: 0 }` because of an incorrect comment saying the users table has no timestamp. The table does have `created_at`.

**Fix:** Replace lines 97–98:

```ts
// REPLACE:
// Note: users table doesn't have a timestamp column, defaulting to 0
const recentUsersCount = { count: 0 };
// WITH:
const [recentUsersCount] = await sql`
  SELECT COUNT(*) AS count
  FROM goodhive.users
  WHERE created_at >= NOW() - INTERVAL '7 days'
`;
```

⚠️ Before deploying to prod, verify the column exists:
```sql
SELECT column_name FROM information_schema.columns
WHERE table_schema = 'goodhive' AND table_name = 'users' AND column_name = 'created_at';
```

**Acceptance:** Dashboard stat card shows a real "new in last 7 days" count instead of 0.

---

## BUG-006 — console.log calls left in production code [P1]

**Files to clean (delete the console.log lines, nothing else):**

1. `app/components/admin/UserGrowthChart.tsx` — inside the `useEffect`, delete these two lines:
   ```ts
   console.log("UserGrowthChart - Max value:", max, "Data points:", data.length);
   console.log("UserGrowthChart - Sample data:", data.slice(0, 5));
   ```

2. `app/components/admin/JobTrendsChart.tsx` — same pattern, find and delete all `console.log` lines.

3. `app/admin/analytics/page.tsx` — search for `console.log` and delete all occurrences (~3 lines).

**Acceptance:** Opening the admin panel produces zero `console.log` output in the browser console.

---

## BUG-007 — admin_token cookie is JS-accessible (XSS risk) [P1]

The `admin_token` cookie is currently set client-side via `js-cookie` without `HttpOnly`. Any XSS attack can steal it. Fix: move cookie management to the server.

### Step 1 — Update login route `app/api/auth/admin/login/route.ts`

Change the success response to set an httpOnly cookie server-side instead of returning the raw token in JSON:

```ts
// REPLACE the success return (the `return new Response(JSON.stringify({ message: "Login Successful", token, ...` block) WITH:
const isProduction = process.env.NODE_ENV === "production";
const cookieValue = [
  `admin_token=${token}`,
  "Path=/",
  "HttpOnly",
  "SameSite=Lax",
  "Max-Age=28800",
  isProduction ? "Secure" : "",
]
  .filter(Boolean)
  .join("; ");

return new Response(
  JSON.stringify({
    message: "Login Successful",
    user: { name: admin.name, email: admin.email, role: admin.role },
  }),
  {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      "Set-Cookie": cookieValue,
    },
  },
);
```

### Step 2 — Create logout route `app/api/auth/admin/logout/route.ts` (new file)

```ts
export async function POST() {
  return new Response(JSON.stringify({ message: "Logged out" }), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      "Set-Cookie": "admin_token=; Path=/; HttpOnly; Max-Age=0; SameSite=Lax",
    },
  });
}
```

### Step 3 — Update login page `app/admin/login/page.tsx`

- Remove `Cookies.set("admin_token", data.token, ...)` — the cookie is now set by the server.
- Remove `import Cookies from "js-cookie"` if it was only used for that.
- After successful login, store the admin email in localStorage (sidebar uses this to show initials):
  ```ts
  if (data.user?.email) {
    localStorage.setItem("admin_email", data.user.email);
  }
  router.push("/admin");
  ```

### Step 4 — Update sidebar logout `app/components/Sidebar/Sidebar.tsx`

Replace the logout handler:
```ts
// REPLACE:
const handleLogout = () => {
  Cookies.remove("admin_token");
  toast.success("Logged out successfully");
  router.push("/admin/login");
};
// WITH:
const handleLogout = async () => {
  await fetch("/api/auth/admin/logout", { method: "POST" });
  localStorage.removeItem("admin_email");
  toast.success("Logged out successfully");
  router.push("/admin/login");
};
```

Also remove `import Cookies from "js-cookie"` from the sidebar if no longer used.

### Step 5 — Remove `Cookies.get("admin_token")` from ALL admin client pages

The cookie is now httpOnly — browsers send it automatically with every fetch. No manual header needed.

For each of these files, do the same 3 changes:
1. Remove `import Cookies from "js-cookie"` (if only used for admin_token)
2. Remove the `getAuthHeaders()` helper function
3. Change every `fetch(url, { headers: getAuthHeaders() })` to `fetch(url)`
4. Keep the 401 redirect: `if (response.status === 401) { router.push("/admin/login"); return; }`

Files to update:
- `app/admin/page.tsx`
- `app/admin/analytics/page.tsx`
- `app/admin/talent-approval/page.tsx`
- `app/admin/company-approval/page.tsx`
- `app/admin/talents/page.tsx`
- `app/admin/companies/page.tsx`
- `app/admin/users/page.tsx`
- `app/admin/company/[user_id]/page.tsx`
- `app/admin/manage-admins/page.tsx`
- `app/admin/settings/page.tsx`
- `app/admin/all-jobs/page.tsx`
- `app/admin/payouts/page.tsx`

**Acceptance:** In browser DevTools → Application → Cookies → `admin_token` shows `HttpOnly ✓`. Running `document.cookie` does not contain `admin_token`.

---

## BUG-008 — Dashboard title rendered twice [P2]

**File:** `app/admin/page.tsx`

**Problem:** Both `<AdminPageLayout title="Admin Dashboard">` AND an inner `<h1>Admin Dashboard</h1>` render, producing two headings.

**Fix:** Delete the inner header block (find and remove):
```tsx
// DELETE this entire block from the JSX:
<div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0">
  <div>
    <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Admin Dashboard</h1>
    <p className="text-xs sm:text-sm text-gray-600 mt-1">
      Overview of your GoodHive platform
    </p>
  </div>
  <Button onClick={fetchStatistics} variant="outline" size="sm" className="w-full sm:w-auto">
    Refresh
  </Button>
</div>
```

Move the Refresh button to the `AdminPageLayout` `actions` prop:
```tsx
<AdminPageLayout
  title="Dashboard"
  subtitle="Overview of your GoodHive platform"
  actions={
    <Button onClick={fetchStatistics} variant="outline" size="sm">
      Refresh
    </Button>
  }
>
```

Note: `AdminPageLayout` doesn't currently have an `actions` prop. Add it as part of Phase 2 (UI-003). For now, just delete the duplicate heading; the Refresh button can be placed elsewhere temporarily if needed.

**Acceptance:** Only one "Dashboard" heading appears on the admin dashboard page.

---

## BUG-009 — Payouts page missing AdminPageLayout [P2]

**File:** `app/admin/payouts/page.tsx`

**Problem:** The page uses a raw `<div className="p-6 space-y-6">` wrapper instead of `AdminPageLayout`, so it has no breadcrumbs, no standard title bar, and inconsistent padding compared to every other admin page.

**Fix:** Import and wrap in `AdminPageLayout`:

```tsx
import { AdminPageLayout } from "@/app/components/admin/AdminPageLayout";

// Replace the outer wrapper div with:
<AdminPageLayout title="Payouts" subtitle="On-chain USDC mission payout history">
  {/* existing content unchanged */}
</AdminPageLayout>
```

**Acceptance:** Payouts page shows breadcrumbs and title bar matching other admin pages.

---

## Final checklist before marking Phase 1 complete

- [ ] Migration file created at `app/db/migrations/admin_infrastructure.sql`
- [ ] Migration run on dev DB successfully
- [ ] BUG-001: `GET /api/admin/analytics` returns 200
- [ ] BUG-002: Admin login JWT has `exp` in decoded payload
- [ ] BUG-003: Settings save and reload correctly
- [ ] BUG-004: Action history shows events on talent/company detail pages
- [ ] BUG-005: Dashboard shows real new-users count
- [ ] BUG-006: Zero console.log in admin browser console
- [ ] BUG-007: `admin_token` cookie is HttpOnly (verified in DevTools)
- [ ] BUG-008: One heading on dashboard
- [ ] BUG-009: Payouts page has breadcrumb + title
- [ ] `pnpm lint` passes (no new errors)
- [ ] `pnpm tsc --noEmit` passes (no new TS errors in changed files)
