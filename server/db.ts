import { eq, desc, and, or, like, sql, isNull, gte, lte, ne } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import { InsertUser, users, vehicles, bookings, pricingSettings, enquiries, publicHolidays, passwordResetTokens, landmarks, emailLogs, type InsertBooking, type Booking, type PricingSetting, type InsertEnquiry, type Enquiry, type InsertPublicHoliday, type PublicHoliday, type Landmark, type InsertLandmark, type InsertEmailLog, type EmailLog } from "../drizzle/schema";
import { ENV } from './_core/env';
import { lookupSuburb } from "@shared/suburbs";

let _db: any = null;
let _pool: any = null;

// Force pool recreation to clear stale prepared statements after schema changes
export async function resetDbPool() {
  if (_pool) {
    try { await _pool.end(); } catch (e) { /* ignore */ }
  }
  _db = null;
  _pool = null;
}

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      const url = new URL(process.env.DATABASE_URL);
      const host = url.hostname;
      const user = decodeURIComponent(url.username);
      const password = decodeURIComponent(url.password);
      const database = url.pathname.slice(1);

      // On Hostinger shared hosting, localhost connections must use Unix socket
      const isLocalhost = host === 'localhost' || host === '127.0.0.1';
      const poolConfig: any = {
        user,
        password,
        database,
        waitForConnections: true,
        connectionLimit: 10,
        connectTimeout: 10000,
      };

      if (isLocalhost) {
        // Use socket path for local MySQL on shared hosting
        poolConfig.socketPath = '/var/lib/mysql/mysql.sock';
      } else {
        poolConfig.host = host;
        poolConfig.port = parseInt(url.port || '3306');
        // TiDB Cloud requires SSL connections
        if (host.includes('tidbcloud.com') || host.includes('tidb')) {
          poolConfig.ssl = { rejectUnauthorized: true };
        }
      }

      poolConfig.enableKeepAlive = true;
      poolConfig.keepAliveInitialDelay = 10000;
      _pool = mysql.createPool(poolConfig);
      _db = drizzle(_pool);
      console.log("[Database] Pool created successfully", isLocalhost ? "via socket" : `for host: ${host}`);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
      _pool = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

