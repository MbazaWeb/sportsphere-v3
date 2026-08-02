module.exports = [
"[externals]/next/dist/build/adapter/setup-node-env.external.js [external] (next/dist/build/adapter/setup-node-env.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/build/adapter/setup-node-env.external.js", () => require("next/dist/build/adapter/setup-node-env.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/work-async-storage.external.js [external] (next/dist/server/app-render/work-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/work-async-storage.external.js", () => require("next/dist/server/app-render/work-async-storage.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/compiled/@opentelemetry/api [external] (next/dist/compiled/@opentelemetry/api, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/compiled/@opentelemetry/api", () => require("next/dist/compiled/@opentelemetry/api"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/work-unit-async-storage.external.js [external] (next/dist/server/app-render/work-unit-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/work-unit-async-storage.external.js", () => require("next/dist/server/app-render/work-unit-async-storage.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/lib/incremental-cache/tags-manifest.external.js [external] (next/dist/server/lib/incremental-cache/tags-manifest.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/lib/incremental-cache/tags-manifest.external.js", () => require("next/dist/server/lib/incremental-cache/tags-manifest.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/after-task-async-storage.external.js [external] (next/dist/server/app-render/after-task-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/after-task-async-storage.external.js", () => require("next/dist/server/app-render/after-task-async-storage.external.js"));

module.exports = mod;
}),
"[externals]/node:async_hooks [external] (node:async_hooks, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("node:async_hooks", () => require("node:async_hooks"));

module.exports = mod;
}),
"[externals]/path [external] (path, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("path", () => require("path"));

module.exports = mod;
}),
"[externals]/next/dist/server/lib/incremental-cache/memory-cache.external.js [external] (next/dist/server/lib/incremental-cache/memory-cache.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/lib/incremental-cache/memory-cache.external.js", () => require("next/dist/server/lib/incremental-cache/memory-cache.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/lib/incremental-cache/shared-cache-controls.external.js [external] (next/dist/server/lib/incremental-cache/shared-cache-controls.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/lib/incremental-cache/shared-cache-controls.external.js", () => require("next/dist/server/lib/incremental-cache/shared-cache-controls.external.js"));

module.exports = mod;
}),
"[externals]/crypto [external] (crypto, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("crypto", () => require("crypto"));

module.exports = mod;
}),
"[externals]/next/dist/compiled/next-server/app-page-turbo.runtime.dev.js [external] (next/dist/compiled/next-server/app-page-turbo.runtime.dev.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/compiled/next-server/app-page-turbo.runtime.dev.js", () => require("next/dist/compiled/next-server/app-page-turbo.runtime.dev.js"));

module.exports = mod;
}),
"[project]/src/lib/session.ts [middleware] (ecmascript)", ((__turbopack_context__) => {
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
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$jose$2f$dist$2f$webapi$2f$jwt$2f$sign$2e$js__$5b$middleware$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/jose/dist/webapi/jwt/sign.js [middleware] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$jose$2f$dist$2f$webapi$2f$jwt$2f$verify$2e$js__$5b$middleware$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/jose/dist/webapi/jwt/verify.js [middleware] (ecmascript)");
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
    return new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$jose$2f$dist$2f$webapi$2f$jwt$2f$sign$2e$js__$5b$middleware$5d$__$28$ecmascript$29$__["SignJWT"]({
        ...payload
    }).setProtectedHeader({
        alg: 'HS256'
    }).setSubject(payload.sub).setIssuedAt().setExpirationTime(`${SESSION_TTL_SECONDS}s`).sign(encoder.encode(SESSION_SECRET));
}
async function verifySession(token) {
    if (!token) return null;
    try {
        const { payload } = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$jose$2f$dist$2f$webapi$2f$jwt$2f$verify$2e$js__$5b$middleware$5d$__$28$ecmascript$29$__["jwtVerify"])(token, encoder.encode(SESSION_SECRET), {
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
"[project]/src/proxy.ts [middleware] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "config",
    ()=>config,
    "proxy",
    ()=>proxy
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$middleware$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/server.js [middleware] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$session$2e$ts__$5b$middleware$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/session.ts [middleware] (ecmascript)");
;
;
async function proxy(request) {
    const { pathname } = request.nextUrl;
    // ─── Skip public routes ──────────────────────────────────────
    // Auth API routes (login, register, forgot/reset password, verify-email)
    if (pathname.startsWith('/api/auth/')) {
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$middleware$5d$__$28$ecmascript$29$__["NextResponse"].next();
    }
    // Public pages & static assets
    if (pathname === '/' || pathname.startsWith('/_next/') || pathname.startsWith('/favicon') || pathname.startsWith('/logo') || pathname.endsWith('.svg') || pathname.endsWith('.png') || pathname.endsWith('.ico')) {
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$middleware$5d$__$28$ecmascript$29$__["NextResponse"].next();
    }
    // ─── Protect API routes that require auth ────────────────────
    if (pathname.startsWith('/api/')) {
        const token = request.cookies.get(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$session$2e$ts__$5b$middleware$5d$__$28$ecmascript$29$__["SESSION_COOKIE"])?.value;
        const session = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$session$2e$ts__$5b$middleware$5d$__$28$ecmascript$29$__["verifySession"])(token);
        if (!session?.sub) {
            return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$middleware$5d$__$28$ecmascript$29$__["NextResponse"].json({
                error: 'Not authenticated'
            }, {
                status: 401
            });
        }
        // Add session info to headers for downstream API routes
        const requestHeaders = new Headers(request.headers);
        requestHeaders.set('x-user-id', session.sub);
        requestHeaders.set('x-user-role', session.role);
        if (session.roleId) requestHeaders.set('x-user-role-id', session.roleId);
        if (session.roleTypeId) requestHeaders.set('x-user-role-type-id', session.roleTypeId);
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$middleware$5d$__$28$ecmascript$29$__["NextResponse"].next({
            request: {
                headers: requestHeaders
            }
        });
    }
    return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$middleware$5d$__$28$ecmascript$29$__["NextResponse"].next();
}
const config = {
    // Match all API routes except auth
    matcher: [
        '/api/:path*'
    ]
};
}),
];

//# sourceMappingURL=%5Broot-of-the-server%5D__1-etd3s._.js.map