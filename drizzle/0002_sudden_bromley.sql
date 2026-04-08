ALTER TABLE `vehicles` MODIFY COLUMN `type` enum('suv','van') NOT NULL;--> statement-breakpoint
ALTER TABLE `bookings` ADD `needsSupportVan` int DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `bookings` ADD `supportVanPrice` decimal(10,2) DEFAULT '0';--> statement-breakpoint
ALTER TABLE `bookings` ADD `basePrice` decimal(10,2) NOT NULL;--> statement-breakpoint
ALTER TABLE `bookings` DROP COLUMN `vehicleType`;