export async function getUserById(id: number) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }
  const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getUserByEmail(email: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }
  const result = await db.select().from(users).where(eq(users.email, email)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function createUserWithPassword(data: {
  name: string;
  email: string;
  passwordHash: string;
  role?: "user" | "admin";
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Generate a unique openId for backward compatibility
  const openId = `local_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;

  await db.insert(users).values({
    openId,
    name: data.name,
    email: data.email,
    passwordHash: data.passwordHash,
    loginMethod: "email",
    role: data.role ?? "user",
    lastSignedIn: new Date(),
  });

  return getUserByEmail(data.email);
}

export async function updateUserLastSignedIn(userId: number) {
  const db = await getDb();
  if (!db) return;
  await db.update(users).set({ lastSignedIn: new Date() }).where(eq(users.id, userId));
}

export async function getUserByGoogleId(googleId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.googleId, googleId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function createUserWithGoogle(data: {
  name: string;
  email: string;
  googleId: string;
  role?: "user" | "admin";
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const openId = `google_${data.googleId}`;

  await db.insert(users).values({
    openId,
    name: data.name,
    email: data.email,
    googleId: data.googleId,
    loginMethod: "google",
    role: data.role ?? "user",
    lastSignedIn: new Date(),
  });

  return getUserByEmail(data.email);
}

export async function linkGoogleAccount(userId: number, googleId: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(users).set({
    googleId,
    loginMethod: "google",
    lastSignedIn: new Date(),
  }).where(eq(users.id, userId));
  return getUserById(userId);
}

// ─── Password Reset Token Helpers ───

export async function createPasswordResetToken(userId: number, token: string, expiresAt: Date) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(passwordResetTokens).values({ userId, token, expiresAt });
}

export async function getPasswordResetToken(token: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(passwordResetTokens)
    .where(eq(passwordResetTokens.token, token))
    .limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function markPasswordResetTokenUsed(tokenId: number) {
  const db = await getDb();
  if (!db) return;
  await db.update(passwordResetTokens)
    .set({ usedAt: new Date() })
    .where(eq(passwordResetTokens.id, tokenId));
}

export async function updateUserPassword(userId: number, passwordHash: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(users)
    .set({ passwordHash, loginMethod: "email" })
    .where(eq(users.id, userId));
}

export async function invalidateUserResetTokens(userId: number) {
  const db = await getDb();
  if (!db) return;
  await db.update(passwordResetTokens)
    .set({ usedAt: new Date() })
    .where(and(eq(passwordResetTokens.userId, userId), isNull(passwordResetTokens.usedAt)));
}

// ─── Vehicle Queries ───

export async function getActiveVehicles() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(vehicles).where(eq(vehicles.isActive, 1));
}

export async function getVehicleById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(vehicles).where(eq(vehicles.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

// ─── Booking Queries ───

function generateReferenceNumber(): string {
  const prefix = "CB";
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `${prefix}-${timestamp}-${random}`.substring(0, 20);
}

export async function createBooking(data: Omit<InsertBooking, "referenceNumber" | "id" | "createdAt" | "updatedAt" | "status">) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const referenceNumber = generateReferenceNumber();

  await db.insert(bookings).values({
    ...data,
    referenceNumber,
    status: "pending",
  });

  const result = await db.select().from(bookings).where(eq(bookings.referenceNumber, referenceNumber)).limit(1);
  return result[0];
}

export async function createQuote(data: Omit<InsertBooking, "referenceNumber" | "id" | "createdAt" | "updatedAt" | "status">) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const referenceNumber = generateReferenceNumber();

  await db.insert(bookings).values({
    ...data,
    referenceNumber,
    status: "quote",
  });

  const result = await db.select().from(bookings).where(eq(bookings.referenceNumber, referenceNumber)).limit(1);
  return result[0];
}

export async function convertQuoteToBooking(referenceNumber: string, paymentMethod: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  try {
    await db.update(bookings)
      .set({ status: "pending", paymentMethod, termsAccepted: 1, updatedAt: new Date() })
      .where(and(eq(bookings.referenceNumber, referenceNumber), eq(bookings.status, "quote")));
  } catch (updateErr: any) {
    console.error('[convertQuoteToBooking] UPDATE failed:', updateErr?.cause?.sqlMessage || updateErr?.message || updateErr);
    throw updateErr;
  }

  const result = await db.select().from(bookings).where(eq(bookings.referenceNumber, referenceNumber)).limit(1);
  return result[0];
}

export async function getBookingByReference(referenceNumber: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(bookings).where(eq(bookings.referenceNumber, referenceNumber)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getBookingById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(bookings).where(eq(bookings.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function listBookings(params: {
  status?: string;
  paymentStatus?: string;
  search?: string;
  limit?: number;
  offset?: number;
}) {
  const db = await getDb();
  if (!db) return { bookings: [], total: 0 };

  const conditions = [];

  if (params.status && params.status !== "all") {
    conditions.push(eq(bookings.status, params.status as Booking["status"]));
  }

  if (params.paymentStatus && params.paymentStatus !== "all") {
    conditions.push(eq(bookings.paymentStatus, params.paymentStatus as "unpaid" | "paid" | "refunded"));
  }

  if (params.search) {
    const searchTerm = `%${params.search}%`;
    conditions.push(
      or(
        like(bookings.clientName, searchTerm),
        like(bookings.clientEmail, searchTerm),
        like(bookings.clientPhone, searchTerm),
        like(bookings.referenceNumber, searchTerm),
        like(bookings.pickupAddress, searchTerm),
      )!
    );
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const [items, countResult] = await Promise.all([
    db
      .select()
      .from(bookings)
      .where(whereClause)
      .orderBy(desc(bookings.createdAt))
      .limit(params.limit ?? 20)
      .offset(params.offset ?? 0),
    db
      .select({ count: sql<number>`count(*)` })
      .from(bookings)
      .where(whereClause),
  ]);

  return {
    bookings: items,
    total: countResult[0]?.count ?? 0,
  };
}

export async function updateBookingStatus(id: number, status: Booking["status"], adminNotes?: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const updateData: Record<string, unknown> = { status };
  if (adminNotes !== undefined) {
    updateData.adminNotes = adminNotes;
  }

  await db.update(bookings).set(updateData).where(eq(bookings.id, id));
  return getBookingById(id);
}

export async function updateBookingPaymentStatus(id: number, paymentStatus: "unpaid" | "paid" | "refunded", paymentNote?: string | null) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const updateData: Record<string, unknown> = { paymentStatus };
  if (paymentNote !== undefined) {
    updateData.paymentNote = paymentNote;
  }
  await db.update(bookings).set(updateData).where(eq(bookings.id, id));
  return getBookingById(id);
}

export async function updateBookingStripeSession(id: number, stripeSessionId: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(bookings).set({ stripeSessionId }).where(eq(bookings.id, id));
}

export async function getBookingByStripeSession(stripeSessionId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(bookings).where(eq(bookings.stripeSessionId, stripeSessionId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function updateBookingDetails(id: number, data: {
  pickupAddress?: string;
  dropoffAddress?: string;
  pickupDate?: number;
  passengerCount?: number;
  specialRequests?: string | null;
  estimatedDuration?: number;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const updateData: Record<string, unknown> = {};
  if (data.pickupAddress !== undefined) updateData.pickupAddress = data.pickupAddress;
  if (data.dropoffAddress !== undefined) updateData.dropoffAddress = data.dropoffAddress;
  if (data.pickupDate !== undefined) updateData.pickupDate = data.pickupDate;
  if (data.passengerCount !== undefined) updateData.passengerCount = data.passengerCount;
  if (data.specialRequests !== undefined) updateData.specialRequests = data.specialRequests;
  if (data.estimatedDuration !== undefined) updateData.estimatedDuration = data.estimatedDuration;
  if (Object.keys(updateData).length === 0) throw new Error("No fields to update");
  await db.update(bookings).set(updateData).where(eq(bookings.id, id));
  return getBookingById(id);
}

export async function getBookingsByDateRange(startMs: number, endMs: number) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select({
      id: bookings.id,
      referenceNumber: bookings.referenceNumber,
      clientName: bookings.clientName,
      clientEmail: bookings.clientEmail,
      serviceType: bookings.serviceType,
      pickupAddress: bookings.pickupAddress,
      dropoffAddress: bookings.dropoffAddress,
      pickupDate: bookings.pickupDate,
      passengerCount: bookings.passengerCount,
      vehicleName: bookings.vehicleName,
      totalPrice: bookings.totalPrice,
      status: bookings.status,
      paymentStatus: bookings.paymentStatus,
      paymentMethod: bookings.paymentMethod,
      estimatedDuration: bookings.estimatedDuration,
    })
    .from(bookings)
    .where(
      and(
        sql`${bookings.pickupDate} >= ${startMs}`,
        sql`${bookings.pickupDate} < ${endMs}`,
      )
    )
    .orderBy(bookings.pickupDate);
}

export async function getBookingsByEmail(email: string) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(bookings)
    .where(eq(bookings.clientEmail, email))
    .orderBy(desc(bookings.pickupDate));
}

export async function deleteBooking(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(bookings).where(eq(bookings.id, id));
  return { success: true };
}

// ─── Pricing Settings Queries ───

export async function getAllPricingSettings() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(pricingSettings);
}

export async function getPricingSettingByKey(key: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(pricingSettings).where(eq(pricingSettings.settingKey, key)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function updatePricingSetting(id: number, value: string, isActive?: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const updateData: Record<string, unknown> = { settingValue: value };
  if (isActive !== undefined) {
    updateData.isActive = isActive;
  }
  await db.update(pricingSettings).set(updateData).where(eq(pricingSettings.id, id));
  return db.select().from(pricingSettings).where(eq(pricingSettings.id, id)).then((r: any[]) => r[0]);
}

export async function markTollsAsReviewed(tollType: "airport" | "road") {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  if (tollType === "airport") {
    await db.update(pricingSettings)
      .set({ updatedAt: new Date() })
      .where(
        and(
          eq(pricingSettings.category, "surcharge"),
          or(
            like(pricingSettings.settingKey, "toll_sct_%"),
            like(pricingSettings.settingKey, "toll_bne_%")
          )
        )
      );
  } else {
    await db.update(pricingSettings)
      .set({ updatedAt: new Date() })
      .where(eq(pricingSettings.category, "road_toll"));
  }
}

// ─── Public Holiday Queries ───

export async function getAllPublicHolidays() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(publicHolidays).orderBy(publicHolidays.date);
}

export async function getActivePublicHolidays() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(publicHolidays).where(eq(publicHolidays.isActive, 1)).orderBy(publicHolidays.date);
}

export async function createPublicHoliday(data: Omit<InsertPublicHoliday, "id" | "createdAt" | "updatedAt">) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(publicHolidays).values(data);
  const result = await db.select().from(publicHolidays).orderBy(desc(publicHolidays.id)).limit(1);
  return result[0];
}

export async function updatePublicHoliday(id: number, data: { name?: string; date?: string; isRecurring?: number; isActive?: number }) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const updateData: Record<string, unknown> = {};
  if (data.name !== undefined) updateData.name = data.name;
  if (data.date !== undefined) updateData.date = data.date;
  if (data.isRecurring !== undefined) updateData.isRecurring = data.isRecurring;
  if (data.isActive !== undefined) updateData.isActive = data.isActive;
  if (Object.keys(updateData).length === 0) throw new Error("No fields to update");
  await db.update(publicHolidays).set(updateData).where(eq(publicHolidays.id, id));
  const result = await db.select().from(publicHolidays).where(eq(publicHolidays.id, id)).limit(1);
  return result[0];
}

export async function deletePublicHoliday(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(publicHolidays).where(eq(publicHolidays.id, id));
}

export function isDatePublicHoliday(dateStr: string, holidays: PublicHoliday[]): PublicHoliday | undefined {
  // dateStr is YYYY-MM-DD
  const monthDay = dateStr.substring(5); // MM-DD
  return holidays.find(h => {
    if (h.isActive !== 1) return false;
    if (h.isRecurring === 1) {
      // For recurring holidays, match MM-DD regardless of year
      return h.date.substring(5) === monthDay;
    }
    // For non-recurring, exact date match
    return h.date === dateStr;
  });
}

export interface PriceBreakdown {
  basePrice: number;
  distanceCharge: number;
  pricePerKm: number;
  outOfHoursSurcharge: number;
  outOfAreaSurcharge: number;
  fuelLevySurcharge: number;
  additionalStopsSurcharge: number;
  additionalStopsCount: number;
  perStopRate: number;
  publicHolidaySurcharge: number;
  publicHolidayName: string | null;
  petSurcharge: number;
  weightSurcharge: number;
  airportTollSurcharge: number;
  airportTollDetails: { airport: string; direction: string; amount: number }[];
  roadTollSurcharge: number;
  roadTollDetails: { road: string; amount: number }[];
  supportVanPrice: number;
  squareSurcharge: number;
  roundingDiscount: number;
  subtotal: number;
  totalPrice: number;
}

export async function calculatePrice(params: {
  serviceType: string;
  distanceKm: number;
  pickupHour: number; // 0-23 in local time
  pickupDateStr: string; // YYYY-MM-DD in local time for holiday check
  isOutOfArea: boolean;
  needsSupportVan: boolean;
  paymentMethod: string;
  hireHours?: number; // for hourly hire
  additionalPickupCount?: number;
  additionalDropoffCount?: number;
  isPetFriendly?: boolean;
  numberOfPets?: number;
  freightWeight?: string;
  pickupSuburb?: string;
  destinationSuburb?: string;
  preferTollFree?: boolean;
}): Promise<PriceBreakdown> {
  const settings = await getAllPricingSettings();
  const getVal = (key: string) => {
    const s = settings.find((s: any) => s.settingKey === key);
    return s ? parseFloat(s.settingValue) : 0;
  };
  const isActive = (key: string) => {
    const s = settings.find((s: any) => s.settingKey === key);
    return s ? s.isActive === 1 : false;
  };

  // Base price for selected service
  const serviceKeyMap: Record<string, string> = {
    airport_transfer: "base_airport_transfer",
    hourly_hire: "base_hourly_hire",
    point_to_point: "base_point_to_point",
    special_events: "base_special_events",
    freight: "base_freight",
  };
  let basePrice = getVal(serviceKeyMap[params.serviceType] || "base_point_to_point");

  // For hourly hire, multiply base rate by number of hours
  if (params.serviceType === "hourly_hire" && params.hireHours && params.hireHours > 0) {
    basePrice = Math.round(basePrice * params.hireHours * 100) / 100;
  }

  // Distance charge (price per km × estimated km)
  const pricePerKm = isActive("rate_per_km") ? getVal("rate_per_km") : 0;
  const distanceCharge = Math.round(params.distanceKm * pricePerKm * 100) / 100;

  // Out-of-hours surcharge (7pm-7am)
  const isOutOfHours = params.pickupHour >= 19 || params.pickupHour < 7;
  const outOfHoursSurcharge = (isOutOfHours && isActive("surcharge_out_of_hours")) ? getVal("surcharge_out_of_hours") : 0;

  // Out-of-area surcharge
  const outOfAreaSurcharge = (params.isOutOfArea && isActive("surcharge_out_of_area")) ? getVal("surcharge_out_of_area") : 0;

  // Fuel levy (distance-based: L/100km × distance/100 × price per litre)
  const fuelConsumptionRate = isActive("fuel_consumption_rate") ? getVal("fuel_consumption_rate") : 0;
  const fuelPricePerLitre = isActive("fuel_price_per_litre") ? getVal("fuel_price_per_litre") : 0;
  const fuelLevySurcharge = Math.round(fuelConsumptionRate * (params.distanceKm / 100) * fuelPricePerLitre * 100) / 100;

  // Additional stops surcharge
  const additionalStopsCount = (params.additionalPickupCount ?? 0) + (params.additionalDropoffCount ?? 0);
  const perStopRate = isActive("surcharge_additional_stop") ? getVal("surcharge_additional_stop") : 0;
  const additionalStopsSurcharge = Math.round(additionalStopsCount * perStopRate * 100) / 100;

  // Public holiday surcharge
  let publicHolidaySurcharge = 0;
  let publicHolidayName: string | null = null;
  if (params.pickupDateStr && isActive("surcharge_public_holiday")) {
    const holidays = await getActivePublicHolidays();
    const matchedHoliday = isDatePublicHoliday(params.pickupDateStr, holidays);
    if (matchedHoliday) {
      publicHolidaySurcharge = getVal("surcharge_public_holiday");
      publicHolidayName = matchedHoliday.name;
    }
  }

  // Pet surcharge (cleaning, disinfecting, deodorising)
  let petSurcharge = 0;
  if (params.isPetFriendly && params.numberOfPets && params.numberOfPets > 0 && isActive("surcharge_pet")) {
    petSurcharge = Math.round(getVal("surcharge_pet") * params.numberOfPets * 100) / 100;
  }

  // Weight surcharge for freight bookings
  let weightSurcharge = 0;
  if (params.serviceType === "freight" && params.freightWeight) {
    const weightKeyMap: Record<string, string> = {
      under_10kg: "freight_weight_under_10kg",
      "10_25kg": "freight_weight_10_25kg",
      "25_50kg": "freight_weight_25_50kg",
      "50_100kg": "freight_weight_50_100kg",
      "100_plus": "freight_weight_100_plus",
    };
    const weightKey = weightKeyMap[params.freightWeight];
    if (weightKey && isActive(weightKey)) {
      weightSurcharge = getVal(weightKey);
    }
  }

  // Airport toll surcharges (auto-detect from suburb names)
  let airportTollSurcharge = 0;
  const airportTollDetails: { airport: string; direction: string; amount: number }[] = [];
  const pickupLower = (params.pickupSuburb || "").toLowerCase();
  const destLower = (params.destinationSuburb || "").toLowerCase();

  // Sunshine Coast Airport detection
  const isSctPickup = pickupLower.includes("sunshine coast airport") || pickupLower.includes("maroochydore airport") || pickupLower === "marcoola" || pickupLower.includes("mcyairport");
  const isSctDropoff = destLower.includes("sunshine coast airport") || destLower.includes("maroochydore airport") || destLower === "marcoola" || destLower.includes("mcyairport");

  // Brisbane Airport detection
  const isBnePickup = pickupLower.includes("brisbane airport") || pickupLower.includes("brisbane domestic") || pickupLower.includes("brisbane international") || pickupLower === "brisbane airport" || pickupLower.includes("bneairport");
  const isBneDropoff = destLower.includes("brisbane airport") || destLower.includes("brisbane domestic") || destLower.includes("brisbane international") || destLower === "brisbane airport" || destLower.includes("bneairport");

  // SCT pickup = entry toll (driving into airport to collect passenger)
  if (isSctPickup && isActive("toll_sct_entry")) {
    const amt = getVal("toll_sct_entry");
    if (amt > 0) {
      airportTollSurcharge += amt;
      airportTollDetails.push({ airport: "Sunshine Coast Airport", direction: "Access", amount: amt });
    }
  }
  // SCT dropoff = exit toll (driving out of airport after drop-off)
  if (isSctDropoff && isActive("toll_sct_exit")) {
    const amt = getVal("toll_sct_exit");
    if (amt > 0) {
      airportTollSurcharge += amt;
      airportTollDetails.push({ airport: "Sunshine Coast Airport", direction: "Access", amount: amt });
    }
  }
  // BNE pickup = entry toll
  if (isBnePickup && isActive("toll_bne_entry")) {
    const amt = getVal("toll_bne_entry");
    if (amt > 0) {
      airportTollSurcharge += amt;
      airportTollDetails.push({ airport: "Brisbane Airport", direction: "Access", amount: amt });
    }
  }
  // BNE dropoff = exit toll
  if (isBneDropoff && isActive("toll_bne_exit")) {
    const amt = getVal("toll_bne_exit");
    if (amt > 0) {
      airportTollSurcharge += amt;
      airportTollDetails.push({ airport: "Brisbane Airport", direction: "Access", amount: amt });
    }
  }
  airportTollSurcharge = Math.round(airportTollSurcharge * 100) / 100;

  // Road toll surcharges (auto-detect from route corridors)
  // Skip if customer prefers toll-free route
  let roadTollSurcharge = 0;
  const roadTollDetails: { road: string; amount: number }[] = [];
  const hasTollRoads = !params.preferTollFree; // only apply if customer accepts tolls

  // Resolve LGA for pickup and destination suburbs
  const pickupInfo = lookupSuburb(params.pickupSuburb || "");
  const destInfo = lookupSuburb(params.destinationSuburb || "");
  const pickupLGA = pickupInfo?.lga?.toLowerCase() || "";
  const destLGA = destInfo?.lga?.toLowerCase() || "";

  // Define route corridors: which suburb/LGA patterns suggest a toll road is used
  // Airport patterns to exclude from road toll corridors (airport routes use M1/Bruce Hwy, not Gateway)
  const AIRPORT_PATTERNS = ["brisbane airport", "brisbane domestic", "brisbane international", "bneairport", "sunshine coast airport", "maroochydore airport", "mcyairport"];
  const isAirportLocation = (loc: string) => AIRPORT_PATTERNS.some(p => loc.includes(p));

  const TOLL_CORRIDORS: { key: string; label: string; pickupPatterns: string[]; destPatterns: string[]; pickupLGAs?: string[]; destLGAs?: string[]; bidirectional?: boolean; excludeAirports?: boolean }[] = [
    {
      key: "toll_gateway_motorway",
      label: "Gateway Motorway",
      // Gateway connects north Brisbane / Sunshine Coast / Moreton Bay to south Brisbane / Gold Coast / Logan
      // Exclude airport routes: SC/Moreton Bay → BNE Airport uses Bruce Hwy (M1), not Gateway
      pickupPatterns: ["caboolture", "morayfield", "north lakes", "redcliffe", "bribie", "deception bay", "burpengary", "narangba", "petrie"],
      pickupLGAs: ["sunshine coast", "noosa", "moreton bay"],
      destPatterns: [],
      destLGAs: ["gold coast", "logan", "ipswich", "brisbane", "redland", "scenic rim"],
      bidirectional: true,
      excludeAirports: true,
    },
    {
      key: "toll_logan_motorway",
      label: "Logan Motorway",
      // Logan connects Ipswich/Springfield to Gateway/Gold Coast corridor
      pickupPatterns: ["ipswich", "springfield", "goodna", "redbank", "forest lake", "inala", "richlands"],
      destPatterns: ["logan", "beenleigh", "springwood", "browns plains", "gold coast", "coomera", "ormeau", "helensvale"],
      bidirectional: true,
    },
    {
      key: "toll_clem7",
      label: "Clem7 Tunnel",
      // Clem7 connects Woolloongabba/south to Bowen Hills/north through CBD
      pickupPatterns: ["woolloongabba", "south brisbane", "kangaroo point", "east brisbane", "coorparoo", "greenslopes", "stones corner"],
      destPatterns: ["bowen hills", "fortitude valley", "newstead", "teneriffe", "new farm", "herston", "kelvin grove", "lutwyche"],
      bidirectional: true,
    },
    {
      key: "toll_go_between_bridge",
      label: "Go Between Bridge",
      // Connects Hale St (Milton) to south bank area
      pickupPatterns: ["milton", "paddington", "auchenflower", "toowong", "bardon", "ashgrove"],
      destPatterns: ["south brisbane", "west end", "south bank", "woolloongabba", "highgate hill"],
      bidirectional: true,
    },
    {
      key: "toll_legacy_way",
      label: "Legacy Way",
      // Connects Toowong/western suburbs to Kelvin Grove/inner north
      pickupPatterns: ["toowong", "indooroopilly", "st lucia", "taringa", "chapel hill", "kenmore", "fig tree pocket", "brookfield"],
      destPatterns: ["kelvin grove", "herston", "bowen hills", "fortitude valley", "newstead", "windsor", "lutwyche"],
      bidirectional: true,
    },
    {
      key: "toll_airportlink_m7",
      label: "AirportlinkM7",
      // Connects Bowen Hills / inner city to airport / north side
      pickupPatterns: ["bowen hills", "fortitude valley", "spring hill", "brisbane cbd", "brisbane city", "south brisbane", "west end", "woolloongabba"],
      destPatterns: ["brisbane airport", "brisbane domestic", "brisbane international", "kedron", "toombul", "nundah", "banyo", "nudgee", "eagle farm", "hendra"],
      bidirectional: true,
    },
    {
      key: "toll_toowoomba_bypass",
      label: "Toowoomba Bypass",
      // Toowoomba Second Range Crossing
      pickupPatterns: ["toowoomba", "highfields", "crows nest", "oakey", "dalby", "warwick"],
      destPatterns: ["toowoomba", "highfields", "gatton", "laidley", "ipswich", "brisbane", "sunshine coast"],
      bidirectional: false, // only applies when crossing the range
    },
  ];

  for (const corridor of TOLL_CORRIDORS) {
    if (!hasTollRoads) break; // customer prefers toll-free route
    if (!isActive(corridor.key)) continue;
    const amt = getVal(corridor.key);
    if (amt <= 0) continue;

    // Match by suburb name patterns OR by LGA
    const pickupMatchesOriginByName = corridor.pickupPatterns.some(p => pickupLower.includes(p));
    const pickupMatchesOriginByLGA = corridor.pickupLGAs?.some(lga => pickupLGA === lga) ?? false;
    const pickupMatchesOrigin = pickupMatchesOriginByName || pickupMatchesOriginByLGA;

    const destMatchesDestByName = corridor.destPatterns.some(p => destLower.includes(p));
    const destMatchesDestByLGA = corridor.destLGAs?.some(lga => destLGA === lga) ?? false;
    const destMatchesDest = destMatchesDestByName || destMatchesDestByLGA;

    const forwardMatch = pickupMatchesOrigin && destMatchesDest;

    let reverseMatch = false;
    if (corridor.bidirectional) {
      const pickupMatchesDestByName = corridor.destPatterns.some(p => pickupLower.includes(p));
      const pickupMatchesDestByLGA = corridor.destLGAs?.some(lga => pickupLGA === lga) ?? false;
      const destMatchesOriginByName = corridor.pickupPatterns.some(p => destLower.includes(p));
      const destMatchesOriginByLGA = corridor.pickupLGAs?.some(lga => destLGA === lga) ?? false;
      reverseMatch = (pickupMatchesDestByName || pickupMatchesDestByLGA) && (destMatchesOriginByName || destMatchesOriginByLGA);
    }

    if (forwardMatch || reverseMatch) {
      // Skip if corridor excludes airport routes and either endpoint is an airport
      if (corridor.excludeAirports && (isAirportLocation(pickupLower) || isAirportLocation(destLower))) {
        continue;
      }
      roadTollSurcharge += amt;
      roadTollDetails.push({ road: corridor.label, amount: amt });
    }
  }
  roadTollSurcharge = Math.round(roadTollSurcharge * 100) / 100;

  // Support van
  const supportVanPrice = params.needsSupportVan ? getVal("rate_support_van") : 0;

  // Subtotal before payment surcharge
  const subtotal = Math.round((basePrice + distanceCharge + outOfHoursSurcharge + outOfAreaSurcharge + fuelLevySurcharge + additionalStopsSurcharge + publicHolidaySurcharge + petSurcharge + weightSurcharge + airportTollSurcharge + roadTollSurcharge + supportVanPrice) * 100) / 100;

  // Square 2% surcharge
  const squareSurcharge = params.paymentMethod === "square_postpay" ? Math.round(subtotal * 0.02 * 100) / 100 : 0;

  const rawTotal = Math.round((subtotal + squareSurcharge) * 100) / 100;

  // Round down to nearest $5 for all bookings
  const totalPrice = Math.floor(rawTotal / 5) * 5;

  // Rounding discount (the amount saved by rounding down)
  const roundingDiscount = Math.round((rawTotal - totalPrice) * 100) / 100;

  return {
    basePrice,
    distanceCharge,
    pricePerKm,
    outOfHoursSurcharge,
    outOfAreaSurcharge,
    fuelLevySurcharge,
    additionalStopsSurcharge,
    additionalStopsCount,
    perStopRate,
    publicHolidaySurcharge,
    publicHolidayName,
    petSurcharge,
    weightSurcharge,
    airportTollSurcharge,
    airportTollDetails,
    roadTollSurcharge,
    roadTollDetails,
    supportVanPrice,
    squareSurcharge,
    roundingDiscount,
    subtotal,
    totalPrice,
  };
}

// ─── Enquiry Queries ───

export async function createEnquiry(data: Omit<InsertEnquiry, "id" | "createdAt" | "updatedAt" | "status">) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(enquiries).values({ ...data, status: "new" });
  const result = await db.select().from(enquiries).orderBy(desc(enquiries.id)).limit(1);
  return result[0];
}

export async function listEnquiries(params: {
  status?: string;
  search?: string;
  limit?: number;
  offset?: number;
}) {
  const db = await getDb();
  if (!db) return { enquiries: [], total: 0 };

  const conditions = [];
  if (params.status && params.status !== "all") {
    conditions.push(eq(enquiries.status, params.status as Enquiry["status"]));
  }
  if (params.search) {
    const searchTerm = `%${params.search}%`;
    conditions.push(
      or(
        like(enquiries.name, searchTerm),
        like(enquiries.email, searchTerm),
        like(enquiries.subject, searchTerm),
      )!
    );
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const [items, countResult] = await Promise.all([
    db.select().from(enquiries).where(whereClause).orderBy(desc(enquiries.createdAt)).limit(params.limit ?? 20).offset(params.offset ?? 0),
    db.select({ count: sql<number>`count(*)` }).from(enquiries).where(whereClause),
  ]);

  return { enquiries: items, total: countResult[0]?.count ?? 0 };
}

export async function getEnquiryById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(enquiries).where(eq(enquiries.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function updateEnquiryStatus(id: number, status: Enquiry["status"], adminNotes?: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const updateData: Record<string, unknown> = { status };
  if (adminNotes !== undefined) updateData.adminNotes = adminNotes;
  await db.update(enquiries).set(updateData).where(eq(enquiries.id, id));
  return getEnquiryById(id);
}

export async function getEnquiryStats() {
  const db = await getDb();
  if (!db) return { total: 0, new: 0, read: 0, replied: 0, archived: 0 };
  const result = await db.select({
    total: sql<number>`count(*)`,
    newCount: sql<number>`sum(case when status = 'new' then 1 else 0 end)`,
    readCount: sql<number>`sum(case when status = 'read' then 1 else 0 end)`,
    repliedCount: sql<number>`sum(case when status = 'replied' then 1 else 0 end)`,
    archivedCount: sql<number>`sum(case when status = 'archived' then 1 else 0 end)`,
  }).from(enquiries);
  const row = result[0];
  return {
    total: row?.total ?? 0,
    new: row?.newCount ?? 0,
    read: row?.readCount ?? 0,
    replied: row?.repliedCount ?? 0,
    archived: row?.archivedCount ?? 0,
  };
}

export async function getBookingStats() {
  const db = await getDb();
  if (!db) return {
    total: 0, pending: 0, confirmed: 0, completed: 0, cancelled: 0, quote: 0, expired: 0,
    totalRevenue: "0", unpaidAmount: "0", refundedAmount: "0",
    revenueByMethod: { stripe: "0", square: "0", cash: "0" },
    unpaidByMethod: { stripe: "0", square: "0", cash: "0" },
    refundedByMethod: { stripe: "0", square: "0", cash: "0" },
    totalTolls: "0", totalAirportTolls: "0", totalRoadTolls: "0",
  };

  const result = await db.select({
    total: sql<number>`count(*)`,
    pending: sql<number>`sum(case when status = 'pending' then 1 else 0 end)`,
    confirmed: sql<number>`sum(case when status = 'confirmed' then 1 else 0 end)`,
    completed: sql<number>`sum(case when status = 'completed' then 1 else 0 end)`,
    cancelled: sql<number>`sum(case when status = 'cancelled' then 1 else 0 end)`,
    quote: sql<number>`sum(case when status = 'quote' then 1 else 0 end)`,
    expired: sql<number>`sum(case when status = 'expired' then 1 else 0 end)`,
    totalRevenue: sql<string>`coalesce(sum(case when paymentStatus = 'paid' then totalPrice else 0 end), 0)`,
    unpaidAmount: sql<string>`coalesce(sum(case when paymentStatus = 'unpaid' and status != 'cancelled' then totalPrice else 0 end), 0)`,
    refundedAmount: sql<string>`coalesce(sum(case when paymentStatus = 'refunded' then totalPrice else 0 end), 0)`,
    // Revenue by method
    revenueStripe: sql<string>`coalesce(sum(case when paymentStatus = 'paid' and paymentMethod = 'stripe_prepay' then totalPrice else 0 end), 0)`,
    revenueSquare: sql<string>`coalesce(sum(case when paymentStatus = 'paid' and paymentMethod = 'square_postpay' then totalPrice else 0 end), 0)`,
    revenueCash: sql<string>`coalesce(sum(case when paymentStatus = 'paid' and paymentMethod = 'cash_postpay' then totalPrice else 0 end), 0)`,
    // Unpaid by method
    unpaidStripe: sql<string>`coalesce(sum(case when paymentStatus = 'unpaid' and status != 'cancelled' and paymentMethod = 'stripe_prepay' then totalPrice else 0 end), 0)`,
    unpaidSquare: sql<string>`coalesce(sum(case when paymentStatus = 'unpaid' and status != 'cancelled' and paymentMethod = 'square_postpay' then totalPrice else 0 end), 0)`,
    unpaidCash: sql<string>`coalesce(sum(case when paymentStatus = 'unpaid' and status != 'cancelled' and paymentMethod = 'cash_postpay' then totalPrice else 0 end), 0)`,
    // Refunded by method
    refundedStripe: sql<string>`coalesce(sum(case when paymentStatus = 'refunded' and paymentMethod = 'stripe_prepay' then totalPrice else 0 end), 0)`,
    refundedSquare: sql<string>`coalesce(sum(case when paymentStatus = 'refunded' and paymentMethod = 'square_postpay' then totalPrice else 0 end), 0)`,
    refundedCash: sql<string>`coalesce(sum(case when paymentStatus = 'refunded' and paymentMethod = 'cash_postpay' then totalPrice else 0 end), 0)`,
    // Toll totals
    totalTolls: sql<string>`coalesce(sum(case when status != 'cancelled' then coalesce(airportTollSurcharge, 0) + coalesce(roadTollSurcharge, 0) else 0 end), 0)`,
    totalAirportTolls: sql<string>`coalesce(sum(case when status != 'cancelled' then coalesce(airportTollSurcharge, 0) else 0 end), 0)`,
    totalRoadTolls: sql<string>`coalesce(sum(case when status != 'cancelled' then coalesce(roadTollSurcharge, 0) else 0 end), 0)`,
  }).from(bookings);

  const row = result[0];
  return {
    total: row?.total ?? 0,
    pending: row?.pending ?? 0,
    confirmed: row?.confirmed ?? 0,
    completed: row?.completed ?? 0,
    cancelled: row?.cancelled ?? 0,
    quote: row?.quote ?? 0,
    expired: row?.expired ?? 0,
    totalRevenue: String(row?.totalRevenue ?? "0"),
    unpaidAmount: String(row?.unpaidAmount ?? "0"),
    refundedAmount: String(row?.refundedAmount ?? "0"),
    revenueByMethod: {
      stripe: String(row?.revenueStripe ?? "0"),
      square: String(row?.revenueSquare ?? "0"),
      cash: String(row?.revenueCash ?? "0"),
    },
    unpaidByMethod: {
      stripe: String(row?.unpaidStripe ?? "0"),
      square: String(row?.unpaidSquare ?? "0"),
      cash: String(row?.unpaidCash ?? "0"),
    },
    refundedByMethod: {
      stripe: String(row?.refundedStripe ?? "0"),
      square: String(row?.refundedSquare ?? "0"),
      cash: String(row?.refundedCash ?? "0"),
    },
    totalTolls: String(row?.totalTolls ?? "0"),
    totalAirportTolls: String(row?.totalAirportTolls ?? "0"),
    totalRoadTolls: String(row?.totalRoadTolls ?? "0"),
  };
}

// ─── Review Queries ───

import { reviews, type InsertReview, type Review } from "../drizzle/schema";

export async function createReview(data: Omit<InsertReview, "id" | "createdAt" | "updatedAt" | "status">) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(reviews).values({ ...data, status: "pending" });
  const result = await db.select().from(reviews).orderBy(desc(reviews.id)).limit(1);
  return result[0];
}

export async function getApprovedReviews() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(reviews).where(eq(reviews.status, "approved")).orderBy(desc(reviews.createdAt));
}

export async function getReviewStats() {
  const db = await getDb();
  if (!db) return { total: 0, pending: 0, approved: 0, rejected: 0, averageRating: 0 };
  const result = await db.select({
    total: sql<number>`count(*)`,
    pendingCount: sql<number>`sum(case when status = 'pending' then 1 else 0 end)`,
    approvedCount: sql<number>`sum(case when status = 'approved' then 1 else 0 end)`,
    rejectedCount: sql<number>`sum(case when status = 'rejected' then 1 else 0 end)`,
    avgRating: sql<number>`coalesce(avg(case when status = 'approved' then rating else null end), 0)`,
  }).from(reviews);
  const row = result[0];
  return {
    total: row?.total ?? 0,
    pending: row?.pendingCount ?? 0,
    approved: row?.approvedCount ?? 0,
    rejected: row?.rejectedCount ?? 0,
    averageRating: Math.round((row?.avgRating ?? 0) * 10) / 10,
  };
}

export async function listReviews(params: {
  status?: string;
  limit?: number;
  offset?: number;
}) {
  const db = await getDb();
  if (!db) return { reviews: [], total: 0 };

  const conditions = [];
  if (params.status && params.status !== "all") {
    conditions.push(eq(reviews.status, params.status as Review["status"]));
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const [items, countResult] = await Promise.all([
    db.select().from(reviews).where(whereClause).orderBy(desc(reviews.createdAt)).limit(params.limit ?? 20).offset(params.offset ?? 0),
    db.select({ count: sql<number>`count(*)` }).from(reviews).where(whereClause),
  ]);

  return { reviews: items, total: countResult[0]?.count ?? 0 };
}

export async function getReviewById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(reviews).where(eq(reviews.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function updateReviewStatus(id: number, status: Review["status"], adminNotes?: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const updateData: Record<string, unknown> = { status };
  if (adminNotes !== undefined) updateData.adminNotes = adminNotes;
  await db.update(reviews).set(updateData).where(eq(reviews.id, id));
  return getReviewById(id);
}

export async function deleteReview(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(reviews).where(eq(reviews.id, id));
}

export async function getReviewByBookingId(bookingId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(reviews).where(eq(reviews.bookingId, bookingId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

// ─── Google Reviews Cache ───

import { googleReviewsCache, appSettings, type InsertGoogleReviewCache } from "../drizzle/schema";

export async function getCachedGoogleReviews(placeId: string) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(googleReviewsCache).where(eq(googleReviewsCache.placeId, placeId)).orderBy(desc(googleReviewsCache.rating));
}

export async function getGoogleReviewsCacheAge(placeId: string): Promise<number | null> {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select({ fetchedAt: googleReviewsCache.fetchedAt })
    .from(googleReviewsCache)
    .where(eq(googleReviewsCache.placeId, placeId))
    .limit(1);
  if (result.length === 0) return null;
  return Date.now() - result[0].fetchedAt.getTime();
}

export async function clearGoogleReviewsCache(placeId: string) {
  const db = await getDb();
  if (!db) return;
  await db.delete(googleReviewsCache).where(eq(googleReviewsCache.placeId, placeId));
}

export async function insertGoogleReviews(reviews: InsertGoogleReviewCache[]) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  if (reviews.length === 0) return;
  await db.insert(googleReviewsCache).values(reviews);
}

// ─── App Settings ───

export async function getAppSetting(key: string): Promise<string | null> {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(appSettings).where(eq(appSettings.settingKey, key)).limit(1);
  return result.length > 0 ? (result[0].settingValue ?? null) : null;
}

export async function setAppSetting(key: string, value: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(appSettings).values({ settingKey: key, settingValue: value })
    .onDuplicateKeyUpdate({ set: { settingValue: value } });
}

// ─── Landmarks ───

export async function getActiveLandmarks(): Promise<Landmark[]> {
  const db = await getDb();
  if (!db) {
    console.warn('[getActiveLandmarks] No DB connection available');
    return [];
  }
  try {
    const result = await db.select().from(landmarks).where(eq(landmarks.isActive, 1)).orderBy(landmarks.name);
    console.log(`[getActiveLandmarks] Returned ${result.length} landmarks, first address: ${result[0]?.address || 'none'}`);
    return result;
  } catch (error: any) {
    console.error('[getActiveLandmarks] Query failed:', error?.message || error);
    return [];
  }
}

export async function getAllLandmarks(): Promise<Landmark[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(landmarks).orderBy(landmarks.name);
}

export async function getLandmarkById(id: number): Promise<Landmark | null> {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(landmarks).where(eq(landmarks.id, id)).limit(1);
  return result.length > 0 ? result[0] : null;
}

export async function createLandmark(data: Omit<InsertLandmark, "id" | "createdAt" | "updatedAt">): Promise<Landmark | null> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(landmarks).values(data);
  const result = await db.select().from(landmarks).orderBy(desc(landmarks.id)).limit(1);
  return result.length > 0 ? result[0] : null;
}

export async function updateLandmark(id: number, data: Partial<Omit<InsertLandmark, "id" | "createdAt" | "updatedAt">>): Promise<Landmark | null> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(landmarks).set(data).where(eq(landmarks.id, id));
  const result = await db.select().from(landmarks).where(eq(landmarks.id, id)).limit(1);
  return result.length > 0 ? result[0] : null;
}

export async function toggleLandmarkActive(id: number): Promise<Landmark | null> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const existing = await db.select().from(landmarks).where(eq(landmarks.id, id)).limit(1);
  if (existing.length === 0) return null;
  const newActive = existing[0].isActive === 1 ? 0 : 1;
  await db.update(landmarks).set({ isActive: newActive }).where(eq(landmarks.id, id));
  const result = await db.select().from(landmarks).where(eq(landmarks.id, id)).limit(1);
  return result.length > 0 ? result[0] : null;
}

export async function deleteLandmark(id: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(landmarks).where(eq(landmarks.id, id));
}

export async function getLandmarkStats(): Promise<{ total: number; active: number; byCategory: { category: string; count: number }[] }> {
  const db = await getDb();
  if (!db) return { total: 0, active: 0, byCategory: [] };
  const [totalResult] = await db.select({ count: sql<number>`count(*)` }).from(landmarks);
  const [activeResult] = await db.select({ count: sql<number>`count(*)` }).from(landmarks).where(eq(landmarks.isActive, 1));
  const byCategory = await db.select({ category: landmarks.category, count: sql<number>`count(*)` }).from(landmarks).groupBy(landmarks.category).orderBy(desc(sql<number>`count(*)`));
  return {
    total: totalResult?.count ?? 0,
    active: activeResult?.count ?? 0,
    byCategory: byCategory.map((r: any) => ({ category: r.category, count: r.count })),
  };
}

// ─── Email Log Queries ───

export async function logEmail(data: Omit<InsertEmailLog, "id" | "createdAt">): Promise<void> {
  const db = await getDb();
  if (!db) return;
  try {
    await db.insert(emailLogs).values(data);
  } catch (e) {
    console.warn("[EmailLog] Failed to log email:", e);
  }
}

export async function listEmailLogs(params: {
  emailType?: string;
  status?: string;
  search?: string;
  limit?: number;
  offset?: number;
}): Promise<{ logs: EmailLog[]; total: number }> {
  const db = await getDb();
  if (!db) return { logs: [], total: 0 };

  const conditions = [];
  if (params.emailType && params.emailType !== "all") {
    conditions.push(eq(emailLogs.emailType, params.emailType));
  }
  if (params.status && params.status !== "all") {
    conditions.push(eq(emailLogs.status, params.status as "sent" | "failed"));
  }
  if (params.search) {
    const searchTerm = `%${params.search}%`;
    conditions.push(
      or(
        like(emailLogs.toEmail, searchTerm),
        like(emailLogs.subject, searchTerm),
        like(emailLogs.bookingReference, searchTerm),
      )!
    );
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const [items, countResult] = await Promise.all([
    db.select().from(emailLogs).where(whereClause).orderBy(desc(emailLogs.createdAt)).limit(params.limit ?? 20).offset(params.offset ?? 0),
    db.select({ count: sql<number>`count(*)` }).from(emailLogs).where(whereClause),
  ]);

  return { logs: items, total: countResult[0]?.count ?? 0 };
}

export async function getEmailLogStats(): Promise<{ total: number; sent: number; failed: number; byType: { emailType: string; count: number }[] }> {
  const db = await getDb();
  if (!db) return { total: 0, sent: 0, failed: 0, byType: [] };

  const [result] = await db.select({
    total: sql<number>`count(*)`,
    sent: sql<number>`sum(case when status = 'sent' then 1 else 0 end)`,
    failed: sql<number>`sum(case when status = 'failed' then 1 else 0 end)`,
  }).from(emailLogs);

  const byType = await db.select({
    emailType: emailLogs.emailType,
    count: sql<number>`count(*)`,
  }).from(emailLogs).groupBy(emailLogs.emailType).orderBy(desc(sql<number>`count(*)`));

  return {
    total: result?.total ?? 0,
    sent: result?.sent ?? 0,
    failed: result?.failed ?? 0,
    byType: byType.map((r: any) => ({ emailType: r.emailType, count: r.count })),
  };
}

// ─── Quote Expiry & Reminder Queries ───

/**
 * Get all active quotes that need daily reminders.
 * Returns quotes where:
 * - status is 'quote'
 * - pickupDate is more than 2 days from now (not yet expired)
 * - lastReminderSentAt is null OR was sent more than 23 hours ago
 */
export async function getQuotesNeedingReminders(): Promise<Booking[]> {
  const db = await getDb();
  if (!db) return [];

  const now = Date.now();
  const twoDaysFromNow = now + 2 * 24 * 60 * 60 * 1000;
  const twentyThreeHoursAgo = now - 23 * 60 * 60 * 1000;

  const result = await db.select().from(bookings).where(
    and(
      eq(bookings.status, "quote"),
      // Pickup is more than 2 days away (not yet expired)
      sql`${bookings.pickupDate} > ${twoDaysFromNow}`,
      // Either never sent a reminder, or last reminder was >23h ago
      or(
        isNull(bookings.lastReminderSentAt),
        sql`${bookings.lastReminderSentAt} < ${twentyThreeHoursAgo}`,
      ),
    )
  );

  return result;
}

/**
 * Get all quotes that should be expired (pickup is within 2 days or past).
 */
export async function getQuotesToExpire(): Promise<Booking[]> {
  const db = await getDb();
  if (!db) return [];

  const now = Date.now();
  const twoDaysFromNow = now + 2 * 24 * 60 * 60 * 1000;

  const result = await db.select().from(bookings).where(
    and(
      eq(bookings.status, "quote"),
      sql`${bookings.pickupDate} <= ${twoDaysFromNow}`,
    )
  );

  return result;
}

/**
 * Mark a quote as expired.
 */
export async function expireQuote(id: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(bookings).set({ status: "expired" }).where(eq(bookings.id, id));
}

/**
 * Update the lastReminderSentAt timestamp for a booking.
 */
export async function updateLastReminderSentAt(id: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(bookings).set({ lastReminderSentAt: Date.now() }).where(eq(bookings.id, id));
}

/**
 * Cancel a quote (client-initiated). Sets status to 'cancelled'.
 */
export async function cancelQuote(referenceNumber: string, clientEmail: string): Promise<Booking | undefined> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Only cancel if it's still a quote and belongs to this client
  await db.update(bookings)
    .set({ status: "cancelled" })
    .where(and(
      eq(bookings.referenceNumber, referenceNumber),
      eq(bookings.clientEmail, clientEmail),
      eq(bookings.status, "quote"),
    ));

  const result = await db.select().from(bookings).where(eq(bookings.referenceNumber, referenceNumber)).limit(1);
  return result[0];
}

/**
 * Admin convert quote to booking - works for both 'quote' and 'expired' quotes.
 */
export async function adminConvertQuoteToBooking(id: number, paymentMethod: string): Promise<Booking | undefined> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(bookings)
    .set({ status: "pending", paymentMethod: paymentMethod as any, termsAccepted: 1 })
    .where(and(
      eq(bookings.id, id),
      or(eq(bookings.status, "quote"), eq(bookings.status, "expired")),
    ));

  const result = await db.select().from(bookings).where(eq(bookings.id, id)).limit(1);
  return result[0];
}

// ─── Bank Details (Direct Deposit) ───

export interface BankDetails {
  bankName: string;
  bsb: string;
  accountNumber: string;
  accountName: string;
  referenceInstructions: string;
  isEnabled: boolean;
}

const BANK_DETAILS_KEY = "bank_details";

export async function getBankDetails(): Promise<BankDetails | null> {
  const raw = await getAppSetting(BANK_DETAILS_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as BankDetails;
  } catch {
    return null;
  }
}

export async function setBankDetails(details: BankDetails): Promise<void> {
  await setAppSetting(BANK_DETAILS_KEY, JSON.stringify(details));
}


// ─── Direct Deposit Payment Reminder Queries ───

/**
 * Get direct deposit bookings that are unpaid and were created more than 24 hours ago.
 * Returns bookings where:
 * - paymentMethod is 'direct_deposit'
 * - paymentStatus is 'unpaid'
 * - status is 'pending' or 'confirmed' (active bookings only)
 * - createdAt is more than 24 hours ago
 * - lastPaymentReminderSentAt is null OR was sent more than 23 hours ago
 */
export async function getDirectDepositUnpaidBookings(): Promise<Booking[]> {
  const db = await getDb();
  if (!db) return [];

  const now = Date.now();
  const twentyFourHoursAgoDate = new Date(now - 24 * 60 * 60 * 1000);
  const twentyThreeHoursAgo = now - 23 * 60 * 60 * 1000;

  const result = await db.select().from(bookings).where(
    and(
      eq(bookings.paymentMethod, "direct_deposit"),
      eq(bookings.paymentStatus, "unpaid"),
      or(eq(bookings.status, "pending"), eq(bookings.status, "confirmed")),
      sql`${bookings.createdAt} < ${twentyFourHoursAgoDate}`,
      or(
        isNull(bookings.lastPaymentReminderSentAt),
        sql`${bookings.lastPaymentReminderSentAt} < ${twentyThreeHoursAgo}`,
      ),
    )
  );

  return result;
}

/**
 * Update the lastPaymentReminderSentAt timestamp for a booking.
 */
export async function updateLastPaymentReminderSentAt(id: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(bookings).set({ lastPaymentReminderSentAt: Date.now() }).where(eq(bookings.id, id));
}

// Payment proof upload
export async function updatePaymentProof(
  bookingId: number,
  proofUrl: string,
  proofKey: string
): Promise<void> {
  const db = await getDb();
  await db
    .update(bookings)
    .set({
      paymentProofUrl: proofUrl,
      paymentProofKey: proofKey,
      paymentProofUploadedAt: Date.now(),
    })
    .where(eq(bookings.id, bookingId));
}

export async function getPaymentProof(bookingId: number): Promise<{
  paymentProofUrl: string | null;
  paymentProofKey: string | null;
  paymentProofUploadedAt: number | null;
} | null> {
  const db = await getDb();
  const [result] = await db
    .select({
      paymentProofUrl: bookings.paymentProofUrl,
      paymentProofKey: bookings.paymentProofKey,
      paymentProofUploadedAt: bookings.paymentProofUploadedAt,
    })
    .from(bookings)
    .where(eq(bookings.id, bookingId))
    .limit(1);
  return result ?? null;
}

/**
 * Assign the next sequential invoice number to a booking.
 * Format: INV-0001, INV-0002, etc.
 * Uses MAX query to find the highest existing number and increments.
 */
export async function assignInvoiceNumber(bookingId: number): Promise<string> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Find the highest existing invoice number
  const result = await db
    .select({ invoiceNumber: bookings.invoiceNumber })
    .from(bookings)
    .where(sql`${bookings.invoiceNumber} IS NOT NULL`)
    .orderBy(sql`CAST(SUBSTRING(${bookings.invoiceNumber}, 5) AS UNSIGNED) DESC`)
    .limit(1);

  let nextNum = 1;
  if (result.length > 0 && result[0].invoiceNumber) {
    const match = result[0].invoiceNumber.match(/INV-(\d+)/);
    if (match) {
      nextNum = parseInt(match[1], 10) + 1;
    }
  }

  const invoiceNumber = `INV-${String(nextNum).padStart(4, "0")}`;

  await db
    .update(bookings)
    .set({ invoiceNumber })
    .where(eq(bookings.id, bookingId));

  return invoiceNumber;
}

/**
 * Get the invoice number for a booking, or null if not assigned yet.
 */
export async function getInvoiceNumber(bookingId: number): Promise<string | null> {
  const db = await getDb();
  if (!db) return null;
  const [result] = await db
    .select({ invoiceNumber: bookings.invoiceNumber })
    .from(bookings)
    .where(eq(bookings.id, bookingId))
    .limit(1);
  return result?.invoiceNumber ?? null;
}

/**
 * Ensure a booking has an invoice number. If it already has one, return it.
 * Otherwise, assign the next sequential number.
 */
export async function ensureInvoiceNumber(bookingId: number): Promise<string> {
  const existing = await getInvoiceNumber(bookingId);
  if (existing) return existing;
  return assignInvoiceNumber(bookingId);
}
