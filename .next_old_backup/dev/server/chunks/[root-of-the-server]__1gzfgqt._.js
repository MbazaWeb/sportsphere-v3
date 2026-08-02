module.exports = [
"[externals]/next/dist/compiled/next-server/app-route-turbo.runtime.dev.js [external] (next/dist/compiled/next-server/app-route-turbo.runtime.dev.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/compiled/next-server/app-route-turbo.runtime.dev.js", () => require("next/dist/compiled/next-server/app-route-turbo.runtime.dev.js"));

module.exports = mod;
}),
"[externals]/next/dist/compiled/@opentelemetry/api [external] (next/dist/compiled/@opentelemetry/api, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/compiled/@opentelemetry/api", () => require("next/dist/compiled/@opentelemetry/api"));

module.exports = mod;
}),
"[externals]/next/dist/compiled/next-server/app-page-turbo.runtime.dev.js [external] (next/dist/compiled/next-server/app-page-turbo.runtime.dev.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/compiled/next-server/app-page-turbo.runtime.dev.js", () => require("next/dist/compiled/next-server/app-page-turbo.runtime.dev.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/work-unit-async-storage.external.js [external] (next/dist/server/app-render/work-unit-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/work-unit-async-storage.external.js", () => require("next/dist/server/app-render/work-unit-async-storage.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/work-async-storage.external.js [external] (next/dist/server/app-render/work-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/work-async-storage.external.js", () => require("next/dist/server/app-render/work-async-storage.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/shared/lib/no-fallback-error.external.js [external] (next/dist/shared/lib/no-fallback-error.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/shared/lib/no-fallback-error.external.js", () => require("next/dist/shared/lib/no-fallback-error.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/after-task-async-storage.external.js [external] (next/dist/server/app-render/after-task-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/after-task-async-storage.external.js", () => require("next/dist/server/app-render/after-task-async-storage.external.js"));

module.exports = mod;
}),
"[project]/src/lib/db.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "db",
    ()=>db
]);
var __TURBOPACK__imported__module__$5b$externals$5d2f40$prisma$2f$client__$5b$external$5d$__$2840$prisma$2f$client$2c$__cjs$2c$__$5b$project$5d2f$node_modules$2f40$prisma$2f$client$29$__ = __turbopack_context__.i("[externals]/@prisma/client [external] (@prisma/client, cjs, [project]/node_modules/@prisma/client)");
;
const globalForPrisma = globalThis;
const db = globalForPrisma.prisma ?? new __TURBOPACK__imported__module__$5b$externals$5d2f40$prisma$2f$client__$5b$external$5d$__$2840$prisma$2f$client$2c$__cjs$2c$__$5b$project$5d2f$node_modules$2f40$prisma$2f$client$29$__["PrismaClient"]();
if ("TURBOPACK compile-time truthy", 1) globalForPrisma.prisma = db;
}),
"[externals]/crypto [external] (crypto, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("crypto", () => require("crypto"));

module.exports = mod;
}),
"[project]/src/lib/json.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

