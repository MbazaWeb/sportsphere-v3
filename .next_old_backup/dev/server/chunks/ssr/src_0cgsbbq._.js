module.exports = [
"[project]/src/store/navigationStore.ts [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "useNavigationStore",
    ()=>useNavigationStore
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zustand$2f$esm$2f$react$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/zustand/esm/react.mjs [app-ssr] (ecmascript)");
;
const useNavigationStore = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zustand$2f$esm$2f$react$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["create"])((set)=>({
        activeTab: "home",
        homeSubTab: "for-you",
        scoresSubTab: "live",
        activitySubTab: "all",
        profileSection: "main",
        settingsSection: "account",
        setActiveTab: (t)=>set({
                activeTab: t
            }),
        setHomeSubTab: (t)=>set({
                homeSubTab: t
            }),
        setScoresSubTab: (t)=>set({
                scoresSubTab: t
            }),
        setActivitySubTab: (t)=>set({
                activitySubTab: t
            }),
        setProfileSection: (s)=>set({
                profileSection: s
            }),
        setSettingsSection: (s)=>set({
                settingsSection: s
            })
    }));
}),
"[project]/src/store/uiStore.ts [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "useUIStore",
    ()=>useUIStore
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zustand$2f$esm$2f$react$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/zustand/esm/react.mjs [app-ssr] (ecmascript)");
'use client';
;
let toastTimer = null;
const useUIStore = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zustand$2f$esm$2f$react$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["create"])((set)=>({
        toastMessage: null,
        loginModalOpen: false,
        loginTrigger: '',
        createModalOpen: false,
        activeCreateType: null,
        viewingProfile: null,
        viewingUser: null,
        showToast: (msg, dur = 3000)=>{
            if (toastTimer) clearTimeout(toastTimer);
            set({
                toastMessage: msg
            });
            toastTimer = setTimeout(()=>set({
                    toastMessage: null
                }), dur);
        },
        setLoginModalOpen: (o)=>set({
                loginModalOpen: o
            }),
        setLoginTrigger: (t)=>set({
                loginTrigger: t
            }),
        setCreateModalOpen: (o)=>set({
                createModalOpen: o
            }),
        setActiveCreateType: (t)=>set({
                activeCreateType: t
            }),
        setViewingProfile: (id)=>set({
                viewingProfile: id
            }),
        setViewingUser: (u)=>set({
                viewingUser: u
            })
    }));
}),
"[project]/src/store/authStore.ts [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "useAuthStore",
    ()=>useAuthStore
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zustand$2f$esm$2f$react$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/zustand/esm/react.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$store$2f$uiStore$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/store/uiStore.ts [app-ssr] (ecmascript)");
;
;
const useAuthStore = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zustand$2f$esm$2f$react$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["create"])((set, get)=>({
        isAuthenticated: false,
        userProfile: null,
        registrationOpen: false,
        registrationStep: "choose",
        hydrated: false,
        setIsAuthenticated: (v)=>set({
                isAuthenticated: v
            }),
        setUserProfile: (p)=>set({
                userProfile: p
            }),
        setRegistrationOpen: (o)=>set({
                registrationOpen: o
            }),
        setRegistrationStep: (s)=>set({
                registrationStep: s
            }),
        setHydrated: (v)=>set({
                hydrated: v
            }),
        // Phase 5: Registration ONLY creates Fan accounts
        completeRegistration: async (d)=>{
            try {
                const res = await fetch('/api/auth/register', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        name: d.name,
                        email: d.email,
                        handle: d.handle,
                        password: d.password,
                        sports: d.sports
                    })
                });
                const data = await res.json();
                if (!res.ok) return {
                    ok: false,
                    error: data.error || 'Registration failed.'
                };
                set({
                    isAuthenticated: true,
                    registrationOpen: false,
                    registrationStep: "choose",
                    userProfile: data
                });
                return {
                    ok: true
                };
            } catch  {
                return {
                    ok: false,
                    error: 'Network error. Please try again.'
                };
            }
        },
        // Phase 8: Pro Upgrade — submit role change for verification
        submitRoleUpgrade: async (d)=>{
            try {
                const res = await fetch('/api/roles/upgrade', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(d)
                });
                const data = await res.json();
                if (!res.ok) return {
                    ok: false,
                    error: data.error || 'Upgrade request failed.'
                };
                // Refresh user profile to reflect new role/verification status
                const meRes = await fetch('/api/auth/me');
                if (meRes.ok) {
                    const meData = await meRes.json();
                    set({
                        userProfile: meData
                    });
                }
                return {
                    ok: true
                };
            } catch  {
                return {
                    ok: false,
                    error: 'Network error. Please try again.'
                };
            }
        },
        logout: async ()=>{
            try {
                await fetch('/api/auth/logout', {
                    method: 'POST'
                });
            } catch  {}
            // Clear any open profile overlays so they don't linger over the guest UI
            __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$store$2f$uiStore$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useUIStore"].getState().setViewingProfile(null);
            __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$store$2f$uiStore$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useUIStore"].getState().setViewingUser(null);
            set({
                isAuthenticated: false,
                userProfile: null,
                registrationOpen: false,
                registrationStep: "choose"
            });
        }
    }));
}),
"[project]/src/store/useAppStore.ts [app-ssr] (ecmascript) <locals>", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "useAppStore",
    ()=>useAppStore
]);
// SportSphere — Store bridge
// Re-exports domain stores. New code should import from domain stores directly.
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$store$2f$authStore$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/store/authStore.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$store$2f$navigationStore$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/store/navigationStore.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$store$2f$uiStore$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/store/uiStore.ts [app-ssr] (ecmascript)");
;
;
;
;
;
;
;
function useAppStore(selector) {
    const auth = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$store$2f$authStore$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useAuthStore"])();
    const nav = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$store$2f$navigationStore$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useNavigationStore"])();
    const ui = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$store$2f$uiStore$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useUIStore"])();
    return selector({
        ...auth,
        ...nav,
        ...ui
    });
}
}),
"[project]/src/hooks/useAuthSession.ts [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "useAuthSession",
    ()=>useAuthSession
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$store$2f$authStore$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/store/authStore.ts [app-ssr] (ecmascript)");
'use client';
;
;
function useAuthSession() {
    const setUserProfile = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$store$2f$authStore$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useAuthStore"])((s)=>s.setUserProfile);
    const setIsAuthenticated = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$store$2f$authStore$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useAuthStore"])((s)=>s.setIsAuthenticated);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEffect"])(()=>{
        let cancelled = false;
        (async ()=>{
            try {
                const res = await fetch('/api/auth/me', {
                    cache: 'no-store'
                });
                if (!res.ok) return;
                const data = await res.json();
                if (cancelled) return;
                if (data.user) {
                    setUserProfile(data.user);
                    setIsAuthenticated(true);
                } else {
                    setUserProfile(null);
                    setIsAuthenticated(false);
                }
            } catch  {
            // Network errors → stay logged out
            }
        })();
        return ()=>{
            cancelled = true;
        };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);
}
}),
"[project]/src/hooks/useSports.ts [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "useSports",
    ()=>useSports
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react.js [app-ssr] (ecmascript)");
// ─── SportSphere — useSports Hook ─────────────────────────────
// Shared hook that fetches sports from /api/sports.
// Replaces all hardcoded SPORTS arrays across the codebase.
// Spec: Phase 17 — "No hardcoded sports. Everything should be data-driven."
'use client';
;
function useSports(options = {}) {
    const [sports, setSports] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])([]);
    const [loading, setLoading] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(true);
    const [error, setError] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(null);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEffect"])(()=>{
        let cancelled = false;
        async function fetchSports() {
            try {
                const params = new URLSearchParams();
                if (options.category) params.set('category', options.category);
                if (options.sportType) params.set('sportType', options.sportType);
                if (options.format) params.set('format', options.format);
                const res = await fetch(`/api/sports?${params.toString()}`);
                if (!res.ok) throw new Error('Failed to fetch sports');
                const data = await res.json();
                if (!cancelled) {
                    let results = data;
                    if (options.limit) results = results.slice(0, options.limit);
                    setSports(results);
                    setError(null);
                }
            } catch (err) {
                if (!cancelled) {
                    setError(err instanceof Error ? err.message : 'Unknown error');
                    // Fallback to minimal list so UI doesn't break
                    setSports(FALLBACK_SPORTS);
                }
            } finally{
                if (!cancelled) setLoading(false);
            }
        }
        fetchSports();
        return ()=>{
            cancelled = true;
        };
    }, [
        options.category,
        options.sportType,
        options.format,
        options.limit
    ]);
    // Convenience: return just the names for backward compat
    const names = sports.map((s)=>s.name);
    // Convenience: return as { value, label } for dropdowns
    const selectOptions = sports.map((s)=>({
            value: s.slug,
            label: s.name,
            icon: s.icon
        }));
    return {
        sports,
        names,
        selectOptions,
        loading,
        error
    };
}
// ─── Fallback sports list ─────────────────────────────────────
// Only used if the API call fails. This is a safety net, not the
// primary data source. The spec says "No hardcoded sports" — this
// fallback exists for resilience, not as the norm.
const FALLBACK_SPORTS = [
    {
        id: '1',
        name: 'Football',
        slug: 'football',
        icon: '⚽',
        category: 'team_sport',
        sportType: 'outdoor',
        format: 'team',
        contactType: 'contact',
        olympicStatus: 'olympic',
        description: 'The world\'s most popular sport',
        tags: [],
        displayOrder: 1
    },
    {
        id: '2',
        name: 'Basketball',
        slug: 'basketball',
        icon: '🏀',
        category: 'team_sport',
        sportType: 'indoor',
        format: 'team',
        contactType: 'limited-contact',
        olympicStatus: 'olympic',
        description: '5v5 court sport',
        tags: [],
        displayOrder: 2
    },
    {
        id: '3',
        name: 'Tennis',
        slug: 'tennis',
        icon: '🎾',
        category: 'racquet',
        sportType: 'outdoor',
        format: 'individual',
        contactType: 'non-contact',
        olympicStatus: 'olympic',
        description: 'Racquet sport',
        tags: [],
        displayOrder: 3
    },
    {
        id: '4',
        name: 'Cricket',
        slug: 'cricket',
        icon: '🏏',
        category: 'team_sport',
        sportType: 'outdoor',
        format: 'team',
        contactType: 'non-contact',
        olympicStatus: 'olympic',
        description: 'Bat-and-ball game',
        tags: [],
        displayOrder: 4
    },
    {
        id: '5',
        name: 'Rugby',
        slug: 'rugby-union',
        icon: '🏉',
        category: 'team_sport',
        sportType: 'outdoor',
        format: 'team',
        contactType: 'contact',
        olympicStatus: 'olympic',
        description: 'Full-contact sport',
        tags: [],
        displayOrder: 5
    },
    {
        id: '6',
        name: 'Volleyball',
        slug: 'volleyball',
        icon: '🏐',
        category: 'team_sport',
        sportType: 'indoor',
        format: 'team',
        contactType: 'non-contact',
        olympicStatus: 'olympic',
        description: '6v6 court sport',
        tags: [],
        displayOrder: 6
    },
    {
        id: '7',
        name: 'Athletics',
        slug: 'athletics',
        icon: '🏃',
        category: 'individual',
        sportType: 'outdoor',
        format: 'individual',
        contactType: 'non-contact',
        olympicStatus: 'olympic',
        description: 'Track and field',
        tags: [],
        displayOrder: 7
    },
    {
        id: '8',
        name: 'Boxing',
        slug: 'boxing',
        icon: '🥊',
        category: 'combat',
        sportType: 'indoor',
        format: 'individual',
        contactType: 'contact',
        olympicStatus: 'olympic',
        description: 'Combat sport',
        tags: [],
        displayOrder: 8
    },
    {
        id: '9',
        name: 'Formula 1',
        slug: 'formula-1',
        icon: '🏎️',
        category: 'motorsport',
        sportType: 'outdoor',
        format: 'individual',
        contactType: 'non-contact',
        olympicStatus: 'none',
        description: 'Motorsport',
        tags: [],
        displayOrder: 9
    },
    {
        id: '10',
        name: 'Esports',
        slug: 'esports',
        icon: '🎮',
        category: 'individual',
        sportType: 'indoor',
        format: 'team',
        contactType: 'non-contact',
        olympicStatus: 'none',
        description: 'Competitive gaming',
        tags: [],
        displayOrder: 10
    },
    {
        id: '11',
        name: 'Baseball',
        slug: 'baseball',
        icon: '⚾',
        category: 'team_sport',
        sportType: 'outdoor',
        format: 'team',
        contactType: 'non-contact',
        olympicStatus: 'olympic',
        description: 'Bat-and-ball game',
        tags: [],
        displayOrder: 11
    },
    {
        id: '12',
        name: 'Ice Hockey',
        slug: 'ice-hockey',
        icon: '🏒',
        category: 'team_sport',
        sportType: 'indoor',
        format: 'team',
        contactType: 'contact',
        olympicStatus: 'olympic',
        description: 'Ice sport',
        tags: [],
        displayOrder: 12
    }
];
}),
"[project]/src/hooks/useServiceWorker.ts [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "useServiceWorker",
    ()=>useServiceWorker
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react.js [app-ssr] (ecmascript)");
'use client';
;
function useServiceWorker() {
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEffect"])(()=>{
        if ("TURBOPACK compile-time truthy", 1) return;
        //TURBOPACK unreachable
        ;
        const registerSW = undefined;
    }, []);
}
}),
"[project]/src/constants/index.ts [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

