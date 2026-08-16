"use client";

/**
 * components/SwipeGuard.tsx
 *
 * Prevents the browser's swipe-to-go-back gesture from firing when the
 * user is interacting with a form. Wrap any form page or component with
 * this provider.
 *
 * Usage:
 *   <SwipeGuard>
 *     <MyFormComponent />
 *   </SwipeGuard>
 *
 * How it works:
 *   - Listens for `touchstart` events that begin within the left 30px
 *     "danger zone" that triggers the browser's swipe-back gesture.
 *   - If the touch started inside a form element (input, textarea, select,
 *     button, or any element with data-swipe-guard) it calls
 *     `preventDefault()` to suppress the navigation gesture.
 *   - Outside forms the gesture works normally.
 *
 * This is intentionally conservative: we only block the gesture when
 * the user is clearly inside a form. Random swipes on other content
 * still navigate back as expected.
 */

import { useEffect, useRef } from "react";

interface SwipeGuardProps {
  children: React.ReactNode;
  /**
   * How far from the left edge (px) to consider a "back-swipe" start.
   * Default: 30px. Increase if users still accidentally navigate back.
   */
  edgeWidth?: number;
}

const FORM_ELEMENTS = new Set([
  "INPUT",
  "TEXTAREA",
  "SELECT",
  "BUTTON",
  "LABEL",
]);

function isInsideForm(target: EventTarget | null): boolean {
  if (!(target instanceof Element)) return false;
  let el: Element | null = target;
  while (el) {
    if (
      el.tagName === "FORM" ||
      FORM_ELEMENTS.has(el.tagName) ||
      el.hasAttribute("data-swipe-guard")
    ) {
      return true;
    }
    el = el.parentElement;
  }
  return false;
}

export function SwipeGuard({ children, edgeWidth = 30 }: SwipeGuardProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    function handleTouchStart(e: TouchEvent) {
      const touch = e.touches[0];
      if (!touch) return;

      // Only intercept touches that start near the left edge
      if (touch.clientX > edgeWidth) return;

      // Only block if the touch started inside a form
      if (isInsideForm(e.target)) {
        e.preventDefault();
      }
    }

    // passive: false is required to be able to call preventDefault()
    container.addEventListener("touchstart", handleTouchStart, {
      passive: false,
    });

    return () => {
      container.removeEventListener("touchstart", handleTouchStart);
    };
  }, [edgeWidth]);

  return (
    <div ref={containerRef} style={{ touchAction: "pan-y" }}>
      {children}
    </div>
  );
}

/**
 * Higher-order component variant. Wrap a page component:
 *
 *   export default withSwipeGuard(MyFormPage);
 */
export function withSwipeGuard<P extends object>(
  Component: React.ComponentType<P>,
  edgeWidth?: number
) {
  return function GuardedComponent(props: P) {
    return (
      <SwipeGuard edgeWidth={edgeWidth}>
        <Component {...props} />
      </SwipeGuard>
    );
  };
}
