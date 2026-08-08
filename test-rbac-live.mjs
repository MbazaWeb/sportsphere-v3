import { PrismaClient } from "@prisma/client";

async function runLiveRbacTests() {
  const prisma = new PrismaClient();
  const baseUrl = "http://localhost:3000";

  console.log("=========================================");
  console.log("   RUNNING LIVE AUTH RBAC TEST SUITE   ");
  console.log("=========================================\n");

  // 1. Obtain authentic admin session cookie via login route
  const adminRes = await fetch(`${baseUrl}/api/auth`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "mbazzacodes@sportsphere.com", password: "Sports123!" }),
  });
  const adminCookie = adminRes.headers.get("set-cookie");

  // 2. Obtain authentic fan session cookie via login route
  const fanRes = await fetch(`${baseUrl}/api/auth`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "fan_test@sportsphere.com", password: "Password123!" }),
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