// SportSphere — Application Constants
// Non-data constants only. User/match/sport data lives in the database
// (prisma/seed.ts) and is served through API routes (/api/*).
// E-2: Removed SPORTS_LIST — sports are now fetched from /api/sports.
__turbopack_context__.s([
    "ADVANCED_ROLES",
    ()=>ADVANCED_ROLES,
    "formatCount",
    ()=>formatCount
]);
const ADVANCED_ROLES = [
    {
        id: 'team',
        label: 'Team',
        description: 'Register a sports team or club'
    },
    {
        id: 'player',
        label: 'Player',
        description: 'Register as a professional player'
    },
    {
        id: 'coach',
        label: 'Coach',
        description: 'Register as a coach or manager'
    },
    {
        id: 'referee',
        label: 'Referee',
        description: 'Register as a match official'
    },
    {
        id: 'journalist',
        label: 'Journalist',
        description: 'Register as a sports journalist'
    },
    {
        id: 'analyst',
        label: 'Analyst',
        description: 'Register as a sports analyst'
    },
    {
        id: 'creator',
        label: 'Creator',
        description: 'Register as a content creator'
    },
    {
        id: 'scout',
        label: 'Scout',
        description: 'Register as a talent scout'
    },
    {
        id: 'stadium',
        label: 'Stadium',
        description: 'Register a stadium or arena'
    },
    {
        id: 'academy',
        label: 'Academy',
        description: 'Register a sports academy'
    },
    {
        id: 'community',
        label: 'Community',
        description: 'Register a fan community'
    },
    {
        id: 'organization',
        label: 'Organization',
        description: 'Register a sports organization'
    },
    {
        id: 'business',
        label: 'Business',
        description: 'Register a sports business'
    }
];
function formatCount(n) {
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
    if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
    return n.toString();
}
}),
"[project]/src/lib/format.ts [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

