/**
 * Mobile API client instance
 * --------------------------
 * Reads the deployed Next.js API URL from EXPO_PUBLIC_API_URL.
 * On native, JWT is stored in expo-secure-store; we send it as a Bearer header.
 *
 * For local dev against the running Next.js app on web:
 *   EXPO_PUBLIC_API_URL=http://192.168.x.x:3000
 *   (use your LAN IP — the simulator/device cannot reach localhost of the dev machine)
 */

import * as SecureStore from 'expo-secure-store';
import { createApiClient, createAuthApi, createFeedApi, createPerformanceApi, createLeaderboardApi } from '@sportsphere/api-client';

const JWT_KEY = 'sportsphere.jwt';

export const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? '';

async function getToken(): Promise<string | null> {
  try {
    return await SecureStore.getItemAsync(JWT_KEY);
  } catch {
    return null;
  }
}

// Synchronous wrapper for the api-client config (which expects sync getToken).
// We populate a module-level cache on app boot, and refresh after login.
let cachedToken: string | null = null;
export async function refreshCachedToken() {
  cachedToken = await getToken();
}
refreshCachedToken().catch(() => {});

export async function setToken(token: string | null) {
  if (token) {
    await SecureStore.setItemAsync(JWT_KEY, token);
  } else {
    await SecureStore.deleteItemAsync(JWT_KEY);
  }
  cachedToken = token;
}

export const apiClient = createApiClient({
  baseURL: API_BASE_URL,
  getToken: () => cachedToken,
  onUnauthorized: () => {
    // Clear local session; redirect to login handled by auth store subscriber
    setToken(null).catch(() => {});
  },
});

export const authApi        = createAuthApi(apiClient);
export const feedApi        = createFeedApi(apiClient);
export const performanceApi = createPerformanceApi(apiClient);
export const leaderboardApi = createLeaderboardApi(apiClient);
