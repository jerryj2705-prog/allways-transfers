CREATE TABLE `app_settings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`settingKey` varchar(100) NOT NULL,
	`settingValue` text,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `app_settings_id` PRIMARY KEY(`id`),
	CONSTRAINT `app_settings_settingKey_unique` UNIQUE(`settingKey`)
);
--> statement-breakpoint
CREATE TABLE `google_reviews_cache` (
	`id` int AUTO_INCREMENT NOT NULL,
	`placeId` varchar(255) NOT NULL,
	`authorName` varchar(300) NOT NULL,
	`rating` int NOT NULL,
	`text` text,
	`relativeTimeDescription` varchar(100),
	`publishTime` bigint,
	`profilePhotoUrl` text,
	`fetchedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `google_reviews_cache_id` PRIMARY KEY(`id`)
);
