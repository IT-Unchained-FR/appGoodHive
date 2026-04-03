# Admin Panel Phase 3 — Extras & Cleanup

**Codex prompt:** "Implement all tasks in `docs/features/admin-phase-3-extras.md`. Read the file fully before starting. Run `pnpm lint && pnpm tsc --noEmit` after completing all tasks."

**Requires:** Phase 1 and Phase 2 complete first. Phase 3 tasks are independent of each other.

---

## EXTRA-001 — Real CSV Report Generation [P2]

### Step 1 — Create `app/api/admin/reports/route.ts` (new file)

```ts
import sql from "@/lib/db";
import { verify } from "jsonwebtoken";
import { cookies } from "next/headers";
import type { NextRequest } from "next/server";
import { getAdminJWTSecret } from "@/app/lib/admin-auth";

export const dynamic = "force-dynamic";

const verifyAdminToken = async () => {
  const cookieStore = cookies();
  const token = cookieStore.get("admin_token")?.value;
  if (!token) throw new Error("No token");
  const decoded = verify(token, getAdminJWTSecret()) as { role: string };
  if (decoded.role !== "admin") throw new Error("Forbidden");
  return decoded;
};

function toCSV(rows: Record<string, unknown>[]): string {
  if (rows.length === 0) return "";
  const headers = Object.keys(rows[0]);
  const escape = (v: unknown): string => {
    const s = v == null ? "" : String(v);
    return s.includes(",") || s.includes('"') || s.includes("\n")
      ? `"${s.replace(/"/g, '""')}"`
      : s;
  };
  return [
    headers.join(","),
    ...rows.map((r) => headers.map((h) => escape(r[h])).join(",")),
  ].join("\n");
}

