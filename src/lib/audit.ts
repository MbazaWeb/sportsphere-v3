/**
 * src/lib/audit.ts
 *
 * Admin audit logging utility.
 * Writes to the AuditLog table for every admin action.
 * Server-only — never import in client components.
 */

import { db } from '@/lib/db';
import type { NextRequest } from 'next/server';

export interface LogAdminActionInput {
  request: NextRequest;
  actorId: string;
  action: string;
  module: string;
  targetId?: string;
  targetType?: string;
  oldValue?: unknown;
  newValue?: unknown;
}

/**
 * Log an admin action to the AuditLog table.
 * Designed to be called with `.catch(() => {})` so it never blocks the main flow.
 */
export async function logAdminAction(input: LogAdminActionInput): Promise<void> {
  const ipAddress =
    input.request.headers.get('x-forwarded-for')?.split(',')[0].trim() ??
    input.request.headers.get('x-real-ip') ??
    'unknown';

  const userAgent = input.request.headers.get('user-agent')?.slice(0, 500) ?? null;

  await db.auditLog.create({
    data: {
      actorId: input.actorId,
      action: input.action,
      module: input.module,
      targetId: input.targetId ?? null,
      targetType: input.targetType ?? null,
      oldValue: input.oldValue !== undefined ? JSON.parse(JSON.stringify(input.oldValue)) : null,
      newValue: input.newValue !== undefined ? JSON.parse(JSON.stringify(input.newValue)) : null,
      ipAddress,
      userAgent,
    },
  });
}
