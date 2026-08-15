# CORS fix for Flutter Web (localhost)

## Why it fails
Browser blocks:
`http://localhost:53302` → `https://sportssphere.fun/sportsphere/api/...`
because the API response has no `Access-Control-Allow-Origin`.

**Android / iOS / desktop native: no CORS problem.**

## Option A — Local Flutter Web (dev only)
```powershell
flutter run -d chrome --web-browser-flag "--disable-web-security" --web-browser-flag "--user-data-dir=C:\Temp\flutter_chrome_dev"
```

## Option B — Fix on API (recommended)
Add to Next.js (e.g. `middleware.ts` or API route headers):

```ts
// middleware.ts (project root of web app)
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const ALLOWED = [
  'http://localhost:3000',
  'http://localhost:53302',
  'http://127.0.0.1:53302',
  'https://sportssphere.fun',
];

export function middleware(request: NextRequest) {
  const origin = request.headers.get('origin') ?? '';
  const res = NextResponse.next();

  if (ALLOWED.some((o) => origin.startsWith(o.replace(/:\d+$/, '')) || origin === o) || origin.includes('localhost')) {
    res.headers.set('Access-Control-Allow-Origin', origin);
    res.headers.set('Access-Control-Allow-Credentials', 'true');
    res.headers.set('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
    res.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, Accept');
  }

  if (request.method === 'OPTIONS') {
    return new NextResponse(null, { status: 204, headers: res.headers });
  }
  return res;
}

export const config = {
  matcher: '/sportsphere/api/:path*',
};
```

Adjust `matcher` if your basePath differs.

## Option C — Same host
Deploy Flutter web under `sportssphere.fun` so origin matches — no CORS needed.
