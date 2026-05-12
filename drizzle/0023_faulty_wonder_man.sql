ALTER TABLE `bookings` ADD `airportTollSurcharge` decimal(10,2) DEFAULT '0';--> statement-breakpoint
ALTER TABLE `bookings` ADD `airportTollDetails` text;--> statement-breakpoint
ALTER TABLE `bookings` ADD `roadTollSurcharge` decimal(10,2) DEFAULT '0';--> statement-breakpoint
ALTER TABLE `bookings` ADD `roadTollDetails` text;--> statement-breakpoint
ALTER TABLE `landmarks` ADD `address` varchar(500);