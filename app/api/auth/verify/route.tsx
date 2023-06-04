import { cookies } from "next/headers";
import { SiweMessage } from "siwe";

const ALLOWED_METHODS = ["POST"];

export async function POST(request: Request) {
  const { method } = request;

  if (!ALLOWED_METHODS.includes(method)) {
    return new Response(null, {
      status: 405,
      statusText: "Method Not Allowed",
    });
  }

  try {
    const body = await request.json();
    const { message, signature } = body;

    const siweMessage = new SiweMessage(message);
    const { success, error, data } = await siweMessage.verify({
      signature,
    });

    if (!success) throw error;

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    const { value: cookieNonceValue } = cookies().get("nonce");

    if (data.nonce !== cookieNonceValue)
      return new Response(JSON.stringify({ message: "Invalid nonce." }), {
        headers: { "Content-Type": "application/json" },
        status: 422,
      });

    return new Response(JSON.stringify({ ok: true }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error(error);

    return new Response(JSON.stringify({ ok: false }), {
      headers: { "Content-Type": "application/json" },
    });
  }
}
