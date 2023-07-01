import { cookies } from "next/headers";

export async function GET(request: Request) {
  if (!cookies().get("address")?.value) {
    return new Response(null, {
      status: 401,
      statusText: "Unauthorized",
    });
  }

  return new Response(
    JSON.stringify({ ok: true, address: cookies().get("address")?.value }),
    {
      headers: { "Content-Type": "application/json" },
    }
  );
}
