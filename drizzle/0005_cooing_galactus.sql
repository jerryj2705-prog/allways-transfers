ALTER TABLE `bookings` ADD `rearFacingSeats` int DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `bookings` ADD `forwardFacingSeats` int DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `bookings` ADD `boosterSeats` int DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `bookings` ADD `isPetFriendly` int DEFAULT 0 NOT NULL;