CREATE TABLE `email_logs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`emailType` varchar(100) NOT NULL,
	`toEmail` varchar(320) NOT NULL,
	`fromEmail` varchar(320) NOT NULL,
	`subject` varchar(500) NOT NULL,
	`status` enum('sent','failed') NOT NULL,
	`resendId` varchar(255),
	`error` text,
	`bookingReference` varchar(20),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `email_logs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `bookings` MODIFY COLUMN `status` enum('quote','pending','confirmed','completed','cancelled','expired') NOT NULL DEFAULT 'pending';--> statement-breakpoint
ALTER TABLE `bookings` ADD `lastReminderSentAt` bigint;