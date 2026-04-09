ALTER TABLE `bookings` ADD `publicHolidaySurcharge` decimal(10,2) DEFAULT '0';--> statement-breakpoint
ALTER TABLE `bookings` ADD `publicHolidayName` varchar(200);