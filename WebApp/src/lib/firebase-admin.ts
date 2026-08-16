/**
 * Firebase Admin (server-only) — used to send FCM push to Flutter devices.
 *
 * Credentials: set GOOGLE_APPLICATION_CREDENTIALS to the absolute path of the
 * service account JSON on the VPS, OR set FIREBASE_SERVICE_ACCOUNT_JSON to the
 * raw JSON string. Never commit the private key to git.
 */
import type { App } from 'firebase-admin/app';

let app: App | null = null;
let initAttempted = false;

export async function getFirebaseAdminApp(): Promise<App | null> {
  if (typeof window !== 'undefined') return null;
  if (app) return app;
  if (initAttempted) return null;
  initAttempted = true;

  try {
    const admin = await import('firebase-admin');
    if (admin.apps.length > 0) {
      app = admin.apps[0]!;
      return app;
    }

    const jsonEnv = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
    if (jsonEnv) {
      const cred = JSON.parse(jsonEnv);
      app = admin.initializeApp({
        credential: admin.credential.cert(cred),
        projectId: cred.project_id || 'sportsphere-v1',
      });
      return app;
    }

    // Falls back to GOOGLE_APPLICATION_CREDENTIALS file path if set
    if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
      app = admin.initializeApp({
        credential: admin.credential.applicationDefault(),
        projectId: process.env.FIREBASE_PROJECT_ID || 'sportsphere-v1',
      });
      return app;
    }

    console.warn(
      '[firebase-admin] No credentials. Set FIREBASE_SERVICE_ACCOUNT_JSON or GOOGLE_APPLICATION_CREDENTIALS',
    );
    return null;
  } catch (e) {
    console.error('[firebase-admin] init failed:', e);
    return null;
  }
}

export async function sendFcmToTokens(
  tokens: string[],
  title: string,
  body: string,
  data?: Record<string, unknown>,
): Promise<void> {
  if (tokens.length === 0) return;
  const a = await getFirebaseAdminApp();
  if (!a) return;

  const admin = await import('firebase-admin');
  const messaging = admin.messaging(a);

  // data values must be strings for FCM
  const dataStr: Record<string, string> | undefined = data
    ? Object.fromEntries(
        Object.entries(data).map(([k, v]) => [k, typeof v === 'string' ? v : JSON.stringify(v)]),
      )
    : undefined;

  // sendEachForMulticast is preferred for batches
  const res = await messaging.sendEachForMulticast({
    tokens,
    notification: { title, body },
    data: dataStr,
    android: { priority: 'high' },
    apns: { payload: { aps: { sound: 'default' } } },
  });

  if (res.failureCount > 0) {
    console.warn(
      `[firebase-admin] FCM failures: ${res.failureCount}/${tokens.length}`,
      res.responses
        .map((r, i) => (r.success ? null : { token: tokens[i]?.slice(0, 12), error: r.error?.message }))
        .filter(Boolean),
    );
  }
}
