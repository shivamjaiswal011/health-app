import { and, eq, isNull } from 'drizzle-orm';

import { database } from '@/db/client';
import { logChange, withTimestamps } from '@/db/mutation';
import { bodyMetrics } from '@/db/schema';
import type { WeightUnit } from '@/domain/units/weight';

const BODY_METRICS = 'body_metrics';

export type NewBodyWeight = {
  id: string;
  measuredOn: string;
  weightKg: number;
  weightUnit: WeightUnit;
};

/**
 * Records a weigh-in, replacing any already recorded for that day. People step on the
 * scale twice and get two different numbers; keeping both would put a phantom swing in
 * the trend line that never happened to their bodyweight.
 */
export async function recordBodyWeight(entry: NewBodyWeight): Promise<void> {
  const now = new Date();
  await database.transaction(async (tx) => {
    await tx
      .update(bodyMetrics)
      .set({ deletedAt: now, updatedAt: now })
      .where(and(eq(bodyMetrics.measuredOn, entry.measuredOn), isNull(bodyMetrics.deletedAt)));
    await tx.insert(bodyMetrics).values(withTimestamps(entry));
    await logChange(tx, { entityTable: BODY_METRICS, entityId: entry.id, operation: 'insert' });
  });
}
