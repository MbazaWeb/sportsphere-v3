# SportSphere API Map (from api.zip)

**Base:** `https://sportssphere.fun/sportsphere/api`

Mobile auth: JWT returned in JSON body (`token`), send as `Authorization: Bearer <token>`.

## Auth
| Method | Path | Notes |
|--------|------|-------|
| POST | `/auth` | login: email OR handle + password → `{ user, token, expiresAt }` |
| POST | `/auth/register` | name, email, handle, password, sports?, roleId?, roleTypeId? |
| GET | `/auth/me` | current user |
| POST | `/auth/logout` | |
| POST | `/auth/forgot-password` | |
| POST | `/auth/reset-password` | |
| POST | `/auth/verify-email/request` | |
| POST | `/auth/verify-email/confirm` | |
| GET | `/auth/check-handle` | |

## Feed / Social
| Method | Path |
|--------|------|
| GET | `/feed` | query: type, limit, offset |
| GET/POST | `/posts` | |
| GET/POST | `/comments` | |
| POST | `/comments/like` | |
| POST | `/likes` | |
| GET/POST | `/polls` | |
| POST | `/polls/vote` | |
| GET/POST | `/predictions` | |
| GET/PATCH | `/predictions/[id]` | |
| GET | `/spotlight` | |
| GET | `/activity` | |
| GET | `/follows` | |

## Sports
| Method | Path |
|--------|------|
| GET | `/matches` | status=live\|today\|… |
| GET | `/standings` | |
| GET | `/leagues` | |
| GET | `/sports` | |
| GET | `/sports/[slug]` | competitions, fixtures, standings, teams, top-scorers |
| GET | `/players` `/players/[id]` `/players/search` | |
| GET | `/teams/search` `/teams/matches` | |

## Profile
| Method | Path |
|--------|------|
| GET/PATCH | `/profile` | |
| POST | `/profile/avatar` | |
| GET | `/profile/favorites` | |
| GET | `/profile-data` | |
| GET | `/users` | |
| GET | `/performance/[userId]` | |
| GET | `/roles` | |

## Other
| Method | Path |
|--------|------|
| GET | `/health` | |
| GET | `/notifications` | |
| GET | `/messages` | |
| GET | `/leaderboard` | |
| GET | `/communities` | |
| POST | `/uploads` | |

## Flutter layer
- `lib/core/constants/api_config.dart`
- `lib/core/network/api_client.dart`
- `lib/core/storage/token_storage.dart`
- `lib/features/auth/data/auth_api.dart`
- `lib/features/home/data/feed_api.dart`
- `lib/core/providers/app_providers.dart` (Riverpod)
