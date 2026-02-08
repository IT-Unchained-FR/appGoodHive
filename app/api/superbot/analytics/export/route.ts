import { getDateRange, getSuperbotDailyMetrics } from "@/lib/superbot/analytics";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const from = url.searchParams.get("from");
  const to = url.searchParams.get("to");
  const range = getDateRange({ from, to });

  const rows = await getSuperbotDailyMetrics(range);

  const header = ["date", "inbound_messages", "outbound_messages", "cta_sent", "cta_clicks"].join(",");
  const csvRows = rows.map((row) =>
    [row.date, row.inbound, row.outbound, row.ctaSent, row.ctaClicks].join(","),
  );
  const csv = [header, ...csvRows].join("\n");

  return new Response(csv, {
    headers: {
      "content-type": "text/csv",
      "content-disposition": "attachment; filename=superbot-metrics.csv",
    },
  });
}
