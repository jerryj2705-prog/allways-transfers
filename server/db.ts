import { eq, desc, and, or, like, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, vehicles, bookings, type InsertBooking, type Booking } from "../drizzle/schema";
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
