import type { EquipmentType, MuscleGroup, TrackingMode } from '@/db/schema/training';

/**
 * A catalogue entry before it reaches the database — no id or timestamps, since
 * those are generated at seed time.
 */
export type ExerciseSeed = {
  name: string;
  primaryMuscle: MuscleGroup;
  secondaryMuscles: MuscleGroup[];
  equipment: EquipmentType;
  trackingMode: TrackingMode;
};

/**
 * Starter catalogue: the lifts people actually log, not an exhaustive encyclopedia.
 * Users add their own beyond this, and a short well-chosen list is easier to search
 * than a padded one. Names follow common gym usage so search matches what people type.
 */
export const EXERCISE_CATALOGUE: ExerciseSeed[] = [
  // Chest
  { name: 'Bench Press (Barbell)', primaryMuscle: 'chest', secondaryMuscles: ['triceps', 'shoulders'], equipment: 'barbell', trackingMode: 'weight_and_reps' },
  { name: 'Incline Bench Press (Barbell)', primaryMuscle: 'chest', secondaryMuscles: ['triceps', 'shoulders'], equipment: 'barbell', trackingMode: 'weight_and_reps' },
  { name: 'Bench Press (Dumbbell)', primaryMuscle: 'chest', secondaryMuscles: ['triceps', 'shoulders'], equipment: 'dumbbell', trackingMode: 'weight_and_reps' },
  { name: 'Incline Bench Press (Dumbbell)', primaryMuscle: 'chest', secondaryMuscles: ['triceps', 'shoulders'], equipment: 'dumbbell', trackingMode: 'weight_and_reps' },
  { name: 'Chest Fly (Dumbbell)', primaryMuscle: 'chest', secondaryMuscles: [], equipment: 'dumbbell', trackingMode: 'weight_and_reps' },
  { name: 'Cable Fly', primaryMuscle: 'chest', secondaryMuscles: [], equipment: 'cable', trackingMode: 'weight_and_reps' },
  { name: 'Chest Press (Machine)', primaryMuscle: 'chest', secondaryMuscles: ['triceps'], equipment: 'machine', trackingMode: 'weight_and_reps' },
  { name: 'Push Up', primaryMuscle: 'chest', secondaryMuscles: ['triceps', 'core'], equipment: 'bodyweight', trackingMode: 'bodyweight_reps' },
  { name: 'Dip', primaryMuscle: 'chest', secondaryMuscles: ['triceps', 'shoulders'], equipment: 'bodyweight', trackingMode: 'weighted_bodyweight' },

  // Back
  { name: 'Deadlift (Barbell)', primaryMuscle: 'back', secondaryMuscles: ['hamstrings', 'glutes', 'forearms'], equipment: 'barbell', trackingMode: 'weight_and_reps' },
  { name: 'Barbell Row', primaryMuscle: 'back', secondaryMuscles: ['biceps', 'forearms'], equipment: 'barbell', trackingMode: 'weight_and_reps' },
  { name: 'Pendlay Row', primaryMuscle: 'back', secondaryMuscles: ['biceps'], equipment: 'barbell', trackingMode: 'weight_and_reps' },
  { name: 'Dumbbell Row', primaryMuscle: 'back', secondaryMuscles: ['biceps', 'forearms'], equipment: 'dumbbell', trackingMode: 'weight_and_reps' },
  { name: 'Pull Up', primaryMuscle: 'back', secondaryMuscles: ['biceps', 'forearms'], equipment: 'bodyweight', trackingMode: 'weighted_bodyweight' },
  { name: 'Chin Up', primaryMuscle: 'back', secondaryMuscles: ['biceps'], equipment: 'bodyweight', trackingMode: 'weighted_bodyweight' },
  { name: 'Lat Pulldown', primaryMuscle: 'back', secondaryMuscles: ['biceps'], equipment: 'cable', trackingMode: 'weight_and_reps' },
  { name: 'Seated Cable Row', primaryMuscle: 'back', secondaryMuscles: ['biceps'], equipment: 'cable', trackingMode: 'weight_and_reps' },
  { name: 'T-Bar Row', primaryMuscle: 'back', secondaryMuscles: ['biceps'], equipment: 'machine', trackingMode: 'weight_and_reps' },
  { name: 'Face Pull', primaryMuscle: 'back', secondaryMuscles: ['shoulders'], equipment: 'cable', trackingMode: 'weight_and_reps' },
  { name: 'Straight Arm Pulldown', primaryMuscle: 'back', secondaryMuscles: [], equipment: 'cable', trackingMode: 'weight_and_reps' },
  { name: 'Shrug (Barbell)', primaryMuscle: 'back', secondaryMuscles: ['forearms'], equipment: 'barbell', trackingMode: 'weight_and_reps' },
  { name: 'Shrug (Dumbbell)', primaryMuscle: 'back', secondaryMuscles: ['forearms'], equipment: 'dumbbell', trackingMode: 'weight_and_reps' },
  { name: 'Rack Pull', primaryMuscle: 'back', secondaryMuscles: ['glutes', 'forearms'], equipment: 'barbell', trackingMode: 'weight_and_reps' },

  // Shoulders
  { name: 'Overhead Press (Barbell)', primaryMuscle: 'shoulders', secondaryMuscles: ['triceps', 'core'], equipment: 'barbell', trackingMode: 'weight_and_reps' },
  { name: 'Overhead Press (Dumbbell)', primaryMuscle: 'shoulders', secondaryMuscles: ['triceps'], equipment: 'dumbbell', trackingMode: 'weight_and_reps' },
  { name: 'Arnold Press', primaryMuscle: 'shoulders', secondaryMuscles: ['triceps'], equipment: 'dumbbell', trackingMode: 'weight_and_reps' },
  { name: 'Lateral Raise (Dumbbell)', primaryMuscle: 'shoulders', secondaryMuscles: [], equipment: 'dumbbell', trackingMode: 'weight_and_reps' },
  { name: 'Lateral Raise (Cable)', primaryMuscle: 'shoulders', secondaryMuscles: [], equipment: 'cable', trackingMode: 'weight_and_reps' },
  { name: 'Rear Delt Fly', primaryMuscle: 'shoulders', secondaryMuscles: ['back'], equipment: 'dumbbell', trackingMode: 'weight_and_reps' },
  { name: 'Front Raise', primaryMuscle: 'shoulders', secondaryMuscles: [], equipment: 'dumbbell', trackingMode: 'weight_and_reps' },
  { name: 'Upright Row', primaryMuscle: 'shoulders', secondaryMuscles: ['back'], equipment: 'barbell', trackingMode: 'weight_and_reps' },
  { name: 'Shoulder Press (Machine)', primaryMuscle: 'shoulders', secondaryMuscles: ['triceps'], equipment: 'machine', trackingMode: 'weight_and_reps' },

  // Biceps
  { name: 'Barbell Curl', primaryMuscle: 'biceps', secondaryMuscles: ['forearms'], equipment: 'barbell', trackingMode: 'weight_and_reps' },
  { name: 'Dumbbell Curl', primaryMuscle: 'biceps', secondaryMuscles: ['forearms'], equipment: 'dumbbell', trackingMode: 'weight_and_reps' },
  { name: 'Hammer Curl', primaryMuscle: 'biceps', secondaryMuscles: ['forearms'], equipment: 'dumbbell', trackingMode: 'weight_and_reps' },
  { name: 'Preacher Curl', primaryMuscle: 'biceps', secondaryMuscles: [], equipment: 'barbell', trackingMode: 'weight_and_reps' },
  { name: 'Incline Dumbbell Curl', primaryMuscle: 'biceps', secondaryMuscles: [], equipment: 'dumbbell', trackingMode: 'weight_and_reps' },
  { name: 'Cable Curl', primaryMuscle: 'biceps', secondaryMuscles: ['forearms'], equipment: 'cable', trackingMode: 'weight_and_reps' },
  { name: 'Concentration Curl', primaryMuscle: 'biceps', secondaryMuscles: [], equipment: 'dumbbell', trackingMode: 'weight_and_reps' },

  // Triceps
  { name: 'Close Grip Bench Press', primaryMuscle: 'triceps', secondaryMuscles: ['chest', 'shoulders'], equipment: 'barbell', trackingMode: 'weight_and_reps' },
  { name: 'Triceps Pushdown', primaryMuscle: 'triceps', secondaryMuscles: [], equipment: 'cable', trackingMode: 'weight_and_reps' },
  { name: 'Overhead Triceps Extension', primaryMuscle: 'triceps', secondaryMuscles: [], equipment: 'dumbbell', trackingMode: 'weight_and_reps' },
  { name: 'Skull Crusher', primaryMuscle: 'triceps', secondaryMuscles: [], equipment: 'barbell', trackingMode: 'weight_and_reps' },
  { name: 'Triceps Dip', primaryMuscle: 'triceps', secondaryMuscles: ['chest'], equipment: 'bodyweight', trackingMode: 'weighted_bodyweight' },
  { name: 'Triceps Kickback', primaryMuscle: 'triceps', secondaryMuscles: [], equipment: 'dumbbell', trackingMode: 'weight_and_reps' },

  // Forearms
  { name: 'Wrist Curl', primaryMuscle: 'forearms', secondaryMuscles: [], equipment: 'barbell', trackingMode: 'weight_and_reps' },
  { name: 'Reverse Curl', primaryMuscle: 'forearms', secondaryMuscles: ['biceps'], equipment: 'barbell', trackingMode: 'weight_and_reps' },
  { name: 'Farmer Carry', primaryMuscle: 'forearms', secondaryMuscles: ['core', 'back'], equipment: 'dumbbell', trackingMode: 'duration' },

  // Quads
  { name: 'Back Squat (Barbell)', primaryMuscle: 'quads', secondaryMuscles: ['glutes', 'hamstrings', 'core'], equipment: 'barbell', trackingMode: 'weight_and_reps' },
  { name: 'Front Squat (Barbell)', primaryMuscle: 'quads', secondaryMuscles: ['glutes', 'core'], equipment: 'barbell', trackingMode: 'weight_and_reps' },
  { name: 'Goblet Squat', primaryMuscle: 'quads', secondaryMuscles: ['glutes', 'core'], equipment: 'dumbbell', trackingMode: 'weight_and_reps' },
  { name: 'Leg Press', primaryMuscle: 'quads', secondaryMuscles: ['glutes'], equipment: 'machine', trackingMode: 'weight_and_reps' },
  { name: 'Hack Squat', primaryMuscle: 'quads', secondaryMuscles: ['glutes'], equipment: 'machine', trackingMode: 'weight_and_reps' },
  { name: 'Leg Extension', primaryMuscle: 'quads', secondaryMuscles: [], equipment: 'machine', trackingMode: 'weight_and_reps' },
  { name: 'Bulgarian Split Squat', primaryMuscle: 'quads', secondaryMuscles: ['glutes'], equipment: 'dumbbell', trackingMode: 'weight_and_reps' },
  { name: 'Walking Lunge', primaryMuscle: 'quads', secondaryMuscles: ['glutes', 'hamstrings'], equipment: 'dumbbell', trackingMode: 'weight_and_reps' },
  { name: 'Step Up', primaryMuscle: 'quads', secondaryMuscles: ['glutes'], equipment: 'dumbbell', trackingMode: 'weight_and_reps' },

  // Hamstrings
  { name: 'Romanian Deadlift', primaryMuscle: 'hamstrings', secondaryMuscles: ['glutes', 'back'], equipment: 'barbell', trackingMode: 'weight_and_reps' },
  { name: 'Stiff Leg Deadlift', primaryMuscle: 'hamstrings', secondaryMuscles: ['glutes', 'back'], equipment: 'barbell', trackingMode: 'weight_and_reps' },
  { name: 'Lying Leg Curl', primaryMuscle: 'hamstrings', secondaryMuscles: [], equipment: 'machine', trackingMode: 'weight_and_reps' },
  { name: 'Seated Leg Curl', primaryMuscle: 'hamstrings', secondaryMuscles: [], equipment: 'machine', trackingMode: 'weight_and_reps' },
  { name: 'Nordic Curl', primaryMuscle: 'hamstrings', secondaryMuscles: [], equipment: 'bodyweight', trackingMode: 'bodyweight_reps' },
  { name: 'Good Morning', primaryMuscle: 'hamstrings', secondaryMuscles: ['back', 'glutes'], equipment: 'barbell', trackingMode: 'weight_and_reps' },

  // Glutes
  { name: 'Hip Thrust (Barbell)', primaryMuscle: 'glutes', secondaryMuscles: ['hamstrings'], equipment: 'barbell', trackingMode: 'weight_and_reps' },
  { name: 'Glute Bridge', primaryMuscle: 'glutes', secondaryMuscles: ['hamstrings'], equipment: 'bodyweight', trackingMode: 'bodyweight_reps' },
  { name: 'Cable Kickback', primaryMuscle: 'glutes', secondaryMuscles: [], equipment: 'cable', trackingMode: 'weight_and_reps' },
  { name: 'Hip Abduction (Machine)', primaryMuscle: 'glutes', secondaryMuscles: [], equipment: 'machine', trackingMode: 'weight_and_reps' },
  { name: 'Sumo Deadlift', primaryMuscle: 'glutes', secondaryMuscles: ['hamstrings', 'back', 'quads'], equipment: 'barbell', trackingMode: 'weight_and_reps' },

  // Calves
  { name: 'Standing Calf Raise', primaryMuscle: 'calves', secondaryMuscles: [], equipment: 'machine', trackingMode: 'weight_and_reps' },
  { name: 'Seated Calf Raise', primaryMuscle: 'calves', secondaryMuscles: [], equipment: 'machine', trackingMode: 'weight_and_reps' },
  { name: 'Calf Raise (Dumbbell)', primaryMuscle: 'calves', secondaryMuscles: [], equipment: 'dumbbell', trackingMode: 'weight_and_reps' },

  // Core
  { name: 'Plank', primaryMuscle: 'core', secondaryMuscles: ['shoulders'], equipment: 'bodyweight', trackingMode: 'duration' },
  { name: 'Side Plank', primaryMuscle: 'core', secondaryMuscles: [], equipment: 'bodyweight', trackingMode: 'duration' },
  { name: 'Hanging Leg Raise', primaryMuscle: 'core', secondaryMuscles: ['forearms'], equipment: 'bodyweight', trackingMode: 'bodyweight_reps' },
  { name: 'Cable Crunch', primaryMuscle: 'core', secondaryMuscles: [], equipment: 'cable', trackingMode: 'weight_and_reps' },
  { name: 'Ab Wheel Rollout', primaryMuscle: 'core', secondaryMuscles: ['shoulders'], equipment: 'other', trackingMode: 'bodyweight_reps' },
  { name: 'Russian Twist', primaryMuscle: 'core', secondaryMuscles: [], equipment: 'other', trackingMode: 'weight_and_reps' },
  { name: 'Sit Up', primaryMuscle: 'core', secondaryMuscles: [], equipment: 'bodyweight', trackingMode: 'bodyweight_reps' },
  { name: 'Back Extension', primaryMuscle: 'core', secondaryMuscles: ['back', 'glutes'], equipment: 'bodyweight', trackingMode: 'weighted_bodyweight' },
  { name: 'Pallof Press', primaryMuscle: 'core', secondaryMuscles: [], equipment: 'cable', trackingMode: 'weight_and_reps' },

  // Full body and conditioning
  { name: 'Clean and Press', primaryMuscle: 'full_body', secondaryMuscles: ['shoulders', 'quads', 'back'], equipment: 'barbell', trackingMode: 'weight_and_reps' },
  { name: 'Power Clean', primaryMuscle: 'full_body', secondaryMuscles: ['back', 'quads'], equipment: 'barbell', trackingMode: 'weight_and_reps' },
  { name: 'Snatch', primaryMuscle: 'full_body', secondaryMuscles: ['shoulders', 'back'], equipment: 'barbell', trackingMode: 'weight_and_reps' },
  { name: 'Kettlebell Swing', primaryMuscle: 'full_body', secondaryMuscles: ['glutes', 'hamstrings'], equipment: 'kettlebell', trackingMode: 'weight_and_reps' },
  { name: 'Burpee', primaryMuscle: 'full_body', secondaryMuscles: ['chest', 'quads'], equipment: 'bodyweight', trackingMode: 'bodyweight_reps' },
  { name: 'Thruster', primaryMuscle: 'full_body', secondaryMuscles: ['quads', 'shoulders'], equipment: 'barbell', trackingMode: 'weight_and_reps' },
  { name: 'Running', primaryMuscle: 'full_body', secondaryMuscles: ['quads', 'calves'], equipment: 'other', trackingMode: 'distance_and_duration' },
  { name: 'Cycling', primaryMuscle: 'full_body', secondaryMuscles: ['quads'], equipment: 'machine', trackingMode: 'distance_and_duration' },
  { name: 'Rowing Machine', primaryMuscle: 'full_body', secondaryMuscles: ['back', 'quads'], equipment: 'machine', trackingMode: 'distance_and_duration' },
  { name: 'Jump Rope', primaryMuscle: 'full_body', secondaryMuscles: ['calves'], equipment: 'other', trackingMode: 'duration' },
];
