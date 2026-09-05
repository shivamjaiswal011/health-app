import { toCalendarDay } from '@/domain/nutrition/calendar-day';
import { rollingAverage, MILLISECONDS_PER_DAY } from '@/domain/progress/time-series';
import { bestOneRepMaxByDay } from '@/domain/training/strength-series';
import type { WeightUnit } from '@/domain/units/weight';
import type {
  DayNutrition,
  InsightContext,
  LiftHistory,
  MuscleActivity,
  NutritionTarget,
  WeeklyTraining,
} from '@/domain/insights/types';

const RECENT_MUSCLE_WINDOW_DAYS = 14;
const WEIGHT_TREND_WINDOW_DAYS = 7;

export type CompletedSetRow = {
  exerciseId: string;
  name: string;
  primaryMuscle: string;
  completedAt: Date | null;
  weightKg: number | null;
  reps: number | null;
};

function groupByExercise(rows: CompletedSetRow[]): LiftHistory[] {
  const byExercise = new Map<string, { name: string; rows: CompletedSetRow[] }>();
  for (const row of rows) {
    const existing = byExercise.get(row.exerciseId);
    if (existing) existing.rows.push(row);
    else byExercise.set(row.exerciseId, { name: row.name, rows: [row] });
  }

  return [...byExercise.entries()].map(([exerciseId, entry]) => ({
    exerciseId,
    name: entry.name,
    sessions: bestOneRepMaxByDay(entry.rows),
  }));
}

function summariseMuscles(rows: CompletedSetRow[], today: string): MuscleActivity[] {
  const cutoff = new Date(today).getTime() - RECENT_MUSCLE_WINDOW_DAYS * MILLISECONDS_PER_DAY;
  const byMuscle = new Map<string, { recent: number; lastAt: number }>();

  for (const row of rows) {
    if (!row.completedAt) continue;
    const at = row.completedAt.getTime();
    const entry = byMuscle.get(row.primaryMuscle) ?? { recent: 0, lastAt: 0 };
    if (at >= cutoff) entry.recent += 1;
    entry.lastAt = Math.max(entry.lastAt, at);
    byMuscle.set(row.primaryMuscle, entry);
  }

  return [...byMuscle.entries()].map(([muscle, entry]) => ({
    muscle,
    setsLast14Days: entry.recent,
    lastTrainedOn: entry.lastAt > 0 ? toCalendarDay(new Date(entry.lastAt)) : null,
  }));
}

function trainingDaysOf(rows: CompletedSetRow[]): Set<string> {
  const days = new Set<string>();
  for (const row of rows) {
    if (row.completedAt) days.add(toCalendarDay(row.completedAt));
  }
  return days;
}

export type ContextSources = {
  today: string;
  completedSets: CompletedSetRow[];
  weeks: { week: string; setCount: number }[];
  nutrition: DayNutrition[];
  target: NutritionTarget | null;
  weighIns: { measuredOn: string; weightKg: number | null }[];
  weightUnit: WeightUnit;
};

/**
 * Turns query results into the shape the rules expect. Kept apart from the rules so a
 * rule never has to know where its numbers came from, and apart from the queries so
 * the shaping itself stays testable.
 */
export function buildInsightContext(sources: ContextSources): InsightContext {
  const weeks: WeeklyTraining[] = [...sources.weeks]
    .reverse()
    .map((entry) => ({ week: entry.week, sets: entry.setCount }));

  const weighIns = sources.weighIns
    .filter((row) => row.weightKg !== null)
    .map((row) => ({ at: new Date(row.measuredOn).getTime(), value: row.weightKg as number }));

  return {
    today: sources.today,
    lifts: groupByExercise(sources.completedSets),
    weeks,
    muscles: summariseMuscles(sources.completedSets, sources.today),
    nutrition: sources.nutrition,
    target: sources.target,
    bodyWeightTrend: rollingAverage(weighIns, WEIGHT_TREND_WINDOW_DAYS),
    trainingDays: trainingDaysOf(sources.completedSets),
    weightUnit: sources.weightUnit,
  };
}
