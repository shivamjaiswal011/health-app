/**
 * Domain shapes for training calculations. Deliberately plain objects rather than
 * database rows: the calculations must stay usable without a database, and no
 * Drizzle type may leak into a domain signature.
 */

export type CompletedSet = {
  exerciseId: string;
  weightKg: number | null;
  reps: number | null;
  completedAt: Date;
};

export type SessionSummary = {
  workoutId: string;
  startedAt: Date;
  endedAt: Date | null;
  sets: CompletedSet[];
};
