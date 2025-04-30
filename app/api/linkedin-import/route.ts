import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const username = searchParams.get("username");

  if (!username) {
    return NextResponse.json(
      { message: "Username is required" },
      { status: 400 },
    );
  }

  try {
    // Call the LinkedIn API
    const apiUrl = `https://linkedin-api8.p.rapidapi.com/?username=${encodeURIComponent(username)}`;
    const response = await fetch(apiUrl, {
      method: "GET",
      headers: {
        "x-rapidapi-host": "linkedin-api8.p.rapidapi.com",
        "x-rapidapi-key": "1b52c7315emshc22c4613bd6f4f2p132fa3jsnd400753270c6",
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error("LinkedIn API error:", errorData);
      return NextResponse.json(
        { message: "Failed to fetch LinkedIn profile" },
        { status: response.status },
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error fetching LinkedIn profile:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 },
    );
  }
}
