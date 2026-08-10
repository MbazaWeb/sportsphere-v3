/**
 * test-rbac-live.mjs
 *
 * Live RBAC smoke-test against a running server.
 *
 * Usage:
 *   ADMIN_EMAIL=admin@example.com \
 *   ADMIN_PASSWORD=<from env / password manager> \
 *   FAN_EMAIL=fan@example.com \
 *   FAN_PASSWORD=<from env / password manager> \
 *   BASE_URL=http://localhost:3000 \
 *   node test-rbac-live.mjs
 *
 * Never commit real credentials. Store them in .env.local (gitignored)
 * or your CI secret store and pass them via environment variables.
 */
import { PrismaClient } from "@prisma/client";

async function runLiveRbacTests() {
  const prisma = new PrismaClient();

  const baseUrl = process.env.BASE_URL ?? "http://localhost:3000";
  const adminEmail = process.env.ADMIN_EMAIL;
  const adminPassword = process.env.ADMIN_PASSWORD;
  const fanEmail = process.env.FAN_EMAIL;
  const fanPassword = process.env.FAN_PASSWORD;

  if (!adminEmail || !adminPassword || !fanEmail || !fanPassword) {
    console.error(
      "ERROR: Set ADMIN_EMAIL, ADMIN_PASSWORD, FAN_EMAIL, FAN_PASSWORD as environment variables.\n" +
      "Never hardcode credentials in source files."
    );
    process.exit(1);
  }

  console.log("=========================================");
  console.log("   RUNNING LIVE AUTH RBAC TEST SUITE   ");
  console.log("=========================================\n");

  const adminRes = await fetch(`${baseUrl}/api/auth`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: adminEmail, password: adminPassword }),
  });
  const adminCookie = adminRes.headers.get("set-cookie");

  const fanRes = await fetch(`${baseUrl}/api/auth`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: fanEmail, password: fanPassword }),
  });
  const fanCookie = fanRes.headers.get("set-cookie");

  const endpoints = [
    "/api/admin/stats",
    "/api/admin/users",
    "/api/admin/posts",
  ];

  let passed = 0;
  let failed = 0;

  console.log("--- TEST CASE 1: Unauthenticated Requests (No Cookie) ---");
  for (const ep of endpoints) {
    const res = await fetch(baseUrl + ep);
    if (res.status === 401 || res.status === 403) {
      console.log(`✓ PASS [${res.status}]: Unauthenticated request blocked on ${ep}`);
      passed++;
    } else {
      console.error(`❌ FAIL [${res.status}]: Unauthenticated allowed on ${ep}`);
      failed++;
    }
  }

  console.log("\n--- TEST CASE 2: Non-Admin User (FAN Role) ---");
  for (const ep of endpoints) {
    const res = await fetch(baseUrl + ep, {
      headers: { Cookie: fanCookie || "" },
    });
    if (res.status === 403) {
      console.log(`✓ PASS [403]: Blocked FAN user from ${ep}`);
      passed++;
    } else {
      const text = await res.text();
      console.error(`❌ FAIL [${res.status}]: FAN user on ${ep} - Response: ${text.slice(0, 100)}`);
      failed++;
    }
  }

  console.log("\n--- TEST CASE 3: Admin User (ADMINISTRATOR Role) ---");
  for (const ep of endpoints) {
    const res = await fetch(baseUrl + ep, {
      headers: { Cookie: adminCookie || "" },
    });
    if (res.status === 200) {
      console.log(`✓ PASS [200]: Admin user granted access to ${ep}`);
      passed++;
    } else {
      const text = await res.text();
      console.error(`❌ FAIL [${res.status}]: Admin user denied access on ${ep} - Response: ${text.slice(0, 100)}`);
      failed++;
    }
  }

  console.log("\n=========================================");
  console.log(`   TEST SUMMARY: ${passed} PASSED / ${failed} FAILED   `);
  console.log("=========================================");

  await prisma.$disconnect();
  if (failed > 0) process.exit(1);
}

runLiveRbacTests();
