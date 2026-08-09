import { db } from '@/lib/db';

export async function logAdminAction(adminId: string, action: string, targetId: string, details?: object) {
  try {
    await (db.auditLog as any).create({
      data: {
        actorId: adminId,
        action,
        targetId,
        details: details ? JSON.stringify(details) : null,
      },
    });
  } catch (error) {
    console.error('Audit logging error:', error);
  }
}
