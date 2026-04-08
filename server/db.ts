import { eq, desc, and, or, like, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, vehicles, bookings, pricingSettings, type InsertBooking, type Booking, type PricingSetting } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
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
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
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

export async function updateBookingPaymentStatus(id: number, paymentStatus: "unpaid" | "paid" | "refunded") {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(bookings).set({ paymentStatus }).where(eq(bookings.id, id));
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
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const updateData: Record<string, unknown> = {};
  if (data.pickupAddress !== undefined) updateData.pickupAddress = data.pickupAddress;
  if (data.dropoffAddress !== undefined) updateData.dropoffAddress = data.dropoffAddress;
  if (data.pickupDate !== undefined) updateData.pickupDate = data.pickupDate;
  if (data.passengerCount !== undefined) updateData.passengerCount = data.passengerCount;
  if (data.specialRequests !== undefined) updateData.specialRequests = data.specialRequests;
  if (Object.keys(updateData).length === 0) throw new Error("No fields to update");
  await db.update(bookings).set(updateData).where(eq(bookings.id, id));
  return getBookingById(id);
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
  return db.select().from(pricingSettings).where(eq(pricingSettings.id, id)).then(r => r[0]);
}

export interface PriceBreakdown {
  basePrice: number;
  distanceCharge: number;
  outOfHoursSurcharge: number;
  outOfAreaSurcharge: number;
  fuelLevySurcharge: number;
  supportVanPrice: number;
  squareSurcharge: number;
  subtotal: number;
  totalPrice: number;
}

export async function calculatePrice(params: {
  serviceType: string;
  distanceKm: number;
  pickupHour: number; // 0-23 in local time
  isOutOfArea: boolean;
  needsSupportVan: boolean;
  paymentMethod: string;
  hireHours?: number; // for hourly hire
}): Promise<PriceBreakdown> {
  const settings = await getAllPricingSettings();
  const getVal = (key: string) => {
    const s = settings.find(s => s.settingKey === key);
    return s ? parseFloat(s.settingValue) : 0;
  };
  const isActive = (key: string) => {
    const s = settings.find(s => s.settingKey === key);
    return s ? s.isActive === 1 : false;
  };

  // Base price for selected service
  const serviceKeyMap: Record<string, string> = {
    airport_transfer: "base_airport_transfer",
    hourly_hire: "base_hourly_hire",
    point_to_point: "base_point_to_point",
    special_events: "base_special_events",
  };
  let basePrice = getVal(serviceKeyMap[params.serviceType] || "base_point_to_point");

  // For hourly hire, multiply base rate by number of hours
  if (params.serviceType === "hourly_hire" && params.hireHours && params.hireHours > 0) {
    basePrice = Math.round(basePrice * params.hireHours * 100) / 100;
  }

  // Distance surcharge (tiered 50km blocks: $0 for first 50km, then per-50km rate)
  let distanceCharge = 0;
  if (params.distanceKm > 50 && isActive("distance_surcharge_per_50km")) {
    const surchargePerBlock = getVal("distance_surcharge_per_50km");
    const extraKm = params.distanceKm - 50;
    const blocks = Math.ceil(extraKm / 50);
    distanceCharge = Math.round(blocks * surchargePerBlock * 100) / 100;
  }

  // Out-of-hours surcharge (7pm-7am)
  const isOutOfHours = params.pickupHour >= 19 || params.pickupHour < 7;
  const outOfHoursSurcharge = (isOutOfHours && isActive("surcharge_out_of_hours")) ? getVal("surcharge_out_of_hours") : 0;

  // Out-of-area surcharge
  const outOfAreaSurcharge = (params.isOutOfArea && isActive("surcharge_out_of_area")) ? getVal("surcharge_out_of_area") : 0;

  // Fuel levy (percentage of base + distance)
  const fuelLevyPercent = isActive("surcharge_fuel_levy") ? getVal("surcharge_fuel_levy") : 0;
  const fuelLevySurcharge = Math.round((basePrice + distanceCharge) * (fuelLevyPercent / 100) * 100) / 100;

  // Support van
  const supportVanPrice = params.needsSupportVan ? getVal("rate_support_van") : 0;

  // Subtotal before payment surcharge
  const subtotal = Math.round((basePrice + distanceCharge + outOfHoursSurcharge + outOfAreaSurcharge + fuelLevySurcharge + supportVanPrice) * 100) / 100;

  // Square 2% surcharge
  const squareSurcharge = params.paymentMethod === "square_postpay" ? Math.round(subtotal * 0.02 * 100) / 100 : 0;

  const totalPrice = Math.round((subtotal + squareSurcharge) * 100) / 100;

  return {
    basePrice,
    distanceCharge,
    outOfHoursSurcharge,
    outOfAreaSurcharge,
    fuelLevySurcharge,
    supportVanPrice,
    squareSurcharge,
    subtotal,
    totalPrice,
  };
}

export async function getBookingStats() {
  const db = await getDb();
  if (!db) return { total: 0, pending: 0, confirmed: 0, completed: 0, cancelled: 0 };

  const result = await db.select({
    total: sql<number>`count(*)`,
    pending: sql<number>`sum(case when status = 'pending' then 1 else 0 end)`,
    confirmed: sql<number>`sum(case when status = 'confirmed' then 1 else 0 end)`,
    completed: sql<number>`sum(case when status = 'completed' then 1 else 0 end)`,
    cancelled: sql<number>`sum(case when status = 'cancelled' then 1 else 0 end)`,
  }).from(bookings);

  const row = result[0];
  return {
    total: row?.total ?? 0,
    pending: row?.pending ?? 0,
    confirmed: row?.confirmed ?? 0,
    completed: row?.completed ?? 0,
    cancelled: row?.cancelled ?? 0,
  };
}
