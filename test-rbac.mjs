import fs from "fs";
import path from "path";
import { PrismaClient } from "@prisma/client";

// Load .env explicitly
const envPath = path.resolve("/var/www/sportsphere-nextjs/.env");
if (fs.existsSync(envPath)) {
  const envConfig = fs.readFileSync(envPath, "utf8");
  for (const line of envConfig.split("\n")) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith("#") && trimmed.includes("=")) {
      const [key, ...values] = trimmed.split("=");
      process.env[key.trim()] = values.join("=").trim().replace(/^["']|["']$/g, "");
    }
  }
}

// Dynamic import after env variables are set
const { signSession } = await import("./src/lib/session.js");

async function runRbacTests() {
  const prisma = new PrismaClient();
  const baseUrl = "http://localhost:3000";

  console.log("=========================================");
  console.log("   RUNNING RBAC SECURITY TEST SUITE   ");
  console.log("=========================================\n");

  const fanUser = await prisma.user.findUnique({ where: { email: "fan_test@sportsphere.com" } });
  const adminUser = await prisma.user.findUnique({ where: { email: "mbazzacodes@sportsphere.com" } });

  if (!fanUser || !adminUser) {
    console.error("❌ Required test accounts not found in database!");
    process.exit(1);
  }

  const fanToken = await signSession({
    sub: fanUser.id,
    email: fanUser.email,
    handle: fanUser.handle || "fan_test",
    role: fanUser.role,
    roleId: fanUser.roleId ?? undefined,
    roleTypeId: fanUser.roleTypeId ?? undefined,
  });

  const adminToken = await signSession({
    sub: adminUser.id,
    email: adminUser.email,
    handle: adminUser.handle || "mbazzacodes",
    role: adminUser.role,
    roleId: adminUser.roleId ?? undefined,
    roleTypeId: adminUser.roleTypeId ?? undefined,
  });

  const endpoints = [
    "/api/admin/stats",
    "/api/admin/users",
    "/api/admin/posts",
  ];

  let passed = 0;
  let failed = 0;

  console.log("--- TEST CASE 1: Unauthenticated Requests (No Cookie) ---");
  for (const endpoint of endpoints) {
    const res = await fetch(baseUrl + endpoint);
    if (res.status === 401 || res.status === 403) {
      console.log(`✓ PASS [${res.status}]: Unauthenticated request blocked on ${endpoint}`);
      passed++;
    } else {
      console.error(`❌ FAIL [${res.status}]: Access allowed on ${endpoint}`);
      failed++;
    }
  }

  console.log("\n--- TEST CASE 2: Non-Admin User Requests (FAN Role) ---");
  for (const endpoint of endpoints) {
    const res = await fetch(baseUrl + endpoint, {
      headers: { Cookie: `ss_session=${fanToken}` },
    });
    if (res.status === 403) {
      console.log(`✓ PASS [${res.status}]: Blocked FAN user (${fanUser.email}) from ${endpoint}`);
      passed++;
    } else {
      const body = await res.text();
      console.error(`❌ FAIL [${res.status}]: FAN user received ${res.status} on ${endpoint} - ${body}`);
      failed++;
    }
  }

  console.log("\n--- TEST CASE 3: Admin User Requests (ADMINISTRATOR Role) ---");
  for (const endpoint of endpoints) {
    const res = await fetch(baseUrl + endpoint, {
      headers: { Cookie: `ss_session=${adminToken}` },
    });
    if (res.status === 200) {
      console.log(`✓ PASS [${res.status}]: Admin user (${adminUser.email}) granted access to ${endpoint}`);
      passed++;
    } else {
      const body = await res.text();
      console.error(`❌ FAIL [${res.status}]: Admin user denied access to ${endpoint} - Response: ${body}`);
      failed++;
    }
  }

  console.log("\n=========================================");
  console.log(`   TEST SUMMARY: ${passed} PASSED / ${failed} FAILED   `);
  console.log("=========================================");

  await prisma.$disconnect();
  if (failed > 0) process.exit(1);
}

runRbacTests();
