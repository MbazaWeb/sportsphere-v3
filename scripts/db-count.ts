import { PrismaClient } from "@prisma/client";
const db = new PrismaClient();
async function main() {
  const tables = ["Sport", "Team", "Player", "Coach", "League", "Match", "User", "Location"];
  for (const t of tables) {
    try {
      const model = (db as any)[t.charAt(0).toLowerCase() + t.slice(1)];
      const count = await model.count();
      console.log(t + ": " + count);
    } catch (e: any) {
      console.log(t + ": ERROR " + e.message.slice(0, 60));
    }
  }
  await db.$disconnect();
}
main();