// Universal JSON field parser
// SQLite returns strings, PostgreSQL Json returns objects directly
__turbopack_context__.s([
    "safeJsonParse",
    ()=>safeJsonParse
]);
function safeJsonParse(value, fallback) {
    if (value === null || value === undefined) return fallback;
    if (typeof value === 'string') {
        try {
            return JSON.parse(value);
        } catch  {
            return fallback;
        }
    }
    // Already parsed (PostgreSQL Json type)
    return value;
}
}),
"[project]/src/lib/session.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "SESSION_COOKIE",
    ()=>SESSION_COOKIE,
    "SESSION_MAX_AGE",
    ()=>SESSION_MAX_AGE,
    "buildClearCookie",
    ()=>buildClearCookie,
    "buildSessionCookie",
    ()=>buildSessionCookie,
    "generateResetToken",
    ()=>generateResetToken,
    "isResetTokenValid",
    ()=>isResetTokenValid,
    "resetTokenExpiry",
    ()=>resetTokenExpiry,
    "signSession",
    ()=>signSession,
    "verifySession",
    ()=>verifySession
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$jose$2f$dist$2f$webapi$2f$jwt$2f$sign$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/jose/dist/webapi/jwt/sign.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$jose$2f$dist$2f$webapi$2f$jwt$2f$verify$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/jose/dist/webapi/jwt/verify.js [app-route] (ecmascript)");
;
// ─── Config ────────────────────────────────────────────────────
const SESSION_SECRET = (()=>{
    const env = process.env.SESSION_SECRET;
    if (env) return env;
    // In production, a missing SESSION_SECRET is a critical security issue.
    if ("TURBOPACK compile-time falsy", 0) //TURBOPACK unreachable
    ;
    // Dev-only fallback — never used in production.
    console.warn('[SportSphere] WARNING: Using insecure dev SESSION_SECRET. ' + 'Set SESSION_SECRET in your .env for production.');
    return 'dev-only-insecure-secret-please-set-SESSION_SECRET-in-env-9f2a4c1b';
})();
const SESSION_COOKIE_NAME = 'ss_session';
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7; // 7 days
const RESET_TOKEN_TTL_MS = 1000 * 60 * 30; // 30 minutes
const encoder = new TextEncoder();
async function signSession(payload) {
    return new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$jose$2f$dist$2f$webapi$2f$jwt$2f$sign$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["SignJWT"]({
        ...payload
    }).setProtectedHeader({
        alg: 'HS256'
    }).setSubject(payload.sub).setIssuedAt().setExpirationTime(`${SESSION_TTL_SECONDS}s`).sign(encoder.encode(SESSION_SECRET));
}
async function verifySession(token) {
    if (!token) return null;
    try {
        const { payload } = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$jose$2f$dist$2f$webapi$2f$jwt$2f$verify$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["jwtVerify"])(token, encoder.encode(SESSION_SECRET), {
            algorithms: [
                'HS256'
            ]
        });
        return {
            sub: payload.sub,
            email: payload.email,
            handle: payload.handle,
            role: payload.role,
            roleId: payload.roleId || undefined,
            roleTypeId: payload.roleTypeId || undefined
        };
    } catch  {
        return null;
    }
}
const SESSION_COOKIE = SESSION_COOKIE_NAME;
const SESSION_MAX_AGE = SESSION_TTL_SECONDS;
function buildSessionCookie(token) {
    const flags = [
        `${SESSION_COOKIE_NAME}=${token}`,
        'Path=/',
        `Max-Age=${SESSION_TTL_SECONDS}`,
        'HttpOnly',
        'SameSite=Lax'
    ];
    // Secure flag only in production (HTTPS). In local dev over http,
    // a Secure cookie would be rejected by the browser.
    if ("TURBOPACK compile-time falsy", 0) //TURBOPACK unreachable
    ;
    return flags.join('; ');
}
function buildClearCookie() {
    return [
        `${SESSION_COOKIE_NAME}=`,
        'Path=/',
        'Max-Age=0',
        'HttpOnly',
        'SameSite=Lax'
    ].join('; ');
}
function generateResetToken() {
    const bytes = new Uint8Array(32);
    crypto.getRandomValues(bytes);
    return Array.from(bytes, (b)=>b.toString(16).padStart(2, '0')).join('');
}
function resetTokenExpiry() {
    return new Date(Date.now() + RESET_TOKEN_TTL_MS);
}
function isResetTokenValid(expiry) {
    if (!expiry) return false;
    return new Date(expiry).getTime() > Date.now();
}
}),
"[project]/src/lib/auth.ts [app-route] (ecmascript) <locals>", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "hashPassword",
    ()=>hashPassword,
    "serializePublicUser",
    ()=>serializePublicUser,
    "verifyPassword",
    ()=>verifyPassword
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$bcryptjs$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/bcryptjs/index.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$json$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/json.ts [app-route] (ecmascript)");
// Re-export everything edge-safe from session.ts so callers have one import.
// `lib/auth.ts` itself is server-only (it pulls in bcryptjs); middleware
// imports `lib/session.ts` directly to stay Edge-compatible.
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$session$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/session.ts [app-route] (ecmascript)");
;
;
;
async function hashPassword(password) {
    return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$bcryptjs$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["default"].hash(password, 10);
}
async function verifyPassword(password, hash) {
    if (!hash) return false;
    return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$bcryptjs$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["default"].compare(password, hash);
}
function serializePublicUser(u) {
    return {
        id: u.id,
        name: u.name,
        email: u.email,
        handle: u.handle,
        avatar: u.avatarInitials || u.name.slice(0, 2).toUpperCase(),
        role: u.role,
        verificationStatus: u.verificationStatus,
        isVerified: u.isVerified,
        emailVerified: u.emailVerified,
        bio: u.bio || '',
        location: u.location || '',
        coverGradient: u.coverGradient,
        followerCount: u.followerCount,
        followingCount: u.followingCount,
        postCount: u.postCount,
        sportsFollowing: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$json$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["safeJsonParse"])(u.sportsFollowing, []),
        roleData: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$json$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["safeJsonParse"])(u.roleData, {}),
        registeredAt: u.registeredAt.toISOString(),
        roleId: u.roleId,
        roleTypeId: u.roleTypeId
    };
}
}),
"[project]/src/app/api/auth/me/route.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "GET",
    ()=>GET,
    "dynamic",
    ()=>dynamic
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/server.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$db$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/db.ts [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$auth$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/src/lib/auth.ts [app-route] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$session$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/session.ts [app-route] (ecmascript)");
;
;
;
const dynamic = 'force-dynamic';
async function GET(request) {
    const token = request.cookies.get(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$session$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["SESSION_COOKIE"])?.value;
    const payload = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$session$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["verifySession"])(token);
    if (!payload) {
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            user: null
        }, {
            status: 200
        });
    }
    const user = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$db$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["db"].user.findUnique({
        where: {
            id: payload.sub
        },
        select: {
            id: true,
            name: true,
            email: true,
            handle: true,
            avatarUrl: true,
            avatarInitials: true,
            role: true,
            verificationStatus: true,
            isVerified: true,
            emailVerified: true,
            bio: true,
            location: true,
            coverGradient: true,
            followerCount: true,
            followingCount: true,
            postCount: true,
            sportsFollowing: true,
            roleData: true,
            registeredAt: true,
            roleId: true,
            roleTypeId: true,
            userRole: {
                select: {
                    id: true,
                    name: true,
                    slug: true,
                    icon: true,
                    category: true
                }
            },
            userRoleType: {
                select: {
                    id: true,
                    name: true,
                    slug: true
                }
            },
            userSports: {
                select: {
                    sport: {
                        select: {
                            id: true,
                            name: true,
                            slug: true,
                            icon: true,
                            category: true,
                            sportType: true,
                            format: true
                        }
                    }
                }
            }
        }
    });
    if (!user) {
        const res = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            user: null
        }, {
            status: 200
        });
        res.headers.set('Set-Cookie', `${__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$session$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["SESSION_COOKIE"]}=; Path=/; Max-Age=0; HttpOnly; SameSite=Lax`);
        return res;
    }
    const publicUser = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$auth$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__["serializePublicUser"])(user);
    return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
        user: {
            ...publicUser,
            roleName: user.userRole?.name || 'Fan',
            roleSlug: user.userRole?.slug || 'fan',
            roleIcon: user.userRole?.icon || '⭐',
            roleCategory: user.userRole?.category || 'individual',
            typeName: user.userRoleType?.name || 'Casual Fan',
            typeSlug: user.userRoleType?.slug || 'casual',
            sports: user.userSports.map((us)=>us.sport)
        }
    }, {
        status: 200
    });
}
}),
];

//# sourceMappingURL=%5Broot-of-the-server%5D__1gzfgqt._.js.map