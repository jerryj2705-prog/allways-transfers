ALTER TABLE `bookings` ADD `additionalPickupCount` int DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `bookings` ADD `additionalDropoffCount` int DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `bookings` ADD `additionalPickupAddresses` text;--> statement-breakpoint
ALTER TABLE `bookings` ADD `additionalDropoffAddresses` text;--> statement-breakpoint
ALTER TABLE `bookings` ADD `additionalStopsSurcharge` decimal(10,2) DEFAULT '0';