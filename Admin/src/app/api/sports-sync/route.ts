import { NextRequest, NextResponse } from "next/server";
import { verifyAdmin } from "@/lib/adminGuard";
import { getSportsInventory, syncFromProviders, type SyncResult } from "@/lib/sports-sync";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

const KNOWN_PROVIDERS = [
  "thesportsdb",
  "openligadb",
  "football-data-org",
  "sportmonks",
  "ergast",
] as const;

const KNOWN_SPORTS = ["football", "basketball", "f1", "motorsport", "formula-1"] as const;

function safeMessage(err: unknown): string {
  const raw = err instanceof Error ? err.message : String(err);
  return raw
    .replace(/api_token=[^&\s]+/gi, "api_token=***")
    .replace(/X-Auth-Token["\s:]+[^\s,"}]+/gi, "X-Auth-Token:***")
    .replace(/Bearer\s+\S+/gi, "Bearer ***")
    .slice(0, 500);
}

function classifySync(results: SyncResult[]) {
  const totalErrors = results.reduce((n, r) => n + r.errors.length, 0);
  const failedRuns = results.filter((r) => r.errors.length > 0 && !hadAnyWrites(r));
  const partialRuns = results.filter((r) => r.errors.length > 0 && hadAnyWrites(r));
  const okRuns = results.filter((r) => r.errors.length === 0);
  const skipped = results.filter((r) =>
    r.errors.some((e) => /skipped|missing.*token|set .*TOKEN/i.test(e))
  );

  return {
    totalErrors,
    failedRuns: failedRuns.length,
    partialRuns: partialRuns.length,
    okRuns: okRuns.length,
    skippedRuns: skipped.length,
    status:
      results.length === 0
        ? ("empty" as const)
        : totalErrors === 0
          ? ("success" as const)
          : okRuns.length > 0 || partialRuns.length > 0
            ? ("partial" as const)
            : skipped.length === results.length
              ? ("skipped" as const)
              : ("failed" as const),
  };
}

function hadAnyWrites(r: SyncResult): boolean {
  return (
    r.leaguesCreated +
      r.leaguesUpdated +
      r.teamsCreated +
      r.teamsUpdated +
      r.playersCreated +
      r.playersUpdated +
      r.coachesCreated +
      r.coachesUpdated +
      r.matchesCreated +
      r.matchesUpdated >
    0
  );
}

function trimErrors(results: SyncResult[], maxPerRun = 12): SyncResult[] {
  return results.map((r) => ({
    ...r,
    errors: r.errors.slice(0, maxPerRun).map((e) => e.slice(0, 400)),
  }));
}

export async function GET(request: NextRequest) {
  const auth = await verifyAdmin(request);
  if (!auth.authorized) return auth.response;

  try {
    const data = await getSportsInventory();
    return NextResponse.json({ ok: true, ...data });
  } catch (error: unknown) {
    console.error("sports-sync GET:", error);
    return NextResponse.json(
      {
        ok: false,
        error: safeMessage(error),
        code: "INVENTORY_FAILED",
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const auth = await verifyAdmin(request);
  if (!auth.authorized) return auth.response;

  let body: Record<string, unknown> = {};
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json(
      { ok: false, error: "Invalid JSON body", code: "BAD_REQUEST" },
      { status: 400 }
    );
  }

  try {
    const rawProviders = Array.isArray(body.providers)
      ? (body.providers as unknown[]).map(String)
      : ["thesportsdb", "openligadb", "football-data-org", "ergast"];
    const rawSports = Array.isArray(body.sports)
      ? (body.sports as unknown[]).map(String)
      : ["football", "f1", "motorsport"];

    const providers = rawProviders.filter((p) =>
      (KNOWN_PROVIDERS as readonly string[]).includes(p)
    );
    const sports = rawSports.filter((s) =>
      (KNOWN_SPORTS as readonly string[]).includes(s)
    );

    if (providers.length === 0) {
      return NextResponse.json(
        {
          ok: false,
          error: `No valid providers. Allowed: ${KNOWN_PROVIDERS.join(", ")}`,
          code: "INVALID_PROVIDERS",
        },
        { status: 400 }
      );
    }
    if (sports.length === 0) {
      return NextResponse.json(
        {
          ok: false,
          error: `No valid sports. Allowed: ${KNOWN_SPORTS.join(", ")}`,
          code: "INVALID_SPORTS",
        },
        { status: 400 }
      );
    }

    const startedAt = Date.now();
    let syncResults: SyncResult[];
    try {
      syncResults = await syncFromProviders({ providers, sports });
    } catch (syncErr) {
      console.error("sports-sync POST fatal:", syncErr);
      return NextResponse.json(
        {
          ok: false,
          success: false,
          error: safeMessage(syncErr),
          code: "SYNC_FATAL",
          timestamp: new Date().toISOString(),
          elapsedMs: Date.now() - startedAt,
        },
        { status: 500 }
      );
    }

    // Sanitize + cap errors for client
    syncResults = trimErrors(
      syncResults.map((r) => ({
        ...r,
        errors: r.errors.map(safeMessage),
      }))
    );

    const summary = syncResults.reduce(
      (acc, r) => {
        acc.leaguesCreated += r.leaguesCreated;
        acc.leaguesUpdated += r.leaguesUpdated;
        acc.teamsCreated += r.teamsCreated;
        acc.teamsUpdated += r.teamsUpdated;
        acc.playersCreated += r.playersCreated;
        acc.playersUpdated += r.playersUpdated;
        acc.coachesCreated += r.coachesCreated;
        acc.coachesUpdated += r.coachesUpdated;
        acc.matchesCreated += r.matchesCreated;
        acc.matchesUpdated += r.matchesUpdated;
        acc.errors += r.errors.length;
        return acc;
      },
      {
        leaguesCreated: 0,
        leaguesUpdated: 0,
        teamsCreated: 0,
        teamsUpdated: 0,
        playersCreated: 0,
        playersUpdated: 0,
        coachesCreated: 0,
        coachesUpdated: 0,
        matchesCreated: 0,
        matchesUpdated: 0,
        errors: 0,
      }
    );

    const meta = classifySync(syncResults);

    let inventory = null;
    let inventoryError: string | null = null;
    try {
      inventory = await getSportsInventory();
    } catch (invErr) {
      console.error("inventory refresh after sync:", invErr);
      inventoryError = safeMessage(invErr);
    }

    const httpStatus =
      meta.status === "failed" ? 207 : meta.status === "empty" ? 422 : 200;

    return NextResponse.json(
      {
        ok: meta.status !== "failed" && meta.status !== "empty",
        success: meta.status === "success",
        partial: meta.status === "partial",
        status: meta.status,
        meta,
        summary,
        results: syncResults,
        inventory,
        inventoryError,
        providersRequested: providers,
        sportsRequested: sports,
        timestamp: new Date().toISOString(),
        elapsedMs: Date.now() - startedAt,
      },
      { status: httpStatus }
    );
  } catch (error: unknown) {
    console.error("sports-sync POST:", error);
    return NextResponse.json(
      {
        ok: false,
        success: false,
        error: safeMessage(error),
        code: "UNEXPECTED",
      },
      { status: 500 }
    );
  }
}
