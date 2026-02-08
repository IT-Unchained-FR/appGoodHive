import { NextResponse } from "next/server";
import sql from "@/lib/ragDb";

type UpdateContentItemBody = {
  type?: unknown;
  title?: unknown;
  body?: unknown;
  ctaLabel?: unknown;
  ctaUrl?: unknown;
  status?: unknown;
};

function normalizeString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: Request, { params }: RouteContext) {
  const { id } = await params;
  const rows = await sql`
    SELECT id, type, title, body, cta_label, cta_url, status, created_at, updated_at
    FROM goodhive.content_items
    WHERE id = ${id}
    LIMIT 1;
  `;

  const item = rows[0];
  if (!item) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({
    item: {
      id: item.id,
      type: item.type,
      title: item.title,
      body: item.body,
      ctaLabel: item.cta_label,
      ctaUrl: item.cta_url,
      status: item.status,
      createdAt: item.created_at,
      updatedAt: item.updated_at,
    },
  });
}

export async function PATCH(request: Request, { params }: RouteContext) {
  const { id } = await params;
  let body: UpdateContentItemBody;

  try {
    body = (await request.json()) as UpdateContentItemBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const type = normalizeString(body.type) || null;
  const title = normalizeString(body.title) || null;
  const contentBody = normalizeString(body.body) || null;
  const ctaLabel = normalizeString(body.ctaLabel) || null;
  const ctaUrl = normalizeString(body.ctaUrl) || null;
  const status = normalizeString(body.status) || null;

  const hasUpdate = Boolean(type || title || contentBody || ctaLabel || ctaUrl || status);
  if (!hasUpdate) {
    return NextResponse.json({ error: "No valid fields to update" }, { status: 400 });
  }

  try {
    const rows = await sql`
      UPDATE goodhive.content_items
      SET
        type = COALESCE(${type}, type),
        title = COALESCE(${title}, title),
        body = COALESCE(${contentBody}, body),
        cta_label = COALESCE(${ctaLabel}, cta_label),
        cta_url = COALESCE(${ctaUrl}, cta_url),
        status = COALESCE(${status}, status),
        updated_at = NOW()
      WHERE id = ${id}
      RETURNING id, type, title, body, cta_label, cta_url, status, created_at, updated_at;
    `;

    const item = rows[0];
    return NextResponse.json({
      item: {
        id: item.id,
        type: item.type,
        title: item.title,
        body: item.body,
        ctaLabel: item.cta_label,
        ctaUrl: item.cta_url,
        status: item.status,
        createdAt: item.created_at,
        updatedAt: item.updated_at,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to update content item" },
      { status: 500 },
    );
  }
}
