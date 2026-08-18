-- SportSphere RLS Policies
-- Run AFTER schema.sql

-- Enable RLS
ALTER TABLE ss_user ENABLE ROW LEVEL SECURITY;
ALTER TABLE ss_post ENABLE ROW LEVEL SECURITY;
ALTER TABLE ss_follow ENABLE ROW LEVEL SECURITY;
ALTER TABLE ss_comment ENABLE ROW LEVEL SECURITY;
ALTER TABLE ss_comment_like ENABLE ROW LEVEL SECURITY;
ALTER TABLE ss_post_like ENABLE ROW LEVEL SECURITY;
ALTER TABLE ss_poll_vote ENABLE ROW LEVEL SECURITY;
ALTER TABLE ss_message ENABLE ROW LEVEL SECURITY;
ALTER TABLE ss_notification ENABLE ROW LEVEL SECURITY;
ALTER TABLE ss_community ENABLE ROW LEVEL SECURITY;
ALTER TABLE ss_community_member ENABLE ROW LEVEL SECURITY;
ALTER TABLE ss_user_favorite ENABLE ROW LEVEL SECURITY;

-- ss_user: anyone can read, only own row update
CREATE POLICY "user_public_read"  ON ss_user FOR SELECT USING (true);
CREATE POLICY "user_own_update"   ON ss_user FOR UPDATE USING (auth.uid()::text = id);
CREATE POLICY "user_own_delete"   ON ss_user FOR DELETE USING (auth.uid()::text = id);

-- ss_post: public read, auth create, own update/delete
CREATE POLICY "post_public_read"  ON ss_post FOR SELECT USING (true);
CREATE POLICY "post_auth_create"  ON ss_post FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "post_own_update"   ON ss_post FOR UPDATE USING (auth.uid()::text = user_id);
CREATE POLICY "post_own_delete"   ON ss_post FOR DELETE USING (auth.uid()::text = user_id);

-- ss_follow: public read, auth create, own delete
CREATE POLICY "follow_public_read" ON ss_follow FOR SELECT USING (true);
CREATE POLICY "follow_auth_create" ON ss_follow FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "follow_own_delete"  ON ss_follow FOR DELETE USING (auth.uid()::text = follower_id);

-- ss_comment: public read, auth create, own delete
CREATE POLICY "comment_public_read" ON ss_comment FOR SELECT USING (true);
CREATE POLICY "comment_auth_create" ON ss_comment FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "comment_own_delete"  ON ss_comment FOR DELETE USING (auth.uid()::text = user_id);

-- ss_post_like: public read, auth create, own delete
CREATE POLICY "post_like_public_read" ON ss_post_like FOR SELECT USING (true);
CREATE POLICY "post_like_auth_create" ON ss_post_like FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "post_like_own_delete"  ON ss_post_like FOR DELETE USING (auth.uid()::text = user_id);

-- ss_poll_vote: public read, auth create
CREATE POLICY "poll_vote_public_read" ON ss_poll_vote FOR SELECT USING (true);
CREATE POLICY "poll_vote_auth_create" ON ss_poll_vote FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- ss_message: only sender/receiver
CREATE POLICY "message_own_read"   ON ss_message FOR SELECT USING (auth.uid()::text = sender_id OR auth.uid()::text = receiver_id);
CREATE POLICY "message_auth_send"  ON ss_message FOR INSERT WITH CHECK (auth.uid()::text = sender_id);
CREATE POLICY "message_own_delete" ON ss_message FOR DELETE USING (auth.uid()::text = sender_id);

-- ss_notification: only owner
CREATE POLICY "notif_own_read"   ON ss_notification FOR SELECT USING (auth.uid()::text = user_id);
CREATE POLICY "notif_own_update" ON ss_notification FOR UPDATE USING (auth.uid()::text = user_id);

-- ss_community: public read
CREATE POLICY "community_public_read"  ON ss_community FOR SELECT USING (true);
CREATE POLICY "community_auth_create"  ON ss_community FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- ss_community_member: public read, auth join, own leave
CREATE POLICY "cm_public_read"  ON ss_community_member FOR SELECT USING (true);
CREATE POLICY "cm_auth_join"    ON ss_community_member FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "cm_own_leave"    ON ss_community_member FOR DELETE USING (auth.uid()::text = user_id);

-- ss_user_favorite: only owner
CREATE POLICY "fav_own_read"   ON ss_user_favorite FOR SELECT USING (auth.uid()::text = user_id);
CREATE POLICY "fav_auth_create" ON ss_user_favorite FOR INSERT WITH CHECK (auth.uid()::text = user_id);
CREATE POLICY "fav_own_delete" ON ss_user_favorite FOR DELETE USING (auth.uid()::text = user_id);

-- Public read-only tables (no auth needed)
ALTER TABLE ss_match ENABLE ROW LEVEL SECURITY;
ALTER TABLE ss_team ENABLE ROW LEVEL SECURITY;
ALTER TABLE ss_league ENABLE ROW LEVEL SECURITY;
ALTER TABLE ss_player ENABLE ROW LEVEL SECURITY;
ALTER TABLE ss_coach ENABLE ROW LEVEL SECURITY;
ALTER TABLE ss_news_item ENABLE ROW LEVEL SECURITY;
ALTER TABLE ss_sport ENABLE ROW LEVEL SECURITY;

CREATE POLICY "match_public"    ON ss_match     FOR SELECT USING (true);
CREATE POLICY "team_public"     ON ss_team      FOR SELECT USING (true);
CREATE POLICY "league_public"   ON ss_league    FOR SELECT USING (true);
CREATE POLICY "player_public"   ON ss_player    FOR SELECT USING (true);
CREATE POLICY "coach_public"    ON ss_coach     FOR SELECT USING (true);
CREATE POLICY "news_public"     ON ss_news_item FOR SELECT USING (true);
CREATE POLICY "sport_public"    ON ss_sport     FOR SELECT USING (true);