// SportSphere — Shared formatting utilities
// Single source of truth for time/count formatting functions.
/**
 * Format a date string into a human-readable relative time string.
 * e.g. "just now", "5m ago", "3h ago", "2d ago"
 */ __turbopack_context__.s([
    "formatKickoffTime",
    ()=>formatKickoffTime,
    "formatTime",
    ()=>formatTime,
    "formatTimeShort",
    ()=>formatTimeShort
]);
function formatTime(dateStr) {
    const d = new Date(dateStr);
    const diff = Date.now() - d.getTime();
    if (diff < 60000) return 'just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return `${Math.floor(diff / 86400000)}d ago`;
}
function formatTimeShort(dateStr) {
    const d = new Date(dateStr);
    const diff = Date.now() - d.getTime();
    if (diff < 60000) return 'now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h`;
    return `${Math.floor(diff / 86400000)}d`;
}
function formatKickoffTime(dateStr) {
    return new Date(dateStr).toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
    });
}
}),
"[project]/src/types/index.ts [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

// ============================================================
// SportSphere — Shared Domain Types
// Single source of truth. Import from here, not from store.
// ============================================================
__turbopack_context__.s([
    "apiUserToViewing",
    ()=>apiUserToViewing
]);
function apiUserToViewing(u, isFollowing = false) {
    return {
        id: u.id,
        name: u.name,
        handle: u.handle,
        avatar: u.avatarInitials || u.name.slice(0, 2).toUpperCase(),
        verified: u.isVerified,
        coverGradient: u.coverGradient || 'from-emerald-600 to-emerald-900',
        bio: u.bio || '',
        role: u.role || 'fan',
        location: u.location || '',
        joined: u.registeredAt ? new Date(u.registeredAt).toLocaleDateString('en-US', {
            month: 'short',
            year: 'numeric'
        }) : '',
        followers: u.followerCount || 0,
        following: u.followingCount || 0,
        posts: u.postCount || 0,
        isFollowing
    };
}
}),
"[project]/src/app/page.tsx [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>Home
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$SplashScreen$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/components/SplashScreen.tsx [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$store$2f$navigationStore$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/store/navigationStore.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$store$2f$uiStore$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/store/uiStore.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$hooks$2f$useAuthSession$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/hooks/useAuthSession.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$layout$2f$BottomNav$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/components/layout/BottomNav.tsx [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$home$2f$HomeTab$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/components/home/HomeTab.tsx [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$scores$2f$ScoresTab$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/components/scores/ScoresTab.tsx [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$create$2f$CreateTab$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/components/create/CreateTab.tsx [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$activity$2f$ActivityTab$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/components/activity/ActivityTab.tsx [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$profile$2f$ProfileTab$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/components/profile/ProfileTab.tsx [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$auth$2f$LoginModal$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/components/auth/LoginModal.tsx [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$registration$2f$RegistrationModal$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/components/registration/RegistrationModal.tsx [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$auth$2f$ResetPasswordPage$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/components/auth/ResetPasswordPage.tsx [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$auth$2f$VerifyEmailModal$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/components/auth/VerifyEmailModal.tsx [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$profiles$2f$ProfilePage$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/components/profiles/ProfilePage.tsx [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$profiles$2f$UserProfileViewer$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/components/profiles/UserProfileViewer.tsx [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$profiles$2f$profileConfig$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/components/profiles/profileConfig.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$framer$2d$motion$2f$dist$2f$es$2f$components$2f$AnimatePresence$2f$index$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/framer-motion/dist/es/components/AnimatePresence/index.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$framer$2d$motion$2f$dist$2f$es$2f$render$2f$components$2f$motion$2f$proxy$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/framer-motion/dist/es/render/components/motion/proxy.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$hooks$2f$useServiceWorker$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/hooks/useServiceWorker.ts [app-ssr] (ecmascript)");
'use client';
;
;
;
;
;
;
;
;
;
;
;
;
;
;
;
;
;
;
;
;
;
function Toast() {
    const msg = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$store$2f$uiStore$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useUIStore"])((s)=>s.toastMessage);
    if (!msg) return null;
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "fixed top-4 left-1/2 z-50 -translate-x-1/2 pointer-events-none",
        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "rounded-xl bg-surface-elevated border border-surface-border px-4 py-3 shadow-xl",
            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                className: "text-sm font-medium text-white",
                children: msg
            }, void 0, false, {
                fileName: "[project]/src/app/page.tsx",
                lineNumber: 31,
                columnNumber: 9
            }, this)
        }, void 0, false, {
            fileName: "[project]/src/app/page.tsx",
            lineNumber: 30,
            columnNumber: 7
        }, this)
    }, void 0, false, {
        fileName: "[project]/src/app/page.tsx",
        lineNumber: 29,
        columnNumber: 5
    }, this);
}
function ProfileTypeOverlay() {
    const viewingProfile = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$store$2f$uiStore$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useUIStore"])((s)=>s.viewingProfile);
    const setViewingProfile = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$store$2f$uiStore$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useUIStore"])((s)=>s.setViewingProfile);
    if (!viewingProfile) return null;
    const config = __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$profiles$2f$profileConfig$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["PROFILE_TYPES"][viewingProfile];
    if (!config) return null;
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$framer$2d$motion$2f$dist$2f$es$2f$render$2f$components$2f$motion$2f$proxy$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["motion"].div, {
        initial: {
            x: '100%'
        },
        animate: {
            x: 0
        },
        exit: {
            x: '100%'
        },
        transition: {
            type: 'spring',
            damping: 30,
            stiffness: 300
        },
        drag: "x",
        dragConstraints: {
            left: 0,
            right: 0
        },
        dragElastic: {
            left: 0,
            right: 0.3
        },
        onDragEnd: (_, info)=>{
            if (info.offset.x > 80 || info.velocity.x > 500) {
                setViewingProfile(null);
            }
        },
        className: "fixed inset-0 z-40 bg-background overflow-y-auto touch-pan-y",
        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$profiles$2f$ProfilePage$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"], {
            config: config,
            onBack: ()=>setViewingProfile(null)
        }, void 0, false, {
            fileName: "[project]/src/app/page.tsx",
            lineNumber: 59,
            columnNumber: 7
        }, this)
    }, void 0, false, {
        fileName: "[project]/src/app/page.tsx",
        lineNumber: 44,
        columnNumber: 5
    }, this);
}
function TabContent() {
    const activeTab = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$store$2f$navigationStore$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useNavigationStore"])((s)=>s.activeTab);
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$framer$2d$motion$2f$dist$2f$es$2f$components$2f$AnimatePresence$2f$index$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["AnimatePresence"], {
        mode: "wait",
        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$framer$2d$motion$2f$dist$2f$es$2f$render$2f$components$2f$motion$2f$proxy$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["motion"].div, {
            initial: {
                opacity: 0,
                x: 10
            },
            animate: {
                opacity: 1,
                x: 0
            },
            exit: {
                opacity: 0,
                x: -10
            },
            transition: {
                duration: 0.15
            },
            className: "mx-auto min-h-screen max-w-lg",
            children: [
                activeTab === 'home' && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$home$2f$HomeTab$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"], {}, void 0, false, {
                    fileName: "[project]/src/app/page.tsx",
                    lineNumber: 70,
                    columnNumber: 38
                }, this),
                activeTab === 'scores' && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$scores$2f$ScoresTab$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"], {}, void 0, false, {
                    fileName: "[project]/src/app/page.tsx",
                    lineNumber: 71,
                    columnNumber: 38
                }, this),
                activeTab === 'create' && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$create$2f$CreateTab$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"], {}, void 0, false, {
                    fileName: "[project]/src/app/page.tsx",
                    lineNumber: 72,
                    columnNumber: 38
                }, this),
                activeTab === 'activity' && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$activity$2f$ActivityTab$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"], {}, void 0, false, {
                    fileName: "[project]/src/app/page.tsx",
                    lineNumber: 73,
                    columnNumber: 38
                }, this),
                activeTab === 'profile' && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$profile$2f$ProfileTab$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"], {}, void 0, false, {
                    fileName: "[project]/src/app/page.tsx",
                    lineNumber: 74,
                    columnNumber: 38
                }, this)
            ]
        }, activeTab, true, {
            fileName: "[project]/src/app/page.tsx",
            lineNumber: 68,
            columnNumber: 7
        }, this)
    }, void 0, false, {
        fileName: "[project]/src/app/page.tsx",
        lineNumber: 67,
        columnNumber: 5
    }, this);
}
function Home() {
    const [splashDone, setSplashDone] = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"].useState(false);
    const [verifyEmailOpen, setVerifyEmailOpen] = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"].useState(false);
    const viewingProfile = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$store$2f$uiStore$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useUIStore"])((s)=>s.viewingProfile);
    const viewingUser = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$store$2f$uiStore$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useUIStore"])((s)=>s.viewingUser);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$hooks$2f$useServiceWorker$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useServiceWorker"])();
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$hooks$2f$useAuthSession$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useAuthSession"])();
    if (!splashDone) return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$SplashScreen$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"], {
        onDone: ()=>setSplashDone(true)
    }, void 0, false, {
        fileName: "[project]/src/app/page.tsx",
        lineNumber: 87,
        columnNumber: 27
    }, this);
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "relative flex min-h-screen flex-col bg-background",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(Toast, {}, void 0, false, {
                fileName: "[project]/src/app/page.tsx",
                lineNumber: 91,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$auth$2f$LoginModal$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"], {}, void 0, false, {
                fileName: "[project]/src/app/page.tsx",
                lineNumber: 92,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$registration$2f$RegistrationModal$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"], {}, void 0, false, {
                fileName: "[project]/src/app/page.tsx",
                lineNumber: 93,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$auth$2f$ResetPasswordPage$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"], {}, void 0, false, {
                fileName: "[project]/src/app/page.tsx",
                lineNumber: 94,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$auth$2f$VerifyEmailModal$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"], {
                open: verifyEmailOpen,
                onClose: ()=>setVerifyEmailOpen(false)
            }, void 0, false, {
                fileName: "[project]/src/app/page.tsx",
                lineNumber: 95,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(ProfileTypeOverlay, {}, void 0, false, {
                fileName: "[project]/src/app/page.tsx",
                lineNumber: 96,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$profiles$2f$UserProfileViewer$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"], {}, void 0, false, {
                fileName: "[project]/src/app/page.tsx",
                lineNumber: 97,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "flex-1 pb-16",
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(TabContent, {}, void 0, false, {
                    fileName: "[project]/src/app/page.tsx",
                    lineNumber: 98,
                    columnNumber: 37
                }, this)
            }, void 0, false, {
                fileName: "[project]/src/app/page.tsx",
                lineNumber: 98,
                columnNumber: 7
            }, this),
            !viewingProfile && !viewingUser && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$layout$2f$BottomNav$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"], {}, void 0, false, {
                fileName: "[project]/src/app/page.tsx",
                lineNumber: 99,
                columnNumber: 43
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/src/app/page.tsx",
        lineNumber: 90,
        columnNumber: 5
    }, this);
}
}),
];

//# sourceMappingURL=src_0cgsbbq._.js.map