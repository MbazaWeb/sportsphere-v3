BEGIN;

-- Delete all sports (they will cascade via FK)
DELETE FROM "Sport";

-- Insert 7 Tanzania sports
INSERT INTO "Sport" ("id", "name", "slug", "icon", "category", "sportType", "format", "contactType", "olympicStatus", "description", "tags", "isActive", "displayOrder", "createdAt", "updatedAt") VALUES
('9b0f68d7-0bb5-4841-814a-4a288f651e13', 'Football', 'football', '\u26BD', 'team', 'team_sport', '11v11', 'full_contact', 'yes', 'Association football - the most popular sport in Tanzania.', '["popular","tanzania","team","outdoor"]', true, 1, NOW(), NOW()),
('a1b2c3d4-basketball', 'Basketball', 'basketball', '\uD83C\uDFC0', 'team', 'team_sport', '5v5', 'limited_contact', 'yes', 'Basketball growing rapidly in Tanzania.', '["popular","tanzania","team","indoor"]', true, 2, NOW(), NOW()),
('a1b2c3d4-athletics', 'Athletics', 'athletics', '\uD83C\uDFC3', 'individual', 'individual', 'individual_and_relay', 'non_contact', 'yes', 'Track and field athletics - Tanzania has produced world-class marathon athletes.', '["tanzania","individual","outdoor","olympic"]', true, 3, NOW(), NOW()),
('a1b2c3d4-boxing', 'Boxing', 'boxing', '\uD83E\uDD4A', 'individual', 'combat', 'individual', 'full_contact', 'yes', 'Boxing has a strong tradition in Tanzania.', '["tanzania","individual","combat","olympic"]', true, 4, NOW(), NOW()),
('a1b2c3d4-volleyball', 'Volleyball', 'volleyball', '\uD83C\uDFD0', 'team', 'team_sport', '6v6', 'non_contact', 'yes', 'Volleyball widely played across Tanzania.', '["tanzania","team","indoor","beach","olympic"]', true, 5, NOW(), NOW()),
('a1b2c3d4-netball', 'Netball', 'netball', '\uD83C\uDFAF', 'team', 'team_sport', '7v7', 'non_contact', 'commonwealth', 'Netball is one of the most popular women sports in Tanzania.', '["tanzania","team","women","indoor","commonwealth"]', true, 6, NOW(), NOW()),
('a1b2c3d4-rugby', 'Rugby', 'rugby', '\uD83C\uDFC9', 'team', 'team_sport', '15v15', 'full_contact', 'sevens_olympic', 'Rugby developing in Tanzania with the Twigas national team.', '["tanzania","team","outdoor","contact","rugby"]', true, 7, NOW(), NOW());

-- Re-link leagues to correct sports
UPDATE "League" SET "sportId" = '9b0f68d7-0bb5-4841-814a-4a288f651e13' WHERE "slug" IN ('vodacom-premier-league', 'nbc-premier-league', 'azam-federation-cup', 'community-shield', 'kagame-interclub-cup');
UPDATE "League" SET "sportId" = 'a1b2c3d4-basketball' WHERE "slug" = 'national-basketball-league';
UPDATE "League" SET "sportId" = 'a1b2c3d4-volleyball' WHERE "slug" = 'national-volleyball-league';
UPDATE "League" SET "sportId" = 'a1b2c3d4-netball' WHERE "slug" = 'national-netball-league';
UPDATE "League" SET "sportId" = 'a1b2c3d4-rugby' WHERE "slug" = 'national-rugby-league';

-- Re-link teams to correct sports
UPDATE "Team" SET "sportId" = '9b0f68d7-0bb5-4841-814a-4a288f651e13' WHERE "slug" IN ('simba-sc','young-africans-sc','azam-fc','kmc-fc','tanzania-prisons-sc','namungo-fc','mtibwa-sugar-fc','kagera-sugar-fc','biashara-united','singida-big-stars-fc','pamba-jiji-fc','dodoma-jiji-fc','coastal-union-fc','jkt-tanzania-fc','gmc-fc','kipanga-fc');
UPDATE "Team" SET "sportId" = 'a1b2c3d4-basketball' WHERE "slug" IN ('abc-giants','don-bosco-lions','arusha-pacers','mwanza-titans');

COMMIT;
