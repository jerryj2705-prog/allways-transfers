ALTER TABLE `bookings` ADD `paymentMethod` enum('stripe_prepay','square_postpay','cash_postpay') DEFAULT 'cash_postpay' NOT NULL;--> statement-breakpoint
ALTER TABLE `bookings` ADD `paymentStatus` enum('unpaid','paid','refunded') DEFAULT 'unpaid' NOT NULL;--> statement-breakpoint
ALTER TABLE `bookings` ADD `stripeSessionId` varchar(255);