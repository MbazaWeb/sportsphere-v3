'use client';

import Image from 'next/image';

/**
 * SportSphere logo displayed at the top of every auth screen.
 * Consistent sizing, responsive, top-centered.
 * Spec: Phase 4 — "Add official SportSphere logo. Top centered. Consistent sizing. Responsive."
 */
export function AuthLogo() {
  return (
    <div className="flex justify-center mb-6">
      <Image
        src="/logo-wordmark.svg"
        alt="SportSphere"
        width={180}
        height={40}
        priority
        className="h-9 w-auto sm:h-10 sm:w-[200px]"
      />
    </div>
  );
}
