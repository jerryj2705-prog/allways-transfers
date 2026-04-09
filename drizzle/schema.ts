import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, decimal, bigint } from "drizzle-orm/mysql-core";

export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

export const vehicles = mysqlTable("vehicles", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 200 }).notNull(),
  type: mysqlEnum("type", ["suv", "van"]).notNull(),
  description: text("description"),
  capacity: int("capacity").notNull().default(4),
  luggageCapacity: int("luggageCapacity").notNull().default(2),
  baseRate: decimal("baseRate", { precision: 10, scale: 2 }).notNull().default("0"),
  perKmRate: decimal("perKmRate", { precision: 10, scale: 2 }).notNull().default("0"),
  perHourRate: decimal("perHourRate", { precision: 10, scale: 2 }).notNull().default("0"),
  imageUrl: text("imageUrl"),
  isActive: int("isActive").notNull().default(1),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Vehicle = typeof vehicles.$inferSelect;
export type InsertVehicle = typeof vehicles.$inferInsert;

export const bookings = mysqlTable("bookings", {
  id: int("id").autoincrement().primaryKey(),
  referenceNumber: varchar("referenceNumber", { length: 20 }).notNull().unique(),
  // Client details
  clientName: varchar("clientName", { length: 200 }).notNull(),
  clientEmail: varchar("clientEmail", { length: 320 }).notNull(),
  clientPhone: varchar("clientPhone", { length: 30 }).notNull(),
  // Service details
  serviceType: mysqlEnum("serviceType", ["airport_transfer", "hourly_hire", "point_to_point", "special_events"]).notNull(),
  // Location details
  pickupAddress: text("pickupAddress").notNull(),
  dropoffAddress: text("dropoffAddress"),
  // Additional stops
  additionalPickupCount: int("additionalPickupCount").notNull().default(0),
  additionalDropoffCount: int("additionalDropoffCount").notNull().default(0),
  additionalPickupAddresses: text("additionalPickupAddresses"), // JSON array of addresses
  additionalDropoffAddresses: text("additionalDropoffAddresses"), // JSON array of addresses
  additionalStopsSurcharge: decimal("additionalStopsSurcharge", { precision: 10, scale: 2 }).default("0"),
  // Public holiday
  publicHolidaySurcharge: decimal("publicHolidaySurcharge", { precision: 10, scale: 2 }).default("0"),
  publicHolidayName: varchar("publicHolidayName", { length: 200 }),
  // Date/time (UTC ms)
  pickupDate: bigint("pickupDate", { mode: "number" }).notNull(),
  // Passengers
  passengerCount: int("passengerCount").notNull().default(1),
  // Vehicle
  vehicleId: int("vehicleId").notNull(),
  vehicleName: varchar("vehicleName", { length: 200 }).notNull(),
  // Support van add-on
  needsSupportVan: int("needsSupportVan").notNull().default(0),
  supportVanPrice: decimal("supportVanPrice", { precision: 10, scale: 2 }).default("0"),
  // Child seat options (0, 1, or 2 of each type)
  rearFacingSeats: int("rearFacingSeats").notNull().default(0),
  forwardFacingSeats: int("forwardFacingSeats").notNull().default(0),
  boosterSeats: int("boosterSeats").notNull().default(0),
  // Pet-friendly
  isPetFriendly: int("isPetFriendly").notNull().default(0),
  petDescription: text("petDescription"),
  // Pricing
  estimatedDistance: decimal("estimatedDistance", { precision: 10, scale: 2 }),
  estimatedDuration: int("estimatedDuration"),
  basePrice: decimal("basePrice", { precision: 10, scale: 2 }).notNull(),
  totalPrice: decimal("totalPrice", { precision: 10, scale: 2 }).notNull(),
  // Payment
  paymentMethod: mysqlEnum("paymentMethod", ["stripe_prepay", "square_postpay", "cash_postpay"]).notNull().default("cash_postpay"),
  paymentStatus: mysqlEnum("paymentStatus", ["unpaid", "paid", "refunded"]).notNull().default("unpaid"),
  stripeSessionId: varchar("stripeSessionId", { length: 255 }),
  // Status
  status: mysqlEnum("status", ["pending", "confirmed", "completed", "cancelled"]).default("pending").notNull(),
  // Notes
  specialRequests: text("specialRequests"),
  adminNotes: text("adminNotes"),
  // Terms
  termsAccepted: int("termsAccepted").notNull().default(0),
  // Timestamps
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Booking = typeof bookings.$inferSelect;
export type InsertBooking = typeof bookings.$inferInsert;

export const pricingSettings = mysqlTable("pricing_settings", {
  id: int("id").autoincrement().primaryKey(),
  settingKey: varchar("settingKey", { length: 100 }).notNull().unique(),
  settingValue: decimal("settingValue", { precision: 10, scale: 2 }).notNull().default("0"),
  label: varchar("label", { length: 200 }).notNull(),
  description: text("description"),
  category: mysqlEnum("category", ["base_price", "surcharge", "rate", "toggle"]).notNull(),
  isActive: int("isActive").notNull().default(1),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type PricingSetting = typeof pricingSettings.$inferSelect;
export type InsertPricingSetting = typeof pricingSettings.$inferInsert;

export const enquiries = mysqlTable("enquiries", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 200 }).notNull(),
  email: varchar("email", { length: 320 }).notNull(),
  phone: varchar("phone", { length: 30 }),
  subject: varchar("subject", { length: 300 }).notNull(),
  message: text("message").notNull(),
  status: mysqlEnum("status", ["new", "read", "replied", "archived"]).default("new").notNull(),
  adminNotes: text("adminNotes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Enquiry = typeof enquiries.$inferSelect;
export type InsertEnquiry = typeof enquiries.$inferInsert;

export const publicHolidays = mysqlTable("public_holidays", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 200 }).notNull(),
  date: varchar("date", { length: 10 }).notNull(), // YYYY-MM-DD format
  isRecurring: int("isRecurring").notNull().default(0), // 1 = same date every year (e.g. Christmas)
  isActive: int("isActive").notNull().default(1),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type PublicHoliday = typeof publicHolidays.$inferSelect;
export type InsertPublicHoliday = typeof publicHolidays.$inferInsert;
