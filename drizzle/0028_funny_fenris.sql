ALTER TABLE `bookings` ADD `paymentProofUrl` text;--> statement-breakpoint
ALTER TABLE `bookings` ADD `paymentProofKey` varchar(512);--> statement-breakpoint
ALTER TABLE `bookings` ADD `paymentProofUploadedAt` bigint;