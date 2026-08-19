"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";

const COPY: Record<string, { title: string; body: string }> = {
  success: {
    title: "You're unsubscribed",
    body: "You won't receive any more newsletter emails from GoodHive. You can still use your account as normal.",
  },
  invalid: {
    title: "This link isn't valid",
    body: "The unsubscribe link is broken or expired. If you keep getting emails you don't want, reach out to support@goodhive.io.",
  },
  error: {
    title: "Something went wrong",
    body: "We couldn't process your unsubscribe request. Please try again or contact support@goodhive.io.",
  },
};

export default function UnsubscribePage() {
  const searchParams = useSearchParams();
  const status = searchParams.get("status") ?? "success";
  const copy = COPY[status] ?? COPY.success;

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f9fafb] px-4">
      <div className="w-full max-w-md rounded-2xl border border-gray-100 bg-white p-8 text-center shadow-sm">
        <div
          className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full"
          style={{ backgroundColor: "#fef3c7" }}
        >
          <span className="text-xl">🐝</span>
        </div>
        <h1 className="text-lg font-semibold text-gray-900">{copy.title}</h1>
        <p className="mt-2 text-sm text-gray-500">{copy.body}</p>
        <Link
          href="/"
          className="mt-6 inline-block rounded-lg px-5 py-2 text-sm font-semibold text-gray-900"
          style={{ backgroundColor: "#f0b429" }}
        >
          Back to GoodHive
        </Link>
      </div>
    </div>
  );
}
