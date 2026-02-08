import { getDateRange, getSuperbotDailyMetrics, getSuperbotMetrics } from "@/lib/superbot/analytics";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const from = url.searchParams.get("from");
  const to = url.searchParams.get("to");

  const range = getDateRange({ from, to });
  const [metrics, daily] = await Promise.all([
    getSuperbotMetrics(range),
    getSuperbotDailyMetrics(range),
  ]);

  return Response.json({
    range,
    metrics,
    daily,
  });
}
