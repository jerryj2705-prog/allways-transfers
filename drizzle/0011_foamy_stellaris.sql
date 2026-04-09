CREATE TABLE `reviews` (
	`id` int AUTO_INCREMENT NOT NULL,
	`bookingId` int NOT NULL,
	`bookingReference` varchar(20) NOT NULL,
	`userId` int,
	`reviewerName` varchar(200) NOT NULL,
	`rating` int NOT NULL,
	`comment` text,
	`serviceType` enum('airport_transfer','hourly_hire','point_to_point','special_events') NOT NULL,
	`status` enum('pending','approved','rejected') NOT NULL DEFAULT 'pending',
	`adminNotes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `reviews_id` PRIMARY KEY(`id`)
);
