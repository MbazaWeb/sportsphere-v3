import { PrismaClient } from "@prisma/client";
const db = new PrismaClient();
async function main() {
  // 1. Delete all teams (will also cascade to TeamProfile, etc.)
  const teams = await db.team.deleteMany();
  console.log("Deleted teams: " + teams.count);

  // 2. Delete all leagues
  const leagues = await db.league.deleteMany();
  console.log("Deleted leagues: " + leagues.count);

  // 3. Confirm remaining state
  console.log("\n--- Remaining ---");
  console.log("Sports: " + await db.sport.count());
  console.log("Teams: " + await db.team.count());
  console.log("Leagues: " + await db.league.count());
  console.log("Players: " + await db.player.count());
  console.log("Coaches: " + await db.coach.count());
  console.log("Users: " + await db.user.count());
  console.log("Locations: " + await db.location.count());
  await db.$disconnect();
}
main();
