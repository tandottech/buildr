import { NextRequest } from "next/server";
import { requestCredits, getCreditRequests } from "@/lib/locus";

export async function GET() {
  const apiKey = process.env.LOCUS_API_KEY || "";
  const requests = await getCreditRequests(apiKey);
  return Response.json(requests);
}

export async function POST(request: NextRequest) {
  const apiKey = process.env.LOCUS_API_KEY || "";
  const { reason, amount } = await request.json();
  const result = await requestCredits(apiKey, reason, amount);
  return Response.json(result);
}
