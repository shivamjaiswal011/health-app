CREATE TABLE `profiles` (
	`id` text PRIMARY KEY NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`deleted_at` integer,
	`effective_from` text NOT NULL,
	`sex` text NOT NULL,
	`age_years` integer NOT NULL,
	`height_cm` real NOT NULL,
	`activity` text NOT NULL,
	`goal` text NOT NULL
);
