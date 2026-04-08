CREATE TABLE `pricing_settings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`settingKey` varchar(100) NOT NULL,
	`settingValue` decimal(10,2) NOT NULL DEFAULT '0',
	`label` varchar(200) NOT NULL,
	`description` text,
	`category` enum('base_price','surcharge','rate','toggle') NOT NULL,
	`isActive` int NOT NULL DEFAULT 1,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `pricing_settings_id` PRIMARY KEY(`id`),
	CONSTRAINT `pricing_settings_settingKey_unique` UNIQUE(`settingKey`)
);
