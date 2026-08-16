# Players API — Fix #6 (dead raw SQL routes)

## Problem

`/api/players/search` and `/api/players/[id]` use `$queryRaw` against
a `players` table that does not exist in the Prisma schema. These routes
always `500` in production. The raw SQL is parameterized (safe from
injection) but points at a ghost table.

## Fix — Option A: Remove the routes entirely

Delete these files if the players feature is not yet implemented:

```
rm app/api/players/search/route.ts
rm app/api/players/[id]/route.ts
```

## Fix — Option B: Rewrite against `PlayerProfile` + `User`

Replace the `$queryRaw` calls with Prisma's type-safe query builder.
Example for the search route:

```ts
// app/api/players/search/route.ts
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get("q") ?? "";

  const players = await db.playerProfile.findMany({
    where: {
      OR: [
        { user: { username: { contains: q, mode: "insensitive" } } },
        { user: { displayName: { contains: q, mode: "insensitive" } } },
        { sport: { contains: q, mode: "insensitive" } },
      ],
    },
    include: {
      user: {
        select: { id: true, username: true, displayName: true, avatarUrl: true },
      },
    },
    take: 20,
  });

  return NextResponse.json(players);
}
```

Example for the `[id]` route:

```ts
// app/api/players/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const player = await db.playerProfile.findUnique({
    where: { id: params.id },
    include: {
      user: {
        select: { id: true, username: true, displayName: true, avatarUrl: true, role: true },
      },
    },
  });

  if (!player) {
    return NextResponse.json({ error: "Player not found." }, { status: 404 });
  }

  return NextResponse.json(player);
}
```

> ⚠️ Adjust `playerProfile` and field names to match your actual Prisma schema.
