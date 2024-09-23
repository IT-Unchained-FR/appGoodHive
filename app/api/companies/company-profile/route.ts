// pages/api/company.ts

import { getCompanyData } from "@/lib/fetch-company-data";
import type { NextRequest } from "next/server";

export async function GET(req: NextRequest) {
  const searchParamsEntries = req.nextUrl.searchParams.entries();
  const searchParams = Object.fromEntries(searchParamsEntries);

  const { wallet_address } = searchParams;

  try {
    const companyData = await getCompanyData(wallet_address as string);
    console.log(companyData, "companyData..");
    return new Response(JSON.stringify(companyData), { status: 200 });
  } catch (error) {
    console.log(error, "error..");
    return new Response(
      JSON.stringify({ message: "Error fetching company data" }),
      {
        status: 500,
      }
    );
  }
}
