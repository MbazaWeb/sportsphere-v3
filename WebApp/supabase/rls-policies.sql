-- SportSphere Row Level Security Policies
-- Run this AFTER schema.sql in Supabase SQL Editor

-- Enable RLS on all tables
ALTER TABLE "user" ENABLE ROW LEVEL SECURITY;
ALTER TABLE post ENABLE ROW LEVEL SECURITY;
ALTER TABLE follow ENABLE ROW LEVEL SECURITY;
ALTER TABLE comment ENABLE ROW LEVEL SECURITY;
ALTER TABLE message ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification ENABLE ROW LEVEL SECURITY;
ALTER TABLE community ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_member ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_like ENABLE ROW LEVEL SECURITY;
ALTER TABLE poll_vote ENABLE ROW LEVEL SECURITY;

-- Users: public read, own write
CREATE POLICY "users_public_read" ON "user" FOR SELECT USING (true);
CREATE POLICY "users_own_update" ON "user" FOR UPDATE USING (auth.uid()::text = id);

-- Posts: public read, authenticated create, own update/delete
CREATE POLICY "posts_public_read" ON post FOR SELECT USING (true);
CREATE POLICY "posts_auth_create" ON post FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "posts_own_update" ON post FOR UPDATE USING (auth.uid()::text = "userId");
CREATE POLICY "posts_own_delete" ON post FOR DELETE USING (auth.uid()::text = "userId");

-- Comments: public read, auth create, own delete
CREATE POLICY "comments_public_read" ON comment FOR SELECT USING (true);
CREATE POLICY "comments_auth_create" ON comment FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "comments_own_delete" ON comment FOR DELETE USING (auth.uid()::text = "userId");

-- Messages: only sender/receiver can read
CREATE POLICY "messages_own_read" ON message FOR SELECT 
  USING (auth.uid()::text = "senderId" OR auth.uid()::text = "receiverId");
CREATE POLICY "messages_auth_create" ON message FOR INSERT 
  WITH CHECK (auth.uid()::text = "senderId");

-- Notifications: only own
CREATE POLICY "notifications_own" ON notification FOR SELECT 
  USING (auth.uid()::text = "userId");

-- Follows: public read, auth create, own delete
CREATE POLICY "follows_public_read" ON follow FOR SELECT USING (true);
CREATE POLICY "follows_auth_create" ON follow FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "follows_own_delete" ON follow FOR DELETE USING (auth.uid()::text = "followerId");

-- Communities: public read
CREATE POLICY "communities_public_read" ON community FOR SELECT USING (true);
CREATE POLICY "community_members_public_read" ON community_member FOR SELECT USING (true);
CREATE POLICY "community_members_auth_join" ON community_member FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "community_members_own_leave" ON community_member FOR DELETE USING (auth.uid()::text = "userId");

-- Teams, leagues, players, matches: public read only
CREATE POLICY "teams_public" ON team FOR SELECT USING (true);
CREATE POLICY "leagues_public" ON league FOR SELECT USING (true);
CREATE POLICY "players_public" ON player FOR SELECT USING (true);
CREATE POLICY "match_public" ON match FOR SELECT USING (true);
