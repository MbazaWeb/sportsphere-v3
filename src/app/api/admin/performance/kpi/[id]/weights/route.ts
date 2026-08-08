// ─── Admin: KPI Weight management (per KPI) ─────────────────────
//
// POST   /api/admin/performance/kpi/[id]/weights          — add a scope-specific weight
// GET    /api/admin/performance/kpi/[id]/weights          — list all weights for a KPI
// PATCH  /api/admin/performance/kpi/[id]/weights          — bulk update weights
//
// A KPIWeight row represents:
//   "For KPI X, when applied to scope Y (e.g. position=FWD), use weightMultiplier Z
//    and difficultyMultiplier W."
//
// The base KPIConfiguration has the pointsPerUnit values; KPIWeight multipliers
// let admins tune how much each KPI contributes per position/role/competition.
//
// Scopes (scope field):
//   - position    — scopeValue = 'GK' | 'DEF' | 'MID' | 'FWD'
//   - role        — scopeValue = 'player' | 'coach' | 'team'
//   - competition — scopeValue = 'pro' | 'semi-pro' | 'amateur' | 'youth'
//   - ageGroup    — scopeValue = 'U13' | 'U15' | 'U17' | 'U20' | 'Senior'
//
// All routes admin-guarded.

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifyAdminSession } from "@/lib/adminGuard";

interface RouteContext {
  params: Promise<{ id: string }>;
}

const VALID_SCOPES = ["position", "role", "competition", "ageGroup"];

// GET — list all weights for a KPI
export async function GET(request: NextRequest, { params }: RouteContext) {
  const auth = await verifyAdminSession(request);
  if (!auth.authorized) return auth.response;

  try {
    const { id } = await params;
    const weights = await db.kPIWeight.findMany({
      where: { kpiConfigId: id },
      orderBy: [{ scope: "asc" }, { scopeValue: "asc" }],
    });
    return NextResponse.json(weights);
  } catch (error) {
    console.error("Failed to fetch KPI weights:", error);
    return NextResponse.json({ error: "Failed to fetch weights" }, { status: 500 });
  }
}

// POST — add a new weight (or upsert if scope+scopeValue already exists)
export async function POST(request: NextRequest, { params }: RouteContext) {
  const auth = await verifyAdminSession(request);
  if (!auth.authorized) return auth.response;

  try {
    const { id } = await params;
    const body = await request.json();

    const { scope, scopeValue, weightMultiplier, difficultyMultiplier, isActive } = body;

    // Validate
    if (!scope || !scopeValue) {
      return NextResponse.json(
        { error: "Missing required fields: scope, scopeValue" },
        { status: 400 },
      );
    }
    if (!VALID_SCOPES.includes(scope)) {
      return NextResponse.json(
        { error: `Invalid scope. Must be one of: ${VALID_SCOPES.join(", ")}` },
        { status: 400 },
      );
    }

    // Verify KPI exists
    const kpi = await db.kPIConfiguration.findUnique({ where: { id } });
    if (!kpi) {
      return NextResponse.json({ error: "KPI not found" }, { status: 404 });
    }

    // Upsert — unique constraint is (kpiConfigId, scope, scopeValue)
    const weight = await db.kPIWeight.upsert({
      where: {
        kpiConfigId_scope_scopeValue: {
          kpiConfigId: id,
          scope,
          scopeValue,
        },
      },
      create: {
        kpiConfigId: id,
        scope,
        scopeValue,
        weightMultiplier: Number(weightMultiplier ?? 1.0),
        difficultyMultiplier: Number(difficultyMultiplier ?? 1.0),
        isActive: isActive !== false,
      },
      update: {
        weightMultiplier: Number(weightMultiplier ?? 1.0),
        difficultyMultiplier: Number(difficultyMultiplier ?? 1.0),
        isActive: isActive !== false,
      },
    });

    return NextResponse.json(weight, { status: 201 });
  } catch (error) {
    console.error("Failed to create KPI weight:", error);
    return NextResponse.json({ error: "Failed to create weight" }, { status: 500 });
  }
}

// PATCH — bulk update weights (array of { id, weightMultiplier, difficultyMultiplier, isActive })
export async function PATCH(request: NextRequest, { params }: RouteContext) {
  const auth = await verifyAdminSession(request);
  if (!auth.authorized) return auth.response;

  try {
    const { id } = await params;
    const body = await request.json();

    if (!Array.isArray(body.weights)) {
      return NextResponse.json(
        { error: "Expected { weights: [...] }" },
        { status: 400 },
      );
    }

    // Run updates in a transaction
    const results = await db.$transaction(
      body.weights.map((w: any) =>
        db.kPIWeight.update({
          where: { id: w.id, kpiConfigId: id }, // ensure weight belongs to this KPI
          data: {
            weightMultiplier: w.weightMultiplier !== undefined ? Number(w.weightMultiplier) : undefined,
            difficultyMultiplier: w.difficultyMultiplier !== undefined ? Number(w.difficultyMultiplier) : undefined,
            isActive: w.isActive !== undefined ? Boolean(w.isActive) : undefined,
          },
        }),
      ),
    );

    return NextResponse.json({ updated: results.length, weights: results });
  } catch (error) {
    console.error("Failed to bulk update KPI weights:", error);
    return NextResponse.json({ error: "Failed to update weights" }, { status: 500 });
  }
}
