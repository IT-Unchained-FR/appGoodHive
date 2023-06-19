// TODO: add logic to check if the user is authenticated
export async function GET(request: Request) {
  return new Response(
    JSON.stringify({ address: "0x06255FA39EBD18796eCCCc17DB8153Ef58DBA0a8" }),
    {
      headers: { "Content-Type": "application/json" },
    }
  );
}