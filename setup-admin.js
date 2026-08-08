
const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

async function main() {
  const prisma = new PrismaClient();
  const email = "mbazzacodes@sportsphere.com";
  const password = "Sports123!";
  const handle = "mbazzacodes";
  const passwordHash = await bcrypt.hash(password, 10);

  let adminRole = await prisma.role.findFirst({
    where: {
      OR: [
        { name: "ADMINISTRATOR" },
        { name: "ADMIN" }
      ]
    }
  });

  if (!adminRole) {
    adminRole = await prisma.role.create({
      data: {
        name: "ADMINISTRATOR",
        description: "System Administrator"
      }
    });
    console.log("✓ Created new Role record:", adminRole.id);
  } else {
    console.log("✓ Found existing Role record:", adminRole.id, "(", adminRole.name, ")");
  }

  const user = await prisma.user.upsert({
    where: { email },
    update: {
      passwordHash,
      role: adminRole.name,
      roleId: adminRole.id,
      name: "Mbazza Admin"
    },
    create: {
      email,
      handle,
      name: "Mbazza Admin",
      passwordHash,
      role: adminRole.name,
      roleId: adminRole.id
    }
  });

  console.log("✓ Success! Admin user ready:", user.email, "| Role ID:", user.roleId);
  await prisma.$disconnect();
}

main().catch(err => {
  console.error("Failed to create admin:", err);
  process.exit(1);
});
