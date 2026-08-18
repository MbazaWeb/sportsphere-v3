-- ============================================================
-- SportSphere — Supabase Schema
-- Clean, fully-fixed SQL — no reserved word conflicts
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ─── Roles & Sports ───────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS ss_role (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL DEFAULT '',
  slug TEXT NOT NULL DEFAULT '',
  description TEXT,
  category TEXT DEFAULT 'individual',
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ss_role_type (
  id TEXT PRIMARY KEY,
  role_id TEXT NOT NULL DEFAULT '',
  slug TEXT NOT NULL DEFAULT '',
  requirements JSONB DEFAULT '[]',
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ss_sport (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL DEFAULT '',
  slug TEXT NOT NULL DEFAULT '',
  icon TEXT,
  sport_type TEXT,
  contact_type TEXT,
  description TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ss_user_sport (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id TEXT NOT NULL DEFAULT '',
  sport_id TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Users ────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS ss_user (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  name TEXT NOT NULL DEFAULT '',
  handle TEXT NOT NULL UNIQUE DEFAULT '',
  email TEXT UNIQUE,
  password_hash TEXT,
  role TEXT DEFAULT 'fan',
  role_id TEXT,
  role_type_id TEXT,
  avatar_url TEXT,
  avatar_initials TEXT,
  cover_url TEXT,
  cover_gradient TEXT DEFAULT 'from-emerald-600 to-emerald-900',
  bio TEXT,
  location TEXT,
  nationality TEXT,
  country_of_origin TEXT,
  current_country TEXT,
  about_me TEXT,
  type_name TEXT,
  role_data JSONB DEFAULT '{}',
  sports_following JSONB DEFAULT '[]',
  interests JSONB DEFAULT '[]',
  is_verified BOOLEAN DEFAULT FALSE,
  is_pro BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  email_verified BOOLEAN DEFAULT FALSE,
  email_verify_token TEXT,
  email_verify_expiry TIMESTAMPTZ,
  reset_token TEXT,
  reset_token_expiry TIMESTAMPTZ,
  verification_status TEXT DEFAULT 'none',
  gender TEXT,
  font_size TEXT DEFAULT 'medium',
  follower_count INTEGER DEFAULT 0,
  fan_count INTEGER DEFAULT 0,
  following_count INTEGER DEFAULT 0,
  post_count INTEGER DEFAULT 0,
  registered_at TIMESTAMPTZ DEFAULT NOW(),
  last_seen_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Social ───────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS ss_follow (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  follower_id TEXT NOT NULL,
  following_id TEXT NOT NULL,
  kind TEXT DEFAULT 'follow',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(follower_id, following_id)
);

CREATE TABLE IF NOT EXISTS ss_post (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id TEXT NOT NULL,
  content TEXT DEFAULT '',
  post_type TEXT DEFAULT 'post',
  media_urls JSONB DEFAULT '[]',
  team_tag TEXT,
  player_tag TEXT,
  sport_tag TEXT,
  location_tag TEXT,
  community_id TEXT,
  hashtags JSONB DEFAULT '[]',
  is_breaking BOOLEAN DEFAULT FALSE,
  like_count INTEGER DEFAULT 0,
  comment_count INTEGER DEFAULT 0,
  share_count INTEGER DEFAULT 0,
  view_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ss_post_like (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  post_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(post_id, user_id)
);

CREATE TABLE IF NOT EXISTS ss_comment (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  post_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  content TEXT NOT NULL DEFAULT '',
  parent_id TEXT,
  like_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ss_comment_like (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  comment_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(comment_id, user_id)
);

CREATE TABLE IF NOT EXISTS ss_poll (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  post_id TEXT NOT NULL,
  question TEXT NOT NULL DEFAULT '',
  options JSONB DEFAULT '[]',
  ends_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ss_poll_vote (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  poll_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  option_idx INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(poll_id, user_id)
);

CREATE TABLE IF NOT EXISTS ss_prediction (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  post_id TEXT,
  user_id TEXT NOT NULL,
  home_team TEXT NOT NULL DEFAULT '',
  away_team TEXT NOT NULL DEFAULT '',
  predicted_home INTEGER,
  predicted_away INTEGER,
  confidence TEXT,
  result TEXT,
  points_earned INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Communities ──────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS ss_community (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  name TEXT NOT NULL DEFAULT '',
  description TEXT,
  topic TEXT,
  member_count INTEGER DEFAULT 0,
  created_by_id TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ss_community_member (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  community_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  role TEXT DEFAULT 'member',
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(community_id, user_id)
);

-- ─── Messages & Notifications ─────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS ss_message (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  sender_id TEXT NOT NULL,
  receiver_id TEXT NOT NULL,
  content TEXT DEFAULT '',
  media_url TEXT,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ss_notification (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id TEXT NOT NULL,
  title TEXT NOT NULL DEFAULT '',
  body TEXT,
  notif_type TEXT DEFAULT 'info',
  actor_id TEXT,
  target_id TEXT,
  target_type TEXT,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Matches & Sports Data ────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS ss_match (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  league TEXT,
  league_id TEXT,
  home_team TEXT NOT NULL DEFAULT '',
  away_team TEXT NOT NULL DEFAULT '',
  home_score INTEGER,
  away_score INTEGER,
  status TEXT DEFAULT 'upcoming',
  minute INTEGER,
  home_badge TEXT,
  away_badge TEXT,
  venue TEXT,
  country TEXT,
  season TEXT,
  kickoff_at TIMESTAMPTZ,
  events JSONB DEFAULT '[]',
  lineups JSONB DEFAULT '{}',
  stats JSONB DEFAULT '[]',
  external_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ss_team (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  name TEXT NOT NULL DEFAULT '',
  short_name TEXT,
  slug TEXT,
  league_id TEXT,
  country TEXT,
  logo_url TEXT,
  founded_year INTEGER,
  description TEXT,
  source TEXT DEFAULT 'admin',
  created_by_ai BOOLEAN DEFAULT FALSE,
  claimed_by_id TEXT,
  verified BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ss_league (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  name TEXT NOT NULL DEFAULT '',
  slug TEXT,
  sport_id TEXT,
  country TEXT,
  logo_url TEXT,
  division TEXT,
  season TEXT,
  source TEXT DEFAULT 'admin',
  created_by_ai BOOLEAN DEFAULT FALSE,
  claimed_by_id TEXT,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ss_player (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  team_id TEXT,
  sport_id TEXT,
  name TEXT NOT NULL DEFAULT '',
  slug TEXT,
  first_name TEXT,
  last_name TEXT,
  player_position TEXT,
  country_code TEXT,
  date_of_birth TIMESTAMPTZ,
  height_cm INTEGER,
  weight_kg INTEGER,
  photo_url TEXT,
  external_id TEXT,
  verified BOOLEAN DEFAULT FALSE,
  created_by_ai BOOLEAN DEFAULT FALSE,
  claimed_by_id TEXT,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ss_coach (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  team_id TEXT,
  sport_id TEXT,
  name TEXT NOT NULL DEFAULT '',
  slug TEXT,
  first_name TEXT,
  nationality TEXT,
  photo_url TEXT,
  coaching_role TEXT DEFAULT 'head_coach',
  external_id TEXT,
  verified BOOLEAN DEFAULT FALSE,
  created_by_ai BOOLEAN DEFAULT FALSE,
  claimed_by_id TEXT,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ss_player_transfer (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  player_id TEXT NOT NULL,
  from_team_id TEXT,
  to_team_id TEXT,
  transfer_type TEXT DEFAULT 'permanent',
  fee TEXT,
  currency TEXT DEFAULT 'EUR',
  transfer_window TEXT,
  season TEXT,
  announced_at TIMESTAMPTZ,
  effective_at TIMESTAMPTZ,
  loan_until TIMESTAMPTZ,
  status TEXT DEFAULT 'completed',
  notes TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── News & Content ───────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS ss_news_item (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  title TEXT NOT NULL DEFAULT '',
  body TEXT NOT NULL DEFAULT '',
  image_url TEXT,
  category TEXT DEFAULT 'general',
  tags JSONB DEFAULT '[]',
  sport_id TEXT,
  team_id TEXT,
  player_id TEXT,
  coach_id TEXT,
  source_type TEXT DEFAULT 'manual',
  external_url TEXT,
  status TEXT DEFAULT 'draft',
  published_at TIMESTAMPTZ,
  view_count INTEGER DEFAULT 0,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ss_rumor (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  title TEXT NOT NULL DEFAULT '',
  body TEXT,
  source TEXT DEFAULT 'ai',
  credibility_score INTEGER DEFAULT 50,
  external_url TEXT,
  tags JSONB DEFAULT '[]',
  sport_id TEXT,
  team_id TEXT,
  player_id TEXT,
  coach_id TEXT,
  status TEXT DEFAULT 'draft',
  published_at TIMESTAMPTZ,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Performance ──────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS ss_leaderboard_entry (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id TEXT NOT NULL,
  period TEXT DEFAULT 'monthly',
  correct_predictions INTEGER DEFAULT 0,
  total_predictions INTEGER DEFAULT 0,
  points INTEGER DEFAULT 0,
  rank INTEGER DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ss_performance_profile (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id TEXT NOT NULL UNIQUE,
  performance_score DOUBLE PRECISION DEFAULT 0,
  total_points INTEGER DEFAULT 0,
  tier TEXT DEFAULT 'D',
  form_score DOUBLE PRECISION DEFAULT 0,
  consistency_score DOUBLE PRECISION DEFAULT 0,
  trend_direction TEXT DEFAULT 'stable',
  trend_delta DOUBLE PRECISION DEFAULT 0,
  improvement_score DOUBLE PRECISION DEFAULT 0,
  rank_global INTEGER DEFAULT 0,
  rank_country INTEGER DEFAULT 0,
  rank_region INTEGER DEFAULT 0,
  rank_category INTEGER DEFAULT 0,
  category_bucket TEXT DEFAULT '',
  data_confidence DOUBLE PRECISION DEFAULT 0,
  decay_status TEXT DEFAULT 'active',
  last_event_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ss_performance_event (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id TEXT NOT NULL,
  event_type TEXT NOT NULL DEFAULT '',
  match_id TEXT,
  competition TEXT,
  season TEXT,
  opponent_strength DOUBLE PRECISION,
  points_awarded INTEGER DEFAULT 0,
  match_date TIMESTAMPTZ,
  source_type TEXT DEFAULT 'manual',
  status TEXT DEFAULT 'pending',
  verified_by TEXT,
  rejection_reason TEXT,
  notes TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Verification ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS ss_verification_request (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id TEXT NOT NULL,
  status TEXT DEFAULT 'pending',
  admin_notes TEXT,
  role_type_id TEXT,
  submitted_at TIMESTAMPTZ DEFAULT NOW(),
  reviewed_at TIMESTAMPTZ
);

-- ─── Favorites & Push ─────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS ss_user_favorite (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id TEXT NOT NULL,
  target_id TEXT NOT NULL,
  target_type TEXT DEFAULT 'post',
  target_handle TEXT,
  preview TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, target_id, target_type)
);

CREATE TABLE IF NOT EXISTS ss_push_token (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id TEXT NOT NULL,
  token TEXT NOT NULL,
  platform TEXT DEFAULT 'android',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Profiles ─────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS ss_player_profile (
  user_id TEXT PRIMARY KEY,
  player_position TEXT,
  preferred_foot TEXT,
  height_cm DOUBLE PRECISION,
  weight_kg DOUBLE PRECISION,
  date_of_birth TIMESTAMPTZ,
  player_type TEXT,
  appearances DOUBLE PRECISION DEFAULT 0,
  goals DOUBLE PRECISION DEFAULT 0,
  assists DOUBLE PRECISION DEFAULT 0,
  minutes DOUBLE PRECISION DEFAULT 0,
  yellow_cards DOUBLE PRECISION DEFAULT 0,
  red_cards DOUBLE PRECISION DEFAULT 0,
  current_club TEXT,
  contract_status TEXT,
  debut_year TEXT,
  international_caps DOUBLE PRECISION DEFAULT 0,
  playing_style TEXT,
  injury_history TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ss_coach_profile (
  user_id TEXT PRIMARY KEY,
  coaching_role TEXT,
  license TEXT,
  nationality TEXT,
  years_coaching DOUBLE PRECISION DEFAULT 0,
  wins DOUBLE PRECISION DEFAULT 0,
  draws DOUBLE PRECISION DEFAULT 0,
  losses DOUBLE PRECISION DEFAULT 0,
  win_rate DOUBLE PRECISION DEFAULT 0,
  preferred_formation TEXT,
  playing_philosophy TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ss_team_profile (
  user_id TEXT PRIMARY KEY,
  nickname TEXT,
  country TEXT,
  stadium TEXT,
  league TEXT,
  coach TEXT,
  colors TEXT,
  wins DOUBLE PRECISION DEFAULT 0,
  losses DOUBLE PRECISION DEFAULT 0,
  draws DOUBLE PRECISION DEFAULT 0,
  league_position TEXT,
  squad JSONB DEFAULT '[]',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Business & Commercial ────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS ss_business (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  name TEXT NOT NULL DEFAULT '',
  business_type TEXT DEFAULT 'brand',
  website TEXT,
  country TEXT,
  logo_url TEXT,
  cover_url TEXT,
  source TEXT DEFAULT 'admin',
  verified BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ss_commercial_partner (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  name TEXT NOT NULL DEFAULT '',
  partner_type TEXT DEFAULT 'brand',
  industry TEXT,
  website TEXT,
  cover_url TEXT,
  city TEXT,
  contact_name TEXT,
  contact_email TEXT,
  contract_start TIMESTAMPTZ,
  contract_end TIMESTAMPTZ,
  contract_value DOUBLE PRECISION,
  currency TEXT DEFAULT 'USD',
  status TEXT DEFAULT 'pending',
  tier TEXT DEFAULT 'bronze',
  is_active BOOLEAN DEFAULT TRUE,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ss_partner_sponsorship (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  partner_id TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  entity_type TEXT DEFAULT 'team',
  sponsorship_type TEXT DEFAULT 'sponsor',
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ,
  deal_value DOUBLE PRECISION,
  currency TEXT DEFAULT 'USD',
  is_visible BOOLEAN DEFAULT TRUE,
  display_label TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Location ─────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS ss_location (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  name TEXT NOT NULL DEFAULT '',
  location_type TEXT DEFAULT 'city',
  parent_id TEXT,
  country TEXT,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  display_label TEXT NOT NULL DEFAULT '',
  population INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Indexes ──────────────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_post_user ON ss_post(user_id);
CREATE INDEX IF NOT EXISTS idx_post_created ON ss_post(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_post_community ON ss_post(community_id);
CREATE INDEX IF NOT EXISTS idx_follow_follower ON ss_follow(follower_id);
CREATE INDEX IF NOT EXISTS idx_follow_following ON ss_follow(following_id);
CREATE INDEX IF NOT EXISTS idx_comment_post ON ss_comment(post_id);
CREATE INDEX IF NOT EXISTS idx_notification_user ON ss_notification(user_id);
CREATE INDEX IF NOT EXISTS idx_message_sender ON ss_message(sender_id);
CREATE INDEX IF NOT EXISTS idx_message_receiver ON ss_message(receiver_id);
CREATE INDEX IF NOT EXISTS idx_match_status ON ss_match(status);
CREATE INDEX IF NOT EXISTS idx_match_kickoff ON ss_match(kickoff_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_handle ON ss_user(handle);
CREATE INDEX IF NOT EXISTS idx_user_email ON ss_user(email);
CREATE INDEX IF NOT EXISTS idx_leaderboard_points ON ss_leaderboard_entry(points DESC);

-- ─── Storage Buckets ──────────────────────────────────────────────────────────

INSERT INTO storage.buckets (id, name, public) VALUES
  ('avatars', 'avatars', true),
  ('covers',  'covers',  true),
  ('posts',   'posts',   true),
  ('media',   'media',   true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies
CREATE POLICY IF NOT EXISTS "avatars_public_read" ON storage.objects FOR SELECT USING (bucket_id = 'avatars');
CREATE POLICY IF NOT EXISTS "avatars_auth_upload" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'avatars' AND auth.uid() IS NOT NULL);
CREATE POLICY IF NOT EXISTS "posts_public_read"   ON storage.objects FOR SELECT USING (bucket_id = 'posts');
CREATE POLICY IF NOT EXISTS "posts_auth_upload"   ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'posts' AND auth.uid() IS NOT NULL);
CREATE POLICY IF NOT EXISTS "covers_public_read"  ON storage.objects FOR SELECT USING (bucket_id = 'covers');
CREATE POLICY IF NOT EXISTS "covers_auth_upload"  ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'covers' AND auth.uid() IS NOT NULL);
