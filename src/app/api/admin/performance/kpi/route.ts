// ─── Admin: Performance KPI Configuration ───────────────────────
//
// GET  /api/admin/performance/kpi          — list all KPI configs (with weights)
// POST /api/admin/performance/kpi          — create a new KPI configuration
//
// All routes are admin-guarded via verifyAdminSession.
//
// Per the master admin spec §8 (PERFORMANCE & RANKING DEPARTMENT):
//   PERFORMANCE_DIRECTOR — owns the KPI framework (this endpoint)
//   PERFORMANCE_ADMIN    — monitors events, can also view (read-only)
// For now we accept any admin; department-level RBAC can be layered later.

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifyAdminSession } from "@/lib/adminGuard";

export async function GET(request: NextRequest) {
  const auth = await verifyAdminSession(request);
  if (!auth.authorized) return auth.response;

  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");
    const activeOnly = searchParams.get("active") === "1";

    const where: any = {};
    if (category) where.category = category;
    if (activeOnly) where.isActive = true;

    const kpis = await db.kPIConfiguration.findMany({
      where,
      include: {
        weights: {
          orderBy: [{ scope: "asc" }, { scopeValue: "asc" }],
        },
      },
      orderBy: [
        { category: "asc" },
        { kpiKey: "asc" },
      ],
    });

    return NextResponse.json(kpis);
  } catch (error) {
    console.error("Failed to fetch KPI configs:", error);
    return NextResponse.json({ error: "Failed to fetch KPI configs" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const auth = await verifyAdminSession(request);
  if (!auth.authorized) return auth.response;

  try {
    const body = await request.json();

    // Validate required fields
    const { kpiKey, label, category } = body;
    if (!kpiKey || !label || !category) {
      return NextResponse.json(
        { error: "Missing required fields: kpiKey, label, category" },
        { status: 400 },
      );
    }

    // Validate kpiKey format (snakeCase, no spaces)
    if (!/^[a-z][a-zA-Z0-9]*$/.test(kpiKey)) {
      return NextResponse.json(
        { error: "kpiKey must be camelCase (letters only, starts lowercase)" },
        { status: 400 },
      );
    }

    // Check for duplicate kpiKey
    const existing = await db.kPIConfiguration.findUnique({ where: { kpiKey } });
    if (existing) {
      return NextResponse.json(
        { error: `KPI with key "${kpiKey}" already exists` },
        { status: 409 },
      );
    }

    const created = await db.kPIConfiguration.create({
      data: {
        kpiKey,
        label,
        category,
        appliesToRoles: body.appliesToRoles ?? [],
        appliesToPositions: body.appliesToPositions ?? [],
        positivePointsPerUnit: Number(body.positivePointsPerUnit ?? 0),
        negativePointsPerUnit: Number(body.negativePointsPerUnit ?? 0),
        maxContributionPerMatch: Number(body.maxContributionPerMatch ?? 0),
        maxContributionPerSeason: Number(body.maxContributionPerSeason ?? 0),
        minValue: Number(body.minValue ?? 0),
        maxValue: Number(body.maxValue ?? 100),
        isActive: body.isActive !== false,
        description: body.description ?? null,
      },
    });

    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    console.error("Failed to create KPI config:", error);
    return NextResponse.json({ error: "Failed to create KPI config" }, { status: 500 });
  }
}
