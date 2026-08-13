import { NextRequest, NextResponse } from "next/server";
import { verifyAdmin } from "@/lib/adminGuard";
import {
  listCustomProviders,
  saveCustomProvider,
  deleteCustomProvider,
  slugifyId,
  type CustomApiProviderConfig,
  type AuthType,
} from "@/lib/api-providers-store";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const auth = await verifyAdmin(request);
  if (!auth.authorized) return auth.response;
  try {
    const providers = await listCustomProviders();
    // mask keys partially
    const safe = providers.map((p) => ({
      ...p,
      apiKey: p.apiKey
        ? `${p.apiKey.slice(0, 4)}…${p.apiKey.slice(-4)}`
        : "",
      apiKeySet: Boolean(p.apiKey),
    }));
    return NextResponse.json({ ok: true, providers: safe });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : String(e) },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const auth = await verifyAdmin(request);
  if (!auth.authorized) return auth.response;

  try {
    const body = await request.json();
    const name = String(body.name || "").trim();
    const baseUrl = String(body.baseUrl || "").trim();
    if (!name || !baseUrl) {
      return NextResponse.json(
        { ok: false, error: "name and baseUrl are required" },
        { status: 400 }
      );
    }

    let id = String(body.id || "").trim() || slugifyId(name);
    id = id.replace(/^custom-/, "");
    const authType = (body.authType || "header") as AuthType;

    const existing = (await listCustomProviders()).find((p) => p.id === id);
    const apiKey =
      body.apiKey && String(body.apiKey).includes("…")
        ? existing?.apiKey
        : body.apiKey != null
          ? String(body.apiKey)
          : existing?.apiKey;

    let extraHeaders: Record<string, string> | undefined;
    if (body.extraHeaders) {
      if (typeof body.extraHeaders === "string") {
        try {
          extraHeaders = JSON.parse(body.extraHeaders);
        } catch {
          return NextResponse.json(
            { ok: false, error: "extraHeaders must be valid JSON" },
            { status: 400 }
          );
        }
      } else if (typeof body.extraHeaders === "object") {
        extraHeaders = body.extraHeaders;
      }
    }

    const sports = Array.isArray(body.supportedSports)
      ? body.supportedSports.map(String)
      : String(body.supportedSports || "football")
          .split(",")
          .map((s: string) => s.trim())
          .filter(Boolean);

    const row = await saveCustomProvider({
      id,
      name,
      baseUrl,
      authType,
      authHeaderName: body.authHeaderName ? String(body.authHeaderName) : undefined,
      authQueryParam: body.authQueryParam ? String(body.authQueryParam) : undefined,
      apiKey: apiKey || undefined,
      extraHeaders,
      supportedSports: sports.length ? sports : ["football"],
      enabled: body.enabled !== false && body.enabled !== "false",
      competitionsPath: body.competitionsPath || undefined,
      fixturesPath: body.fixturesPath || undefined,
      teamsPath: body.teamsPath || undefined,
      playersPath: body.playersPath || undefined,
      dateParam: body.dateParam || undefined,
      searchParam: body.searchParam || undefined,
      competitionsListPath: body.competitionsListPath || undefined,
      fixturesListPath: body.fixturesListPath || undefined,
      teamsListPath: body.teamsListPath || undefined,
      playersListPath: body.playersListPath || undefined,
      notes: body.notes || undefined,
      createdAt: existing?.createdAt,
    });

    return NextResponse.json({
      ok: true,
      provider: { ...row, apiKey: row.apiKey ? "••••" : "", apiKeySet: Boolean(row.apiKey) },
    });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : String(e) },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  const auth = await verifyAdmin(request);
  if (!auth.authorized) return auth.response;
  try {
    const id = request.nextUrl.searchParams.get("id");
    if (!id) {
      return NextResponse.json({ ok: false, error: "id required" }, { status: 400 });
    }
    const ok = await deleteCustomProvider(id.replace(/^custom-/, ""));
    return NextResponse.json({ ok });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : String(e) },
      { status: 500 }
    );
  }
}
