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

type OrientationLockType =
  | "any"
  | "natural"
  | "landscape"
  | "portrait"
  | "portrait-primary"
  | "portrait-secondary"
  | "landscape-primary"
  | "landscape-secondary";

/**
 * The `lock()` and `unlock()` methods on `ScreenOrientation` are part of the
 * W3C Screen Orientation API but are NOT included in TypeScript's bundled
 * lib.dom.d.ts (the spec is still in flux and browser support is incomplete).
 * We declare a minimal extension here so the rest of the code is type-safe.
 */
interface LockableScreenOrientation extends ScreenOrientation {
  lock(orientation: OrientationLockType): Promise<void>;
  unlock(): void;
}

interface LockableScreen extends Screen {
  orientation: LockableScreenOrientation;
}

export function useOrientationLock(orientation: OrientationLockType = "portrait") {
  useEffect(() => {
    async function lock() {
      try {
        const s = screen as LockableScreen | undefined;
        // The API is only available in secure contexts (HTTPS)
        if (s?.orientation?.lock) {
          await s.orientation.lock(orientation);
        }
      } catch {
        // Silently ignore — the browser may not support locking
        // (e.g. desktop browsers, or iOS Safari in a regular tab)
      }
    }

    lock();

    return () => {
      try {
        const s = screen as LockableScreen | undefined;
        s?.orientation?.unlock?.();
      } catch {
        // ignore
      }
    };
  }, [orientation]);
}