export async function GET(req: NextRequest) {
  try {
    await verifyAdminToken();
    const { searchParams } = new URL(req.url);
    const type      = searchParams.get("type") ?? "talents";
    const startDate = searchParams.get("startDate");
    const endDate   = searchParams.get("endDate");

    let rows: Record<string, unknown>[] = [];

    if (type === "talents") {
      rows = await sql`
        SELECT
          t.first_name,
          t.last_name,
          u.email,
          u.talent_status   AS status,
          t.phone,
          t.location,
          t.linkedin,
          t.portfolio,
          t.created_at
        FROM goodhive.talents t
        JOIN goodhive.users u ON u.userid = t.user_id
        ${startDate ? sql`WHERE t.created_at >= ${startDate}::date` : sql``}
        ORDER BY t.created_at DESC
      `;
    } else if (type === "companies") {
      rows = await sql`
        SELECT
          c.designation AS company_name,
          u.email,
          CASE WHEN c.approved THEN 'approved' ELSE 'pending' END AS status,
          c.created_at
        FROM goodhive.companies c
        JOIN goodhive.users u ON u.userid = c.user_id
        ${startDate ? sql`WHERE c.created_at >= ${startDate}::date` : sql``}
        ORDER BY c.created_at DESC
      `;
    } else if (type === "jobs") {
      rows = await sql`
        SELECT
          j.title,
          j.status,
          j.review_status,
          j.budget_min,
          j.budget_max,
          j.token_currency,
          j.posted_at,
          j.published
        FROM goodhive.job_offers j
        ${startDate ? sql`WHERE j.posted_at >= ${startDate}::date` : sql``}
        ORDER BY j.posted_at DESC
      `;
    }

    const csv      = toCSV(rows as Record<string, unknown>[]);
    const dateStr  = new Date().toISOString().split("T")[0];
    const filename = `goodhive-${type}-${dateStr}.csv`;

    return new Response(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch {
    return new Response(JSON.stringify({ message: "Unauthorized" }), { status: 401 });
  }
}
```

### Step 2 — Update `handleGenerateReport` in `app/admin/analytics/page.tsx`

Find the `handleGenerateReport` function (currently just a `console.log`). Replace its entire body:

```ts
const handleGenerateReport = async (config: {
  reportType: string;
  format: string;
  dateRange: { start: string; end: string };
}) => {
  try {
    setLoading(true);
    const params = new URLSearchParams({
      type:      config.reportType,
      format:    config.format,
      startDate: config.dateRange.start,
      endDate:   config.dateRange.end,
    });
    const res = await fetch(`/api/admin/reports?${params}`);
    if (!res.ok) throw new Error("Failed to generate report");
    const blob = await res.blob();
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href     = url;
    a.download = `goodhive-${config.reportType}-report.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success("Report downloaded successfully");
  } catch {
    toast.error("Failed to generate report");
  } finally {
    setLoading(false);
  }
};
```

**Acceptance:** Click "Generate Report" in the analytics page → a `.csv` file downloads to the user's machine with real data.

---

## EXTRA-002 — Replace hand-rolled charts with Recharts [P2]

### Check if recharts is installed

Run: `grep '"recharts"' package.json`

If not found: run `pnpm add recharts`

### Rewrite `app/components/admin/UserGrowthChart.tsx` — full replacement

```tsx
"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users } from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface DataPoint {
  date: string;
  count: number;
}

interface UserGrowthChartProps {
  data: DataPoint[];
  loading?: boolean;
}

export function UserGrowthChart({ data, loading }: UserGrowthChartProps) {
  if (loading) {
    return (
      <Card className="rounded-2xl border border-gray-100 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm font-semibold text-gray-700">
            <Users className="h-4 w-4" />
            User Growth
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-48">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-[#FFC905]" />
          </div>
        </CardContent>
      </Card>
    );
  }

  const formatted = data.map((d) => ({
    ...d,
    label: new Date(d.date + "T00:00:00").toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    }),
  }));

  const total = data.reduce((s, d) => s + d.count, 0);
  const allZero = data.every((d) => d.count === 0);

  return (
    <Card className="rounded-2xl border border-gray-100 shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2 text-sm font-semibold text-gray-700">
            <Users className="h-4 w-4" />
            User Growth
          </span>
          <span className="text-xs text-gray-400">{total} registrations</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {allZero ? (
          <div className="flex flex-col items-center justify-center h-48 text-gray-400">
            <Users className="h-10 w-10 mb-2 text-gray-200" />
            <p className="text-sm">No registrations in this period</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={formatted} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="userGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#FFC905" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#FFC905" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 10, fill: "#9ca3af" }}
                axisLine={false}
                tickLine={false}
                interval="preserveStartEnd"
              />
              <YAxis
                tick={{ fontSize: 10, fill: "#9ca3af" }}
                axisLine={false}
                tickLine={false}
                allowDecimals={false}
              />
              <Tooltip
                contentStyle={{
                  borderRadius: 8,
                  border: "1px solid #e5e7eb",
                  fontSize: 12,
                  boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
                }}
                formatter={(v: number) => [v, "Users"]}
                labelFormatter={(l) => String(l)}
              />
              <Area
                type="monotone"
                dataKey="count"
                stroke="#FFC905"
                strokeWidth={2}
                fill="url(#userGradient)"
                dot={false}
                activeDot={{ r: 4, fill: "#FFC905", strokeWidth: 0 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
```

### Rewrite `app/components/admin/JobTrendsChart.tsx` — full replacement

Same structure as `UserGrowthChart` with these differences:
- Import `Briefcase` instead of `Users`
- Title: `Job Trends`
- Gradient id: `"jobGradient"` with `stopColor="#3b82f6"`
- Area: `stroke="#3b82f6"`, `fill="url(#jobGradient)"`, activeDot `fill="#3b82f6"`
- Tooltip formatter: `[v, "Jobs"]`
- Counter label: `{total} jobs posted`
- Empty state icon: `<Briefcase />`

**Acceptance:** Analytics page shows smooth area charts with grid lines, axes, and tooltips on hover. No hand-rolled div bars.

---

## EXTRA-003 — Remove orphaned admin components [P3]

### Step 1 — Verify zero imports

Run this command to confirm these files are never imported anywhere:

```bash
grep -r "RoleManager\|PermissionsEditor\|ActivityFeed\|RecentActivity\|ApprovalQueue\b\|QuickActions\b\|AdminTable\b\|TableFilters\b\|StatusFilter\b" \
  app/ --include="*.tsx" --include="*.ts" -l
```

The output should only show the component files themselves. If any OTHER file imports them, **do not delete that component**.

### Step 2 — Delete confirmed-orphan files

If confirmed unused, delete:
- `app/components/admin/RoleManager.tsx`
- `app/components/admin/PermissionsEditor.tsx`
- `app/components/admin/ActivityFeed.tsx`
- `app/components/admin/RecentActivity.tsx`
- `app/components/admin/ApprovalQueue.tsx`
- `app/components/admin/QuickActions.tsx`
- `app/components/admin/AdminTable.tsx`
- `app/components/admin/TableFilters.tsx`
- `app/components/admin/StatusFilter.tsx`

**Acceptance:** `pnpm build` still passes. No import errors.

---

## EXTRA-004 — Deduplicate Spinner in manage-admins [P3]

**File:** `app/admin/manage-admins/page.tsx`

**Problem:** An inline Spinner component is defined locally (lines ~16–23), duplicating `app/components/admin/Spinner.tsx`.

**Fix:**
1. Delete the inline Spinner definition (the `const Spinner = () => ...` block at the top of the file)
2. Add import: `import { Spinner } from "@/app/components/admin/Spinner";`

Check the import path: run `ls app/components/admin/Spinner.tsx` to confirm it exists at that path.

**Acceptance:** `manage-admins/page.tsx` no longer defines its own Spinner. Build passes.

---

## Final checklist before marking Phase 3 complete

- [ ] `GET /api/admin/reports?type=talents` returns a valid CSV download
- [ ] `GET /api/admin/reports?type=companies` returns a valid CSV download
- [ ] `GET /api/admin/reports?type=jobs` returns a valid CSV download
- [ ] "Generate Report" button on analytics page triggers a real download
- [ ] `recharts` installed in `package.json`
- [ ] UserGrowthChart uses Recharts AreaChart with grid + axes + tooltip
- [ ] JobTrendsChart uses Recharts AreaChart with blue color
- [ ] Orphaned components deleted (confirmed no imports exist)
- [ ] Spinner import fixed in manage-admins page
- [ ] `pnpm lint` passes
- [ ] `pnpm tsc --noEmit` passes
- [ ] `pnpm build` passes
