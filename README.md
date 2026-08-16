# SportSphere v3

Multi-platform sports social + performance platform.

## Repository Structure

```
sportsphere-v3/
├── WebApp/          # Fan-facing Web App (Next.js 16)
├── Admin/           # Admin Console (Next.js, port 3003)
├── Flutter/         # Native mobile app (Android + iOS)
├── packages/        # Shared TypeScript packages (design-system, types, api-client)
├── prisma/          # Shared database schema + migrations
├── scripts/         # Deployment & ops scripts
├── nginx/           # Nginx configs
└── docs & reports
```

## Clients

| Client     | Folder    | Tech                          | Port / Notes      |
|------------|-----------|-------------------------------|-------------------|
| Web App    | `WebApp/` | Next.js 16 + React 19         | 3002              |
| Admin      | `Admin/`  | Next.js (separate process)    | 3003              |
| Mobile     | `Flutter/`| Flutter + Riverpod            | Android + iOS     |

All clients share the **same PostgreSQL database** and (where applicable) the same API surface.

## Quick Start

### Web App
```bash
cd WebApp
npm install
npm run dev
```

### Admin
```bash
cd Admin
npm install
npm run dev
```

### Flutter
```bash
cd Flutter
flutter pub get
flutter run
```

See `ARCHITECTURE.md` and `SETUP.md` for full details.
