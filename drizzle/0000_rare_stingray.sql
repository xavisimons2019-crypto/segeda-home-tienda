CREATE TABLE `category_changes` (
	`id` text PRIMARY KEY NOT NULL,
	`action` text NOT NULL,
	`data` text DEFAULT '{}' NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `orders` (
	`id` text PRIMARY KEY NOT NULL,
	`customer_name` text DEFAULT '' NOT NULL,
	`customer_phone` text DEFAULT '' NOT NULL,
	`payload` text NOT NULL,
	`total` integer DEFAULT 0 NOT NULL,
	`status` text DEFAULT 'nuevo' NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_orders_created_at` ON `orders` (`created_at`);--> statement-breakpoint
CREATE TABLE `product_changes` (
	`id` text PRIMARY KEY NOT NULL,
	`action` text NOT NULL,
	`data` text DEFAULT '{}' NOT NULL,
	`updated_at` integer NOT NULL
);
