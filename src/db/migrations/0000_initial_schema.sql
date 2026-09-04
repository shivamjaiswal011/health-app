CREATE TABLE `change_log` (
	`id` text PRIMARY KEY NOT NULL,
	`entity_table` text NOT NULL,
	`entity_id` text NOT NULL,
	`operation` text NOT NULL,
	`occurred_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `exercises` (
	`id` text PRIMARY KEY NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`deleted_at` integer,
	`name` text NOT NULL,
	`primary_muscle` text NOT NULL,
	`secondary_muscles` text DEFAULT '[]' NOT NULL,
	`equipment` text NOT NULL,
	`tracking_mode` text NOT NULL,
	`is_custom` integer DEFAULT false NOT NULL,
	`notes` text
);
--> statement-breakpoint
CREATE INDEX `idx_exercises_name` ON `exercises` (`name`);--> statement-breakpoint
CREATE TABLE `personal_records` (
	`id` text PRIMARY KEY NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`deleted_at` integer,
	`exercise_id` text NOT NULL,
	`record_type` text NOT NULL,
	`value` real NOT NULL,
	`achieved_at` integer NOT NULL,
	`set_id` text,
	FOREIGN KEY (`exercise_id`) REFERENCES `exercises`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`set_id`) REFERENCES `sets`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_personal_records_exercise` ON `personal_records` (`exercise_id`,`record_type`);--> statement-breakpoint
CREATE TABLE `routine_exercises` (
	`id` text PRIMARY KEY NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`deleted_at` integer,
	`routine_id` text NOT NULL,
	`exercise_id` text NOT NULL,
	`position` integer NOT NULL,
	`superset_group` integer,
	`target_sets` integer,
	`target_reps_low` integer,
	`target_reps_high` integer,
	`target_rest_seconds` integer,
	`notes` text,
	FOREIGN KEY (`routine_id`) REFERENCES `routines`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`exercise_id`) REFERENCES `exercises`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_routine_exercises_routine` ON `routine_exercises` (`routine_id`,`position`);--> statement-breakpoint
CREATE TABLE `routines` (
	`id` text PRIMARY KEY NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`deleted_at` integer,
	`name` text NOT NULL,
	`position` integer DEFAULT 0 NOT NULL,
	`notes` text
);
--> statement-breakpoint
CREATE TABLE `sets` (
	`id` text PRIMARY KEY NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`deleted_at` integer,
	`workout_exercise_id` text NOT NULL,
	`exercise_id` text NOT NULL,
	`position` integer NOT NULL,
	`set_type` text DEFAULT 'working' NOT NULL,
	`weight_kg` real,
	`reps` integer,
	`rpe` real,
	`duration_seconds` integer,
	`distance_meters` real,
	`completed_at` integer,
	FOREIGN KEY (`workout_exercise_id`) REFERENCES `workout_exercises`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`exercise_id`) REFERENCES `exercises`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_sets_workout_exercise` ON `sets` (`workout_exercise_id`,`position`);--> statement-breakpoint
CREATE INDEX `idx_sets_exercise_history` ON `sets` (`exercise_id`,`completed_at`);--> statement-breakpoint
CREATE TABLE `workout_exercises` (
	`id` text PRIMARY KEY NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`deleted_at` integer,
	`workout_id` text NOT NULL,
	`exercise_id` text NOT NULL,
	`position` integer NOT NULL,
	`superset_group` integer,
	`notes` text,
	FOREIGN KEY (`workout_id`) REFERENCES `workouts`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`exercise_id`) REFERENCES `exercises`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_workout_exercises_workout` ON `workout_exercises` (`workout_id`,`position`);--> statement-breakpoint
CREATE TABLE `workouts` (
	`id` text PRIMARY KEY NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`deleted_at` integer,
	`routine_id` text,
	`name` text NOT NULL,
	`started_at` integer NOT NULL,
	`ended_at` integer,
	`notes` text,
	FOREIGN KEY (`routine_id`) REFERENCES `routines`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_workouts_started_at` ON `workouts` (`started_at`);--> statement-breakpoint
CREATE TABLE `body_metrics` (
	`id` text PRIMARY KEY NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`deleted_at` integer,
	`measured_on` text NOT NULL,
	`weight_kg` real,
	`body_fat_percent` real,
	`notes` text
);
--> statement-breakpoint
CREATE INDEX `idx_body_metrics_measured_on` ON `body_metrics` (`measured_on`);--> statement-breakpoint
CREATE TABLE `custom_food_portions` (
	`id` text PRIMARY KEY NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`deleted_at` integer,
	`custom_food_id` text NOT NULL,
	`label` text NOT NULL,
	`grams` real NOT NULL,
	`is_default` integer DEFAULT false NOT NULL,
	FOREIGN KEY (`custom_food_id`) REFERENCES `custom_foods`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_custom_food_portions_food` ON `custom_food_portions` (`custom_food_id`);--> statement-breakpoint
CREATE TABLE `custom_foods` (
	`id` text PRIMARY KEY NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`deleted_at` integer,
	`name` text NOT NULL,
	`brand` text,
	`kcal_per_100g` real NOT NULL,
	`protein_per_100g` real NOT NULL,
	`carbs_per_100g` real NOT NULL,
	`fat_per_100g` real NOT NULL,
	`fiber_per_100g` real
);
--> statement-breakpoint
CREATE INDEX `idx_custom_foods_name` ON `custom_foods` (`name`);--> statement-breakpoint
CREATE TABLE `food_entries` (
	`id` text PRIMARY KEY NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`deleted_at` integer,
	`logged_on` text NOT NULL,
	`meal_slot` text NOT NULL,
	`position` integer DEFAULT 0 NOT NULL,
	`food_id` text NOT NULL,
	`food_source` text NOT NULL,
	`food_name_at_log` text NOT NULL,
	`portion_label` text,
	`portion_count` real DEFAULT 1 NOT NULL,
	`grams_at_log` real NOT NULL,
	`kcal_at_log` real NOT NULL,
	`protein_at_log` real NOT NULL,
	`carbs_at_log` real NOT NULL,
	`fat_at_log` real NOT NULL,
	`fiber_at_log` real
);
--> statement-breakpoint
CREATE INDEX `idx_food_entries_day` ON `food_entries` (`logged_on`,`meal_slot`,`position`);--> statement-breakpoint
CREATE INDEX `idx_food_entries_food` ON `food_entries` (`food_id`);--> statement-breakpoint
CREATE TABLE `nutrition_targets` (
	`id` text PRIMARY KEY NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`deleted_at` integer,
	`effective_from` text NOT NULL,
	`kcal` real NOT NULL,
	`protein_grams` real NOT NULL,
	`carbs_grams` real NOT NULL,
	`fat_grams` real NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_nutrition_targets_effective_from` ON `nutrition_targets` (`effective_from`);--> statement-breakpoint
CREATE TABLE `recipe_items` (
	`id` text PRIMARY KEY NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`deleted_at` integer,
	`recipe_id` text NOT NULL,
	`food_id` text NOT NULL,
	`food_source` text NOT NULL,
	`food_name` text NOT NULL,
	`grams` real NOT NULL,
	`position` integer NOT NULL,
	FOREIGN KEY (`recipe_id`) REFERENCES `recipes`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_recipe_items_recipe` ON `recipe_items` (`recipe_id`,`position`);--> statement-breakpoint
CREATE TABLE `recipes` (
	`id` text PRIMARY KEY NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`deleted_at` integer,
	`name` text NOT NULL,
	`servings` real DEFAULT 1 NOT NULL,
	`notes` text
);
