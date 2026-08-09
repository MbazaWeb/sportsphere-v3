const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

// ── Config (read from env or CLI args — no hardcoded secrets) ─────
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "admin@sportsphere.app";
const ADMIN_HANDLE = process.env.ADMIN_HANDLE || "admin";
const ADMIN_NAME = process.env.ADMIN_NAME || "SportSphere Admin";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

if (!ADMIN_PASSWORD) {
  console.error(
    "ERROR: ADMIN_PASSWORD environment variable is required.\n" +
    "  Usage: ADMIN_PASSWORD='your-secure-password' node setup-admin.js\n" +
    "  Or set it in your .env file."
  );
  process.exit(1);
}

async function main() {
  const prisma = new PrismaClient();
  const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, 10);

  let adminRole = await prisma.role.findFirst({
    where: {
      OR: [
        { slug: "administrator" },
        { name: "Administrator" },
        { name: "ADMINISTRATOR" },
      ],
    },
  });

  if (!adminRole) {
    adminRole = await prisma.role.findFirst({
      where: { slug: "fan" },
    });
    console.warn(
      "⚠ No administrator role found in Role table. " +
      "Using the first available role (" + (adminRole?.slug ?? "none") + "). " +
      "Run db:seed first to create roles."
    );
  }

  if (!adminRole) {
    console.error("ERROR: No roles found at all. Run 'npm run db:seed' first.");
    process.exit(1);
  }

  const user = await prisma.user.upsert({
    where: { email: ADMIN_EMAIL },
    update: {
      passwordHash,
      role: "administrator",
      roleId: adminRole.id,
      name: ADMIN_NAME,
    },
    create: {
      email: ADMIN_EMAIL,
      handle: ADMIN_HANDLE,
      name: ADMIN_NAME,
      passwordHash,
      role: "administrator",
      roleId: adminRole.id,
      roleTypeId: adminRole.types?.[0]?.id ?? "fan-casual-type",
    },
  });

  console.log(
    "✓ Admin user ready:\n" +
    "  Email:  " + user.email + "\n" +
    "  Handle: @" + user.handle + "\n" +
    "  Role:   " + user.role + "\n" +
    "  RoleId: " + user.roleId
  );
  await prisma.$disconnect();
}

main().catch((err) => {
  console.error("Failed to create admin:", err);
  process.exit(1);
});
