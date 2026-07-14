import { NextResponse } from "next/server";
import { MOCK_TRADERS } from "@/lib/mock-data";
import { proxyToBackend } from "@/lib/backend-proxy";

export async function GET() {
  const result = await proxyToBackend("/v1/profile");
  if (result?.ok) {
    return NextResponse.json(result.data);
  }
  return NextResponse.json(MOCK_TRADERS[0]);
}
