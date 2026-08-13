import { NextRequest, NextResponse } from "next/server";
import { verifyAdmin } from "@/lib/adminGuard";
import { getSportsInventory, syncFromProviders } from "@/lib/sports-sync";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

export async function GET(request: NextRequest) {
  const auth = await verifyAdmin(request);
  if (!auth.authorized) return auth.response;

  try {
    const data = await getSportsInventory();
    return NextResponse.json({ ok: true, ...data });
  } catch (error: unknown) {
    console.error("sports-sync GET:", error);
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const auth = await verifyAdmin(request);
  if (!auth.authorized) return auth.response;

  try {
    const body = await request.json().catch(() => ({}));
    const providers = Array.isArray(body.providers)
      ? body.providers
      : ["thesportsdb", "openligadb", "football-data-org", "ergast"];
    const sports = Array.isArray(body.sports)
      ? body.sports
      : ["football", "f1", "motorsport"];

    const syncResults = await syncFromProviders({ providers, sports });
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

    let inventory = null;
    try {
      inventory = await getSportsInventory();
    } catch (invErr) {
      console.error("inventory refresh after sync:", invErr);
    }

    return NextResponse.json({
      ok: true,
      success: true,
      summary,
      results: syncResults,
      inventory,
      timestamp: new Date().toISOString(),
    });
  } catch (error: unknown) {
    console.error("sports-sync POST:", error);
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
