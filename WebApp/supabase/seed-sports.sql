-- Seed core sports so fan web + Flutter + admin stay in sync.
-- Football id matches existing ss_league.sport_id values.

INSERT INTO ss_sport (id, name, slug, icon, sport_type, contact_type, description, is_active, display_order)
VALUES
  ('82842919-643c-41ab-89a6-38f7017d9012', 'Football', 'football', '⚽', 'team', 'contact', 'Association football in Tanzania and Africa', true, 1),
  ('sport-basketball', 'Basketball', 'basketball', '🏀', 'team', 'contact', 'Basketball', true, 2),
  ('sport-athletics', 'Athletics', 'athletics', '🏃', 'individual', 'none', 'Track and field', true, 3),
  ('sport-boxing', 'Boxing', 'boxing', '🥊', 'individual', 'contact', 'Boxing', true, 4),
  ('sport-volleyball', 'Volleyball', 'volleyball', '🏐', 'team', 'contact', 'Volleyball', true, 5),
  ('sport-netball', 'Netball', 'netball', '🥅', 'team', 'contact', 'Netball', true, 6),
  ('sport-rugby', 'Rugby', 'rugby', '🏉', 'team', 'contact', 'Rugby', true, 7)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  slug = EXCLUDED.slug,
  is_active = true;

INSERT INTO ss_role (id, name, slug, description, category, display_order, is_active)
VALUES
  ('role-fan', 'Fan', 'fan', 'Passionate supporters', 'individual', 1, true),
  ('role-player', 'Player', 'player', 'Athletes', 'individual', 2, true),
  ('role-admin', 'Admin', 'admin', 'Platform administrator', 'admin', 99, true)
ON CONFLICT (id) DO NOTHING;
