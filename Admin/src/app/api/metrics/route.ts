import { NextRequest, NextResponse } from "next/server";
import { renderPrometheusMetrics } from "@/lib/metrics";

export const dynamic = "force-dynamic";

/**
 * GET /api/metrics — Prometheus text exposition.
 * Optional: METRICS_TOKEN env + Authorization Bearer or ?token=
 */
export async function GET(request: NextRequest) {
  const expected = process.env.METRICS_TOKEN?.trim();
  if (expected) {
    const auth = request.headers.get("authorization") || "";
    const bearer = auth.startsWith("Bearer ") ? auth.slice(7) : "";
    const q = request.nextUrl.searchParams.get("token") || "";
    if (bearer !== expected && q !== expected) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const body = renderPrometheusMetrics();
  return new NextResponse(body, {
    status: 200,
    headers: {
      "Content-Type": "text/plain; version=0.0.4; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}
