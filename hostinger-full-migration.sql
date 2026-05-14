-- ============================================================
-- FULL SCHEMA MIGRATION FOR HOSTINGER LOCAL MySQL
-- This script is idempotent - safe to run multiple times
-- It creates tables if they don't exist and adds missing columns
-- ============================================================

-- ============ USERS TABLE ============
CREATE TABLE IF NOT EXISTS `users` (
  `id` int AUTO_INCREMENT NOT NULL,
  `openId` varchar(64),
  `name` text,
  `email` varchar(320),
  `passwordHash` varchar(255),
  `googleId` varchar(255),
  `loginMethod` varchar(64),
  `role` enum('user','admin') NOT NULL DEFAULT 'user',
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `lastSignedIn` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT `users_id` PRIMARY KEY(`id`),
  CONSTRAINT `users_openId_unique` UNIQUE(`openId`)
);

-- Add columns that may be missing from users
SET @col_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users' AND COLUMN_NAME = 'passwordHash');
SET @sql = IF(@col_exists = 0, 'ALTER TABLE `users` ADD `passwordHash` varchar(255)', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @col_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users' AND COLUMN_NAME = 'googleId');
SET @sql = IF(@col_exists = 0, 'ALTER TABLE `users` ADD `googleId` varchar(255)', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @col_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users' AND COLUMN_NAME = 'email');
SET @sql = IF(@col_exists = 0, 'ALTER TABLE `users` ADD `email` varchar(320)', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- ============ VEHICLES TABLE ============
CREATE TABLE IF NOT EXISTS `vehicles` (
  `id` int AUTO_INCREMENT NOT NULL,
  `name` varchar(200) NOT NULL,
  `type` enum('suv','van') NOT NULL,
  `description` text,
  `capacity` int NOT NULL DEFAULT 4,
  `luggageCapacity` int NOT NULL DEFAULT 2,
  `baseRate` decimal(10,2) NOT NULL DEFAULT '0',
  `perKmRate` decimal(10,2) NOT NULL DEFAULT '0',
  `perHourRate` decimal(10,2) NOT NULL DEFAULT '0',
  `imageUrl` text,
  `isActive` int NOT NULL DEFAULT 1,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT `vehicles_id` PRIMARY KEY(`id`)
);

-- ============ BOOKINGS TABLE ============
CREATE TABLE IF NOT EXISTS `bookings` (
  `id` int AUTO_INCREMENT NOT NULL,
  `referenceNumber` varchar(20) NOT NULL,
  `clientName` varchar(200) NOT NULL,
  `clientEmail` varchar(320) NOT NULL,
  `clientPhone` varchar(30) NOT NULL,
  `serviceType` enum('airport_transfer','hourly_hire','point_to_point','special_events','freight') NOT NULL,
  `pickupAddress` text NOT NULL,
  `dropoffAddress` text,
  `pickupDate` bigint NOT NULL,
  `passengerCount` int NOT NULL DEFAULT 1,
  `vehicleId` int NOT NULL,
  `vehicleName` varchar(200) NOT NULL,
  `estimatedDistance` decimal(10,2),
  `estimatedDuration` int,
  `totalPrice` decimal(10,2) NOT NULL,
  `status` enum('quote','pending','confirmed','completed','cancelled','expired') NOT NULL DEFAULT 'pending',
  `specialRequests` text,
  `adminNotes` text,
  `termsAccepted` int NOT NULL DEFAULT 0,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `bookings_id` PRIMARY KEY(`id`),
  CONSTRAINT `bookings_referenceNumber_unique` UNIQUE(`referenceNumber`)
);

-- Add all columns that may be missing from bookings (added in later migrations)
SET @col_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'bookings' AND COLUMN_NAME = 'needsSupportVan');
SET @sql = IF(@col_exists = 0, 'ALTER TABLE `bookings` ADD `needsSupportVan` int NOT NULL DEFAULT 0', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @col_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'bookings' AND COLUMN_NAME = 'supportVanPrice');
SET @sql = IF(@col_exists = 0, 'ALTER TABLE `bookings` ADD `supportVanPrice` decimal(10,2) DEFAULT ''0''', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @col_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'bookings' AND COLUMN_NAME = 'basePrice');
SET @sql = IF(@col_exists = 0, 'ALTER TABLE `bookings` ADD `basePrice` decimal(10,2) NOT NULL DEFAULT ''0''', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @col_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'bookings' AND COLUMN_NAME = 'paymentMethod');
SET @sql = IF(@col_exists = 0, 'ALTER TABLE `bookings` ADD `paymentMethod` enum(''stripe_prepay'',''square_postpay'',''cash_postpay'',''direct_deposit'') NOT NULL DEFAULT ''cash_postpay''', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @col_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'bookings' AND COLUMN_NAME = 'paymentStatus');
SET @sql = IF(@col_exists = 0, 'ALTER TABLE `bookings` ADD `paymentStatus` enum(''unpaid'',''paid'',''refunded'') NOT NULL DEFAULT ''unpaid''', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @col_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'bookings' AND COLUMN_NAME = 'stripeSessionId');
SET @sql = IF(@col_exists = 0, 'ALTER TABLE `bookings` ADD `stripeSessionId` varchar(255)', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @col_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'bookings' AND COLUMN_NAME = 'rearFacingSeats');
SET @sql = IF(@col_exists = 0, 'ALTER TABLE `bookings` ADD `rearFacingSeats` int NOT NULL DEFAULT 0', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @col_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'bookings' AND COLUMN_NAME = 'forwardFacingSeats');
SET @sql = IF(@col_exists = 0, 'ALTER TABLE `bookings` ADD `forwardFacingSeats` int NOT NULL DEFAULT 0', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @col_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'bookings' AND COLUMN_NAME = 'boosterSeats');
SET @sql = IF(@col_exists = 0, 'ALTER TABLE `bookings` ADD `boosterSeats` int NOT NULL DEFAULT 0', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @col_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'bookings' AND COLUMN_NAME = 'isPetFriendly');
SET @sql = IF(@col_exists = 0, 'ALTER TABLE `bookings` ADD `isPetFriendly` int NOT NULL DEFAULT 0', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @col_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'bookings' AND COLUMN_NAME = 'numberOfPets');
SET @sql = IF(@col_exists = 0, 'ALTER TABLE `bookings` ADD `numberOfPets` int', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @col_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'bookings' AND COLUMN_NAME = 'petDescription');
SET @sql = IF(@col_exists = 0, 'ALTER TABLE `bookings` ADD `petDescription` text', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @col_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'bookings' AND COLUMN_NAME = 'additionalPickupCount');
SET @sql = IF(@col_exists = 0, 'ALTER TABLE `bookings` ADD `additionalPickupCount` int NOT NULL DEFAULT 0', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @col_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'bookings' AND COLUMN_NAME = 'additionalDropoffCount');
SET @sql = IF(@col_exists = 0, 'ALTER TABLE `bookings` ADD `additionalDropoffCount` int NOT NULL DEFAULT 0', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @col_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'bookings' AND COLUMN_NAME = 'additionalPickupAddresses');
SET @sql = IF(@col_exists = 0, 'ALTER TABLE `bookings` ADD `additionalPickupAddresses` text', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @col_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'bookings' AND COLUMN_NAME = 'additionalDropoffAddresses');
SET @sql = IF(@col_exists = 0, 'ALTER TABLE `bookings` ADD `additionalDropoffAddresses` text', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @col_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'bookings' AND COLUMN_NAME = 'additionalStopsSurcharge');
SET @sql = IF(@col_exists = 0, 'ALTER TABLE `bookings` ADD `additionalStopsSurcharge` decimal(10,2) DEFAULT ''0''', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @col_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'bookings' AND COLUMN_NAME = 'publicHolidaySurcharge');
SET @sql = IF(@col_exists = 0, 'ALTER TABLE `bookings` ADD `publicHolidaySurcharge` decimal(10,2) DEFAULT ''0''', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @col_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'bookings' AND COLUMN_NAME = 'publicHolidayName');
SET @sql = IF(@col_exists = 0, 'ALTER TABLE `bookings` ADD `publicHolidayName` varchar(200)', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @col_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'bookings' AND COLUMN_NAME = 'paymentNote');
SET @sql = IF(@col_exists = 0, 'ALTER TABLE `bookings` ADD `paymentNote` text', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @col_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'bookings' AND COLUMN_NAME = 'freightDescription');
SET @sql = IF(@col_exists = 0, 'ALTER TABLE `bookings` ADD `freightDescription` text', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @col_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'bookings' AND COLUMN_NAME = 'freightWeight');
SET @sql = IF(@col_exists = 0, 'ALTER TABLE `bookings` ADD `freightWeight` varchar(50)', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @col_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'bookings' AND COLUMN_NAME = 'freightItemCount');
SET @sql = IF(@col_exists = 0, 'ALTER TABLE `bookings` ADD `freightItemCount` int', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @col_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'bookings' AND COLUMN_NAME = 'freightSpecialHandling');
SET @sql = IF(@col_exists = 0, 'ALTER TABLE `bookings` ADD `freightSpecialHandling` text', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @col_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'bookings' AND COLUMN_NAME = 'routePreference');
SET @sql = IF(@col_exists = 0, 'ALTER TABLE `bookings` ADD `routePreference` varchar(20) DEFAULT ''fastest''', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @col_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'bookings' AND COLUMN_NAME = 'tollOverride');
SET @sql = IF(@col_exists = 0, 'ALTER TABLE `bookings` ADD `tollOverride` decimal(10,2)', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @col_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'bookings' AND COLUMN_NAME = 'airportTollSurcharge');
SET @sql = IF(@col_exists = 0, 'ALTER TABLE `bookings` ADD `airportTollSurcharge` decimal(10,2) DEFAULT ''0''', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @col_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'bookings' AND COLUMN_NAME = 'airportTollDetails');
SET @sql = IF(@col_exists = 0, 'ALTER TABLE `bookings` ADD `airportTollDetails` text', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @col_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'bookings' AND COLUMN_NAME = 'roadTollSurcharge');
SET @sql = IF(@col_exists = 0, 'ALTER TABLE `bookings` ADD `roadTollSurcharge` decimal(10,2) DEFAULT ''0''', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @col_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'bookings' AND COLUMN_NAME = 'roadTollDetails');
SET @sql = IF(@col_exists = 0, 'ALTER TABLE `bookings` ADD `roadTollDetails` text', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @col_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'bookings' AND COLUMN_NAME = 'lastReminderSentAt');
SET @sql = IF(@col_exists = 0, 'ALTER TABLE `bookings` ADD `lastReminderSentAt` bigint', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @col_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'bookings' AND COLUMN_NAME = 'paymentProofUrl');
SET @sql = IF(@col_exists = 0, 'ALTER TABLE `bookings` ADD `paymentProofUrl` text', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @col_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'bookings' AND COLUMN_NAME = 'paymentProofKey');
SET @sql = IF(@col_exists = 0, 'ALTER TABLE `bookings` ADD `paymentProofKey` varchar(512)', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @col_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'bookings' AND COLUMN_NAME = 'paymentProofUploadedAt');
SET @sql = IF(@col_exists = 0, 'ALTER TABLE `bookings` ADD `paymentProofUploadedAt` bigint', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @col_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'bookings' AND COLUMN_NAME = 'lastPaymentReminderSentAt');
SET @sql = IF(@col_exists = 0, 'ALTER TABLE `bookings` ADD `lastPaymentReminderSentAt` bigint', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @col_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'bookings' AND COLUMN_NAME = 'invoiceNumber');
SET @sql = IF(@col_exists = 0, 'ALTER TABLE `bookings` ADD `invoiceNumber` varchar(20)', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- ============ PRICING SETTINGS TABLE ============
CREATE TABLE IF NOT EXISTS `pricing_settings` (
  `id` int AUTO_INCREMENT NOT NULL,
  `settingKey` varchar(100) NOT NULL,
  `settingValue` decimal(10,2) NOT NULL DEFAULT '0',
  `label` varchar(200) NOT NULL,
  `description` text,
  `category` enum('base_price','surcharge','rate','toggle','road_toll','fuel') NOT NULL,
  `isActive` int NOT NULL DEFAULT 1,
  `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `pricing_settings_id` PRIMARY KEY(`id`),
  CONSTRAINT `pricing_settings_settingKey_unique` UNIQUE(`settingKey`)
);

-- ============ ENQUIRIES TABLE ============
CREATE TABLE IF NOT EXISTS `enquiries` (
  `id` int AUTO_INCREMENT NOT NULL,
  `name` varchar(200) NOT NULL,
  `email` varchar(320) NOT NULL,
  `phone` varchar(30),
  `subject` varchar(300) NOT NULL,
  `message` text NOT NULL,
  `status` enum('new','read','replied','archived') NOT NULL DEFAULT 'new',
  `adminNotes` text,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `enquiries_id` PRIMARY KEY(`id`)
);

-- ============ PUBLIC HOLIDAYS TABLE ============
CREATE TABLE IF NOT EXISTS `public_holidays` (
  `id` int AUTO_INCREMENT NOT NULL,
  `name` varchar(200) NOT NULL,
  `date` varchar(10) NOT NULL,
  `isRecurring` int NOT NULL DEFAULT 0,
  `isActive` int NOT NULL DEFAULT 1,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `public_holidays_id` PRIMARY KEY(`id`)
);

-- ============ REVIEWS TABLE ============
CREATE TABLE IF NOT EXISTS `reviews` (
  `id` int AUTO_INCREMENT NOT NULL,
  `bookingId` int NOT NULL,
  `bookingReference` varchar(20) NOT NULL,
  `userId` int,
  `reviewerName` varchar(200) NOT NULL,
  `rating` int NOT NULL,
  `comment` text,
  `serviceType` enum('airport_transfer','hourly_hire','point_to_point','special_events','freight') NOT NULL,
  `status` enum('pending','approved','rejected') NOT NULL DEFAULT 'pending',
  `adminNotes` text,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `reviews_id` PRIMARY KEY(`id`)
);

-- ============ APP SETTINGS TABLE ============
CREATE TABLE IF NOT EXISTS `app_settings` (
  `id` int AUTO_INCREMENT NOT NULL,
  `settingKey` varchar(100) NOT NULL,
  `settingValue` text,
  `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `app_settings_id` PRIMARY KEY(`id`),
  CONSTRAINT `app_settings_settingKey_unique` UNIQUE(`settingKey`)
);

-- ============ GOOGLE REVIEWS CACHE TABLE ============
CREATE TABLE IF NOT EXISTS `google_reviews_cache` (
  `id` int AUTO_INCREMENT NOT NULL,
  `placeId` varchar(255) NOT NULL,
  `authorName` varchar(300) NOT NULL,
  `rating` int NOT NULL,
  `text` text,
  `relativeTimeDescription` varchar(100),
  `publishTime` bigint,
  `profilePhotoUrl` text,
  `fetchedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT `google_reviews_cache_id` PRIMARY KEY(`id`)
);

-- ============ PASSWORD RESET TOKENS TABLE ============
CREATE TABLE IF NOT EXISTS `password_reset_tokens` (
  `id` int AUTO_INCREMENT NOT NULL,
  `userId` int NOT NULL,
  `token` varchar(255) NOT NULL,
  `expiresAt` timestamp NOT NULL,
  `usedAt` timestamp NULL,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT `password_reset_tokens_id` PRIMARY KEY(`id`),
  CONSTRAINT `password_reset_tokens_token_unique` UNIQUE(`token`)
);

-- ============ LANDMARKS TABLE ============
CREATE TABLE IF NOT EXISTS `landmarks` (
  `id` int AUTO_INCREMENT NOT NULL,
  `name` varchar(300) NOT NULL,
  `lat` decimal(10,6) NOT NULL,
  `lng` decimal(10,6) NOT NULL,
  `lga` varchar(200) NOT NULL,
  `category` enum('resort','golf_course','venue','hospital','university','airport','shopping','stadium','theme_park','attraction','other') NOT NULL DEFAULT 'other',
  `address` varchar(500),
  `isActive` int NOT NULL DEFAULT 1,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `landmarks_id` PRIMARY KEY(`id`)
);

-- ============ EMAIL LOGS TABLE ============
CREATE TABLE IF NOT EXISTS `email_logs` (
  `id` int AUTO_INCREMENT NOT NULL,
  `emailType` varchar(100) NOT NULL,
  `toEmail` varchar(320) NOT NULL,
  `fromEmail` varchar(320) NOT NULL,
  `subject` varchar(500) NOT NULL,
  `status` enum('sent','failed') NOT NULL,
  `resendId` varchar(255),
  `error` text,
  `bookingReference` varchar(20),
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT `email_logs_id` PRIMARY KEY(`id`)
);

-- ============ MODIFY ENUM COLUMNS (if table existed before with fewer options) ============
-- Update status enum to include 'quote' and 'expired'
ALTER TABLE `bookings` MODIFY COLUMN `status` enum('quote','pending','confirmed','completed','cancelled','expired') NOT NULL DEFAULT 'pending';

-- Update serviceType enum to include 'freight'
ALTER TABLE `bookings` MODIFY COLUMN `serviceType` enum('airport_transfer','hourly_hire','point_to_point','special_events','freight') NOT NULL;

-- Update paymentMethod enum to include 'direct_deposit'
ALTER TABLE `bookings` MODIFY COLUMN `paymentMethod` enum('stripe_prepay','square_postpay','cash_postpay','direct_deposit') NOT NULL DEFAULT 'cash_postpay';

-- Update pricing_settings category enum to include 'fuel'
ALTER TABLE `pricing_settings` MODIFY COLUMN `category` enum('base_price','surcharge','rate','toggle','road_toll','fuel') NOT NULL;

-- ============ DONE ============
SELECT 'Migration completed successfully!' as result;
