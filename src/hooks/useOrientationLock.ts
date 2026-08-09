"use client";

/**
 * hooks/useOrientationLock.ts
 *
 * Locks the screen to portrait orientation using the Web Screen Orientation
 * API. Call this hook in your root layout or a top-level component.
 *
 * Usage in app/layout.tsx:
 *
 *   "use client";
 *   import { useOrientationLock } from "@/hooks/useOrientationLock";
 *   export default function RootLayout({ children }) {
 *     useOrientationLock("portrait");
 *     return <html>...</html>;
 *   }
 *
 * Note: The Screen Orientation lock API only works in fullscreen / PWA
 * contexts on iOS Safari. For browser tabs, use the CSS approach in
 * mobile-ux-fixes.css or the viewport meta tag instead.
 */

import { useEffect } from "react";

type OrientationType =
  | "portrait"
  | "landscape"
  | "portrait-primary"
  | "portrait-secondary"
  | "landscape-primary"
  | "landscape-secondary"
  | "natural"
  | "any";

export function useOrientationLock(orientation: OrientationType = "portrait") {
  useEffect(() => {
    async function lock() {
      try {
        // The API is only available in secure contexts (HTTPS)
        if (screen?.orientation?.lock) {
          await screen.orientation.lock(orientation);
        }
      } catch {
        // Silently ignore — the browser may not support locking
        // (e.g. desktop browsers, or iOS Safari in a regular tab)
      }
    }

    lock();

    return () => {
      try {
        screen?.orientation?.unlock?.();
      } catch {
        // ignore
      }
    };
  }, [orientation]);
}
