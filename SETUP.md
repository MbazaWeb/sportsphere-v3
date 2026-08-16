# SportSphere - Setup Guide

## Project Overview
SportSphere is a sports-focused social + performance platform built with:
- **Next.js 16** (App Router) — Web + Admin
- **Flutter** — sole native mobile client (Android + iOS)
- **TypeScript / Prisma / PostgreSQL**
- **Tailwind CSS v4** (web)

The previous Expo / React Native and Capacitor mobile paths have been removed. Use the `Flutter/` directory for all native mobile work.

---

## Quick Start (Web)

### Prerequisites
- Node.js 18+ or Bun
- npm or Bun

### 1. Install Dependencies
```bash
npm install
# or: bun install
```

### 2. Run Development Server
```bash
npm run dev
# or: bun run dev
```

### 3. Open in Browser
```
http://localhost:3000
```

### 4. Build for Production
```bash
npm run build
# or: bun run build
```

---

## Mobile (Flutter)

```bash
cd Flutter
flutter pub get
flutter run
```

See `Flutter/README.md` and `Flutter/API_MAP.md` for more details.

---

