import { NextRequest, NextResponse } from "next/server";

import { fetchTalents } from "@/lib/talents";

function getParam(searchParams: URLSearchParams, key: string) {
  return searchParams.get(key) ?? "";
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const viewerUserId =
      request.headers.get("x-user-id") ?? request.cookies.get("user_id")?.value;

    const itemsValue = Number(searchParams.get("items") ?? "9");
    const pageValue = Number(searchParams.get("page") ?? "1");
    const items = Number.isFinite(itemsValue) ? Math.max(1, Math.trunc(itemsValue)) : 9;
    const page = Number.isFinite(pageValue) ? Math.max(1, Math.trunc(pageValue)) : 1;

    const { talents, count } = await fetchTalents({
      search: getParam(searchParams, "search"),
      location: getParam(searchParams, "location"),
      name: getParam(searchParams, "name"),
      items,
      page,
      onlyTalent: getParam(searchParams, "onlyTalent"),
      onlyMentor: getParam(searchParams, "onlyMentor"),
      onlyRecruiter: getParam(searchParams, "onlyRecruiter"),
      availability: getParam(searchParams, "availability"),
      remoteOnly: getParam(searchParams, "remoteOnly"),
      freelanceOnly: getParam(searchParams, "freelanceOnly"),
      sort: getParam(searchParams, "sort") || "recent",
      minRate: getParam(searchParams, "minRate"),
      maxRate: getParam(searchParams, "maxRate"),
      viewerUserId,
    });

    return NextResponse.json(
      {
        success: true,
        data: talents,
        total: count,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Failed to fetch talents:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch talents",
      },
      { status: 500 },
    );
  }
}
