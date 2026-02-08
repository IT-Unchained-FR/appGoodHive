import { NextResponse } from "next/server";
import sql from "@/lib/ragDb";

type CreateContentItemBody = {
  id?: unknown;
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

function validateCreateContentItem(body: CreateContentItemBody) {
  const id = normalizeString(body.id);
  const type = normalizeString(body.type);
  const title = normalizeString(body.title);
  const contentBody = normalizeString(body.body);
  const ctaLabel = normalizeString(body.ctaLabel);
  const ctaUrl = normalizeString(body.ctaUrl);
  const status = normalizeString(body.status) || "active";

  const errors: string[] = [];

  if (!type) errors.push("type is required");
  if (!title) errors.push("title is required");
  if (!contentBody) errors.push("body is required");
  if (!ctaLabel) errors.push("ctaLabel is required");
  if (!ctaUrl) errors.push("ctaUrl is required");

  return {
    errors,
    data:
      errors.length === 0
        ? {
            id: id || undefined,
            type,
            title,
            body: contentBody,
            ctaLabel,
            ctaUrl,
            status,
          }
        : null,
  };
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type") ?? undefined;
  const status = searchParams.get("status") ?? undefined;

  let items;
  if (type && status) {
    items = await sql`
      SELECT id, type, title, body, cta_label, cta_url, status, created_at, updated_at
      FROM goodhive.content_items
      WHERE type = ${type} AND status = ${status}
      ORDER BY updated_at DESC;
    `;
  } else if (type) {
    items = await sql`
      SELECT id, type, title, body, cta_label, cta_url, status, created_at, updated_at
      FROM goodhive.content_items
      WHERE type = ${type}
      ORDER BY updated_at DESC;
    `;
  } else if (status) {
    items = await sql`
      SELECT id, type, title, body, cta_label, cta_url, status, created_at, updated_at
      FROM goodhive.content_items
      WHERE status = ${status}
      ORDER BY updated_at DESC;
    `;
  } else {
    items = await sql`
      SELECT id, type, title, body, cta_label, cta_url, status, created_at, updated_at
      FROM goodhive.content_items
      ORDER BY updated_at DESC;
    `;
  }

  const mapped = items.map((item) => ({
    id: item.id,
    type: item.type,
    title: item.title,
    body: item.body,
    ctaLabel: item.cta_label,
    ctaUrl: item.cta_url,
    status: item.status,
    createdAt: item.created_at,
    updatedAt: item.updated_at,
  }));

  return NextResponse.json({ items: mapped });
}

export async function POST(request: Request) {
  let body: CreateContentItemBody;

  try {
    body = (await request.json()) as CreateContentItemBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { errors, data } = validateCreateContentItem(body);

  if (errors.length > 0 || !data) {
    return NextResponse.json({ error: errors.join(", ") }, { status: 400 });
  }

  try {
    let rows;
    if (data.id) {
      rows = await sql`
        INSERT INTO goodhive.content_items (id, type, title, body, cta_label, cta_url, status)
        VALUES (${data.id}, ${data.type}, ${data.title}, ${data.body}, ${data.ctaLabel}, ${data.ctaUrl}, ${data.status})
        RETURNING id, type, title, body, cta_label, cta_url, status, created_at, updated_at;
      `;
    } else {
      rows = await sql`
        INSERT INTO goodhive.content_items (type, title, body, cta_label, cta_url, status)
        VALUES (${data.type}, ${data.title}, ${data.body}, ${data.ctaLabel}, ${data.ctaUrl}, ${data.status})
        RETURNING id, type, title, body, cta_label, cta_url, status, created_at, updated_at;
      `;
    }

    const item = rows[0];
    return NextResponse.json(
      {
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
      },
      { status: 201 },
    );
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to create content item" },
      { status: 500 },
    );
  }
}
