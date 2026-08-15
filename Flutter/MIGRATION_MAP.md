# SportSphere React → Flutter 1:1 Migration Map

Source of truth: existing Next.js / React PWA in `src/`.

## Screen inventory

### Bottom tabs (TabId)
| React | Flutter |
|-------|---------|
| home | features/home |
| scores | features/scores |
| create | features/create |
| activity | features/activity |
| profile | features/profile |

### HomeSubTab
for-you (label: Sportlights) | trending | predictions | polls  
(+ spotlight exists in store; header shows Sportlights for for-you)

### ScoresSubTab
live | today | upcoming | results | standings

### ActivitySubTab
all | social | sports | messages

### Auth surfaces
LoginModal → features/auth/login_sheet.dart  
RegisterModal / RegistrationModal → register_sheet.dart (+ fan/role/success steps)  
ForgotPasswordModal | ResetPasswordPage | VerifyEmailModal  
RegistrationFanStep | RegistrationRoleStep | RegistrationSuccessStep | RoleForms | ProUpgradeModal

### Home components
HomeTab, HomeHeader, FeedCard, CommentSheet, SearchModal, ShareSheet,  
MatchDetailModal, PollsTab, PredictionsTab, SportlightsTab, TrendingTab, EditPredictionModal

### Scores
ScoresTab, ScoresHeader, MatchList, StandingsList, FilterDropdown

### Create
CreateTab, PostComposer, PollCreator, PredictionCreator

### Profiles
ProfilePage, ProfileHeader, ProfileCover, ProfileInfo, ProfileStats, ProfileTabs,  
ProfileActions, ProfileExplorer, EntityProfileSheet, PeopleListModal, UserProfileViewer,  
tabs: About, Feeds, Overview, RoleContent, Shop, Stats  
ProfileTab (own), EditProfileModal

### Performance
PerformanceCard, PerformanceBreakdown, PerformanceOpportunities, PerformanceTrend, PerformanceBadge

### Media / Uploads
MediaEditor, PhotoEditor, VideoTrimmer, PhotoUpload, VideoUpload

### Layout
BottomNav, PageBackHeader, PageContainer, PullToRefresh, SwipeGuard

### App routes (pages)
/ (shell) | /leaderboard | /p/[id] | /players | /players/[id] | /u/[handle] | /privacy | /terms

### API groups (do not invent)
auth*, feed, posts, comments, likes, polls, predictions, matches, standings,  
sports*, teams*, players*, profile*, follows, notifications, messages, activity,  
leaderboard, communities, uploads, performance, roles, locations/search, spotlight

### Design tokens (locked)
background #0A1628 | secondary #0F1D3A | gold #F5C518 | accent #FF6B35  
glass rgba(255,255,255,0.05) | border rgba(255,255,255,0.08) | radius 0.75rem  
Fonts: Outfit (display) + Inter (body)

## Implementation order (active)
- [x] Phase 2 foundation (theme, colors, GlassCard, BottomNav)
- [x] Phase 3 partial (Splash + Login + Register sheets)
- [x] Phase 4 partial (shell tabs)
- [ ] Phase 3 complete (Forgot/Reset/Verify + session)
- [ ] Phase 5 Home real FeedCard + SportlightsTab from API
- [ ] Phase 6 Scores real MatchList + Standings
- [ ] Phase 7 Profiles
- [ ] Phase 8–12 remainder

## State mapping
Zustand authStore → Riverpod AuthNotifier  
navigationStore → NavigationNotifier  
uiStore → UiNotifier  
