#!/usr/bin/env python3
"""Fix SportlightsTab: remove leaderboard fallback from /api/users, hide widget when no data."""
import paramiko

HOST, USER, PASS = '104.152.50.173', 'deploy', 'Rehema@1234!'
FILE = '/var/www/sportsphere-nextjs/src/components/home/SportlightsTab.tsx'

def ssh_cmd(cmd, timeout=30):
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    client.connect(HOST, username=USER, password=PASS, timeout=timeout)
    stdin, stdout, stderr = client.exec_command(cmd, timeout=timeout)
    out = stdout.read().decode()
    err = stderr.read().decode()
    client.close()
    return out, err

# Read current file
out, err = ssh_cmd(f'cat {FILE}')
if err:
    print(f"Error reading: {err}")
    exit(1)

content = out

# 1. Replace the leaderboard fallback block — remove the setLeaderboard(allUsers...) call
# Old: from "setSeededTeams(teamAccounts);" to the next setLeaderboard(allUsers...) closing ");"
old_fallback = """setSeededTeams(teamAccounts);
          // Removed: leaderboard fallback from followerCount — only real leaderboard API data populates Top Accounts
        setLeaderboard(allUsers
          .sort((a: { followerCount: number }, b: { followerCount: number }) => (b.followerCount || 0) - (a.followerCount || 0))
          .slice(0, 10)
          .map((u: any, i: number) => ({
            rank: i + 1,
            id: u.id,
            name: u.name,
            handle: u.handle,
            avatarUrl: u.avatarUrl,
            avatarInitials: u.avatarInitials,
            points: u.followerCount || 0,
            isVerified: u.isVerified,
            role: u.role,
          })));"""

new_fallback = """setSeededTeams(teamAccounts);
          // Top Accounts populated only by real leaderboard API data below"""

content = content.replace(old_fallback, new_fallback)

# 2. Wrap the Top Accounts widget to hide when no real data (all points are 0)
old_widget = """      {/* ===== TOP ACCOUNTS ===== */}
      <div className="glass-card rounded-2xl p-4 glass-card-hover">
        <div className="flex items-center gap-2 mb-3">
          <Crown className="h-4 w-4 text-gold" />
          <h3 className="text-xs font-bold text-gold uppercase tracking-wider">Top Accounts</h3>
        </div>
        {leaderboard.length === 0 ? (
          <p className="text-xs text-muted-foreground py-2">No leaderboard data yet.</p>
        ) : ("""

new_widget = """      {/* ===== TOP ACCOUNTS — only shown when real leaderboard data exists ===== */}
      {leaderboard.length > 0 && leaderboard.some((item) => item.points > 0) && (
      <div className="glass-card rounded-2xl p-4 glass-card-hover">
        <div className="flex items-center gap-2 mb-3">
          <Crown className="h-4 w-4 text-gold" />
          <h3 className="text-xs font-bold text-gold uppercase tracking-wider">Top Accounts</h3>
        </div>
        <div className="flex flex-col gap-2">"""

content = content.replace(old_widget, new_widget)

# 3. Replace the closing of the old conditional with just closing the map div + card div
old_close = """          </div>
        )}
      </div>

      {/* ===== CHOOSE YOUR TEAMS (seeded accounts + match data) ===== */}"""

new_close = """        </div>
      </div>
      )}

      {/* ===== CHOOSE YOUR TEAMS (seeded accounts + match data) ===== */}"""

content = content.replace(old_close, new_close)

# Verify replacements worked
if "setLeaderboard(allUsers" in content:
    print("ERROR: Fallback setLeaderboard still present!")
    exit(1)
if "leaderboard.length === 0" in content:
    print("ERROR: Old empty check still present!")
    exit(1)

# Write back
escaped = content.replace("'", "'\\''")
out, err = ssh_cmd(f"printf '%s' '{escaped}' > {FILE}")
if err:
    print(f"Error writing: {err}")
    exit(1)

print("✅ SportlightsTab.tsx updated successfully")
print("   - Removed leaderboard fallback from /api/users followerCount")
print("   - Top Accounts widget hidden when no entries have points > 0")
