import { getDatabase } from '@/lib/db';
import { auditLogs } from '@/lib/db/schema';

/**
 * Record an audit log entry
 */
export async function recordAuditLog({
  userId,
  action,
  entityType,
  entityId,
  metadata,
}: {
  userId?: number | null;
  action: string;
  entityType?: string;
  entityId?: number;
  metadata?: Record<string, unknown>;
}): Promise<void> {
  try {
    const db = getDatabase();
    await db.insert(auditLogs).values({
      userId: userId || null,
      action,
      entityType,
      entityId,
      metadata: metadata || null,
    });
  } catch (error) {
    console.error('Failed to record audit log:', error);
    // Don't throw — audit logging failure shouldn't break the main operation
  }
}
