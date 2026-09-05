import type { CalendarDay } from '@/domain/nutrition/calendar-day';
import type { SeriesPoint } from '@/domain/progress/time-series';
import type { WeightUnit } from '@/domain/units/weight';

/**
 * How an insight should read, not how alarming it is. `attention` is the strongest
 * tone the app uses — nothing here is an emergency, and dressing a training
 * observation up as one would train the user to ignore all of them.
 */
export type InsightTone = 'positive' | 'neutral' | 'attention';

export type Insight = {
  id: string;
  title: string;
  /**
   * What the app observed, in the user's own numbers. Every insight carries this: an
   * unexplained verdict is not actionable, and a wrong one is impossible to argue with.
   */
  evidence: string;
  tone: InsightTone;
};

export type LiftHistory = {
  exerciseId: string;
  name: string;
  /** Best estimated one-rep max per training day, oldest first. */
  sessions: SeriesPoint[];
};

export type MuscleActivity = {
  muscle: string;
  setsLast14Days: number;
  lastTrainedOn: CalendarDay | null;
};

export type DayNutrition = {
  day: CalendarDay;
  kcal: number;
  protein: number;
};

export type NutritionTarget = {
  kcal: number;
  proteinGrams: number;
};

export type WeeklyTraining = {
  /** `YYYY-WW`, oldest first. */
  week: string;
  sets: number;
};

/**
 * Everything the rules are allowed to see. Assembled once per evaluation so each rule
 * stays a pure function of it — that is what makes them testable without a database.
 */
export type InsightContext = {
  today: CalendarDay;
  lifts: LiftHistory[];
  weeks: WeeklyTraining[];
  muscles: MuscleActivity[];
  nutrition: DayNutrition[];
  target: NutritionTarget | null;
  bodyWeightTrend: SeriesPoint[];
  /** Days on which any set was completed. */
  trainingDays: Set<CalendarDay>;
  /**
   * How to write weights in the evidence. Rules still reason in kilograms — this is a
   * formatting choice, and letting it into the arithmetic would make the thresholds
   * mean different things in different units.
   */
  weightUnit: WeightUnit;
};

export type InsightRule = (context: InsightContext) => Insight | null;
