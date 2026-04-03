export async function POST() {
  return new Response(JSON.stringify({ message: "Logged out" }), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      "Set-Cookie": "admin_token=; Path=/; HttpOnly; Max-Age=0; SameSite=Lax",
    },
  });
}
