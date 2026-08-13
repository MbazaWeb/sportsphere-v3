---
Task ID: 1
Agent: main
Task: Fix 404 on sportssphere.fun — remove basePath, deploy Tanzania baseline

Work Log:
- Analyzed screenshot showing 404 on https://sportssphere.fun
- Found root cause: next.config.ts had basePath: "/sportsphere" causing all routes to 404 when accessed at domain root
- Fixed next.config.ts: removed basePath and NEXT_PUBLIC_BASE_PATH
- Fixed 10 source files with hardcoded /sportsphere references (layout, terms, privacy, components, API calls, email templates)
- Pushed fix to GitHub (commit a77188b)
- Pulled changes on production server
- Ran Tanzania baseline seed successfully: 7 sports, 9 competitions, 20 teams, 64 locations
- Fan users preserved (5 users, NOT deleted per user requirement)
- Admin infrastructure preserved (19 AdminRoles, 26 Roles, 25 KPI Configs)
- Rebuilt Next.js and restarted PM2
- Verified: Homepage 200, API /api/sports returns all 7 Tanzania sports, /terms 200, /privacy 200, /players 200

Stage Summary:
- Site is now LIVE at https://sportssphere.fun returning 200
- Tanzania baseline data seeded: Football, Basketball, Athletics, Boxing, Volleyball, Netball, Rugby
- 16 VPL football teams + 4 basketball teams
- 33 regions, 20 cities, 10 neighboring countries
- All hardcoded /sportsphere paths removed from codebase
