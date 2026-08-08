// ─── Admin: Single KPI Configuration + Weight management ────────
//
// GET    /api/admin/performance/kpi/[id]          — fetch one KPI (with weights)
// PUT    /api/admin/performance/kpi/[id]          — update KPI config fields
// DELETE /api/admin/performance/kpi/[id]          — soft-delete (set isActive=false)
//
// All routes admin-guarded.

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifyAdminSession } from "@/lib/adminGuard";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, { params }: RouteContext) {
  const auth = await verifyAdminSession(request);
  if (!auth.authorized) return auth.response;

  try {
    const { id } = await params;
    const kpi = await db.kPIConfiguration.findUnique({
      where: { id },
      include: { weights: true },
    });

    if (!kpi) {
      return NextResponse.json({ error: "KPI not found" }, { status: 404 });
    }
    return NextResponse.json(kpi);
  } catch (error) {
    console.error("Failed to fetch KPI:", error);
    return NextResponse.json({ error: "Failed to fetch KPI" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: RouteContext) {
  const auth = await verifyAdminSession(request);
  if (!auth.authorized) return auth.response;

  try {
    const { id } = await params;
    const body = await request.json();

    // Verify exists
    const existing = await db.kPIConfiguration.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "KPI not found" }, { status: 404 });
    }

    // Build update data — only allow safe fields (not kpiKey, which is the unique key)
    const update: any = {};
    const allowedFields = [
      "label", "category", "description",
      "positivePointsPerUnit", "negativePointsPerUnit",
      "maxContributionPerMatch", "maxContributionPerSeason",
      "minValue", "maxValue", "isActive",
      "appliesToRoles", "appliesToPositions",
    ];
    for (const f of allowedFields) {
      if (body[f] !== undefined) {
        if (f === "appliesToRoles" || f === "appliesToPositions") {
          update[f] = Array.isArray(body[f]) ? body[f] : [];
        } else if (["positivePointsPerUnit", "negativePointsPerUnit", "maxContributionPerMatch", "maxContributionPerSeason", "minValue", "maxValue"].includes(f)) {
          update[f] = Number(body[f]);
        } else if (f === "isActive") {
          update[f] = Boolean(body[f]);
        } else {
          update[f] = body[f];
        }
      }
    }

    const updated = await db.kPIConfiguration.update({
      where: { id },
      data: update,
      include: { weights: true },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Failed to update KPI:", error);
    return NextResponse.json({ error: "Failed to update KPI" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: RouteContext) {
  const auth = await verifyAdminSession(request);
  if (!auth.authorized) return auth.response;

  try {
    const { id } = await params;

    // Soft delete — set isActive=false (preserves audit history on existing events)
    const existing = await db.kPIConfiguration.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "KPI not found" }, { status: 404 });
    }

    await db.kPIConfiguration.update({
      where: { id },
      data: { isActive: false },
    });

    return NextResponse.json({ success: true, deactivated: id });
  } catch (error) {
    console.error("Failed to deactivate KPI:", error);
    return NextResponse.json({ error: "Failed to deactivate KPI" }, { status: 500 });
  }
}
