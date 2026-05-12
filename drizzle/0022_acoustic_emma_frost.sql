CREATE TABLE `landmarks` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(300) NOT NULL,
	`lat` decimal(10,6) NOT NULL,
	`lng` decimal(10,6) NOT NULL,
	`lga` varchar(200) NOT NULL,
	`category` enum('resort','golf_course','venue','hospital','university','airport','shopping','stadium','theme_park','attraction','other') NOT NULL DEFAULT 'other',
	`isActive` int NOT NULL DEFAULT 1,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `landmarks_id` PRIMARY KEY(`id`)
);
