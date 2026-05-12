var __defProp = Object.defineProperty;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __esm = (fn, res) => function __init() {
  return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// server/_core/env.ts
var env_exports = {};
__export(env_exports, {
  ENV: () => ENV
});
var ENV;
var init_env = __esm({
  "server/_core/env.ts"() {
    "use strict";
    ENV = {
      cookieSecret: process.env.JWT_SECRET ?? "",
      databaseUrl: process.env.DATABASE_URL ?? "",
      isProduction: process.env.NODE_ENV === "production",
      googleMapsApiKey: process.env.GOOGLE_MAPS_API_KEY ?? "",
      resendApiKey: process.env.RESEND_API_KEY ?? "",
      resendFromEmail: process.env.RESEND_FROM_EMAIL ?? "onboarding@resend.dev",
      adminEmail: process.env.ADMIN_EMAIL ?? "admin@allwaystransfers.com.au",
      googleClientId: process.env.GOOGLE_CLIENT_ID ?? "",
      googleClientSecret: process.env.GOOGLE_CLIENT_SECRET ?? ""
    };
  }
});

// drizzle/schema.ts
import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, decimal, bigint } from "drizzle-orm/mysql-core";
var users, vehicles, bookings, pricingSettings, enquiries, publicHolidays, reviews, googleReviewsCache, appSettings, passwordResetTokens, landmarks;
var init_schema = __esm({
  "drizzle/schema.ts"() {
    "use strict";
    users = mysqlTable("users", {
      id: int("id").autoincrement().primaryKey(),
      openId: varchar("openId", { length: 64 }).unique(),
      name: text("name"),
      email: varchar("email", { length: 320 }).unique(),
      passwordHash: varchar("passwordHash", { length: 255 }),
      googleId: varchar("googleId", { length: 255 }).unique(),
      loginMethod: varchar("loginMethod", { length: 64 }),
      role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
      createdAt: timestamp("createdAt").defaultNow().notNull(),
      updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
      lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull()
    });
    vehicles = mysqlTable("vehicles", {
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
      createdAt: timestamp("createdAt").defaultNow().notNull()
    });
    bookings = mysqlTable("bookings", {
      id: int("id").autoincrement().primaryKey(),
      referenceNumber: varchar("referenceNumber", { length: 20 }).notNull().unique(),
      // Client details
      clientName: varchar("clientName", { length: 200 }).notNull(),
      clientEmail: varchar("clientEmail", { length: 320 }).notNull(),
      clientPhone: varchar("clientPhone", { length: 30 }).notNull(),
      // Service details
      serviceType: mysqlEnum("serviceType", ["airport_transfer", "hourly_hire", "point_to_point", "special_events", "freight"]).notNull(),
      // Location details
      pickupAddress: text("pickupAddress").notNull(),
      dropoffAddress: text("dropoffAddress"),
      // Additional stops
      additionalPickupCount: int("additionalPickupCount").notNull().default(0),
      additionalDropoffCount: int("additionalDropoffCount").notNull().default(0),
      additionalPickupAddresses: text("additionalPickupAddresses"),
      // JSON array of addresses
      additionalDropoffAddresses: text("additionalDropoffAddresses"),
      // JSON array of addresses
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
      // Freight-specific fields
      freightDescription: text("freightDescription"),
      freightWeight: varchar("freightWeight", { length: 50 }),
      // e.g. "Under 10kg", "10-25kg", etc.
      freightItemCount: int("freightItemCount"),
      freightSpecialHandling: text("freightSpecialHandling"),
      routePreference: varchar("routePreference", { length: 20 }).default("fastest"),
      // 'fastest' or 'toll_free'
      tollOverride: decimal("tollOverride", { precision: 10, scale: 2 }),
      // Admin manual toll override amount
      // Pet-friendly
      isPetFriendly: int("isPetFriendly").notNull().default(0),
      numberOfPets: int("numberOfPets"),
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
      paymentNote: text("paymentNote"),
      // Status
      status: mysqlEnum("status", ["pending", "confirmed", "completed", "cancelled"]).default("pending").notNull(),
      // Notes
      specialRequests: text("specialRequests"),
      adminNotes: text("adminNotes"),
      // Terms
      termsAccepted: int("termsAccepted").notNull().default(0),
      // Timestamps
      createdAt: timestamp("createdAt").defaultNow().notNull(),
      updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull()
    });
    pricingSettings = mysqlTable("pricing_settings", {
      id: int("id").autoincrement().primaryKey(),
      settingKey: varchar("settingKey", { length: 100 }).notNull().unique(),
      settingValue: decimal("settingValue", { precision: 10, scale: 2 }).notNull().default("0"),
      label: varchar("label", { length: 200 }).notNull(),
      description: text("description"),
      category: mysqlEnum("category", ["base_price", "surcharge", "rate", "toggle", "road_toll"]).notNull(),
      isActive: int("isActive").notNull().default(1),
      updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull()
    });
    enquiries = mysqlTable("enquiries", {
      id: int("id").autoincrement().primaryKey(),
      name: varchar("name", { length: 200 }).notNull(),
      email: varchar("email", { length: 320 }).notNull(),
      phone: varchar("phone", { length: 30 }),
      subject: varchar("subject", { length: 300 }).notNull(),
      message: text("message").notNull(),
      status: mysqlEnum("status", ["new", "read", "replied", "archived"]).default("new").notNull(),
      adminNotes: text("adminNotes"),
      createdAt: timestamp("createdAt").defaultNow().notNull(),
      updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull()
    });
    publicHolidays = mysqlTable("public_holidays", {
      id: int("id").autoincrement().primaryKey(),
      name: varchar("name", { length: 200 }).notNull(),
      date: varchar("date", { length: 10 }).notNull(),
      // YYYY-MM-DD format
      isRecurring: int("isRecurring").notNull().default(0),
      // 1 = same date every year (e.g. Christmas)
      isActive: int("isActive").notNull().default(1),
      createdAt: timestamp("createdAt").defaultNow().notNull(),
      updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull()
    });
    reviews = mysqlTable("reviews", {
      id: int("id").autoincrement().primaryKey(),
      bookingId: int("bookingId").notNull(),
      bookingReference: varchar("bookingReference", { length: 20 }).notNull(),
      userId: int("userId"),
      reviewerName: varchar("reviewerName", { length: 200 }).notNull(),
      rating: int("rating").notNull(),
      // 1-5 stars
      comment: text("comment"),
      serviceType: mysqlEnum("serviceType", ["airport_transfer", "hourly_hire", "point_to_point", "special_events", "freight"]).notNull(),
      status: mysqlEnum("status", ["pending", "approved", "rejected"]).default("pending").notNull(),
      adminNotes: text("adminNotes"),
      createdAt: timestamp("createdAt").defaultNow().notNull(),
      updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull()
    });
    googleReviewsCache = mysqlTable("google_reviews_cache", {
      id: int("id").autoincrement().primaryKey(),
      placeId: varchar("placeId", { length: 255 }).notNull(),
      authorName: varchar("authorName", { length: 300 }).notNull(),
      rating: int("rating").notNull(),
      text: text("text"),
      relativeTimeDescription: varchar("relativeTimeDescription", { length: 100 }),
      publishTime: bigint("publishTime", { mode: "number" }),
      // Unix timestamp
      profilePhotoUrl: text("profilePhotoUrl"),
      fetchedAt: timestamp("fetchedAt").defaultNow().notNull()
    });
    appSettings = mysqlTable("app_settings", {
      id: int("id").autoincrement().primaryKey(),
      settingKey: varchar("settingKey", { length: 100 }).notNull().unique(),
      settingValue: text("settingValue"),
      updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull()
    });
    passwordResetTokens = mysqlTable("password_reset_tokens", {
      id: int("id").autoincrement().primaryKey(),
      userId: int("userId").notNull(),
      token: varchar("token", { length: 255 }).notNull().unique(),
      expiresAt: timestamp("expiresAt").notNull(),
      usedAt: timestamp("usedAt"),
      createdAt: timestamp("createdAt").defaultNow().notNull()
    });
    landmarks = mysqlTable("landmarks", {
      id: int("id").autoincrement().primaryKey(),
      name: varchar("name", { length: 300 }).notNull(),
      lat: decimal("lat", { precision: 10, scale: 6 }).notNull(),
      lng: decimal("lng", { precision: 10, scale: 6 }).notNull(),
      lga: varchar("lga", { length: 200 }).notNull(),
      category: mysqlEnum("category", ["resort", "golf_course", "venue", "hospital", "university", "airport", "shopping", "stadium", "theme_park", "attraction", "other"]).notNull().default("other"),
      address: varchar("address", { length: 500 }),
      isActive: int("isActive").notNull().default(1),
      createdAt: timestamp("createdAt").defaultNow().notNull(),
      updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull()
    });
  }
});

// shared/suburbs.ts
function classifyLGA(lga) {
  if (PRIMARY_LGAS.includes(lga)) return "primary";
  if (SECONDARY_LGAS.includes(lga)) return "secondary";
  return "other";
}
function lookupSuburb(input) {
  const cleaned = input.trim().toLowerCase();
  if (suburbMap.has(cleaned)) return suburbMap.get(cleaned);
  const withoutState = cleaned.replace(/,?\s*(qld|queensland)\s*$/i, "").replace(/,?\s*\d{4}\s*$/, "").trim();
  if (suburbMap.has(withoutState)) return suburbMap.get(withoutState);
  for (const entry of Array.from(suburbMap.entries())) {
    if (withoutState.includes(entry[0]) || entry[0].includes(withoutState)) {
      return entry[1];
    }
  }
  return null;
}
function calculateDistance(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const straightLine = R * c;
  return Math.round(straightLine * 1.3);
}
function estimateDistance(pickupSuburb, destinationSuburb) {
  const pickup = lookupSuburb(pickupSuburb);
  const destination = lookupSuburb(destinationSuburb);
  if (!pickup || !destination) return null;
  return calculateDistance(pickup.lat, pickup.lng, destination.lat, destination.lng);
}
function getAllSuburbNames() {
  return Array.from(new Set(SUBURB_DATA.map(([name]) => name))).sort();
}
function getAllLocationsWithType() {
  const seen = /* @__PURE__ */ new Set();
  const results = [];
  for (let i = 0; i < SUBURB_DATA.length; i++) {
    const name = SUBURB_DATA[i][0];
    if (!seen.has(name)) {
      seen.add(name);
      const landmark = LANDMARK_START_INDEX >= 0 && i >= LANDMARK_START_INDEX;
      results.push({ name, isLandmark: landmark });
    }
  }
  return results.sort((a, b) => a.name.localeCompare(b.name));
}
var PRIMARY_LGAS, SECONDARY_LGAS, SUBURB_DATA, LANDMARK_START_INDEX, suburbMap;
var init_suburbs = __esm({
  "shared/suburbs.ts"() {
    "use strict";
    PRIMARY_LGAS = ["Sunshine Coast", "Noosa"];
    SECONDARY_LGAS = [
      "Fraser Coast",
      "Gympie",
      "Somerset",
      "Moreton Bay",
      "Brisbane",
      "Logan",
      "Gold Coast",
      "Redland",
      "Scenic Rim",
      "Ipswich"
    ];
    SUBURB_DATA = [
      // === SUNSHINE COAST REGION (Primary) ===
      ["Alexandra Headland", "Sunshine Coast", -26.667, 153.103],
      ["Aroona", "Sunshine Coast", -26.738, 153.082],
      ["Bald Knob", "Sunshine Coast", -26.762, 152.88],
      ["Banksia Beach", "Sunshine Coast", -27.057, 153.138],
      ["Battery Hill", "Sunshine Coast", -26.784, 153.118],
      ["Beerwah", "Sunshine Coast", -26.858, 152.96],
      ["Bells Creek", "Sunshine Coast", -26.808, 153.062],
      ["Birtinya", "Sunshine Coast", -26.738, 153.112],
      ["Bli Bli", "Sunshine Coast", -26.618, 153.03],
      ["Bokarina", "Sunshine Coast", -26.738, 153.128],
      ["Bongaree", "Sunshine Coast", -27.08, 153.158],
      ["Buddina", "Sunshine Coast", -26.695, 153.128],
      ["Buderim", "Sunshine Coast", -26.68, 153.06],
      ["Burnside", "Sunshine Coast", -26.62, 153.068],
      ["Caloundra", "Sunshine Coast", -26.798, 153.128],
      ["Caloundra West", "Sunshine Coast", -26.81, 153.098],
      ["Chevallum", "Sunshine Coast", -26.7, 152.98],
      ["Coes Creek", "Sunshine Coast", -26.638, 152.968],
      ["Coolum Beach", "Sunshine Coast", -26.528, 153.088],
      ["Cotton Tree", "Sunshine Coast", -26.65, 153.098],
      ["Crohamhurst", "Sunshine Coast", -26.828, 152.898],
      ["Currimundi", "Sunshine Coast", -26.768, 153.128],
      ["Dicky Beach", "Sunshine Coast", -26.778, 153.138],
      ["Diddillibah", "Sunshine Coast", -26.698, 153.018],
      ["Doonan", "Sunshine Coast", -26.508, 153.018],
      ["Dulong", "Sunshine Coast", -26.648, 152.888],
      ["Eerwah Vale", "Sunshine Coast", -26.548, 152.948],
      ["Eudlo", "Sunshine Coast", -26.738, 152.948],
      ["Flaxton", "Sunshine Coast", -26.668, 152.868],
      ["Forest Glen", "Sunshine Coast", -26.698, 152.978],
      ["Glass House Mountains", "Sunshine Coast", -26.898, 152.948],
      ["Golden Beach", "Sunshine Coast", -26.818, 153.128],
      ["Glenview", "Sunshine Coast", -26.768, 152.978],
      ["Hunchy", "Sunshine Coast", -26.718, 152.918],
      ["Ilkley", "Sunshine Coast", -26.748, 152.918],
      ["Image Flat", "Sunshine Coast", -26.618, 152.948],
      ["Kawana Island", "Sunshine Coast", -26.728, 153.128],
      ["Kenilworth", "Sunshine Coast", -26.588, 152.728],
      ["Kiels Mountain", "Sunshine Coast", -26.718, 153.018],
      ["Kings Beach", "Sunshine Coast", -26.808, 153.138],
      ["Kuluin", "Sunshine Coast", -26.668, 153.048],
      ["Landsborough", "Sunshine Coast", -26.808, 152.968],
      ["Little Mountain", "Sunshine Coast", -26.788, 153.088],
      ["Maleny", "Sunshine Coast", -26.758, 152.858],
      ["Mapleton", "Sunshine Coast", -26.628, 152.868],
      ["Marcoola", "Sunshine Coast", -26.588, 153.098],
      ["Maroochydore", "Sunshine Coast", -26.658, 153.098],
      ["Meridan Plains", "Sunshine Coast", -26.778, 153.068],
      ["Minyama", "Sunshine Coast", -26.688, 153.118],
      ["Moffat Beach", "Sunshine Coast", -26.788, 153.138],
      ["Mons", "Sunshine Coast", -26.688, 152.958],
      ["Montville", "Sunshine Coast", -26.688, 152.878],
      ["Mooloolaba", "Sunshine Coast", -26.688, 153.118],
      ["Mooloolah Valley", "Sunshine Coast", -26.768, 152.958],
      ["Mount Coolum", "Sunshine Coast", -26.558, 153.078],
      ["Mountain Creek", "Sunshine Coast", -26.708, 153.098],
      ["Mudjimba", "Sunshine Coast", -26.608, 153.098],
      ["Nambour", "Sunshine Coast", -26.628, 152.958],
      ["Ninderry", "Sunshine Coast", -26.548, 153.018],
      ["North Arm", "Sunshine Coast", -26.558, 153.008],
      ["Pacific Paradise", "Sunshine Coast", -26.618, 153.078],
      ["Palmview", "Sunshine Coast", -26.748, 153.048],
      ["Palmwoods", "Sunshine Coast", -26.688, 152.958],
      ["Parrearra", "Sunshine Coast", -26.718, 153.118],
      ["Peachester", "Sunshine Coast", -26.838, 152.878],
      ["Pelican Waters", "Sunshine Coast", -26.828, 153.108],
      ["Peregian Beach", "Sunshine Coast", -26.488, 153.088],
      ["Peregian Springs", "Sunshine Coast", -26.488, 153.058],
      ["Petrie Creek", "Sunshine Coast", -26.648, 152.978],
      ["Reesville", "Sunshine Coast", -26.718, 152.858],
      ["Rosemount", "Sunshine Coast", -26.618, 152.928],
      ["Shelly Beach", "Sunshine Coast", -26.808, 153.148],
      ["Sippy Downs", "Sunshine Coast", -26.718, 153.058],
      ["Tanawha", "Sunshine Coast", -26.728, 153.028],
      ["Towen Mountain", "Sunshine Coast", -26.668, 152.928],
      ["Twin Waters", "Sunshine Coast", -26.628, 153.088],
      ["Warana", "Sunshine Coast", -26.718, 153.128],
      ["Weyba Downs", "Sunshine Coast", -26.458, 153.048],
      ["Witta", "Sunshine Coast", -26.718, 152.838],
      ["Woombye", "Sunshine Coast", -26.668, 152.968],
      ["Wurtulla", "Sunshine Coast", -26.748, 153.128],
      ["Yandina", "Sunshine Coast", -26.568, 152.958],
      ["Yandina Creek", "Sunshine Coast", -26.538, 153.028],
      ["Yaroomba", "Sunshine Coast", -26.548, 153.088],
      // === NOOSA SHIRE (Primary) ===
      ["Castaways Beach", "Noosa", -26.418, 153.088],
      ["Noosa Heads", "Noosa", -26.388, 153.088],
      ["Noosaville", "Noosa", -26.398, 153.058],
      ["Sunrise Beach", "Noosa", -26.408, 153.098],
      ["Sunshine Beach", "Noosa", -26.418, 153.098],
      ["Tewantin", "Noosa", -26.398, 153.038],
      ["Como", "Noosa", -26.438, 153.058],
      ["Marcus Beach", "Noosa", -26.448, 153.078],
      ["Noosa North Shore", "Noosa", -26.358, 153.068],
      ["Black Mountain", "Noosa", -26.468, 152.868],
      ["Boreen Point", "Noosa", -26.328, 152.988],
      ["Cooran", "Noosa", -26.338, 152.808],
      ["Cooroibah", "Noosa", -26.368, 153.008],
      ["Cooroy", "Noosa", -26.418, 152.918],
      ["Cooroy Mountain", "Noosa", -26.438, 152.908],
      ["Cootharaba", "Noosa", -26.318, 152.928],
      ["Doonan", "Noosa", -26.428, 153.008],
      ["Eerwah Vale", "Noosa", -26.458, 152.948],
      ["Federal", "Noosa", -26.448, 152.878],
      ["Kin Kin", "Noosa", -26.268, 152.888],
      ["Lake Macdonald", "Noosa", -26.378, 152.928],
      ["Pinbarren", "Noosa", -26.308, 152.838],
      ["Pomona", "Noosa", -26.368, 152.858],
      ["Ridgewood", "Noosa", -26.358, 152.828],
      ["Ringtail Creek", "Noosa", -26.408, 152.878],
      ["Tinbeerwah", "Noosa", -26.438, 153.028],
      ["West Cooroy", "Noosa", -26.428, 152.888],
      // === MORETON BAY (Secondary) ===
      ["Caboolture", "Moreton Bay", -27.085, 152.951],
      ["Morayfield", "Moreton Bay", -27.107, 152.95],
      ["Burpengary", "Moreton Bay", -27.158, 152.958],
      ["Narangba", "Moreton Bay", -27.2, 152.978],
      ["North Lakes", "Moreton Bay", -27.228, 153.008],
      ["Redcliffe", "Moreton Bay", -27.228, 153.098],
      ["Deception Bay", "Moreton Bay", -27.188, 153.028],
      ["Kallangur", "Moreton Bay", -27.248, 152.988],
      ["Petrie", "Moreton Bay", -27.268, 152.978],
      ["Strathpine", "Moreton Bay", -27.298, 152.988],
      ["Albany Creek", "Moreton Bay", -27.348, 152.968],
      ["Brendale", "Moreton Bay", -27.318, 152.978],
      ["Lawnton", "Moreton Bay", -27.278, 152.978],
      ["Murrumba Downs", "Moreton Bay", -27.238, 153.008],
      ["Warner", "Moreton Bay", -27.318, 152.948],
      ["Scarborough", "Moreton Bay", -27.198, 153.108],
      ["Margate", "Moreton Bay", -27.238, 153.098],
      ["Clontarf", "Moreton Bay", -27.248, 153.078],
      ["Woody Point", "Moreton Bay", -27.258, 153.098],
      ["Bribie Island", "Moreton Bay", -27.058, 153.168],
      ["Bellara", "Moreton Bay", -27.068, 153.148],
      ["Woorim", "Moreton Bay", -27.068, 153.198],
      ["Dayboro", "Moreton Bay", -27.198, 152.818],
      ["Samford", "Moreton Bay", -27.378, 152.878],
      ["Samford Valley", "Moreton Bay", -27.368, 152.858],
      ["Ferny Hills", "Moreton Bay", -27.388, 152.938],
      ["Arana Hills", "Moreton Bay", -27.398, 152.948],
      ["Everton Hills", "Moreton Bay", -27.378, 152.968],
      ["Eatons Hill", "Moreton Bay", -27.338, 152.958],
      ["Cashmere", "Moreton Bay", -27.318, 152.928],
      ["Woodford", "Moreton Bay", -26.948, 152.778],
      ["Kilcoy", "Moreton Bay", -26.948, 152.568],
      // === BRISBANE (Secondary) ===
      ["Brisbane CBD", "Brisbane", -27.47, 153.025],
      ["South Brisbane", "Brisbane", -27.478, 153.018],
      ["Fortitude Valley", "Brisbane", -27.458, 153.038],
      ["New Farm", "Brisbane", -27.468, 153.048],
      ["West End", "Brisbane", -27.488, 153.008],
      ["Paddington", "Brisbane", -27.458, 152.998],
      ["Milton", "Brisbane", -27.468, 152.998],
      ["Toowong", "Brisbane", -27.488, 152.988],
      ["Indooroopilly", "Brisbane", -27.498, 152.978],
      ["St Lucia", "Brisbane", -27.498, 153.008],
      ["Woolloongabba", "Brisbane", -27.488, 153.038],
      ["Kangaroo Point", "Brisbane", -27.478, 153.038],
      ["Spring Hill", "Brisbane", -27.458, 153.018],
      ["Kelvin Grove", "Brisbane", -27.448, 153.008],
      ["Red Hill", "Brisbane", -27.448, 152.998],
      ["Herston", "Brisbane", -27.438, 153.018],
      ["Newstead", "Brisbane", -27.448, 153.048],
      ["Teneriffe", "Brisbane", -27.458, 153.048],
      ["Bulimba", "Brisbane", -27.458, 153.058],
      ["Hawthorne", "Brisbane", -27.458, 153.058],
      ["Coorparoo", "Brisbane", -27.498, 153.058],
      ["Camp Hill", "Brisbane", -27.498, 153.068],
      ["Carindale", "Brisbane", -27.508, 153.098],
      ["Mount Gravatt", "Brisbane", -27.548, 153.078],
      ["Sunnybank", "Brisbane", -27.578, 153.058],
      ["Eight Mile Plains", "Brisbane", -27.578, 153.098],
      ["Upper Mount Gravatt", "Brisbane", -27.558, 153.078],
      ["Holland Park", "Brisbane", -27.518, 153.068],
      ["Greenslopes", "Brisbane", -27.508, 153.048],
      ["Stones Corner", "Brisbane", -27.498, 153.048],
      ["Annerley", "Brisbane", -27.508, 153.038],
      ["Yeronga", "Brisbane", -27.518, 153.018],
      ["Fairfield", "Brisbane", -27.508, 153.018],
      ["Graceville", "Brisbane", -27.518, 152.978],
      ["Sherwood", "Brisbane", -27.528, 152.978],
      ["Kenmore", "Brisbane", -27.508, 152.948],
      ["Chapel Hill", "Brisbane", -27.498, 152.958],
      ["The Gap", "Brisbane", -27.438, 152.948],
      ["Ashgrove", "Brisbane", -27.438, 152.978],
      ["Bardon", "Brisbane", -27.458, 152.978],
      ["Mitchelton", "Brisbane", -27.418, 152.968],
      ["Stafford", "Brisbane", -27.418, 153.008],
      ["Chermside", "Brisbane", -27.388, 153.028],
      ["Nundah", "Brisbane", -27.398, 153.058],
      ["Clayfield", "Brisbane", -27.428, 153.058],
      ["Ascot", "Brisbane", -27.428, 153.058],
      ["Hamilton", "Brisbane", -27.438, 153.058],
      ["Eagle Farm", "Brisbane", -27.438, 153.078],
      ["Pinkenba", "Brisbane", -27.418, 153.108],
      ["Brisbane Airport", "Brisbane", -27.388, 153.118],
      ["Sandgate", "Brisbane", -27.328, 153.068],
      ["Shorncliffe", "Brisbane", -27.328, 153.078],
      ["Brighton", "Brisbane", -27.298, 153.058],
      ["Zillmere", "Brisbane", -27.358, 153.038],
      ["Geebung", "Brisbane", -27.368, 153.048],
      ["Virginia", "Brisbane", -27.378, 153.058],
      ["Banyo", "Brisbane", -27.378, 153.078],
      ["Nudgee", "Brisbane", -27.368, 153.088],
      ["Wynnum", "Brisbane", -27.448, 153.168],
      ["Manly", "Brisbane", -27.458, 153.188],
      ["Capalaba", "Brisbane", -27.528, 153.188],
      ["Cleveland", "Brisbane", -27.528, 153.268],
      ["Inala", "Brisbane", -27.598, 152.978],
      ["Richlands", "Brisbane", -27.598, 152.998],
      ["Forest Lake", "Brisbane", -27.628, 152.968],
      ["Springfield", "Brisbane", -27.658, 152.908],
      ["Springfield Lakes", "Brisbane", -27.668, 152.918],
      ["Darra", "Brisbane", -27.558, 152.958],
      ["Oxley", "Brisbane", -27.558, 152.978],
      ["Corinda", "Brisbane", -27.538, 152.978],
      ["Moorooka", "Brisbane", -27.528, 153.028],
      ["Rocklea", "Brisbane", -27.548, 153.008],
      ["Acacia Ridge", "Brisbane", -27.578, 153.028],
      ["Coopers Plains", "Brisbane", -27.568, 153.048],
      ["Robertson", "Brisbane", -27.568, 153.068],
      ["Wishart", "Brisbane", -27.558, 153.098],
      ["Mansfield", "Brisbane", -27.548, 153.108],
      ["Rochedale", "Brisbane", -27.568, 153.128],
      ["Chandler", "Brisbane", -27.508, 153.148],
      ["Belmont", "Brisbane", -27.508, 153.128],
      // === GOLD COAST (Secondary) ===
      ["Surfers Paradise", "Gold Coast", -28, 153.43],
      ["Broadbeach", "Gold Coast", -28.028, 153.438],
      ["Southport", "Gold Coast", -27.968, 153.408],
      ["Nerang", "Gold Coast", -27.988, 153.338],
      ["Robina", "Gold Coast", -28.078, 153.378],
      ["Varsity Lakes", "Gold Coast", -28.088, 153.408],
      ["Burleigh Heads", "Gold Coast", -28.088, 153.448],
      ["Palm Beach", "Gold Coast", -28.118, 153.458],
      ["Coolangatta", "Gold Coast", -28.168, 153.538],
      ["Coomera", "Gold Coast", -27.868, 153.308],
      ["Ormeau", "Gold Coast", -27.768, 153.248],
      ["Oxenford", "Gold Coast", -27.888, 153.308],
      ["Helensvale", "Gold Coast", -27.908, 153.338],
      ["Runaway Bay", "Gold Coast", -27.938, 153.398],
      ["Labrador", "Gold Coast", -27.948, 153.398],
      ["Ashmore", "Gold Coast", -27.978, 153.378],
      ["Mudgeeraba", "Gold Coast", -28.078, 153.368],
      ["Currumbin", "Gold Coast", -28.138, 153.478],
      ["Tugun", "Gold Coast", -28.148, 153.498],
      ["Tweed Heads", "Gold Coast", -28.178, 153.548],
      // === LOGAN (Secondary) ===
      ["Logan Central", "Logan", -27.638, 153.108],
      ["Springwood", "Logan", -27.608, 153.128],
      ["Shailer Park", "Logan", -27.648, 153.178],
      ["Daisy Hill", "Logan", -27.638, 153.158],
      ["Loganholme", "Logan", -27.668, 153.198],
      ["Beenleigh", "Logan", -27.718, 153.198],
      ["Eagleby", "Logan", -27.698, 153.218],
      ["Marsden", "Logan", -27.668, 153.098],
      ["Crestmead", "Logan", -27.688, 153.088],
      ["Browns Plains", "Logan", -27.668, 153.048],
      ["Jimboomba", "Logan", -27.838, 153.028],
      ["Waterford", "Logan", -27.688, 153.148],
      ["Underwood", "Logan", -27.608, 153.108],
      // === IPSWICH (Secondary) ===
      ["Ipswich", "Ipswich", -27.618, 152.768],
      ["Booval", "Ipswich", -27.618, 152.788],
      ["Brassall", "Ipswich", -27.588, 152.748],
      ["Goodna", "Ipswich", -27.608, 152.898],
      ["Redbank Plains", "Ipswich", -27.648, 152.868],
      ["Springfield Central", "Ipswich", -27.668, 152.898],
      ["Ripley", "Ipswich", -27.718, 152.818],
      ["Rosewood", "Ipswich", -27.638, 152.598],
      ["Yamanto", "Ipswich", -27.648, 152.738],
      ["Karalee", "Ipswich", -27.558, 152.838],
      ["Gatton", "Ipswich", -27.558, 152.278],
      // === REDLAND (Secondary) ===
      ["Redland Bay", "Redland", -27.618, 153.298],
      ["Victoria Point", "Redland", -27.588, 153.278],
      ["Cleveland", "Redland", -27.528, 153.268],
      ["Capalaba", "Redland", -27.528, 153.188],
      ["Alexandra Hills", "Redland", -27.548, 153.228],
      ["Thornlands", "Redland", -27.558, 153.258],
      ["Wellington Point", "Redland", -27.478, 153.238],
      ["Birkdale", "Redland", -27.498, 153.218],
      ["Ormiston", "Redland", -27.518, 153.258],
      ["North Stradbroke Island", "Redland", -27.498, 153.418],
      // === SCENIC RIM (Secondary) ===
      ["Beaudesert", "Scenic Rim", -27.988, 152.998],
      ["Boonah", "Scenic Rim", -27.998, 152.678],
      ["Canungra", "Scenic Rim", -28.028, 153.168],
      ["Tamborine Mountain", "Scenic Rim", -27.938, 153.178],
      ["Mount Tamborine", "Scenic Rim", -27.968, 153.178],
      ["Rathdowney", "Scenic Rim", -28.218, 152.868],
      ["Kalbar", "Scenic Rim", -27.948, 152.628],
      // === GYMPIE (Secondary) ===
      ["Gympie", "Gympie", -26.188, 152.668],
      ["Tin Can Bay", "Gympie", -25.918, 153.008],
      ["Rainbow Beach", "Gympie", -25.898, 153.088],
      ["Cooloola Cove", "Gympie", -25.948, 153.018],
      ["Amamoor", "Gympie", -26.348, 152.628],
      ["Gunalda", "Gympie", -26.068, 152.578],
      ["Tiaro", "Gympie", -25.728, 152.588],
      // === FRASER COAST (Secondary) ===
      ["Hervey Bay", "Fraser Coast", -25.288, 152.848],
      ["Maryborough", "Fraser Coast", -25.538, 152.698],
      ["Pialba", "Fraser Coast", -25.288, 152.838],
      ["Torquay", "Fraser Coast", -25.288, 152.868],
      ["Urangan", "Fraser Coast", -25.298, 152.908],
      ["Howard", "Fraser Coast", -25.318, 152.558],
      ["Burrum Heads", "Fraser Coast", -25.188, 152.618],
      ["Fraser Island", "Fraser Coast", -25.248, 153.148],
      // === SOMERSET (Secondary) ===
      ["Esk", "Somerset", -27.238, 152.428],
      ["Fernvale", "Somerset", -27.438, 152.658],
      ["Lowood", "Somerset", -27.468, 152.578],
      ["Toogoolawah", "Somerset", -27.088, 152.378],
      ["Kilcoy", "Somerset", -26.948, 152.568],
      // === LANDMARKS & KEY LOCATIONS ===
      // Sunshine Coast Landmarks
      ["Sunshine Coast Airport", "Sunshine Coast", -26.604, 153.091],
      ["Sunshine Coast University Hospital", "Sunshine Coast", -26.737, 153.112],
      ["Sunshine Coast University", "Sunshine Coast", -26.718, 153.063],
      ["USC Sunshine Coast", "Sunshine Coast", -26.718, 153.063],
      ["Sunshine Plaza", "Sunshine Coast", -26.654, 153.07],
      ["Stockland Caloundra", "Sunshine Coast", -26.798, 153.13],
      ["Big Pineapple", "Sunshine Coast", -26.67, 153],
      ["Australia Zoo", "Sunshine Coast", -26.836, 152.96],
      ["Aussie World", "Sunshine Coast", -26.81, 153.02],
      ["SEA LIFE Sunshine Coast", "Sunshine Coast", -26.654, 153.1],
      ["Nambour General Hospital", "Sunshine Coast", -26.628, 152.96],
      ["Buderim Private Hospital", "Sunshine Coast", -26.68, 153.05],
      ["Caloundra Private Hospital", "Sunshine Coast", -26.798, 153.125],
      ["Kawana Shoppingworld", "Sunshine Coast", -26.72, 153.118],
      ["Noosa Civic", "Noosa", -26.395, 153.05],
      ["Noosa Junction", "Noosa", -26.385, 153.07],
      ["Noosa Main Beach", "Noosa", -26.378, 153.09],
      ["Noosa National Park", "Noosa", -26.38, 153.098],
      ["Hastings Street Noosa", "Noosa", -26.38, 153.088],
      ["Noosa Marina", "Noosa", -26.393, 153.058],
      ["Eumundi Markets", "Noosa", -26.478, 152.952],
      // Sunshine Coast & Noosa — Resorts & Accommodation
      ["RACV Noosa Resort", "Noosa", -26.393, 153.065],
      ["Sofitel Noosa Pacific Resort", "Noosa", -26.379, 153.088],
      ["Netanya Noosa Beachfront Resort", "Noosa", -26.38, 153.089],
      ["Peppers Noosa Resort & Villas", "Noosa", -26.394, 153.068],
      ["Noosa Springs Golf & Spa Resort", "Noosa", -26.398, 153.058],
      ["Seahaven Beachfront Resort Noosa", "Noosa", -26.38, 153.087],
      ["South Pacific Resort Noosa", "Noosa", -26.38, 153.085],
      ["Noosa Lakes Resort", "Noosa", -26.4, 153.055],
      ["Noosa Blue Resort", "Noosa", -26.388, 153.078],
      ["Tingirana Noosa", "Noosa", -26.38, 153.086],
      ["Sun Lagoon Resort Noosa", "Noosa", -26.393, 153.06],
      ["Elysium Noosa Resort", "Noosa", -26.379, 153.087],
      ["Noosa Eco Retreat", "Noosa", -26.41, 153.01],
      ["Eumarella Shores Noosa Lake Retreat", "Noosa", -26.42, 153],
      ["Noosa Valley Manor B&B", "Noosa", -26.41, 153.02],
      ["Oceans Mooloolaba", "Sunshine Coast", -26.684, 153.12],
      ["Sea Pearl Resort Mooloolaba", "Sunshine Coast", -26.683, 153.118],
      ["Mantra Mooloolaba Beach", "Sunshine Coast", -26.682, 153.119],
      ["Novotel Sunshine Coast Resort", "Sunshine Coast", -26.64, 153.078],
      ["Palmer Coolum Resort", "Sunshine Coast", -26.54, 153.08],
      ["Ramada Resort Marcoola", "Sunshine Coast", -26.59, 153.09],
      ["Rumba Beach Resort Caloundra", "Sunshine Coast", -26.8, 153.14],
      ["Oaks Seaforth Resort Alexandra Headland", "Sunshine Coast", -26.672, 153.115],
      ["Spicers Clovelly Estate", "Sunshine Coast", -26.7, 152.88],
      ["Narrows Escape Rainforest Retreat", "Sunshine Coast", -26.7, 152.87],
      ["Flaxton Gardens", "Sunshine Coast", -26.68, 152.86],
      ["Secrets on the Lake", "Sunshine Coast", -26.7, 152.87],
      ["Montville Country Cabins", "Sunshine Coast", -26.69, 152.88],
      ["Kondalilla Eco Resort", "Sunshine Coast", -26.68, 152.87],
      ["Glass House Mountains Ecolodge", "Sunshine Coast", -26.89, 152.94],
      ["Surfair Marcoola", "Sunshine Coast", -26.59, 153.09],
      // Sunshine Coast & Noosa — Golf Courses
      ["Noosa Springs Golf Club", "Noosa", -26.398, 153.058],
      ["Noosa Golf Club", "Noosa", -26.4, 153.05],
      ["Noosa Valley Golf Club", "Noosa", -26.41, 153.02],
      ["Tewantin-Noosa Golf Club", "Noosa", -26.395, 153.04],
      ["Twin Waters Golf Club", "Sunshine Coast", -26.628, 153.075],
      ["Peregian Golf Course", "Sunshine Coast", -26.49, 153.078],
      ["Maroochy River Golf Club", "Sunshine Coast", -26.62, 153.05],
      ["Pelican Waters Golf Club", "Sunshine Coast", -26.78, 153.11],
      ["Headland Golf Club", "Sunshine Coast", -26.695, 153.1],
      ["Horton Park Golf Club", "Sunshine Coast", -26.65, 153.08],
      ["Caloundra Golf Club", "Sunshine Coast", -26.81, 153.12],
      ["Maleny Golf Club", "Sunshine Coast", -26.76, 152.85],
      ["Beerwah Golf Club", "Sunshine Coast", -26.86, 152.96],
      ["Mount Coolum Golf Club", "Sunshine Coast", -26.56, 153.07],
      ["Nambour Golf Club", "Sunshine Coast", -26.63, 152.95],
      ["Hinterland Golf Club Buderim", "Sunshine Coast", -26.69, 153.05],
      ["Tanawha Valley Par 3", "Sunshine Coast", -26.71, 153.04],
      ["Bribie Island Golf Club", "Moreton Bay", -27.05, 153.14],
      // Sunshine Coast & Noosa — Event Venues & Function Centres
      ["Sunshine Coast Convention Centre", "Sunshine Coast", -26.64, 153.078],
      ["The J Noosa", "Noosa", -26.395, 153.05],
      ["Noosa Boathouse", "Noosa", -26.393, 153.058],
      ["Surfair Events Centre", "Sunshine Coast", -26.59, 153.09],
      ["Clios Conferences Montville", "Sunshine Coast", -26.69, 152.88],
      ["Spicers Tamarind Retreat", "Sunshine Coast", -26.7, 152.88],
      ["Maleny Manor", "Sunshine Coast", -26.76, 152.86],
      ["Tiffanys Maleny", "Sunshine Coast", -26.76, 152.85],
      ["Weddings at Tiffanys", "Sunshine Coast", -26.76, 152.85],
      ["The Ginger Factory", "Sunshine Coast", -26.67, 152.95],
      ["Venue 114 Bokarina", "Sunshine Coast", -26.73, 153.13],
      ["Lake Kawana Community Centre", "Sunshine Coast", -26.72, 153.12],
      ["Maroochy RSL", "Sunshine Coast", -26.65, 153.07],
      ["Caloundra RSL", "Sunshine Coast", -26.8, 153.13],
      ["Noosa RSL", "Noosa", -26.395, 153.05],
      ["Peregian Beach Hotel", "Sunshine Coast", -26.49, 153.09],
      ["Coolum Surf Club", "Sunshine Coast", -26.53, 153.09],
      ["Mooloolaba Surf Club", "Sunshine Coast", -26.685, 153.12],
      ["Alexandra Headland Surf Club", "Sunshine Coast", -26.672, 153.118],
      ["Maroochydore Surf Club", "Sunshine Coast", -26.655, 153.1],
      ["Noosa Surf Club", "Noosa", -26.378, 153.09],
      ["Rickys Noosa", "Noosa", -26.393, 153.058],
      ["Pier 33 Mooloolaba", "Sunshine Coast", -26.685, 153.118],
      ["The Wharf Mooloolaba", "Sunshine Coast", -26.685, 153.118],
      ["Montville Village", "Sunshine Coast", -26.69, 152.88],
      ["Mapleton Falls", "Sunshine Coast", -26.66, 152.86],
      ["Mary Cairncross Scenic Reserve", "Sunshine Coast", -26.77, 152.87],
      ["Kondalilla Falls", "Sunshine Coast", -26.68, 152.87],
      ["Mooloolaba Esplanade", "Sunshine Coast", -26.684, 153.12],
      ["Cotton Tree Park", "Sunshine Coast", -26.65, 153.095],
      ["Kings Beach Caloundra", "Sunshine Coast", -26.8, 153.14],
      // Brisbane Landmarks
      ["Roma Street Parkland", "Brisbane", -27.462, 153.014],
      ["Parkland", "Brisbane", -27.462, 153.014],
      ["South Bank Parklands", "Brisbane", -27.48, 153.022],
      ["South Bank", "Brisbane", -27.48, 153.022],
      ["Queen Street Mall", "Brisbane", -27.47, 153.026],
      ["Brisbane Convention Centre", "Brisbane", -27.48, 153.018],
      ["Suncorp Stadium", "Brisbane", -27.465, 153.009],
      ["The Gabba", "Brisbane", -27.486, 153.038],
      ["Brisbane Showgrounds", "Brisbane", -27.451, 153.032],
      ["Royal Brisbane Hospital", "Brisbane", -27.449, 153.028],
      ["RBWH", "Brisbane", -27.449, 153.028],
      ["Mater Hospital Brisbane", "Brisbane", -27.484, 153.028],
      ["PA Hospital", "Brisbane", -27.497, 153.033],
      ["Princess Alexandra Hospital", "Brisbane", -27.497, 153.033],
      ["QUT Gardens Point", "Brisbane", -27.477, 153.028],
      ["QUT Kelvin Grove", "Brisbane", -27.451, 153.012],
      ["University of Queensland", "Brisbane", -27.497, 153.013],
      ["UQ St Lucia", "Brisbane", -27.497, 153.013],
      ["Griffith University Nathan", "Brisbane", -27.554, 153.052],
      ["Griffith University South Bank", "Brisbane", -27.48, 153.02],
      ["Brisbane Cruise Terminal", "Brisbane", -27.418, 153.168],
      ["Portside Wharf", "Brisbane", -27.418, 153.168],
      ["Eagle Street Pier", "Brisbane", -27.467, 153.03],
      ["Howard Smith Wharves", "Brisbane", -27.461, 153.035],
      ["Eat Street Northshore", "Brisbane", -27.43, 153.08],
      ["Westfield Chermside", "Brisbane", -27.387, 153.032],
      ["Westfield Carindale", "Brisbane", -27.505, 153.102],
      ["Westfield Garden City", "Brisbane", -27.555, 153.072],
      ["Indooroopilly Shopping Centre", "Brisbane", -27.498, 152.972],
      ["DFO Brisbane Airport", "Brisbane", -27.395, 153.108],
      ["Brisbane Entertainment Centre", "Brisbane", -27.45, 153.032],
      ["QPAC", "Brisbane", -27.478, 153.02],
      ["Queensland Museum", "Brisbane", -27.475, 153.018],
      ["GOMA", "Brisbane", -27.472, 153.018],
      ["State Library Queensland", "Brisbane", -27.472, 153.02],
      ["Brisbane City Hall", "Brisbane", -27.468, 153.024],
      ["Treasury Casino", "Brisbane", -27.472, 153.024],
      ["Queens Wharf", "Brisbane", -27.472, 153.022],
      ["Lone Pine Koala Sanctuary", "Brisbane", -27.534, 152.968],
      ["Mount Coot-tha Lookout", "Brisbane", -27.476, 152.958],
      ["Brisbane Botanic Gardens", "Brisbane", -27.476, 152.974],
      // Gold Coast Landmarks
      ["Gold Coast Airport", "Gold Coast", -28.165, 153.505],
      ["Coolangatta Airport", "Gold Coast", -28.165, 153.505],
      ["Dreamworld", "Gold Coast", -27.862, 153.312],
      ["Movie World", "Gold Coast", -27.907, 153.318],
      ["Sea World", "Gold Coast", -27.958, 153.425],
      ["Wet'n'Wild", "Gold Coast", -27.908, 153.318],
      ["WhiteWater World", "Gold Coast", -27.862, 153.31],
      ["Currumbin Wildlife Sanctuary", "Gold Coast", -28.138, 153.478],
      ["Pacific Fair", "Gold Coast", -28.038, 153.432],
      ["Robina Town Centre", "Gold Coast", -28.078, 153.388],
      ["Gold Coast University Hospital", "Gold Coast", -27.962, 153.382],
      ["Griffith University Gold Coast", "Gold Coast", -27.962, 153.38],
      ["Bond University", "Gold Coast", -28.073, 153.415],
      ["Star Casino Gold Coast", "Gold Coast", -28.028, 153.432],
      ["Gold Coast Convention Centre", "Gold Coast", -28.028, 153.428],
      ["Metricon Stadium", "Gold Coast", -28.005, 153.368],
      ["Harbour Town Gold Coast", "Gold Coast", -27.935, 153.368],
      ["Surfers Paradise Beach", "Gold Coast", -28.002, 153.432],
      ["SkyPoint Observation Deck", "Gold Coast", -28.002, 153.43],
      ["Springbrook National Park", "Gold Coast", -28.198, 153.268],
      // Moreton Bay Landmarks
      ["Redcliffe Hospital", "Moreton Bay", -27.23, 153.098],
      ["Westfield North Lakes", "Moreton Bay", -27.23, 153.028],
      ["Morayfield Shopping Centre", "Moreton Bay", -27.098, 152.952],
      // Ipswich Landmarks
      ["Ipswich Hospital", "Ipswich", -27.608, 152.758],
      ["USQ Ipswich", "Ipswich", -27.608, 152.76],
      ["Riverlink Shopping Centre", "Ipswich", -27.608, 152.758],
      ["Orion Springfield Central", "Ipswich", -27.668, 152.908],
      // Toowoomba Landmarks
      ["Toowoomba Hospital", "Toowoomba", -27.558, 151.948],
      ["USQ Toowoomba", "Toowoomba", -27.558, 151.948],
      ["Grand Central Toowoomba", "Toowoomba", -27.558, 151.958]
    ];
    LANDMARK_START_INDEX = SUBURB_DATA.findIndex(([name]) => name === "Sunshine Coast Airport");
    suburbMap = /* @__PURE__ */ new Map();
    for (let i = 0; i < SUBURB_DATA.length; i++) {
      const [name, lga, lat, lng] = SUBURB_DATA[i];
      const key = name.toLowerCase();
      const existing = suburbMap.get(key);
      const area = classifyLGA(lga);
      const isLandmark = LANDMARK_START_INDEX >= 0 && i >= LANDMARK_START_INDEX;
      if (!existing || area === "primary" && existing.area !== "primary") {
        suburbMap.set(key, { name, lga, area, lat, lng, isLandmark });
      }
    }
  }
});

// server/db.ts
var db_exports = {};
__export(db_exports, {
  calculatePrice: () => calculatePrice,
  clearGoogleReviewsCache: () => clearGoogleReviewsCache,
  createBooking: () => createBooking,
  createEnquiry: () => createEnquiry,
  createLandmark: () => createLandmark,
  createPasswordResetToken: () => createPasswordResetToken,
  createPublicHoliday: () => createPublicHoliday,
  createReview: () => createReview,
  createUserWithGoogle: () => createUserWithGoogle,
  createUserWithPassword: () => createUserWithPassword,
  deleteLandmark: () => deleteLandmark,
  deletePublicHoliday: () => deletePublicHoliday,
  deleteReview: () => deleteReview,
  getActiveLandmarks: () => getActiveLandmarks,
  getActivePublicHolidays: () => getActivePublicHolidays,
  getActiveVehicles: () => getActiveVehicles,
  getAllLandmarks: () => getAllLandmarks,
  getAllPricingSettings: () => getAllPricingSettings,
  getAllPublicHolidays: () => getAllPublicHolidays,
  getAppSetting: () => getAppSetting,
  getApprovedReviews: () => getApprovedReviews,
  getBookingById: () => getBookingById,
  getBookingByReference: () => getBookingByReference,
  getBookingByStripeSession: () => getBookingByStripeSession,
  getBookingStats: () => getBookingStats,
  getBookingsByDateRange: () => getBookingsByDateRange,
  getBookingsByEmail: () => getBookingsByEmail,
  getCachedGoogleReviews: () => getCachedGoogleReviews,
  getDb: () => getDb,
  getEnquiryById: () => getEnquiryById,
  getEnquiryStats: () => getEnquiryStats,
  getGoogleReviewsCacheAge: () => getGoogleReviewsCacheAge,
  getLandmarkById: () => getLandmarkById,
  getLandmarkStats: () => getLandmarkStats,
  getPasswordResetToken: () => getPasswordResetToken,
  getPricingSettingByKey: () => getPricingSettingByKey,
  getReviewByBookingId: () => getReviewByBookingId,
  getReviewById: () => getReviewById,
  getReviewStats: () => getReviewStats,
  getUserByEmail: () => getUserByEmail,
  getUserByGoogleId: () => getUserByGoogleId,
  getUserById: () => getUserById,
  getUserByOpenId: () => getUserByOpenId,
  getVehicleById: () => getVehicleById,
  insertGoogleReviews: () => insertGoogleReviews,
  invalidateUserResetTokens: () => invalidateUserResetTokens,
  isDatePublicHoliday: () => isDatePublicHoliday,
  linkGoogleAccount: () => linkGoogleAccount,
  listBookings: () => listBookings,
  listEnquiries: () => listEnquiries,
  listReviews: () => listReviews,
  markPasswordResetTokenUsed: () => markPasswordResetTokenUsed,
  setAppSetting: () => setAppSetting,
  toggleLandmarkActive: () => toggleLandmarkActive,
  updateBookingDetails: () => updateBookingDetails,
  updateBookingPaymentStatus: () => updateBookingPaymentStatus,
  updateBookingStatus: () => updateBookingStatus,
  updateBookingStripeSession: () => updateBookingStripeSession,
  updateEnquiryStatus: () => updateEnquiryStatus,
  updateLandmark: () => updateLandmark,
  updatePricingSetting: () => updatePricingSetting,
  updatePublicHoliday: () => updatePublicHoliday,
  updateReviewStatus: () => updateReviewStatus,
  updateUserLastSignedIn: () => updateUserLastSignedIn,
  updateUserPassword: () => updateUserPassword,
  upsertUser: () => upsertUser
});
import { eq, desc, and, or, like, sql, isNull } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      const url = new URL(process.env.DATABASE_URL);
      const host = url.hostname;
      const user = decodeURIComponent(url.username);
      const password = decodeURIComponent(url.password);
      const database = url.pathname.slice(1);
      const isLocalhost = host === "localhost" || host === "127.0.0.1";
      const poolConfig = {
        user,
        password,
        database,
        waitForConnections: true,
        connectionLimit: 10,
        connectTimeout: 1e4
      };
      if (isLocalhost) {
        poolConfig.socketPath = "/var/lib/mysql/mysql.sock";
      } else {
        poolConfig.host = host;
        poolConfig.port = parseInt(url.port || "3306");
      }
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
async function upsertUser(user) {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }
  try {
    const values = {
      openId: user.openId
    };
    const updateSet = {};
    const textFields = ["name", "email", "loginMethod"];
    const assignNullable = (field) => {
      const value = user[field];
      if (value === void 0) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };
    textFields.forEach(assignNullable);
    if (user.lastSignedIn !== void 0) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== void 0) {
      values.role = user.role;
      updateSet.role = user.role;
    }
    if (!values.lastSignedIn) {
      values.lastSignedIn = /* @__PURE__ */ new Date();
    }
    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = /* @__PURE__ */ new Date();
    }
    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}
async function getUserByOpenId(openId) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return void 0;
  }
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : void 0;
}
async function getUserById(id) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return void 0;
  }
  const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return result.length > 0 ? result[0] : void 0;
}
async function getUserByEmail(email) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return void 0;
  }
  const result = await db.select().from(users).where(eq(users.email, email)).limit(1);
  return result.length > 0 ? result[0] : void 0;
}
async function createUserWithPassword(data) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const openId = `local_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
  await db.insert(users).values({
    openId,
    name: data.name,
    email: data.email,
    passwordHash: data.passwordHash,
    loginMethod: "email",
    role: data.role ?? "user",
    lastSignedIn: /* @__PURE__ */ new Date()
  });
  return getUserByEmail(data.email);
}
async function updateUserLastSignedIn(userId) {
  const db = await getDb();
  if (!db) return;
  await db.update(users).set({ lastSignedIn: /* @__PURE__ */ new Date() }).where(eq(users.id, userId));
}
async function getUserByGoogleId(googleId) {
  const db = await getDb();
  if (!db) return void 0;
  const result = await db.select().from(users).where(eq(users.googleId, googleId)).limit(1);
  return result.length > 0 ? result[0] : void 0;
}
async function createUserWithGoogle(data) {
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
    lastSignedIn: /* @__PURE__ */ new Date()
  });
  return getUserByEmail(data.email);
}
async function linkGoogleAccount(userId, googleId) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(users).set({
    googleId,
    loginMethod: "google",
    lastSignedIn: /* @__PURE__ */ new Date()
  }).where(eq(users.id, userId));
  return getUserById(userId);
}
async function createPasswordResetToken(userId, token, expiresAt) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(passwordResetTokens).values({ userId, token, expiresAt });
}
async function getPasswordResetToken(token) {
  const db = await getDb();
  if (!db) return void 0;
  const result = await db.select().from(passwordResetTokens).where(eq(passwordResetTokens.token, token)).limit(1);
  return result.length > 0 ? result[0] : void 0;
}
async function markPasswordResetTokenUsed(tokenId) {
  const db = await getDb();
  if (!db) return;
  await db.update(passwordResetTokens).set({ usedAt: /* @__PURE__ */ new Date() }).where(eq(passwordResetTokens.id, tokenId));
}
async function updateUserPassword(userId, passwordHash) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(users).set({ passwordHash, loginMethod: "email" }).where(eq(users.id, userId));
}
async function invalidateUserResetTokens(userId) {
  const db = await getDb();
  if (!db) return;
  await db.update(passwordResetTokens).set({ usedAt: /* @__PURE__ */ new Date() }).where(and(eq(passwordResetTokens.userId, userId), isNull(passwordResetTokens.usedAt)));
}
async function getActiveVehicles() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(vehicles).where(eq(vehicles.isActive, 1));
}
async function getVehicleById(id) {
  const db = await getDb();
  if (!db) return void 0;
  const result = await db.select().from(vehicles).where(eq(vehicles.id, id)).limit(1);
  return result.length > 0 ? result[0] : void 0;
}
function generateReferenceNumber() {
  const prefix = "CB";
  const timestamp2 = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `${prefix}-${timestamp2}-${random}`.substring(0, 20);
}
async function createBooking(data) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const referenceNumber = generateReferenceNumber();
  await db.insert(bookings).values({
    ...data,
    referenceNumber,
    status: "pending"
  });
  const result = await db.select().from(bookings).where(eq(bookings.referenceNumber, referenceNumber)).limit(1);
  return result[0];
}
async function getBookingByReference(referenceNumber) {
  const db = await getDb();
  if (!db) return void 0;
  const result = await db.select().from(bookings).where(eq(bookings.referenceNumber, referenceNumber)).limit(1);
  return result.length > 0 ? result[0] : void 0;
}
async function getBookingById(id) {
  const db = await getDb();
  if (!db) return void 0;
  const result = await db.select().from(bookings).where(eq(bookings.id, id)).limit(1);
  return result.length > 0 ? result[0] : void 0;
}
async function listBookings(params) {
  const db = await getDb();
  if (!db) return { bookings: [], total: 0 };
  const conditions = [];
  if (params.status && params.status !== "all") {
    conditions.push(eq(bookings.status, params.status));
  }
  if (params.paymentStatus && params.paymentStatus !== "all") {
    conditions.push(eq(bookings.paymentStatus, params.paymentStatus));
  }
  if (params.search) {
    const searchTerm = `%${params.search}%`;
    conditions.push(
      or(
        like(bookings.clientName, searchTerm),
        like(bookings.clientEmail, searchTerm),
        like(bookings.clientPhone, searchTerm),
        like(bookings.referenceNumber, searchTerm),
        like(bookings.pickupAddress, searchTerm)
      )
    );
  }
  const whereClause = conditions.length > 0 ? and(...conditions) : void 0;
  const [items, countResult] = await Promise.all([
    db.select().from(bookings).where(whereClause).orderBy(desc(bookings.createdAt)).limit(params.limit ?? 20).offset(params.offset ?? 0),
    db.select({ count: sql`count(*)` }).from(bookings).where(whereClause)
  ]);
  return {
    bookings: items,
    total: countResult[0]?.count ?? 0
  };
}
async function updateBookingStatus(id, status, adminNotes) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const updateData = { status };
  if (adminNotes !== void 0) {
    updateData.adminNotes = adminNotes;
  }
  await db.update(bookings).set(updateData).where(eq(bookings.id, id));
  return getBookingById(id);
}
async function updateBookingPaymentStatus(id, paymentStatus, paymentNote) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const updateData = { paymentStatus };
  if (paymentNote !== void 0) {
    updateData.paymentNote = paymentNote;
  }
  await db.update(bookings).set(updateData).where(eq(bookings.id, id));
  return getBookingById(id);
}
async function updateBookingStripeSession(id, stripeSessionId) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(bookings).set({ stripeSessionId }).where(eq(bookings.id, id));
}
async function getBookingByStripeSession(stripeSessionId) {
  const db = await getDb();
  if (!db) return void 0;
  const result = await db.select().from(bookings).where(eq(bookings.stripeSessionId, stripeSessionId)).limit(1);
  return result.length > 0 ? result[0] : void 0;
}
async function updateBookingDetails(id, data) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const updateData = {};
  if (data.pickupAddress !== void 0) updateData.pickupAddress = data.pickupAddress;
  if (data.dropoffAddress !== void 0) updateData.dropoffAddress = data.dropoffAddress;
  if (data.pickupDate !== void 0) updateData.pickupDate = data.pickupDate;
  if (data.passengerCount !== void 0) updateData.passengerCount = data.passengerCount;
  if (data.specialRequests !== void 0) updateData.specialRequests = data.specialRequests;
  if (Object.keys(updateData).length === 0) throw new Error("No fields to update");
  await db.update(bookings).set(updateData).where(eq(bookings.id, id));
  return getBookingById(id);
}
async function getBookingsByDateRange(startMs, endMs) {
  const db = await getDb();
  if (!db) return [];
  return db.select({
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
    estimatedDuration: bookings.estimatedDuration
  }).from(bookings).where(
    and(
      sql`${bookings.pickupDate} >= ${startMs}`,
      sql`${bookings.pickupDate} < ${endMs}`
    )
  ).orderBy(bookings.pickupDate);
}
async function getBookingsByEmail(email) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(bookings).where(eq(bookings.clientEmail, email)).orderBy(desc(bookings.pickupDate));
}
async function getAllPricingSettings() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(pricingSettings);
}
async function getPricingSettingByKey(key) {
  const db = await getDb();
  if (!db) return void 0;
  const result = await db.select().from(pricingSettings).where(eq(pricingSettings.settingKey, key)).limit(1);
  return result.length > 0 ? result[0] : void 0;
}
async function updatePricingSetting(id, value, isActive) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const updateData = { settingValue: value };
  if (isActive !== void 0) {
    updateData.isActive = isActive;
  }
  await db.update(pricingSettings).set(updateData).where(eq(pricingSettings.id, id));
  return db.select().from(pricingSettings).where(eq(pricingSettings.id, id)).then((r) => r[0]);
}
async function getAllPublicHolidays() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(publicHolidays).orderBy(publicHolidays.date);
}
async function getActivePublicHolidays() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(publicHolidays).where(eq(publicHolidays.isActive, 1)).orderBy(publicHolidays.date);
}
async function createPublicHoliday(data) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(publicHolidays).values(data);
  const result = await db.select().from(publicHolidays).orderBy(desc(publicHolidays.id)).limit(1);
  return result[0];
}
async function updatePublicHoliday(id, data) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const updateData = {};
  if (data.name !== void 0) updateData.name = data.name;
  if (data.date !== void 0) updateData.date = data.date;
  if (data.isRecurring !== void 0) updateData.isRecurring = data.isRecurring;
  if (data.isActive !== void 0) updateData.isActive = data.isActive;
  if (Object.keys(updateData).length === 0) throw new Error("No fields to update");
  await db.update(publicHolidays).set(updateData).where(eq(publicHolidays.id, id));
  const result = await db.select().from(publicHolidays).where(eq(publicHolidays.id, id)).limit(1);
  return result[0];
}
async function deletePublicHoliday(id) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(publicHolidays).where(eq(publicHolidays.id, id));
}
function isDatePublicHoliday(dateStr, holidays) {
  const monthDay = dateStr.substring(5);
  return holidays.find((h) => {
    if (h.isActive !== 1) return false;
    if (h.isRecurring === 1) {
      return h.date.substring(5) === monthDay;
    }
    return h.date === dateStr;
  });
}
async function calculatePrice(params) {
  const settings = await getAllPricingSettings();
  const getVal = (key) => {
    const s = settings.find((s2) => s2.settingKey === key);
    return s ? parseFloat(s.settingValue) : 0;
  };
  const isActive = (key) => {
    const s = settings.find((s2) => s2.settingKey === key);
    return s ? s.isActive === 1 : false;
  };
  const serviceKeyMap = {
    airport_transfer: "base_airport_transfer",
    hourly_hire: "base_hourly_hire",
    point_to_point: "base_point_to_point",
    special_events: "base_special_events",
    freight: "base_freight"
  };
  let basePrice = getVal(serviceKeyMap[params.serviceType] || "base_point_to_point");
  if (params.serviceType === "hourly_hire" && params.hireHours && params.hireHours > 0) {
    basePrice = Math.round(basePrice * params.hireHours * 100) / 100;
  }
  const pricePerKm = isActive("rate_per_km") ? getVal("rate_per_km") : 0;
  const distanceCharge = Math.round(params.distanceKm * pricePerKm * 100) / 100;
  const isOutOfHours = params.pickupHour >= 19 || params.pickupHour < 7;
  const outOfHoursSurcharge = isOutOfHours && isActive("surcharge_out_of_hours") ? getVal("surcharge_out_of_hours") : 0;
  const outOfAreaSurcharge = params.isOutOfArea && isActive("surcharge_out_of_area") ? getVal("surcharge_out_of_area") : 0;
  const fuelLevyPercent = isActive("surcharge_fuel_levy") ? getVal("surcharge_fuel_levy") : 0;
  const fuelLevySurcharge = Math.round((basePrice + distanceCharge) * (fuelLevyPercent / 100) * 100) / 100;
  const additionalStopsCount = (params.additionalPickupCount ?? 0) + (params.additionalDropoffCount ?? 0);
  const perStopRate = isActive("surcharge_additional_stop") ? getVal("surcharge_additional_stop") : 0;
  const additionalStopsSurcharge = Math.round(additionalStopsCount * perStopRate * 100) / 100;
  let publicHolidaySurcharge = 0;
  let publicHolidayName = null;
  if (params.pickupDateStr && isActive("surcharge_public_holiday")) {
    const holidays = await getActivePublicHolidays();
    const matchedHoliday = isDatePublicHoliday(params.pickupDateStr, holidays);
    if (matchedHoliday) {
      publicHolidaySurcharge = getVal("surcharge_public_holiday");
      publicHolidayName = matchedHoliday.name;
    }
  }
  let petSurcharge = 0;
  if (params.isPetFriendly && params.numberOfPets && params.numberOfPets > 0 && isActive("surcharge_pet")) {
    petSurcharge = Math.round(getVal("surcharge_pet") * params.numberOfPets * 100) / 100;
  }
  let weightSurcharge = 0;
  if (params.serviceType === "freight" && params.freightWeight) {
    const weightKeyMap = {
      under_10kg: "freight_weight_under_10kg",
      "10_25kg": "freight_weight_10_25kg",
      "25_50kg": "freight_weight_25_50kg",
      "50_100kg": "freight_weight_50_100kg",
      "100_plus": "freight_weight_100_plus"
    };
    const weightKey = weightKeyMap[params.freightWeight];
    if (weightKey && isActive(weightKey)) {
      weightSurcharge = getVal(weightKey);
    }
  }
  let airportTollSurcharge = 0;
  const airportTollDetails = [];
  const pickupLower = (params.pickupSuburb || "").toLowerCase();
  const destLower = (params.destinationSuburb || "").toLowerCase();
  const isSctPickup = pickupLower.includes("sunshine coast airport") || pickupLower.includes("maroochydore airport") || pickupLower === "marcoola" || pickupLower.includes("mcyairport");
  const isSctDropoff = destLower.includes("sunshine coast airport") || destLower.includes("maroochydore airport") || destLower === "marcoola" || destLower.includes("mcyairport");
  const isBnePickup = pickupLower.includes("brisbane airport") || pickupLower.includes("brisbane domestic") || pickupLower.includes("brisbane international") || pickupLower === "brisbane airport" || pickupLower.includes("bneairport");
  const isBneDropoff = destLower.includes("brisbane airport") || destLower.includes("brisbane domestic") || destLower.includes("brisbane international") || destLower === "brisbane airport" || destLower.includes("bneairport");
  if (isSctPickup && isActive("toll_sct_entry")) {
    const amt = getVal("toll_sct_entry");
    if (amt > 0) {
      airportTollSurcharge += amt;
      airportTollDetails.push({ airport: "Sunshine Coast Airport", direction: "Entry", amount: amt });
    }
  }
  if (isSctDropoff && isActive("toll_sct_exit")) {
    const amt = getVal("toll_sct_exit");
    if (amt > 0) {
      airportTollSurcharge += amt;
      airportTollDetails.push({ airport: "Sunshine Coast Airport", direction: "Exit", amount: amt });
    }
  }
  if (isBnePickup && isActive("toll_bne_entry")) {
    const amt = getVal("toll_bne_entry");
    if (amt > 0) {
      airportTollSurcharge += amt;
      airportTollDetails.push({ airport: "Brisbane Airport", direction: "Entry", amount: amt });
    }
  }
  if (isBneDropoff && isActive("toll_bne_exit")) {
    const amt = getVal("toll_bne_exit");
    if (amt > 0) {
      airportTollSurcharge += amt;
      airportTollDetails.push({ airport: "Brisbane Airport", direction: "Exit", amount: amt });
    }
  }
  airportTollSurcharge = Math.round(airportTollSurcharge * 100) / 100;
  let roadTollSurcharge = 0;
  const roadTollDetails = [];
  const hasTollRoads = !params.preferTollFree;
  const pickupInfo = lookupSuburb(params.pickupSuburb || "");
  const destInfo = lookupSuburb(params.destinationSuburb || "");
  const pickupLGA = pickupInfo?.lga?.toLowerCase() || "";
  const destLGA = destInfo?.lga?.toLowerCase() || "";
  const TOLL_CORRIDORS = [
    {
      key: "toll_gateway_motorway",
      label: "Gateway Motorway",
      // Gateway connects north Brisbane / Sunshine Coast / Moreton Bay to south Brisbane / Gold Coast / Logan
      pickupPatterns: ["caboolture", "morayfield", "north lakes", "redcliffe", "bribie", "deception bay", "burpengary", "narangba", "petrie"],
      pickupLGAs: ["sunshine coast", "noosa", "moreton bay"],
      destPatterns: [],
      destLGAs: ["gold coast", "logan", "ipswich", "brisbane", "redland", "scenic rim"],
      bidirectional: true
    },
    {
      key: "toll_logan_motorway",
      label: "Logan Motorway",
      // Logan connects Ipswich/Springfield to Gateway/Gold Coast corridor
      pickupPatterns: ["ipswich", "springfield", "goodna", "redbank", "forest lake", "inala", "richlands"],
      destPatterns: ["logan", "beenleigh", "springwood", "browns plains", "gold coast", "coomera", "ormeau", "helensvale"],
      bidirectional: true
    },
    {
      key: "toll_clem7",
      label: "Clem7 Tunnel",
      // Clem7 connects Woolloongabba/south to Bowen Hills/north through CBD
      pickupPatterns: ["woolloongabba", "south brisbane", "kangaroo point", "east brisbane", "coorparoo", "greenslopes", "stones corner"],
      destPatterns: ["bowen hills", "fortitude valley", "newstead", "teneriffe", "new farm", "herston", "kelvin grove", "lutwyche"],
      bidirectional: true
    },
    {
      key: "toll_go_between_bridge",
      label: "Go Between Bridge",
      // Connects Hale St (Milton) to south bank area
      pickupPatterns: ["milton", "paddington", "auchenflower", "toowong", "bardon", "ashgrove"],
      destPatterns: ["south brisbane", "west end", "south bank", "woolloongabba", "highgate hill"],
      bidirectional: true
    },
    {
      key: "toll_legacy_way",
      label: "Legacy Way",
      // Connects Toowong/western suburbs to Kelvin Grove/inner north
      pickupPatterns: ["toowong", "indooroopilly", "st lucia", "taringa", "chapel hill", "kenmore", "fig tree pocket", "brookfield"],
      destPatterns: ["kelvin grove", "herston", "bowen hills", "fortitude valley", "newstead", "windsor", "lutwyche"],
      bidirectional: true
    },
    {
      key: "toll_airportlink_m7",
      label: "AirportlinkM7",
      // Connects Bowen Hills / inner city to airport / north side
      pickupPatterns: ["bowen hills", "fortitude valley", "spring hill", "brisbane cbd", "brisbane city", "south brisbane", "west end", "woolloongabba"],
      destPatterns: ["brisbane airport", "brisbane domestic", "brisbane international", "kedron", "toombul", "nundah", "banyo", "nudgee", "eagle farm", "hendra"],
      bidirectional: true
    },
    {
      key: "toll_toowoomba_bypass",
      label: "Toowoomba Bypass",
      // Toowoomba Second Range Crossing
      pickupPatterns: ["toowoomba", "highfields", "crows nest", "oakey", "dalby", "warwick"],
      destPatterns: ["toowoomba", "highfields", "gatton", "laidley", "ipswich", "brisbane", "sunshine coast"],
      bidirectional: false
      // only applies when crossing the range
    }
  ];
  for (const corridor of TOLL_CORRIDORS) {
    if (!hasTollRoads) break;
    if (!isActive(corridor.key)) continue;
    const amt = getVal(corridor.key);
    if (amt <= 0) continue;
    const pickupMatchesOriginByName = corridor.pickupPatterns.some((p) => pickupLower.includes(p));
    const pickupMatchesOriginByLGA = corridor.pickupLGAs?.some((lga) => pickupLGA === lga) ?? false;
    const pickupMatchesOrigin = pickupMatchesOriginByName || pickupMatchesOriginByLGA;
    const destMatchesDestByName = corridor.destPatterns.some((p) => destLower.includes(p));
    const destMatchesDestByLGA = corridor.destLGAs?.some((lga) => destLGA === lga) ?? false;
    const destMatchesDest = destMatchesDestByName || destMatchesDestByLGA;
    const forwardMatch = pickupMatchesOrigin && destMatchesDest;
    let reverseMatch = false;
    if (corridor.bidirectional) {
      const pickupMatchesDestByName = corridor.destPatterns.some((p) => pickupLower.includes(p));
      const pickupMatchesDestByLGA = corridor.destLGAs?.some((lga) => pickupLGA === lga) ?? false;
      const destMatchesOriginByName = corridor.pickupPatterns.some((p) => destLower.includes(p));
      const destMatchesOriginByLGA = corridor.pickupLGAs?.some((lga) => destLGA === lga) ?? false;
      reverseMatch = (pickupMatchesDestByName || pickupMatchesDestByLGA) && (destMatchesOriginByName || destMatchesOriginByLGA);
    }
    if (forwardMatch || reverseMatch) {
      roadTollSurcharge += amt;
      roadTollDetails.push({ road: corridor.label, amount: amt });
    }
  }
  roadTollSurcharge = Math.round(roadTollSurcharge * 100) / 100;
  const supportVanPrice = params.needsSupportVan ? getVal("rate_support_van") : 0;
  const subtotal = Math.round((basePrice + distanceCharge + outOfHoursSurcharge + outOfAreaSurcharge + fuelLevySurcharge + additionalStopsSurcharge + publicHolidaySurcharge + petSurcharge + weightSurcharge + airportTollSurcharge + roadTollSurcharge + supportVanPrice) * 100) / 100;
  const squareSurcharge = params.paymentMethod === "square_postpay" ? Math.round(subtotal * 0.02 * 100) / 100 : 0;
  const rawTotal = Math.round((subtotal + squareSurcharge) * 100) / 100;
  const totalPrice = Math.floor(rawTotal / 5) * 5;
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
    totalPrice
  };
}
async function createEnquiry(data) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(enquiries).values({ ...data, status: "new" });
  const result = await db.select().from(enquiries).orderBy(desc(enquiries.id)).limit(1);
  return result[0];
}
async function listEnquiries(params) {
  const db = await getDb();
  if (!db) return { enquiries: [], total: 0 };
  const conditions = [];
  if (params.status && params.status !== "all") {
    conditions.push(eq(enquiries.status, params.status));
  }
  if (params.search) {
    const searchTerm = `%${params.search}%`;
    conditions.push(
      or(
        like(enquiries.name, searchTerm),
        like(enquiries.email, searchTerm),
        like(enquiries.subject, searchTerm)
      )
    );
  }
  const whereClause = conditions.length > 0 ? and(...conditions) : void 0;
  const [items, countResult] = await Promise.all([
    db.select().from(enquiries).where(whereClause).orderBy(desc(enquiries.createdAt)).limit(params.limit ?? 20).offset(params.offset ?? 0),
    db.select({ count: sql`count(*)` }).from(enquiries).where(whereClause)
  ]);
  return { enquiries: items, total: countResult[0]?.count ?? 0 };
}
async function getEnquiryById(id) {
  const db = await getDb();
  if (!db) return void 0;
  const result = await db.select().from(enquiries).where(eq(enquiries.id, id)).limit(1);
  return result.length > 0 ? result[0] : void 0;
}
async function updateEnquiryStatus(id, status, adminNotes) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const updateData = { status };
  if (adminNotes !== void 0) updateData.adminNotes = adminNotes;
  await db.update(enquiries).set(updateData).where(eq(enquiries.id, id));
  return getEnquiryById(id);
}
async function getEnquiryStats() {
  const db = await getDb();
  if (!db) return { total: 0, new: 0, read: 0, replied: 0, archived: 0 };
  const result = await db.select({
    total: sql`count(*)`,
    newCount: sql`sum(case when status = 'new' then 1 else 0 end)`,
    readCount: sql`sum(case when status = 'read' then 1 else 0 end)`,
    repliedCount: sql`sum(case when status = 'replied' then 1 else 0 end)`,
    archivedCount: sql`sum(case when status = 'archived' then 1 else 0 end)`
  }).from(enquiries);
  const row = result[0];
  return {
    total: row?.total ?? 0,
    new: row?.newCount ?? 0,
    read: row?.readCount ?? 0,
    replied: row?.repliedCount ?? 0,
    archived: row?.archivedCount ?? 0
  };
}
async function getBookingStats() {
  const db = await getDb();
  if (!db) return {
    total: 0,
    pending: 0,
    confirmed: 0,
    completed: 0,
    cancelled: 0,
    totalRevenue: "0",
    unpaidAmount: "0",
    refundedAmount: "0",
    revenueByMethod: { stripe: "0", square: "0", cash: "0" },
    unpaidByMethod: { stripe: "0", square: "0", cash: "0" },
    refundedByMethod: { stripe: "0", square: "0", cash: "0" }
  };
  const result = await db.select({
    total: sql`count(*)`,
    pending: sql`sum(case when status = 'pending' then 1 else 0 end)`,
    confirmed: sql`sum(case when status = 'confirmed' then 1 else 0 end)`,
    completed: sql`sum(case when status = 'completed' then 1 else 0 end)`,
    cancelled: sql`sum(case when status = 'cancelled' then 1 else 0 end)`,
    totalRevenue: sql`coalesce(sum(case when paymentStatus = 'paid' then totalPrice else 0 end), 0)`,
    unpaidAmount: sql`coalesce(sum(case when paymentStatus = 'unpaid' and status != 'cancelled' then totalPrice else 0 end), 0)`,
    refundedAmount: sql`coalesce(sum(case when paymentStatus = 'refunded' then totalPrice else 0 end), 0)`,
    // Revenue by method
    revenueStripe: sql`coalesce(sum(case when paymentStatus = 'paid' and paymentMethod = 'stripe_prepay' then totalPrice else 0 end), 0)`,
    revenueSquare: sql`coalesce(sum(case when paymentStatus = 'paid' and paymentMethod = 'square_postpay' then totalPrice else 0 end), 0)`,
    revenueCash: sql`coalesce(sum(case when paymentStatus = 'paid' and paymentMethod = 'cash_postpay' then totalPrice else 0 end), 0)`,
    // Unpaid by method
    unpaidStripe: sql`coalesce(sum(case when paymentStatus = 'unpaid' and status != 'cancelled' and paymentMethod = 'stripe_prepay' then totalPrice else 0 end), 0)`,
    unpaidSquare: sql`coalesce(sum(case when paymentStatus = 'unpaid' and status != 'cancelled' and paymentMethod = 'square_postpay' then totalPrice else 0 end), 0)`,
    unpaidCash: sql`coalesce(sum(case when paymentStatus = 'unpaid' and status != 'cancelled' and paymentMethod = 'cash_postpay' then totalPrice else 0 end), 0)`,
    // Refunded by method
    refundedStripe: sql`coalesce(sum(case when paymentStatus = 'refunded' and paymentMethod = 'stripe_prepay' then totalPrice else 0 end), 0)`,
    refundedSquare: sql`coalesce(sum(case when paymentStatus = 'refunded' and paymentMethod = 'square_postpay' then totalPrice else 0 end), 0)`,
    refundedCash: sql`coalesce(sum(case when paymentStatus = 'refunded' and paymentMethod = 'cash_postpay' then totalPrice else 0 end), 0)`
  }).from(bookings);
  const row = result[0];
  return {
    total: row?.total ?? 0,
    pending: row?.pending ?? 0,
    confirmed: row?.confirmed ?? 0,
    completed: row?.completed ?? 0,
    cancelled: row?.cancelled ?? 0,
    totalRevenue: String(row?.totalRevenue ?? "0"),
    unpaidAmount: String(row?.unpaidAmount ?? "0"),
    refundedAmount: String(row?.refundedAmount ?? "0"),
    revenueByMethod: {
      stripe: String(row?.revenueStripe ?? "0"),
      square: String(row?.revenueSquare ?? "0"),
      cash: String(row?.revenueCash ?? "0")
    },
    unpaidByMethod: {
      stripe: String(row?.unpaidStripe ?? "0"),
      square: String(row?.unpaidSquare ?? "0"),
      cash: String(row?.unpaidCash ?? "0")
    },
    refundedByMethod: {
      stripe: String(row?.refundedStripe ?? "0"),
      square: String(row?.refundedSquare ?? "0"),
      cash: String(row?.refundedCash ?? "0")
    }
  };
}
async function createReview(data) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(reviews).values({ ...data, status: "pending" });
  const result = await db.select().from(reviews).orderBy(desc(reviews.id)).limit(1);
  return result[0];
}
async function getApprovedReviews() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(reviews).where(eq(reviews.status, "approved")).orderBy(desc(reviews.createdAt));
}
async function getReviewStats() {
  const db = await getDb();
  if (!db) return { total: 0, pending: 0, approved: 0, rejected: 0, averageRating: 0 };
  const result = await db.select({
    total: sql`count(*)`,
    pendingCount: sql`sum(case when status = 'pending' then 1 else 0 end)`,
    approvedCount: sql`sum(case when status = 'approved' then 1 else 0 end)`,
    rejectedCount: sql`sum(case when status = 'rejected' then 1 else 0 end)`,
    avgRating: sql`coalesce(avg(case when status = 'approved' then rating else null end), 0)`
  }).from(reviews);
  const row = result[0];
  return {
    total: row?.total ?? 0,
    pending: row?.pendingCount ?? 0,
    approved: row?.approvedCount ?? 0,
    rejected: row?.rejectedCount ?? 0,
    averageRating: Math.round((row?.avgRating ?? 0) * 10) / 10
  };
}
async function listReviews(params) {
  const db = await getDb();
  if (!db) return { reviews: [], total: 0 };
  const conditions = [];
  if (params.status && params.status !== "all") {
    conditions.push(eq(reviews.status, params.status));
  }
  const whereClause = conditions.length > 0 ? and(...conditions) : void 0;
  const [items, countResult] = await Promise.all([
    db.select().from(reviews).where(whereClause).orderBy(desc(reviews.createdAt)).limit(params.limit ?? 20).offset(params.offset ?? 0),
    db.select({ count: sql`count(*)` }).from(reviews).where(whereClause)
  ]);
  return { reviews: items, total: countResult[0]?.count ?? 0 };
}
async function getReviewById(id) {
  const db = await getDb();
  if (!db) return void 0;
  const result = await db.select().from(reviews).where(eq(reviews.id, id)).limit(1);
  return result.length > 0 ? result[0] : void 0;
}
async function updateReviewStatus(id, status, adminNotes) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const updateData = { status };
  if (adminNotes !== void 0) updateData.adminNotes = adminNotes;
  await db.update(reviews).set(updateData).where(eq(reviews.id, id));
  return getReviewById(id);
}
async function deleteReview(id) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(reviews).where(eq(reviews.id, id));
}
async function getReviewByBookingId(bookingId) {
  const db = await getDb();
  if (!db) return void 0;
  const result = await db.select().from(reviews).where(eq(reviews.bookingId, bookingId)).limit(1);
  return result.length > 0 ? result[0] : void 0;
}
async function getCachedGoogleReviews(placeId) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(googleReviewsCache).where(eq(googleReviewsCache.placeId, placeId)).orderBy(desc(googleReviewsCache.rating));
}
async function getGoogleReviewsCacheAge(placeId) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select({ fetchedAt: googleReviewsCache.fetchedAt }).from(googleReviewsCache).where(eq(googleReviewsCache.placeId, placeId)).limit(1);
  if (result.length === 0) return null;
  return Date.now() - result[0].fetchedAt.getTime();
}
async function clearGoogleReviewsCache(placeId) {
  const db = await getDb();
  if (!db) return;
  await db.delete(googleReviewsCache).where(eq(googleReviewsCache.placeId, placeId));
}
async function insertGoogleReviews(reviews2) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  if (reviews2.length === 0) return;
  await db.insert(googleReviewsCache).values(reviews2);
}
async function getAppSetting(key) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(appSettings).where(eq(appSettings.settingKey, key)).limit(1);
  return result.length > 0 ? result[0].settingValue ?? null : null;
}
async function setAppSetting(key, value) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(appSettings).values({ settingKey: key, settingValue: value }).onDuplicateKeyUpdate({ set: { settingValue: value } });
}
async function getActiveLandmarks() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(landmarks).where(eq(landmarks.isActive, 1)).orderBy(landmarks.name);
}
async function getAllLandmarks() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(landmarks).orderBy(landmarks.name);
}
async function getLandmarkById(id) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(landmarks).where(eq(landmarks.id, id)).limit(1);
  return result.length > 0 ? result[0] : null;
}
async function createLandmark(data) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(landmarks).values(data);
  const result = await db.select().from(landmarks).orderBy(desc(landmarks.id)).limit(1);
  return result.length > 0 ? result[0] : null;
}
async function updateLandmark(id, data) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(landmarks).set(data).where(eq(landmarks.id, id));
  const result = await db.select().from(landmarks).where(eq(landmarks.id, id)).limit(1);
  return result.length > 0 ? result[0] : null;
}
async function toggleLandmarkActive(id) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const existing = await db.select().from(landmarks).where(eq(landmarks.id, id)).limit(1);
  if (existing.length === 0) return null;
  const newActive = existing[0].isActive === 1 ? 0 : 1;
  await db.update(landmarks).set({ isActive: newActive }).where(eq(landmarks.id, id));
  const result = await db.select().from(landmarks).where(eq(landmarks.id, id)).limit(1);
  return result.length > 0 ? result[0] : null;
}
async function deleteLandmark(id) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(landmarks).where(eq(landmarks.id, id));
}
async function getLandmarkStats() {
  const db = await getDb();
  if (!db) return { total: 0, active: 0, byCategory: [] };
  const [totalResult] = await db.select({ count: sql`count(*)` }).from(landmarks);
  const [activeResult] = await db.select({ count: sql`count(*)` }).from(landmarks).where(eq(landmarks.isActive, 1));
  const byCategory = await db.select({ category: landmarks.category, count: sql`count(*)` }).from(landmarks).groupBy(landmarks.category).orderBy(desc(sql`count(*)`));
  return {
    total: totalResult?.count ?? 0,
    active: activeResult?.count ?? 0,
    byCategory: byCategory.map((r) => ({ category: r.category, count: r.count }))
  };
}
var _db, _pool;
var init_db = __esm({
  "server/db.ts"() {
    "use strict";
    init_schema();
    init_suburbs();
    init_schema();
    init_schema();
    _db = null;
    _pool = null;
  }
});

// server/_core/index.ts
import "dotenv/config";
import express2 from "express";
import { createServer } from "http";
import net from "net";
import { createExpressMiddleware } from "@trpc/server/adapters/express";

// server/_core/auth-routes.ts
function registerAuthRoutes(app) {
  app.get("/api/auth/health", (_req, res) => {
    res.json({ ok: true, method: "standalone" });
  });
  app.get("/api/oauth/callback", (_req, res) => {
    res.redirect(302, "/login");
  });
}

// shared/const.ts
var COOKIE_NAME = "app_session_id";
var ONE_YEAR_MS = 1e3 * 60 * 60 * 24 * 365;
var SESSION_SHORT_MS = 1e3 * 60 * 60 * 24;
var SESSION_LONG_MS = 1e3 * 60 * 60 * 24 * 365;
var UNAUTHED_ERR_MSG = "Please login (10001)";
var NOT_ADMIN_ERR_MSG = "You do not have required permission (10002)";

// server/_core/cookies.ts
function isSecureRequest(req) {
  if (req.protocol === "https") return true;
  const forwardedProto = req.headers["x-forwarded-proto"];
  if (!forwardedProto) return false;
  const protoList = Array.isArray(forwardedProto) ? forwardedProto : forwardedProto.split(",");
  return protoList.some((proto) => proto.trim().toLowerCase() === "https");
}
function getSessionCookieOptions(req) {
  return {
    httpOnly: true,
    path: "/",
    sameSite: "none",
    secure: isSecureRequest(req)
  };
}

// server/_core/systemRouter.ts
import { z } from "zod";

// server/_core/notification.ts
init_env();
import { TRPCError } from "@trpc/server";
import { Resend } from "resend";
var TITLE_MAX_LENGTH = 1200;
var CONTENT_MAX_LENGTH = 2e4;
var trimValue = (value) => value.trim();
var isNonEmptyString = (value) => typeof value === "string" && value.trim().length > 0;
var validatePayload = (input) => {
  if (!isNonEmptyString(input.title)) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Notification title is required."
    });
  }
  if (!isNonEmptyString(input.content)) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Notification content is required."
    });
  }
  const title = trimValue(input.title);
  const content = trimValue(input.content);
  if (title.length > TITLE_MAX_LENGTH) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: `Notification title must be at most ${TITLE_MAX_LENGTH} characters.`
    });
  }
  if (content.length > CONTENT_MAX_LENGTH) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: `Notification content must be at most ${CONTENT_MAX_LENGTH} characters.`
    });
  }
  return { title, content };
};
async function notifyOwner(payload) {
  const { title, content } = validatePayload(payload);
  if (!ENV.resendApiKey) {
    console.warn("[Notification] RESEND_API_KEY is not configured, skipping notification");
    return false;
  }
  if (!ENV.adminEmail) {
    console.warn("[Notification] ADMIN_EMAIL is not configured, skipping notification");
    return false;
  }
  try {
    const resend = new Resend(ENV.resendApiKey);
    const { error } = await resend.emails.send({
      from: ENV.resendFromEmail,
      to: ENV.adminEmail,
      subject: `[All Ways Transfers] ${title}`,
      text: content,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: #1a1a1a; padding: 20px; text-align: center;">
            <img src="https://d2xsxph8kpxj0f.cloudfront.net/310519663486426022/2tTLZKCNzV8jFwxBsLMjpn/logo-white_476df209.png" alt="All Ways Transfers" style="height: 50px;" />
          </div>
          <div style="padding: 20px; background: #f9f9f9;">
            <h2 style="color: #333; margin-top: 0;">${title}</h2>
            <pre style="white-space: pre-wrap; font-family: Arial, sans-serif; color: #555; line-height: 1.6;">${content}</pre>
          </div>
          <div style="padding: 15px; text-align: center; color: #999; font-size: 12px;">
            This is an automated notification from All Ways Transfers.
          </div>
        </div>
      `
    });
    if (error) {
      console.warn("[Notification] Failed to send email:", error);
      return false;
    }
    return true;
  } catch (error) {
    console.warn("[Notification] Error sending notification email:", error);
    return false;
  }
}

// server/_core/trpc.ts
import { initTRPC, TRPCError as TRPCError2 } from "@trpc/server";
import superjson from "superjson";
var t = initTRPC.context().create({
  transformer: superjson
});
var router = t.router;
var publicProcedure = t.procedure;
var requireUser = t.middleware(async (opts) => {
  const { ctx, next } = opts;
  if (!ctx.user) {
    throw new TRPCError2({ code: "UNAUTHORIZED", message: UNAUTHED_ERR_MSG });
  }
  return next({
    ctx: {
      ...ctx,
      user: ctx.user
    }
  });
});
var protectedProcedure = t.procedure.use(requireUser);
var adminProcedure = t.procedure.use(
  t.middleware(async (opts) => {
    const { ctx, next } = opts;
    if (!ctx.user || ctx.user.role !== "admin") {
      throw new TRPCError2({ code: "FORBIDDEN", message: NOT_ADMIN_ERR_MSG });
    }
    return next({
      ctx: {
        ...ctx,
        user: ctx.user
      }
    });
  })
);

// server/_core/systemRouter.ts
var systemRouter = router({
  health: publicProcedure.input(
    z.object({
      timestamp: z.number().min(0, "timestamp cannot be negative")
    })
  ).query(() => ({
    ok: true
  })),
  notifyOwner: adminProcedure.input(
    z.object({
      title: z.string().min(1, "title is required"),
      content: z.string().min(1, "content is required")
    })
  ).mutation(async ({ input }) => {
    const delivered = await notifyOwner(input);
    return {
      success: delivered
    };
  })
});

// shared/_core/errors.ts
var HttpError = class extends Error {
  constructor(statusCode, message) {
    super(message);
    this.statusCode = statusCode;
    this.name = "HttpError";
  }
};
var ForbiddenError = (msg) => new HttpError(403, msg);

// server/_core/standalone-auth.ts
init_db();
init_env();
import bcrypt from "bcryptjs";
import { parse as parseCookieHeader } from "cookie";
import { SignJWT, jwtVerify } from "jose";
var BCRYPT_ROUNDS = 12;
async function hashPassword(password) {
  return bcrypt.hash(password, BCRYPT_ROUNDS);
}
async function verifyPassword(password, hash) {
  return bcrypt.compare(password, hash);
}
function getSessionSecret() {
  const secret = ENV.cookieSecret;
  if (!secret) {
    throw new Error("JWT_SECRET is not configured");
  }
  return new TextEncoder().encode(secret);
}
async function createSessionToken(user, options = {}) {
  const issuedAt = Date.now();
  const expiresInMs = options.expiresInMs ?? SESSION_SHORT_MS;
  const expirationSeconds = Math.floor((issuedAt + expiresInMs) / 1e3);
  const secretKey = getSessionSecret();
  return new SignJWT({
    userId: user.id,
    email: user.email,
    role: user.role
  }).setProtectedHeader({ alg: "HS256", typ: "JWT" }).setExpirationTime(expirationSeconds).sign(secretKey);
}
async function verifySession(cookieValue) {
  if (!cookieValue) {
    return null;
  }
  try {
    const secretKey = getSessionSecret();
    const { payload } = await jwtVerify(cookieValue, secretKey, {
      algorithms: ["HS256"]
    });
    const { userId, email, role } = payload;
    if (typeof userId !== "number" || typeof email !== "string" || typeof role !== "string") {
      console.warn("[Auth] Session payload missing required fields");
      return null;
    }
    return { userId, email, role };
  } catch (error) {
    console.warn("[Auth] Session verification failed", String(error));
    return null;
  }
}
function parseCookies(cookieHeader) {
  if (!cookieHeader) {
    return /* @__PURE__ */ new Map();
  }
  const parsed = parseCookieHeader(cookieHeader);
  return new Map(Object.entries(parsed));
}
async function authenticateRequest(req) {
  const cookies = parseCookies(req.headers.cookie);
  const sessionCookie = cookies.get(COOKIE_NAME);
  const session = await verifySession(sessionCookie);
  if (!session) {
    throw ForbiddenError("Invalid session cookie");
  }
  const user = await getUserById(session.userId);
  if (!user) {
    throw ForbiddenError("User not found");
  }
  await updateUserLastSignedIn(user.id);
  return user;
}

// server/routers.ts
init_db();
import { z as z2 } from "zod";

// server/_core/map.ts
init_env();
function getMapsConfig() {
  const apiKey = ENV.googleMapsApiKey;
  if (!apiKey) {
    throw new Error(
      "Google Maps API credentials missing: set GOOGLE_MAPS_API_KEY in your environment"
    );
  }
  return {
    baseUrl: "https://maps.googleapis.com",
    apiKey
  };
}
async function makeRequest(endpoint, params = {}, options = {}) {
  const { baseUrl, apiKey } = getMapsConfig();
  const url = new URL(`${baseUrl}${endpoint}`);
  url.searchParams.append("key", apiKey);
  Object.entries(params).forEach(([key, value]) => {
    if (value !== void 0 && value !== null) {
      url.searchParams.append(key, String(value));
    }
  });
  const response = await fetch(url.toString(), {
    method: options.method || "GET",
    headers: {
      "Content-Type": "application/json"
    },
    body: options.body ? JSON.stringify(options.body) : void 0
  });
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `Google Maps API request failed (${response.status} ${response.statusText}): ${errorText}`
    );
  }
  return await response.json();
}

// server/stripe.ts
import Stripe from "stripe";
var _stripe = null;
function getStripe() {
  if (!_stripe) {
    const secretKey = process.env.STRIPE_SECRET_KEY;
    if (!secretKey) {
      throw new Error("STRIPE_SECRET_KEY is not configured");
    }
    _stripe = new Stripe(secretKey);
  }
  return _stripe;
}
async function createCheckoutSession(params) {
  const stripe = getStripe();
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ["card"],
    mode: "payment",
    customer_email: params.customerEmail,
    client_reference_id: params.bookingId.toString(),
    metadata: {
      booking_id: params.bookingId.toString(),
      booking_reference: params.bookingReference,
      customer_name: params.customerName,
      customer_email: params.customerEmail
    },
    line_items: [
      {
        price_data: {
          currency: "aud",
          product_data: {
            name: `All Ways Transfers - ${params.serviceDescription}`,
            description: `Booking Reference: ${params.bookingReference}`
          },
          unit_amount: Math.round(params.amount * 100)
          // Convert to cents
        },
        quantity: 1
      }
    ],
    allow_promotion_codes: true,
    // Session expires 30 minutes from now
    expires_at: Math.floor(Date.now() / 1e3) + 1800,
    success_url: `${params.origin}/confirmation/${params.bookingReference}?payment=success`,
    cancel_url: `${params.origin}/confirmation/${params.bookingReference}?payment=cancelled`
  });
  return { url: session.url, sessionId: session.id };
}
function constructWebhookEvent(payload, signature) {
  const stripe = getStripe();
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    throw new Error("STRIPE_WEBHOOK_SECRET is not configured");
  }
  return stripe.webhooks.constructEvent(payload, signature, webhookSecret);
}

// server/email.ts
init_env();
import { Resend as Resend2 } from "resend";
var _resend = null;
function getResend() {
  if (!_resend) {
    if (!ENV.resendApiKey) {
      throw new Error("RESEND_API_KEY is not configured");
    }
    _resend = new Resend2(ENV.resendApiKey);
  }
  return _resend;
}
var LOGO_URL = "https://d2xsxph8kpxj0f.cloudfront.net/310519663486426022/2tTLZKCNzV8jFwxBsLMjpn/logo-white_476df209.png";
function formatDate(timestamp2) {
  return new Date(timestamp2).toLocaleDateString("en-AU", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "Australia/Brisbane"
  });
}
function formatTime(timestamp2) {
  return new Date(timestamp2).toLocaleTimeString("en-AU", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "Australia/Brisbane"
  });
}
function formatServiceType(serviceType) {
  return serviceType.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}
function formatPaymentMethod(method) {
  const labels = {
    stripe_prepay: "Pre-pay by Credit Card",
    square_postpay: "Pay Driver by Card",
    cash_postpay: "Pay Driver by Cash"
  };
  return labels[method] ?? method;
}
function formatPaymentStatus(status) {
  const labels = {
    paid: "Paid",
    unpaid: "Unpaid",
    refunded: "Refunded"
  };
  return labels[status] ?? status;
}
function wrapInTemplate(bodyContent) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>All Ways Transfers</title>
</head>
<body style="margin:0;padding:0;background-color:#0a0a0a;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;color:#e5e5e5;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#0a0a0a;">
    <tr>
      <td align="center" style="padding:24px 16px;">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">
          <!-- Header -->
          <tr>
            <td align="center" style="padding:24px 0 16px;">
              <img src="${LOGO_URL}" alt="All Ways Transfers" width="180" style="display:block;max-width:180px;height:auto;" />
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="background-color:#1a1a1a;border-radius:12px;padding:32px 28px;">
              ${bodyContent}
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td align="center" style="padding:24px 0 8px;font-size:13px;color:#737373;">
              <p style="margin:0 0 4px;">All Ways Transfers</p>
              <p style="margin:0 0 4px;">Phone: 0466 544 068</p>
              <p style="margin:0 0 4px;">Email: bookings@allwaystransfers.com.au</p>
              <p style="margin:0;color:#525252;font-size:11px;">ABN 18 715 944 056</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}
function buildAdditionalStopsHtml(data) {
  let html = "";
  if ((data.additionalPickupCount ?? 0) > 0) {
    html += `<tr>
        <td style="padding:8px 0;border-bottom:1px solid #333;">
          <span style="color:#a3a3a3;font-size:13px;">Additional Pickups (${data.additionalPickupCount})</span><br/>
          <span style="color:#e5e5e5;font-size:15px;">${(data.additionalPickupAddresses ?? []).join("<br/>")}</span>
        </td>
      </tr>`;
  }
  if ((data.additionalDropoffCount ?? 0) > 0) {
    html += `<tr>
        <td style="padding:8px 0;border-bottom:1px solid #333;">
          <span style="color:#a3a3a3;font-size:13px;">Additional Drop-offs (${data.additionalDropoffCount})</span><br/>
          <span style="color:#e5e5e5;font-size:15px;">${(data.additionalDropoffAddresses ?? []).join("<br/>")}</span>
        </td>
      </tr>`;
  }
  return html;
}
function buildPublicHolidayHtml(data) {
  if (!data.publicHolidayName) return "";
  const surcharge = (data.publicHolidaySurcharge ?? 0) > 0 ? ` \u2014 $${data.publicHolidaySurcharge.toFixed(2)} surcharge` : "";
  return `<tr>
      <td style="padding:8px 0;border-bottom:1px solid #333;">
        <span style="color:#a3a3a3;font-size:13px;">Public Holiday</span><br/>
        <span style="color:#d4a843;font-size:15px;">&#127881; ${data.publicHolidayName}${surcharge}</span>
      </td>
    </tr>`;
}
async function sendBookingConfirmationEmail(data) {
  if (process.env.VITEST || process.env.NODE_ENV === "test") {
    console.log(`[Email] Skipping email send in test environment for ${data.referenceNumber}`);
    return true;
  }
  const resend = getResend();
  const myBookingsUrl = `${data.origin}/my-bookings`;
  const confirmationUrl = `${data.origin}/confirmation/${data.referenceNumber}`;
  const childSeats = [];
  if (data.rearFacingSeats && data.rearFacingSeats > 0) childSeats.push(`${data.rearFacingSeats}\xD7 Rear-facing`);
  if (data.forwardFacingSeats && data.forwardFacingSeats > 0) childSeats.push(`${data.forwardFacingSeats}\xD7 Forward-facing`);
  if (data.boosterSeats && data.boosterSeats > 0) childSeats.push(`${data.boosterSeats}\xD7 Booster`);
  const bodyContent = `
    <h1 style="margin:0 0 8px;font-size:24px;color:#d4a843;font-weight:700;">Booking Confirmed</h1>
    <p style="margin:0 0 24px;font-size:15px;color:#a3a3a3;">Thank you for booking with All Ways Transfers, ${data.clientName}.</p>

    <!-- Reference Number -->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
      <tr>
        <td style="background-color:#262626;border-radius:8px;padding:16px;text-align:center;">
          <p style="margin:0 0 4px;font-size:12px;color:#a3a3a3;text-transform:uppercase;letter-spacing:1px;">Booking Reference</p>
          <p style="margin:0;font-size:22px;font-weight:700;color:#d4a843;letter-spacing:2px;">${data.referenceNumber}</p>
        </td>
      </tr>
    </table>

    <!-- Booking Details -->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
      <tr>
        <td style="padding:8px 0;border-bottom:1px solid #333;">
          <span style="color:#a3a3a3;font-size:13px;">Service</span><br/>
          <span style="color:#e5e5e5;font-size:15px;">${formatServiceType(data.serviceType)}</span>
        </td>
      </tr>
      <tr>
        <td style="padding:8px 0;border-bottom:1px solid #333;">
          <span style="color:#a3a3a3;font-size:13px;">Date &amp; Time</span><br/>
          <span style="color:#e5e5e5;font-size:15px;">${formatDate(data.pickupDate)} at ${formatTime(data.pickupDate)} (AEST)</span>
        </td>
      </tr>
      <tr>
        <td style="padding:8px 0;border-bottom:1px solid #333;">
          <span style="color:#a3a3a3;font-size:13px;">Pickup</span><br/>
          <span style="color:#e5e5e5;font-size:15px;">${data.pickupAddress}</span>
        </td>
      </tr>
      ${data.dropoffAddress ? `<tr>
        <td style="padding:8px 0;border-bottom:1px solid #333;">
          <span style="color:#a3a3a3;font-size:13px;">Drop-off</span><br/>
          <span style="color:#e5e5e5;font-size:15px;">${data.dropoffAddress}</span>
        </td>
      </tr>` : ""}
      <tr>
        <td style="padding:8px 0;border-bottom:1px solid #333;">
          <span style="color:#a3a3a3;font-size:13px;">Passengers</span><br/>
          <span style="color:#e5e5e5;font-size:15px;">${data.passengerCount}</span>
        </td>
      </tr>
      <tr>
        <td style="padding:8px 0;border-bottom:1px solid #333;">
          <span style="color:#a3a3a3;font-size:13px;">Vehicle</span><br/>
          <span style="color:#e5e5e5;font-size:15px;">${data.vehicleName}</span>
        </td>
      </tr>
      ${childSeats.length > 0 ? `<tr>
        <td style="padding:8px 0;border-bottom:1px solid #333;">
          <span style="color:#a3a3a3;font-size:13px;">Child Seats</span><br/>
          <span style="color:#e5e5e5;font-size:15px;">${childSeats.join(", ")}</span>
        </td>
      </tr>` : ""}
      ${data.isPetFriendly && data.numberOfPets ? `<tr>
        <td style="padding:8px 0;border-bottom:1px solid #333;">
          <span style="color:#a3a3a3;font-size:13px;">Number of Pets</span><br/>
          <span style="color:#e5e5e5;font-size:15px;">${data.numberOfPets}</span>
        </td>
      </tr>` : ""}
      ${data.isPetFriendly ? `<tr>
        <td style="padding:8px 0;border-bottom:1px solid #333;">
          <span style="color:#a3a3a3;font-size:13px;">Pet(s) Description</span><br/>
          <span style="color:#e5e5e5;font-size:15px;">${data.petDescription ?? "Yes"}</span>
        </td>
      </tr>` : ""}
      ${data.freightDescription ? `<tr>
        <td style="padding:8px 0;border-bottom:1px solid #333;">
          <span style="color:#a3a3a3;font-size:13px;">Freight \u2014 Item Description</span><br/>
          <span style="color:#e5e5e5;font-size:15px;">${data.freightDescription}</span>
        </td>
      </tr>` : ""}
      ${data.freightWeight ? `<tr>
        <td style="padding:8px 0;border-bottom:1px solid #333;">
          <span style="color:#a3a3a3;font-size:13px;">Freight \u2014 Estimated Weight</span><br/>
          <span style="color:#e5e5e5;font-size:15px;">${{ under_10kg: "Under 10 kg", "10_25kg": "10\u201325 kg", "25_50kg": "25\u201350 kg", "50_100kg": "50\u2013100 kg", "100_plus": "100+ kg" }[data.freightWeight] || data.freightWeight}</span>
        </td>
      </tr>` : ""}
      ${data.freightItemCount ? `<tr>
        <td style="padding:8px 0;border-bottom:1px solid #333;">
          <span style="color:#a3a3a3;font-size:13px;">Freight \u2014 Number of Items</span><br/>
          <span style="color:#e5e5e5;font-size:15px;">${data.freightItemCount}</span>
        </td>
      </tr>` : ""}
      ${data.freightSpecialHandling ? `<tr>
        <td style="padding:8px 0;border-bottom:1px solid #333;">
          <span style="color:#a3a3a3;font-size:13px;">Freight \u2014 Special Handling</span><br/>
          <span style="color:#e5e5e5;font-size:15px;">${data.freightSpecialHandling}</span>
        </td>
      </tr>` : ""}
      ${data.routePreference && data.routePreference !== "fastest" ? `<tr>
        <td style="padding:8px 0;border-bottom:1px solid #333;">
          <span style="color:#a3a3a3;font-size:13px;">Route Preference</span><br/>
          <span style="color:#22c55e;font-size:15px;">&#x1F6E3;&#xFE0F; Toll-Free Route</span>
        </td>
      </tr>` : data.routePreference === "fastest" ? `<tr>
        <td style="padding:8px 0;border-bottom:1px solid #333;">
          <span style="color:#a3a3a3;font-size:13px;">Route Preference</span><br/>
          <span style="color:#e5e5e5;font-size:15px;">&#x1F6E3;&#xFE0F; Fastest Route (may include toll roads)</span>
        </td>
      </tr>` : ""}
      ${buildAdditionalStopsHtml(data)}
      ${buildPublicHolidayHtml(data)}
      ${data.specialRequests ? `<tr>
        <td style="padding:8px 0;border-bottom:1px solid #333;">
          <span style="color:#a3a3a3;font-size:13px;">Special Requests</span><br/>
          <span style="color:#e5e5e5;font-size:15px;">${data.specialRequests}</span>
        </td>
      </tr>` : ""}
      <tr>
        <td style="padding:8px 0;border-bottom:1px solid #333;">
          <span style="color:#a3a3a3;font-size:13px;">Payment</span><br/>
          <span style="color:#e5e5e5;font-size:15px;">${formatPaymentMethod(data.paymentMethod)} \u2014 ${formatPaymentStatus(data.paymentStatus)}</span>
        </td>
      </tr>
      <tr>
        <td style="padding:12px 0 0;">
          <span style="color:#a3a3a3;font-size:13px;">Total</span><br/>
          <span style="color:#d4a843;font-size:22px;font-weight:700;">$${data.totalPrice}</span>
        </td>
      </tr>
    </table>

    <!-- My Bookings CTA -->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:16px;">
      <tr>
        <td align="center" style="padding:16px 0;">
          <a href="${myBookingsUrl}" style="display:inline-block;background-color:#d4a843;color:#0a0a0a;text-decoration:none;padding:12px 32px;border-radius:8px;font-weight:600;font-size:15px;">View My Bookings</a>
        </td>
      </tr>
    </table>

    <p style="margin:0;font-size:13px;color:#737373;text-align:center;">
      You can view, modify, or cancel your booking at any time by visiting your
      <a href="${myBookingsUrl}" style="color:#d4a843;text-decoration:underline;">My Bookings</a> page.
      You can also view this booking's details at your
      <a href="${confirmationUrl}" style="color:#d4a843;text-decoration:underline;">confirmation page</a>.
    </p>
  `;
  try {
    const result = await resend.emails.send({
      from: `All Ways Transfers <${ENV.resendFromEmail}>`,
      to: [data.clientEmail],
      subject: `Booking Confirmed \u2014 ${data.referenceNumber}`,
      html: wrapInTemplate(bodyContent)
    });
    if (result.error) {
      console.warn("[Email] Failed to send booking confirmation:", result.error);
      return false;
    }
    console.log(`[Email] Booking confirmation sent to ${data.clientEmail} for ${data.referenceNumber}`);
    return true;
  } catch (error) {
    console.warn("[Email] Error sending booking confirmation:", error);
    return false;
  }
}
async function sendCancellationConfirmationEmail(data) {
  if (process.env.VITEST || process.env.NODE_ENV === "test") {
    console.log(`[Email] Skipping email send in test environment for ${data.referenceNumber}`);
    return true;
  }
  const resend = getResend();
  const myBookingsUrl = `${data.origin}/my-bookings`;
  let policyText;
  let policyColor;
  if (data.cancellationTier === "free") {
    policyText = "Your booking has been cancelled at no charge, as it was more than 24 hours before your scheduled pickup.";
    policyColor = "#22c55e";
  } else if (data.cancellationTier === "partial_charge") {
    const chargeAmount = (parseFloat(data.totalPrice) * data.chargePercent / 100).toFixed(2);
    policyText = `A ${data.chargePercent}% late cancellation fee of $${chargeAmount} applies, as the cancellation was made less than 24 hours before your scheduled pickup.`;
    policyColor = "#f59e0b";
  } else {
    policyText = "No refund is available for cancellations made less than 4 hours before the scheduled pickup.";
    policyColor = "#ef4444";
  }
  const bodyContent = `
    <h1 style="margin:0 0 8px;font-size:24px;color:#ef4444;font-weight:700;">Booking Cancelled</h1>
    <p style="margin:0 0 24px;font-size:15px;color:#a3a3a3;">Your booking has been cancelled, ${data.clientName}.</p>

    <!-- Reference Number -->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
      <tr>
        <td style="background-color:#262626;border-radius:8px;padding:16px;text-align:center;">
          <p style="margin:0 0 4px;font-size:12px;color:#a3a3a3;text-transform:uppercase;letter-spacing:1px;">Booking Reference</p>
          <p style="margin:0;font-size:22px;font-weight:700;color:#737373;letter-spacing:2px;text-decoration:line-through;">${data.referenceNumber}</p>
        </td>
      </tr>
    </table>

    <!-- Cancellation Policy -->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
      <tr>
        <td style="background-color:#262626;border-left:4px solid ${policyColor};border-radius:4px;padding:16px;">
          <p style="margin:0 0 4px;font-size:13px;font-weight:600;color:${policyColor};text-transform:uppercase;letter-spacing:0.5px;">Cancellation Policy</p>
          <p style="margin:0;font-size:14px;color:#d4d4d4;">${policyText}</p>
        </td>
      </tr>
    </table>

    <!-- Cancelled Booking Details -->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
      <tr>
        <td style="padding:8px 0;border-bottom:1px solid #333;">
          <span style="color:#a3a3a3;font-size:13px;">Service</span><br/>
          <span style="color:#a3a3a3;font-size:15px;">${formatServiceType(data.serviceType)}</span>
        </td>
      </tr>
      <tr>
        <td style="padding:8px 0;border-bottom:1px solid #333;">
          <span style="color:#a3a3a3;font-size:13px;">Date &amp; Time</span><br/>
          <span style="color:#a3a3a3;font-size:15px;">${formatDate(data.pickupDate)} at ${formatTime(data.pickupDate)} (AEST)</span>
        </td>
      </tr>
      <tr>
        <td style="padding:8px 0;border-bottom:1px solid #333;">
          <span style="color:#a3a3a3;font-size:13px;">Pickup</span><br/>
          <span style="color:#a3a3a3;font-size:15px;">${data.pickupAddress}</span>
        </td>
      </tr>
      ${data.dropoffAddress ? `<tr>
        <td style="padding:8px 0;border-bottom:1px solid #333;">
          <span style="color:#a3a3a3;font-size:13px;">Drop-off</span><br/>
          <span style="color:#a3a3a3;font-size:15px;">${data.dropoffAddress}</span>
        </td>
      </tr>` : ""}
      <tr>
        <td style="padding:8px 0;">
          <span style="color:#a3a3a3;font-size:13px;">Original Total</span><br/>
          <span style="color:#a3a3a3;font-size:18px;font-weight:600;text-decoration:line-through;">$${data.totalPrice}</span>
        </td>
      </tr>
    </table>

    ${data.reason ? `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
      <tr>
        <td style="padding:8px 0;">
          <span style="color:#a3a3a3;font-size:13px;">Your Reason</span><br/>
          <span style="color:#d4d4d4;font-size:14px;">${data.reason}</span>
        </td>
      </tr>
    </table>` : ""}

    <!-- My Bookings CTA -->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:16px;">
      <tr>
        <td align="center" style="padding:16px 0;">
          <a href="${myBookingsUrl}" style="display:inline-block;background-color:#d4a843;color:#0a0a0a;text-decoration:none;padding:12px 32px;border-radius:8px;font-weight:600;font-size:15px;">View My Bookings</a>
        </td>
      </tr>
    </table>

    <p style="margin:0;font-size:13px;color:#737373;text-align:center;">
      You can view all your bookings, including cancelled ones, on your
      <a href="${myBookingsUrl}" style="color:#d4a843;text-decoration:underline;">My Bookings</a> page.
      If you have any questions about this cancellation, please contact us at
      <a href="mailto:bookings@allwaystransfers.com.au" style="color:#d4a843;text-decoration:underline;">bookings@allwaystransfers.com.au</a>
      or call 0466 544 068.
    </p>
  `;
  try {
    const result = await resend.emails.send({
      from: `All Ways Transfers <${ENV.resendFromEmail}>`,
      to: [data.clientEmail],
      subject: `Booking Cancelled \u2014 ${data.referenceNumber}`,
      html: wrapInTemplate(bodyContent)
    });
    if (result.error) {
      console.warn("[Email] Failed to send cancellation confirmation:", result.error);
      return false;
    }
    console.log(`[Email] Cancellation confirmation sent to ${data.clientEmail} for ${data.referenceNumber}`);
    return true;
  } catch (error) {
    console.warn("[Email] Error sending cancellation confirmation:", error);
    return false;
  }
}
var ADMIN_EMAIL = ENV.adminEmail || "admin@allwaystransfers.com.au";
async function sendAdminNewBookingNotification(data) {
  if (process.env.VITEST || process.env.NODE_ENV === "test") {
    console.log(`[Email] Skipping admin notification in test environment for ${data.referenceNumber}`);
    return true;
  }
  const resend = getResend();
  const adminDashboardUrl = `${data.origin}/admin/bookings`;
  const childSeats = [];
  if (data.rearFacingSeats && data.rearFacingSeats > 0) childSeats.push(`${data.rearFacingSeats}\xD7 Rear-facing`);
  if (data.forwardFacingSeats && data.forwardFacingSeats > 0) childSeats.push(`${data.forwardFacingSeats}\xD7 Forward-facing`);
  if (data.boosterSeats && data.boosterSeats > 0) childSeats.push(`${data.boosterSeats}\xD7 Booster`);
  const bodyContent = `
    <h1 style="margin:0 0 8px;font-size:24px;color:#d4a843;font-weight:700;">New Booking Received</h1>
    <p style="margin:0 0 24px;font-size:15px;color:#a3a3a3;">A new booking has been submitted and requires your attention.</p>

    <!-- Reference Number -->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
      <tr>
        <td style="background-color:#262626;border-radius:8px;padding:16px;text-align:center;">
          <p style="margin:0 0 4px;font-size:12px;color:#a3a3a3;text-transform:uppercase;letter-spacing:1px;">Booking Reference</p>
          <p style="margin:0;font-size:22px;font-weight:700;color:#d4a843;letter-spacing:2px;">${data.referenceNumber}</p>
        </td>
      </tr>
    </table>

    <!-- Client Info -->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
      <tr>
        <td style="padding:8px 0;border-bottom:1px solid #333;">
          <span style="color:#a3a3a3;font-size:13px;">Client Name</span><br/>
          <span style="color:#e5e5e5;font-size:15px;">${data.clientName}</span>
        </td>
      </tr>
      <tr>
        <td style="padding:8px 0;border-bottom:1px solid #333;">
          <span style="color:#a3a3a3;font-size:13px;">Client Email</span><br/>
          <span style="color:#e5e5e5;font-size:15px;"><a href="mailto:${data.clientEmail}" style="color:#d4a843;text-decoration:underline;">${data.clientEmail}</a></span>
        </td>
      </tr>
    </table>

    <!-- Booking Details -->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
      <tr>
        <td style="padding:8px 0;border-bottom:1px solid #333;">
          <span style="color:#a3a3a3;font-size:13px;">Service</span><br/>
          <span style="color:#e5e5e5;font-size:15px;">${formatServiceType(data.serviceType)}</span>
        </td>
      </tr>
      <tr>
        <td style="padding:8px 0;border-bottom:1px solid #333;">
          <span style="color:#a3a3a3;font-size:13px;">Date &amp; Time</span><br/>
          <span style="color:#e5e5e5;font-size:15px;">${formatDate(data.pickupDate)} at ${formatTime(data.pickupDate)} (AEST)</span>
        </td>
      </tr>
      <tr>
        <td style="padding:8px 0;border-bottom:1px solid #333;">
          <span style="color:#a3a3a3;font-size:13px;">Pickup</span><br/>
          <span style="color:#e5e5e5;font-size:15px;">${data.pickupAddress}</span>
        </td>
      </tr>
      ${data.dropoffAddress ? `<tr>
        <td style="padding:8px 0;border-bottom:1px solid #333;">
          <span style="color:#a3a3a3;font-size:13px;">Drop-off</span><br/>
          <span style="color:#e5e5e5;font-size:15px;">${data.dropoffAddress}</span>
        </td>
      </tr>` : ""}
      <tr>
        <td style="padding:8px 0;border-bottom:1px solid #333;">
          <span style="color:#a3a3a3;font-size:13px;">Passengers</span><br/>
          <span style="color:#e5e5e5;font-size:15px;">${data.passengerCount}</span>
        </td>
      </tr>
      <tr>
        <td style="padding:8px 0;border-bottom:1px solid #333;">
          <span style="color:#a3a3a3;font-size:13px;">Vehicle</span><br/>
          <span style="color:#e5e5e5;font-size:15px;">${data.vehicleName}</span>
        </td>
      </tr>
      ${childSeats.length > 0 ? `<tr>
        <td style="padding:8px 0;border-bottom:1px solid #333;">
          <span style="color:#a3a3a3;font-size:13px;">Child Seats</span><br/>
          <span style="color:#e5e5e5;font-size:15px;">${childSeats.join(", ")}</span>
        </td>
      </tr>` : ""}
      ${data.isPetFriendly && data.numberOfPets ? `<tr>
        <td style="padding:8px 0;border-bottom:1px solid #333;">
          <span style="color:#a3a3a3;font-size:13px;">Number of Pets</span><br/>
          <span style="color:#e5e5e5;font-size:15px;">${data.numberOfPets}</span>
        </td>
      </tr>` : ""}
      ${data.isPetFriendly ? `<tr>
        <td style="padding:8px 0;border-bottom:1px solid #333;">
          <span style="color:#a3a3a3;font-size:13px;">Pet(s) Description</span><br/>
          <span style="color:#e5e5e5;font-size:15px;">${data.petDescription ?? "Yes"}</span>
        </td>
      </tr>` : ""}
      ${data.freightDescription ? `<tr>
        <td style="padding:8px 0;border-bottom:1px solid #333;">
          <span style="color:#a3a3a3;font-size:13px;">Freight \u2014 Item Description</span><br/>
          <span style="color:#e5e5e5;font-size:15px;">${data.freightDescription}</span>
        </td>
      </tr>` : ""}
      ${data.freightWeight ? `<tr>
        <td style="padding:8px 0;border-bottom:1px solid #333;">
          <span style="color:#a3a3a3;font-size:13px;">Freight \u2014 Estimated Weight</span><br/>
          <span style="color:#e5e5e5;font-size:15px;">${{ under_10kg: "Under 10 kg", "10_25kg": "10\u201325 kg", "25_50kg": "25\u201350 kg", "50_100kg": "50\u2013100 kg", "100_plus": "100+ kg" }[data.freightWeight] || data.freightWeight}</span>
        </td>
      </tr>` : ""}
      ${data.freightItemCount ? `<tr>
        <td style="padding:8px 0;border-bottom:1px solid #333;">
          <span style="color:#a3a3a3;font-size:13px;">Freight \u2014 Number of Items</span><br/>
          <span style="color:#e5e5e5;font-size:15px;">${data.freightItemCount}</span>
        </td>
      </tr>` : ""}
      ${data.freightSpecialHandling ? `<tr>
        <td style="padding:8px 0;border-bottom:1px solid #333;">
          <span style="color:#a3a3a3;font-size:13px;">Freight \u2014 Special Handling</span><br/>
          <span style="color:#e5e5e5;font-size:15px;">${data.freightSpecialHandling}</span>
        </td>
      </tr>` : ""}
      ${data.routePreference && data.routePreference !== "fastest" ? `<tr>
        <td style="padding:8px 0;border-bottom:1px solid #333;">
          <span style="color:#a3a3a3;font-size:13px;">Route Preference</span><br/>
          <span style="color:#22c55e;font-size:15px;">&#x1F6E3;&#xFE0F; Toll-Free Route</span>
        </td>
      </tr>` : data.routePreference === "fastest" ? `<tr>
        <td style="padding:8px 0;border-bottom:1px solid #333;">
          <span style="color:#a3a3a3;font-size:13px;">Route Preference</span><br/>
          <span style="color:#e5e5e5;font-size:15px;">&#x1F6E3;&#xFE0F; Fastest Route (may include toll roads)</span>
        </td>
      </tr>` : ""}
      ${buildAdditionalStopsHtml(data)}
      ${buildPublicHolidayHtml(data)}
      ${data.specialRequests ? `<tr>
        <td style="padding:8px 0;border-bottom:1px solid #333;">
          <span style="color:#a3a3a3;font-size:13px;">Special Requests</span><br/>
          <span style="color:#e5e5e5;font-size:15px;">${data.specialRequests}</span>
        </td>
      </tr>` : ""}
      <tr>
        <td style="padding:8px 0;border-bottom:1px solid #333;">
          <span style="color:#a3a3a3;font-size:13px;">Payment Method</span><br/>
          <span style="color:#e5e5e5;font-size:15px;">${formatPaymentMethod(data.paymentMethod)} \u2014 ${formatPaymentStatus(data.paymentStatus)}</span>
        </td>
      </tr>
      <tr>
        <td style="padding:12px 0 0;">
          <span style="color:#a3a3a3;font-size:13px;">Total</span><br/>
          <span style="color:#d4a843;font-size:22px;font-weight:700;">$${data.totalPrice}</span>
        </td>
      </tr>
    </table>

    <!-- Admin Dashboard CTA -->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:16px;">
      <tr>
        <td align="center" style="padding:16px 0;">
          <a href="${adminDashboardUrl}" style="display:inline-block;background-color:#d4a843;color:#0a0a0a;text-decoration:none;padding:12px 32px;border-radius:8px;font-weight:600;font-size:15px;">View in Admin Dashboard</a>
        </td>
      </tr>
    </table>
  `;
  try {
    const result = await resend.emails.send({
      from: `All Ways Transfers <${ENV.resendFromEmail}>`,
      to: [ADMIN_EMAIL],
      subject: `\u{1F514} New Booking \u2014 ${data.referenceNumber} \u2014 ${data.clientName}`,
      html: wrapInTemplate(bodyContent)
    });
    if (result.error) {
      console.warn("[Email] Failed to send admin new booking notification:", result.error);
      return false;
    }
    console.log(`[Email] Admin notification sent for new booking ${data.referenceNumber}`);
    return true;
  } catch (error) {
    console.warn("[Email] Error sending admin new booking notification:", error);
    return false;
  }
}
async function sendAdminCancellationNotification(data) {
  if (process.env.VITEST || process.env.NODE_ENV === "test") {
    console.log(`[Email] Skipping admin cancellation notification in test environment for ${data.referenceNumber}`);
    return true;
  }
  const resend = getResend();
  const adminDashboardUrl = `${data.origin}/admin/bookings`;
  let policyText;
  let policyColor;
  if (data.cancellationTier === "free") {
    policyText = `Free cancellation \u2014 more than 24 hours before pickup.`;
    policyColor = "#22c55e";
  } else if (data.cancellationTier === "partial_charge") {
    const chargeAmount = (parseFloat(data.totalPrice) * data.chargePercent / 100).toFixed(2);
    policyText = `${data.chargePercent}% late cancellation fee ($${chargeAmount}) \u2014 less than 24 hours before pickup.`;
    policyColor = "#f59e0b";
  } else {
    policyText = `No refund \u2014 cancelled less than 4 hours before pickup.`;
    policyColor = "#ef4444";
  }
  const bodyContent = `
    <h1 style="margin:0 0 8px;font-size:24px;color:#ef4444;font-weight:700;">Booking Cancelled</h1>
    <p style="margin:0 0 24px;font-size:15px;color:#a3a3a3;">A client has cancelled their booking.</p>

    <!-- Reference Number -->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
      <tr>
        <td style="background-color:#262626;border-radius:8px;padding:16px;text-align:center;">
          <p style="margin:0 0 4px;font-size:12px;color:#a3a3a3;text-transform:uppercase;letter-spacing:1px;">Booking Reference</p>
          <p style="margin:0;font-size:22px;font-weight:700;color:#737373;letter-spacing:2px;text-decoration:line-through;">${data.referenceNumber}</p>
        </td>
      </tr>
    </table>

    <!-- Client Info -->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
      <tr>
        <td style="padding:8px 0;border-bottom:1px solid #333;">
          <span style="color:#a3a3a3;font-size:13px;">Client Name</span><br/>
          <span style="color:#e5e5e5;font-size:15px;">${data.clientName}</span>
        </td>
      </tr>
      <tr>
        <td style="padding:8px 0;border-bottom:1px solid #333;">
          <span style="color:#a3a3a3;font-size:13px;">Client Email</span><br/>
          <span style="color:#e5e5e5;font-size:15px;"><a href="mailto:${data.clientEmail}" style="color:#d4a843;text-decoration:underline;">${data.clientEmail}</a></span>
        </td>
      </tr>
    </table>

    <!-- Cancellation Policy -->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
      <tr>
        <td style="background-color:#262626;border-left:4px solid ${policyColor};border-radius:4px;padding:16px;">
          <p style="margin:0 0 4px;font-size:13px;font-weight:600;color:${policyColor};text-transform:uppercase;letter-spacing:0.5px;">Cancellation Policy Applied</p>
          <p style="margin:0;font-size:14px;color:#d4d4d4;">${policyText}</p>
        </td>
      </tr>
    </table>

    <!-- Booking Details -->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
      <tr>
        <td style="padding:8px 0;border-bottom:1px solid #333;">
          <span style="color:#a3a3a3;font-size:13px;">Service</span><br/>
          <span style="color:#a3a3a3;font-size:15px;">${formatServiceType(data.serviceType)}</span>
        </td>
      </tr>
      <tr>
        <td style="padding:8px 0;border-bottom:1px solid #333;">
          <span style="color:#a3a3a3;font-size:13px;">Date &amp; Time</span><br/>
          <span style="color:#a3a3a3;font-size:15px;">${formatDate(data.pickupDate)} at ${formatTime(data.pickupDate)} (AEST)</span>
        </td>
      </tr>
      <tr>
        <td style="padding:8px 0;border-bottom:1px solid #333;">
          <span style="color:#a3a3a3;font-size:13px;">Pickup</span><br/>
          <span style="color:#a3a3a3;font-size:15px;">${data.pickupAddress}</span>
        </td>
      </tr>
      ${data.dropoffAddress ? `<tr>
        <td style="padding:8px 0;border-bottom:1px solid #333;">
          <span style="color:#a3a3a3;font-size:13px;">Drop-off</span><br/>
          <span style="color:#a3a3a3;font-size:15px;">${data.dropoffAddress}</span>
        </td>
      </tr>` : ""}
      <tr>
        <td style="padding:8px 0;">
          <span style="color:#a3a3a3;font-size:13px;">Original Total</span><br/>
          <span style="color:#a3a3a3;font-size:18px;font-weight:600;text-decoration:line-through;">$${data.totalPrice}</span>
        </td>
      </tr>
    </table>

    ${data.reason ? `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
      <tr>
        <td style="padding:8px 0;">
          <span style="color:#a3a3a3;font-size:13px;">Client's Reason</span><br/>
          <span style="color:#d4d4d4;font-size:14px;">${data.reason}</span>
        </td>
      </tr>
    </table>` : ""}

    <!-- Admin Dashboard CTA -->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:16px;">
      <tr>
        <td align="center" style="padding:16px 0;">
          <a href="${adminDashboardUrl}" style="display:inline-block;background-color:#d4a843;color:#0a0a0a;text-decoration:none;padding:12px 32px;border-radius:8px;font-weight:600;font-size:15px;">View in Admin Dashboard</a>
        </td>
      </tr>
    </table>
  `;
  try {
    const result = await resend.emails.send({
      from: `All Ways Transfers <${ENV.resendFromEmail}>`,
      to: [ADMIN_EMAIL],
      subject: `\u274C Booking Cancelled \u2014 ${data.referenceNumber} \u2014 ${data.clientName}`,
      html: wrapInTemplate(bodyContent)
    });
    if (result.error) {
      console.warn("[Email] Failed to send admin cancellation notification:", result.error);
      return false;
    }
    console.log(`[Email] Admin cancellation notification sent for ${data.referenceNumber}`);
    return true;
  } catch (error) {
    console.warn("[Email] Error sending admin cancellation notification:", error);
    return false;
  }
}
async function sendPasswordResetEmail(data) {
  if (process.env.VITEST || process.env.NODE_ENV === "test") {
    console.log(`[Email] Skipping password reset email in test environment for ${data.email}`);
    return true;
  }
  const resend = getResend();
  const bodyContent = `
    <h1 style="margin:0 0 8px;font-size:24px;color:#d4a843;font-weight:700;">Reset Your Password</h1>
    <p style="margin:0 0 24px;font-size:15px;color:#a3a3a3;">Hi ${data.name},</p>
    <p style="margin:0 0 16px;font-size:15px;color:#d4d4d4;">
      We received a request to reset the password for your All Ways Transfers account. Click the button below to set a new password:
    </p>

    <!-- Reset Button -->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
      <tr>
        <td align="center" style="padding:16px 0;">
          <a href="${data.resetUrl}" style="display:inline-block;background-color:#d4a843;color:#0a0a0a;text-decoration:none;padding:14px 40px;border-radius:8px;font-weight:700;font-size:16px;">Reset Password</a>
        </td>
      </tr>
    </table>

    <p style="margin:0 0 8px;font-size:13px;color:#a3a3a3;">
      This link will expire in <strong style="color:#d4d4d4;">${data.expiresInMinutes} minutes</strong>.
    </p>
    <p style="margin:0 0 16px;font-size:13px;color:#a3a3a3;">
      If you didn't request a password reset, you can safely ignore this email. Your password will remain unchanged.
    </p>

    <!-- Fallback URL -->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:16px;border-top:1px solid #333;padding-top:16px;">
      <tr>
        <td>
          <p style="margin:0 0 4px;font-size:11px;color:#737373;">If the button doesn't work, copy and paste this link into your browser:</p>
          <p style="margin:0;font-size:11px;color:#525252;word-break:break-all;">${data.resetUrl}</p>
        </td>
      </tr>
    </table>
  `;
  try {
    const result = await resend.emails.send({
      from: `All Ways Transfers <${ENV.resendFromEmail}>`,
      to: [data.email],
      subject: "Reset Your Password \u2014 All Ways Transfers",
      html: wrapInTemplate(bodyContent)
    });
    if (result.error) {
      console.warn("[Email] Failed to send password reset email:", result.error);
      return false;
    }
    console.log(`[Email] Password reset email sent to ${data.email}`);
    return true;
  } catch (error) {
    console.warn("[Email] Error sending password reset email:", error);
    return false;
  }
}
async function sendPaymentReceiptEmail(data) {
  if (process.env.VITEST || process.env.NODE_ENV === "test") {
    console.log(`[Email] Skipping email send in test environment for ${data.referenceNumber}`);
    return true;
  }
  const resend = getResend();
  const paidAt = (/* @__PURE__ */ new Date()).toLocaleString("en-AU", {
    timeZone: "Australia/Brisbane",
    dateStyle: "medium",
    timeStyle: "short"
  });
  const bodyContent = `
    <h1 style="margin:0 0 8px;font-size:24px;color:#d4a843;font-weight:700;">Payment Receipt</h1>
    <p style="margin:0 0 24px;font-size:15px;color:#a3a3a3;">Thank you for your payment, ${data.clientName}. Your transaction has been completed successfully.</p>

    <!-- Payment Confirmation Badge -->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
      <tr>
        <td style="background-color:#1a3a1a;border:1px solid #2d5a2d;border-radius:8px;padding:16px;text-align:center;">
          <p style="margin:0 0 4px;font-size:14px;color:#4ade80;font-weight:600;">&#10003; Payment Successful</p>
          <p style="margin:0;font-size:12px;color:#86efac;">Processed on ${paidAt} (AEST)</p>
        </td>
      </tr>
    </table>

    <!-- Reference & Amount -->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
      <tr>
        <td style="background-color:#262626;border-radius:8px;padding:16px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td style="padding:0 0 12px;">
                <span style="color:#a3a3a3;font-size:12px;text-transform:uppercase;letter-spacing:1px;">Booking Reference</span><br/>
                <span style="color:#d4a843;font-size:20px;font-weight:700;letter-spacing:2px;">${data.referenceNumber}</span>
              </td>
            </tr>
            <tr>
              <td style="border-top:1px solid #333;padding:12px 0 0;">
                <span style="color:#a3a3a3;font-size:12px;text-transform:uppercase;letter-spacing:1px;">Amount Paid</span><br/>
                <span style="color:#4ade80;font-size:24px;font-weight:700;">$${data.totalPrice} AUD</span>
              </td>
            </tr>
            <tr>
              <td style="padding:8px 0 0;">
                <span style="color:#a3a3a3;font-size:12px;text-transform:uppercase;letter-spacing:1px;">Payment Method</span><br/>
                <span style="color:#e5e5e5;font-size:15px;">${formatPaymentMethod(data.paymentMethod)}</span>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>

    <!-- Trip Summary -->
    <p style="margin:0 0 12px;font-size:12px;color:#a3a3a3;text-transform:uppercase;letter-spacing:1px;">Trip Summary</p>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
      <tr>
        <td style="padding:8px 0;border-bottom:1px solid #333;">
          <span style="color:#a3a3a3;font-size:13px;">Service</span><br/>
          <span style="color:#e5e5e5;font-size:15px;">${formatServiceType(data.serviceType)}</span>
        </td>
      </tr>
      <tr>
        <td style="padding:8px 0;border-bottom:1px solid #333;">
          <span style="color:#a3a3a3;font-size:13px;">Date &amp; Time</span><br/>
          <span style="color:#e5e5e5;font-size:15px;">${formatDate(data.pickupDate)} at ${formatTime(data.pickupDate)} (AEST)</span>
        </td>
      </tr>
      <tr>
        <td style="padding:8px 0;border-bottom:1px solid #333;">
          <span style="color:#a3a3a3;font-size:13px;">Pickup</span><br/>
          <span style="color:#e5e5e5;font-size:15px;">${data.pickupAddress}</span>
        </td>
      </tr>
      ${data.dropoffAddress ? `<tr>
        <td style="padding:8px 0;border-bottom:1px solid #333;">
          <span style="color:#a3a3a3;font-size:13px;">Drop-off</span><br/>
          <span style="color:#e5e5e5;font-size:15px;">${data.dropoffAddress}</span>
        </td>
      </tr>` : ""}
      <tr>
        <td style="padding:8px 0;border-bottom:1px solid #333;">
          <span style="color:#a3a3a3;font-size:13px;">Vehicle</span><br/>
          <span style="color:#e5e5e5;font-size:15px;">${data.vehicleName}</span>
        </td>
      </tr>
      <tr>
        <td style="padding:8px 0;border-bottom:1px solid #333;">
          <span style="color:#a3a3a3;font-size:13px;">Passengers</span><br/>
          <span style="color:#e5e5e5;font-size:15px;">${data.passengerCount}</span>
        </td>
      </tr>
      ${data.isPetFriendly && data.numberOfPets ? `<tr>
        <td style="padding:8px 0;border-bottom:1px solid #333;">
          <span style="color:#a3a3a3;font-size:13px;">Pets</span><br/>
          <span style="color:#e5e5e5;font-size:15px;">${data.numberOfPets} pet${data.numberOfPets !== 1 ? "s" : ""}${data.petDescription ? ` \u2014 ${data.petDescription}` : ""}</span>
        </td>
      </tr>` : ""}
      ${data.publicHolidayName ? `<tr>
        <td style="padding:8px 0;border-bottom:1px solid #333;">
          <span style="color:#a3a3a3;font-size:13px;">Public Holiday</span><br/>
          <span style="color:#d4a843;font-size:15px;">&#127881; ${data.publicHolidayName}${parseFloat(data.publicHolidaySurcharge ?? "0") > 0 ? ` \u2014 $${parseFloat(data.publicHolidaySurcharge).toFixed(2)} surcharge` : ""}</span>
        </td>
      </tr>` : ""}
      ${data.routePreference && data.routePreference !== "fastest" ? `<tr>
        <td style="padding:8px 0;border-bottom:1px solid #333;">
          <span style="color:#a3a3a3;font-size:13px;">Route Preference</span><br/>
          <span style="color:#22c55e;font-size:15px;">&#x1F6E3;&#xFE0F; Toll-Free Route</span>
        </td>
      </tr>` : data.routePreference === "fastest" ? `<tr>
        <td style="padding:8px 0;border-bottom:1px solid #333;">
          <span style="color:#a3a3a3;font-size:13px;">Route Preference</span><br/>
          <span style="color:#e5e5e5;font-size:15px;">&#x1F6E3;&#xFE0F; Fastest Route (may include toll roads)</span>
        </td>
      </tr>` : ""}
    </table>

    <!-- Note -->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
      <tr>
        <td style="background-color:#262626;border-radius:8px;padding:16px;">
          <p style="margin:0 0 4px;font-size:13px;color:#a3a3a3;">
            This email serves as your payment receipt. Please retain it for your records.
            If you have any questions about your booking or payment, please contact us at
            <a href="mailto:bookings@allwaystransfers.com.au" style="color:#d4a843;text-decoration:underline;">bookings@allwaystransfers.com.au</a>
            or call <strong style="color:#e5e5e5;">0466 544 068</strong>.
          </p>
        </td>
      </tr>
    </table>
  `;
  try {
    const adminEmail = ENV.adminEmail || "admin@allwaystransfers.com.au";
    const result = await resend.emails.send({
      from: `All Ways Transfers <${ENV.resendFromEmail}>`,
      to: [data.clientEmail],
      bcc: [adminEmail],
      subject: `Payment Receipt \u2014 ${data.referenceNumber}`,
      html: wrapInTemplate(bodyContent)
    });
    if (result.error) {
      console.warn("[Email] Failed to send payment receipt:", result.error);
      return false;
    }
    console.log(`[Email] Payment receipt sent to ${data.clientEmail} for ${data.referenceNumber}`);
    return true;
  } catch (error) {
    console.warn("[Email] Error sending payment receipt:", error);
    return false;
  }
}

// server/routers.ts
init_suburbs();
import crypto from "crypto";
var appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    login: publicProcedure.input(z2.object({
      email: z2.string().email("Valid email is required"),
      password: z2.string().min(1, "Password is required"),
      rememberMe: z2.boolean().optional().default(false)
    })).mutation(async ({ input, ctx }) => {
      const user = await getUserByEmail(input.email);
      if (!user || !user.passwordHash) {
        throw new Error("Invalid email or password");
      }
      const valid = await verifyPassword(input.password, user.passwordHash);
      if (!valid) {
        throw new Error("Invalid email or password");
      }
      const sessionDuration = input.rememberMe ? SESSION_LONG_MS : SESSION_SHORT_MS;
      const token = await createSessionToken({
        id: user.id,
        email: user.email,
        role: user.role
      }, { expiresInMs: sessionDuration });
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.cookie(COOKIE_NAME, token, { ...cookieOptions, maxAge: sessionDuration });
      return { success: true, user: { id: user.id, name: user.name, email: user.email, role: user.role } };
    }),
    register: publicProcedure.input(z2.object({
      name: z2.string().min(1, "Name is required"),
      email: z2.string().email("Valid email is required"),
      password: z2.string().min(8, "Password must be at least 8 characters")
    })).mutation(async ({ input, ctx }) => {
      const existing = await getUserByEmail(input.email);
      if (existing) {
        throw new Error("An account with this email already exists");
      }
      const passwordHash = await hashPassword(input.password);
      const user = await createUserWithPassword({
        name: input.name,
        email: input.email,
        passwordHash
      });
      if (!user) {
        throw new Error("Failed to create account");
      }
      const token = await createSessionToken({
        id: user.id,
        email: user.email,
        role: user.role
      });
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.cookie(COOKIE_NAME, token, { ...cookieOptions, maxAge: SESSION_SHORT_MS });
      return { success: true, user: { id: user.id, name: user.name, email: user.email, role: user.role } };
    }),
    googleLogin: publicProcedure.input(z2.object({
      credential: z2.string().min(1, "Google credential is required"),
      rememberMe: z2.boolean().optional().default(false)
    })).mutation(async ({ input, ctx }) => {
      const { ENV: ENV2 } = await Promise.resolve().then(() => (init_env(), env_exports));
      const { OAuth2Client } = await import("google-auth-library");
      const clientId = ENV2.googleClientId;
      if (!clientId) {
        throw new Error("Google Sign-In is not configured");
      }
      const client = new OAuth2Client(clientId);
      let ticket;
      try {
        ticket = await client.verifyIdToken({
          idToken: input.credential,
          audience: clientId
        });
      } catch {
        throw new Error("Invalid Google credential");
      }
      const payload = ticket.getPayload();
      if (!payload || !payload.email || !payload.sub) {
        throw new Error("Invalid Google token payload");
      }
      const googleId = payload.sub;
      const email = payload.email;
      const name = payload.name || email.split("@")[0];
      let user = await getUserByGoogleId(googleId);
      if (!user) {
        user = await getUserByEmail(email);
        if (user) {
          user = await linkGoogleAccount(user.id, googleId) ?? void 0;
        } else {
          user = await createUserWithGoogle({ name, email, googleId }) ?? void 0;
        }
      }
      if (!user) {
        throw new Error("Failed to create or find user account");
      }
      const sessionDuration = input.rememberMe ? SESSION_LONG_MS : SESSION_LONG_MS;
      const token = await createSessionToken({
        id: user.id,
        email: user.email,
        role: user.role
      }, { expiresInMs: sessionDuration });
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.cookie(COOKIE_NAME, token, { ...cookieOptions, maxAge: sessionDuration });
      return { success: true, user: { id: user.id, name: user.name, email: user.email, role: user.role } };
    }),
    forgotPassword: publicProcedure.input(z2.object({
      email: z2.string().email("Invalid email address"),
      origin: z2.string().min(1, "Origin is required")
    })).mutation(async ({ input }) => {
      const user = await getUserByEmail(input.email);
      if (!user) {
        return { success: true, message: "If an account with that email exists, a password reset link has been sent." };
      }
      const token = crypto.randomBytes(32).toString("hex");
      const RESET_EXPIRY_MINUTES = 30;
      const expiresAt = new Date(Date.now() + RESET_EXPIRY_MINUTES * 60 * 1e3);
      await invalidateUserResetTokens(user.id);
      await createPasswordResetToken(user.id, token, expiresAt);
      const resetUrl = `${input.origin}/reset-password?token=${token}`;
      await sendPasswordResetEmail({
        name: user.name || "Customer",
        email: user.email,
        resetUrl,
        expiresInMinutes: RESET_EXPIRY_MINUTES
      });
      return { success: true, message: "If an account with that email exists, a password reset link has been sent." };
    }),
    resetPassword: publicProcedure.input(z2.object({
      token: z2.string().min(1, "Reset token is required"),
      password: z2.string().min(8, "Password must be at least 8 characters")
    })).mutation(async ({ input }) => {
      const resetToken = await getPasswordResetToken(input.token);
      if (!resetToken) {
        throw new Error("Invalid or expired reset link. Please request a new one.");
      }
      if (resetToken.usedAt) {
        throw new Error("This reset link has already been used. Please request a new one.");
      }
      if (/* @__PURE__ */ new Date() > resetToken.expiresAt) {
        throw new Error("This reset link has expired. Please request a new one.");
      }
      const user = await getUserById(resetToken.userId);
      if (!user) {
        throw new Error("User account not found.");
      }
      const newHash = await hashPassword(input.password);
      await updateUserPassword(user.id, newHash);
      await markPasswordResetTokenUsed(resetToken.id);
      await invalidateUserResetTokens(user.id);
      return { success: true, message: "Your password has been reset successfully. You can now sign in with your new password." };
    }),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true };
    })
  }),
  vehicles: router({
    list: publicProcedure.query(async () => {
      return getActiveVehicles();
    }),
    getById: publicProcedure.input(z2.object({ id: z2.number() })).query(async ({ input }) => {
      return getVehicleById(input.id);
    })
  }),
  bookings: router({
    create: publicProcedure.input(
      z2.object({
        clientName: z2.string().min(1, "Name is required"),
        clientEmail: z2.string().email("Valid email is required"),
        clientPhone: z2.string().min(1, "Phone is required"),
        serviceType: z2.enum(["airport_transfer", "hourly_hire", "point_to_point", "special_events", "freight"]),
        pickupAddress: z2.string().min(1, "Pickup address is required"),
        dropoffAddress: z2.string().optional(),
        pickupDate: z2.number().min(1, "Pickup date is required"),
        passengerCount: z2.number().min(0).max(7),
        vehicleId: z2.number(),
        vehicleName: z2.string(),
        needsSupportVan: z2.boolean().default(false),
        supportVanPrice: z2.number().default(0),
        rearFacingSeats: z2.number().min(0).max(2).default(0),
        forwardFacingSeats: z2.number().min(0).max(2).default(0),
        boosterSeats: z2.number().min(0).max(2).default(0),
        isPetFriendly: z2.boolean().default(false),
        numberOfPets: z2.number().min(1).max(10).optional(),
        petDescription: z2.string().optional(),
        // Freight-specific fields
        freightDescription: z2.string().optional(),
        freightWeight: z2.string().optional(),
        freightItemCount: z2.number().min(1).max(100).optional(),
        freightSpecialHandling: z2.string().optional(),
        routePreference: z2.enum(["fastest", "toll_free"]).default("fastest"),
        estimatedDistance: z2.number().optional(),
        estimatedDuration: z2.number().optional(),
        basePrice: z2.number(),
        totalPrice: z2.number(),
        additionalPickupCount: z2.number().min(0).max(5).default(0),
        additionalDropoffCount: z2.number().min(0).max(5).default(0),
        additionalPickupAddresses: z2.array(z2.string()).default([]),
        additionalDropoffAddresses: z2.array(z2.string()).default([]),
        additionalStopsSurcharge: z2.number().default(0),
        publicHolidaySurcharge: z2.number().default(0),
        publicHolidayName: z2.string().optional(),
        specialRequests: z2.string().optional(),
        termsAccepted: z2.boolean(),
        paymentMethod: z2.enum(["stripe_prepay", "square_postpay", "cash_postpay"]),
        origin: z2.string().optional()
      })
    ).mutation(async ({ input }) => {
      if (!input.termsAccepted) {
        throw new Error("You must accept the terms and conditions");
      }
      if (input.serviceType === "hourly_hire") {
        const settings = await getAllPricingSettings();
        const minHoursSetting = settings.find((s) => s.settingKey === "min_hourly_hours");
        const minHours = minHoursSetting ? parseInt(minHoursSetting.settingValue, 10) : 3;
        const bookingHours = input.estimatedDuration ? Math.round(input.estimatedDuration / 60) : 0;
        if (bookingHours < minHours) {
          throw new Error(`Hourly Hire requires a minimum of ${minHours} hours`);
        }
      }
      const vehicle = await getVehicleById(input.vehicleId);
      if (!vehicle) {
        throw new Error("Selected vehicle not found");
      }
      const booking = await createBooking({
        clientName: input.clientName,
        clientEmail: input.clientEmail,
        clientPhone: input.clientPhone,
        serviceType: input.serviceType,
        pickupAddress: input.pickupAddress,
        dropoffAddress: input.dropoffAddress ?? null,
        pickupDate: input.pickupDate,
        passengerCount: input.passengerCount,
        vehicleId: input.vehicleId,
        vehicleName: input.vehicleName,
        needsSupportVan: input.needsSupportVan ? 1 : 0,
        supportVanPrice: input.supportVanPrice.toFixed(2),
        rearFacingSeats: input.rearFacingSeats,
        forwardFacingSeats: input.forwardFacingSeats,
        boosterSeats: input.boosterSeats,
        isPetFriendly: input.isPetFriendly ? 1 : 0,
        numberOfPets: input.isPetFriendly ? input.numberOfPets ?? 1 : null,
        petDescription: input.isPetFriendly ? input.petDescription ?? null : null,
        // Freight fields
        freightDescription: input.serviceType === "freight" ? input.freightDescription ?? null : null,
        freightWeight: input.serviceType === "freight" ? input.freightWeight ?? null : null,
        freightItemCount: input.serviceType === "freight" ? input.freightItemCount ?? null : null,
        freightSpecialHandling: input.serviceType === "freight" ? input.freightSpecialHandling ?? null : null,
        routePreference: input.routePreference ?? "fastest",
        estimatedDistance: input.estimatedDistance?.toFixed(2) ?? null,
        estimatedDuration: input.estimatedDuration ?? null,
        basePrice: input.basePrice.toFixed(2),
        totalPrice: input.totalPrice.toFixed(2),
        additionalPickupCount: input.additionalPickupCount,
        additionalDropoffCount: input.additionalDropoffCount,
        additionalPickupAddresses: input.additionalPickupAddresses.length > 0 ? JSON.stringify(input.additionalPickupAddresses) : null,
        additionalDropoffAddresses: input.additionalDropoffAddresses.length > 0 ? JSON.stringify(input.additionalDropoffAddresses) : null,
        additionalStopsSurcharge: input.additionalStopsSurcharge.toFixed(2),
        publicHolidaySurcharge: input.publicHolidaySurcharge.toFixed(2),
        publicHolidayName: input.publicHolidayName ?? null,
        paymentMethod: input.paymentMethod,
        paymentStatus: "unpaid",
        specialRequests: input.specialRequests ?? null,
        adminNotes: null,
        termsAccepted: 1
      });
      try {
        await notifyOwner({
          title: `New Booking: ${booking.referenceNumber}`,
          content: `New booking from ${input.clientName}
Service: ${input.serviceType.replace(/_/g, " ")}
Pickup: ${input.pickupAddress}
Date: ${new Date(input.pickupDate).toLocaleString("en-AU", { timeZone: "Australia/Brisbane" })}
Passengers: ${input.passengerCount}
Total: $${input.totalPrice.toFixed(2)}${input.needsSupportVan ? "\n+ Support Van required" : ""}`
        });
      } catch (e) {
        console.warn("Failed to send owner notification:", e);
      }
      let checkoutUrl = null;
      if (input.paymentMethod === "stripe_prepay" && input.origin) {
        try {
          const serviceLabel = input.serviceType.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
          const { url, sessionId } = await createCheckoutSession({
            bookingReference: booking.referenceNumber,
            bookingId: booking.id,
            amount: input.totalPrice,
            customerEmail: input.clientEmail,
            customerName: input.clientName,
            serviceDescription: serviceLabel,
            origin: input.origin
          });
          checkoutUrl = url;
          await updateBookingStripeSession(booking.id, sessionId);
        } catch (e) {
          console.warn("Failed to create Stripe checkout session:", e);
        }
      }
      if (input.origin) {
        try {
          await sendBookingConfirmationEmail({
            referenceNumber: booking.referenceNumber,
            clientName: input.clientName,
            clientEmail: input.clientEmail,
            serviceType: input.serviceType,
            pickupAddress: input.pickupAddress,
            dropoffAddress: input.dropoffAddress ?? null,
            pickupDate: input.pickupDate,
            passengerCount: input.passengerCount,
            vehicleName: input.vehicleName,
            rearFacingSeats: input.rearFacingSeats,
            forwardFacingSeats: input.forwardFacingSeats,
            boosterSeats: input.boosterSeats,
            isPetFriendly: input.isPetFriendly,
            numberOfPets: input.numberOfPets ?? null,
            petDescription: input.petDescription ?? null,
            freightDescription: input.freightDescription ?? null,
            freightWeight: input.freightWeight ?? null,
            freightItemCount: input.freightItemCount ?? null,
            freightSpecialHandling: input.freightSpecialHandling ?? null,
            routePreference: input.routePreference ?? "fastest",
            totalPrice: input.totalPrice.toFixed(2),
            paymentMethod: input.paymentMethod,
            paymentStatus: input.paymentMethod === "stripe_prepay" ? "unpaid" : "unpaid",
            specialRequests: input.specialRequests ?? null,
            additionalPickupCount: input.additionalPickupCount ?? 0,
            additionalDropoffCount: input.additionalDropoffCount ?? 0,
            additionalPickupAddresses: input.additionalPickupAddresses ?? [],
            additionalDropoffAddresses: input.additionalDropoffAddresses ?? [],
            publicHolidaySurcharge: input.publicHolidaySurcharge ?? 0,
            publicHolidayName: input.publicHolidayName ?? null,
            origin: input.origin
          });
        } catch (emailError) {
          console.warn("[Booking] Failed to send confirmation email:", emailError);
        }
        try {
          await sendAdminNewBookingNotification({
            referenceNumber: booking.referenceNumber,
            clientName: input.clientName,
            clientEmail: input.clientEmail,
            serviceType: input.serviceType,
            pickupAddress: input.pickupAddress,
            dropoffAddress: input.dropoffAddress ?? null,
            pickupDate: input.pickupDate,
            passengerCount: input.passengerCount,
            vehicleName: input.vehicleName,
            rearFacingSeats: input.rearFacingSeats,
            forwardFacingSeats: input.forwardFacingSeats,
            boosterSeats: input.boosterSeats,
            isPetFriendly: input.isPetFriendly,
            numberOfPets: input.numberOfPets ?? null,
            petDescription: input.petDescription ?? null,
            freightDescription: input.freightDescription ?? null,
            freightWeight: input.freightWeight ?? null,
            freightItemCount: input.freightItemCount ?? null,
            freightSpecialHandling: input.freightSpecialHandling ?? null,
            routePreference: input.routePreference ?? "fastest",
            totalPrice: input.totalPrice.toFixed(2),
            paymentMethod: input.paymentMethod,
            paymentStatus: input.paymentMethod === "stripe_prepay" ? "unpaid" : "unpaid",
            specialRequests: input.specialRequests ?? null,
            additionalPickupCount: input.additionalPickupCount ?? 0,
            additionalDropoffCount: input.additionalDropoffCount ?? 0,
            additionalPickupAddresses: input.additionalPickupAddresses ?? [],
            additionalDropoffAddresses: input.additionalDropoffAddresses ?? [],
            publicHolidaySurcharge: input.publicHolidaySurcharge ?? 0,
            publicHolidayName: input.publicHolidayName ?? null,
            origin: input.origin
          });
        } catch (e) {
          console.warn("Failed to send admin new booking notification:", e);
        }
      }
      return { ...booking, checkoutUrl };
    }),
    getByReference: publicProcedure.input(z2.object({ referenceNumber: z2.string() })).query(async ({ input }) => {
      return getBookingByReference(input.referenceNumber);
    }),
    // Admin routes
    list: adminProcedure.input(
      z2.object({
        status: z2.string().optional(),
        paymentStatus: z2.string().optional(),
        search: z2.string().optional(),
        limit: z2.number().optional(),
        offset: z2.number().optional()
      })
    ).query(async ({ input }) => {
      return listBookings(input);
    }),
    getById: adminProcedure.input(z2.object({ id: z2.number() })).query(async ({ input }) => {
      return getBookingById(input.id);
    }),
    updateStatus: adminProcedure.input(
      z2.object({
        id: z2.number(),
        status: z2.enum(["pending", "confirmed", "completed", "cancelled"]),
        adminNotes: z2.string().optional()
      })
    ).mutation(async ({ input }) => {
      return updateBookingStatus(input.id, input.status, input.adminNotes);
    }),
    updatePaymentStatus: adminProcedure.input(
      z2.object({
        id: z2.number(),
        paymentStatus: z2.enum(["unpaid", "paid", "refunded"]),
        paymentNote: z2.string().optional()
      })
    ).mutation(async ({ input }) => {
      const booking = await getBookingById(input.id);
      if (!booking) throw new Error("Booking not found");
      return updateBookingPaymentStatus(input.id, input.paymentStatus, input.paymentNote);
    }),
    stats: adminProcedure.query(async () => {
      return getBookingStats();
    }),
    calendarBookings: adminProcedure.input(z2.object({
      startMs: z2.number(),
      endMs: z2.number()
    })).query(async ({ input }) => {
      return getBookingsByDateRange(input.startMs, input.endMs);
    }),
    // Admin: modify any booking's details
    adminModify: adminProcedure.input(z2.object({
      bookingId: z2.number(),
      pickupAddress: z2.string().optional(),
      dropoffAddress: z2.string().nullable().optional(),
      pickupDate: z2.number().optional(),
      passengerCount: z2.number().min(0).max(7).optional(),
      specialRequests: z2.string().nullable().optional()
    })).mutation(async ({ input }) => {
      const booking = await getBookingById(input.bookingId);
      if (!booking) throw new Error("Booking not found");
      if (input.pickupDate && input.pickupDate < Date.now()) {
        throw new Error("New pickup date must be in the future");
      }
      const changes = [];
      if (input.pickupAddress && input.pickupAddress !== booking.pickupAddress) {
        changes.push(`Pickup: ${booking.pickupAddress} \u2192 ${input.pickupAddress}`);
      }
      if (input.dropoffAddress !== void 0 && input.dropoffAddress !== booking.dropoffAddress) {
        changes.push(`Drop-off: ${booking.dropoffAddress ?? "N/A"} \u2192 ${input.dropoffAddress ?? "N/A"}`);
      }
      if (input.pickupDate && input.pickupDate !== booking.pickupDate) {
        const oldDate = new Date(booking.pickupDate).toLocaleString("en-AU", { timeZone: "Australia/Brisbane" });
        const newDate = new Date(input.pickupDate).toLocaleString("en-AU", { timeZone: "Australia/Brisbane" });
        changes.push(`Date/Time: ${oldDate} \u2192 ${newDate}`);
      }
      if (input.passengerCount && input.passengerCount !== booking.passengerCount) {
        changes.push(`Passengers: ${booking.passengerCount} \u2192 ${input.passengerCount}`);
      }
      if (input.specialRequests !== void 0 && input.specialRequests !== booking.specialRequests) {
        changes.push(`Special requests updated`);
      }
      if (changes.length === 0) {
        return booking;
      }
      const updated = await updateBookingDetails(input.bookingId, {
        pickupAddress: input.pickupAddress,
        dropoffAddress: input.dropoffAddress ?? void 0,
        pickupDate: input.pickupDate,
        passengerCount: input.passengerCount,
        specialRequests: input.specialRequests
      });
      return updated;
    }),
    // Authenticated user: get my bookings by email
    myBookings: protectedProcedure.query(async ({ ctx }) => {
      if (!ctx.user?.email) {
        return [];
      }
      return getBookingsByEmail(ctx.user.email);
    }),
    // Authenticated user: modify their own upcoming booking
    modify: protectedProcedure.input(z2.object({
      bookingId: z2.number(),
      pickupAddress: z2.string().optional(),
      dropoffAddress: z2.string().optional(),
      pickupDate: z2.number().optional(),
      passengerCount: z2.number().min(0).max(7).optional(),
      specialRequests: z2.string().optional()
    })).mutation(async ({ input, ctx }) => {
      const booking = await getBookingById(input.bookingId);
      if (!booking) throw new Error("Booking not found");
      if (booking.clientEmail !== ctx.user?.email) throw new Error("Unauthorized");
      if (booking.status === "cancelled") throw new Error("Cannot modify a cancelled booking");
      if (booking.status === "completed") throw new Error("Cannot modify a completed booking");
      if (booking.pickupDate < Date.now()) {
        throw new Error("Cannot modify a past booking");
      }
      if (input.pickupDate && input.pickupDate < Date.now()) {
        throw new Error("New pickup date must be in the future");
      }
      const changes = [];
      if (input.pickupAddress && input.pickupAddress !== booking.pickupAddress) {
        changes.push(`Pickup: ${booking.pickupAddress} \u2192 ${input.pickupAddress}`);
      }
      if (input.dropoffAddress && input.dropoffAddress !== booking.dropoffAddress) {
        changes.push(`Drop-off: ${booking.dropoffAddress ?? "N/A"} \u2192 ${input.dropoffAddress}`);
      }
      if (input.pickupDate && input.pickupDate !== booking.pickupDate) {
        const oldDate = new Date(booking.pickupDate).toLocaleString("en-AU", { timeZone: "Australia/Brisbane" });
        const newDate = new Date(input.pickupDate).toLocaleString("en-AU", { timeZone: "Australia/Brisbane" });
        changes.push(`Date/Time: ${oldDate} \u2192 ${newDate}`);
      }
      if (input.passengerCount && input.passengerCount !== booking.passengerCount) {
        changes.push(`Passengers: ${booking.passengerCount} \u2192 ${input.passengerCount}`);
      }
      if (input.specialRequests !== void 0 && input.specialRequests !== booking.specialRequests) {
        changes.push(`Special requests updated`);
      }
      if (changes.length === 0) {
        return booking;
      }
      const updated = await updateBookingDetails(input.bookingId, {
        pickupAddress: input.pickupAddress,
        dropoffAddress: input.dropoffAddress,
        pickupDate: input.pickupDate,
        passengerCount: input.passengerCount,
        specialRequests: input.specialRequests
      });
      try {
        await notifyOwner({
          title: `Booking Modified: ${booking.referenceNumber}`,
          content: `Booking ${booking.referenceNumber} modified by ${booking.clientName}.
Changes:
${changes.join("\n")}`
        });
      } catch (e) {
        console.warn("Failed to send modification notification:", e);
      }
      return updated;
    }),
    // Authenticated user: get cancellation policy for a booking
    cancellationPolicy: protectedProcedure.input(z2.object({ bookingId: z2.number() })).query(async ({ input, ctx }) => {
      const booking = await getBookingById(input.bookingId);
      if (!booking) throw new Error("Booking not found");
      if (booking.clientEmail !== ctx.user?.email) throw new Error("Unauthorized");
      const settings = await getAllPricingSettings();
      const chargeSetting = settings.find((s) => s.settingKey === "late_cancel_charge_pct");
      const chargePercent = chargeSetting ? parseFloat(chargeSetting.settingValue) : 50;
      const now = Date.now();
      const hoursUntilPickup = (booking.pickupDate - now) / (1e3 * 60 * 60);
      if (hoursUntilPickup < 4) {
        return { tier: "no_refund", hoursUntilPickup, chargePercent, message: "Cancellations less than 4 hours before pickup are not eligible for a refund." };
      } else if (hoursUntilPickup < 24) {
        return { tier: "partial_charge", hoursUntilPickup, chargePercent, message: `Cancellations less than 24 hours before pickup will incur a ${chargePercent}% charge of the booking fee.` };
      } else {
        return { tier: "free", hoursUntilPickup, chargePercent: 0, message: "Free cancellation \u2014 more than 24 hours before pickup." };
      }
    }),
    // Authenticated user: cancel their own booking
    cancel: protectedProcedure.input(z2.object({
      bookingId: z2.number(),
      reason: z2.string().optional(),
      termsAccepted: z2.boolean(),
      origin: z2.string().optional()
    })).mutation(async ({ input, ctx }) => {
      if (!input.termsAccepted) {
        throw new Error("You must accept the cancellation terms");
      }
      const booking = await getBookingById(input.bookingId);
      if (!booking) throw new Error("Booking not found");
      if (booking.clientEmail !== ctx.user?.email) throw new Error("Unauthorized");
      if (booking.status === "cancelled") throw new Error("Booking is already cancelled");
      if (booking.status === "completed") throw new Error("Cannot cancel a completed booking");
      const settings = await getAllPricingSettings();
      const chargeSetting = settings.find((s) => s.settingKey === "late_cancel_charge_pct");
      const chargePercent = chargeSetting ? parseFloat(chargeSetting.settingValue) : 50;
      const now = Date.now();
      const hoursUntilPickup = (booking.pickupDate - now) / (1e3 * 60 * 60);
      let cancellationNote = "Cancelled by client.";
      if (hoursUntilPickup < 4) {
        cancellationNote = "Cancelled by client (less than 4 hours before pickup \u2014 no refund).";
      } else if (hoursUntilPickup < 24) {
        cancellationNote = `Cancelled by client (less than 24 hours before pickup \u2014 ${chargePercent}% charge applies).`;
      } else {
        cancellationNote = "Cancelled by client (free cancellation).";
      }
      if (input.reason) {
        cancellationNote += ` Reason: ${input.reason}`;
      }
      const updated = await updateBookingStatus(input.bookingId, "cancelled", cancellationNote);
      try {
        await notifyOwner({
          title: `Booking Cancelled: ${booking.referenceNumber}`,
          content: `Booking ${booking.referenceNumber} cancelled by ${booking.clientName}.
${cancellationNote}
Pickup was: ${new Date(booking.pickupDate).toLocaleString("en-AU", { timeZone: "Australia/Brisbane" })}`
        });
      } catch (e) {
        console.warn("Failed to send cancellation notification:", e);
      }
      if (input.origin) {
        try {
          const cancellationTier = hoursUntilPickup < 4 ? "no_refund" : hoursUntilPickup < 24 ? "partial_charge" : "free";
          await sendCancellationConfirmationEmail({
            referenceNumber: booking.referenceNumber,
            clientName: booking.clientName,
            clientEmail: booking.clientEmail,
            serviceType: booking.serviceType,
            pickupAddress: booking.pickupAddress,
            dropoffAddress: booking.dropoffAddress,
            pickupDate: booking.pickupDate,
            totalPrice: booking.totalPrice,
            cancellationTier,
            chargePercent,
            reason: input.reason ?? null,
            origin: input.origin
          });
        } catch (e) {
          console.warn("Failed to send cancellation confirmation email:", e);
        }
        try {
          const cancellationTier = hoursUntilPickup < 4 ? "no_refund" : hoursUntilPickup < 24 ? "partial_charge" : "free";
          await sendAdminCancellationNotification({
            referenceNumber: booking.referenceNumber,
            clientName: booking.clientName,
            clientEmail: booking.clientEmail,
            serviceType: booking.serviceType,
            pickupAddress: booking.pickupAddress,
            dropoffAddress: booking.dropoffAddress,
            pickupDate: booking.pickupDate,
            totalPrice: booking.totalPrice,
            cancellationTier,
            chargePercent,
            reason: input.reason ?? null,
            origin: input.origin
          });
        } catch (e) {
          console.warn("Failed to send admin cancellation notification:", e);
        }
      }
      return updated;
    }),
    // Public: retry payment for an unpaid Stripe booking
    retryPayment: publicProcedure.input(z2.object({
      referenceNumber: z2.string(),
      origin: z2.string()
    })).mutation(async ({ input }) => {
      const booking = await getBookingByReference(input.referenceNumber);
      if (!booking) throw new Error("Booking not found");
      if (booking.paymentMethod !== "stripe_prepay") throw new Error("This booking does not use Stripe payment");
      if (booking.paymentStatus === "paid") throw new Error("This booking has already been paid");
      if (booking.status === "cancelled") throw new Error("Cannot pay for a cancelled booking");
      const serviceLabel = booking.serviceType.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
      const { url, sessionId } = await createCheckoutSession({
        bookingReference: booking.referenceNumber,
        bookingId: booking.id,
        amount: parseFloat(booking.totalPrice ?? "0"),
        customerEmail: booking.clientEmail,
        customerName: booking.clientName,
        serviceDescription: serviceLabel,
        origin: input.origin
      });
      await updateBookingStripeSession(booking.id, sessionId);
      return { checkoutUrl: url };
    })
  }),
  pricing: router({
    // Public: get all pricing settings (for displaying base prices on cards)
    getAll: publicProcedure.query(async () => {
      return getAllPricingSettings();
    }),
    // Public: calculate price for a booking (suburb-based)
    calculate: publicProcedure.input(
      z2.object({
        serviceType: z2.string(),
        pickupSuburb: z2.string(),
        destinationSuburb: z2.string().optional(),
        distanceKm: z2.number().min(0).optional(),
        pickupHour: z2.number().min(0).max(23),
        pickupDateStr: z2.string().regex(/^(\d{4}-\d{2}-\d{2})?$/).optional().default(""),
        needsSupportVan: z2.boolean().default(false),
        paymentMethod: z2.string().default("cash_postpay"),
        hireHours: z2.number().min(0).optional(),
        additionalPickupCount: z2.number().min(0).max(5).default(0),
        additionalDropoffCount: z2.number().min(0).max(5).default(0),
        isPetFriendly: z2.boolean().default(false),
        numberOfPets: z2.number().min(0).default(0),
        freightWeight: z2.string().optional(),
        preferTollFree: z2.boolean().default(false)
      })
    ).query(async ({ input }) => {
      const dbLandmarks = await getActiveLandmarks();
      const resolveLocation = (name) => {
        const staticResult = lookupSuburb(name);
        if (staticResult) return staticResult;
        const cleaned = name.trim().toLowerCase();
        const match = dbLandmarks.find((lm) => lm.name.toLowerCase() === cleaned);
        if (match) {
          return {
            name: match.name,
            lga: match.lga,
            area: classifyLGA(match.lga),
            lat: parseFloat(String(match.lat)),
            lng: parseFloat(String(match.lng)),
            isLandmark: true
          };
        }
        return null;
      };
      const pickupResolved = input.pickupSuburb ? resolveLocation(input.pickupSuburb) : null;
      const destResolved = input.destinationSuburb ? resolveLocation(input.destinationSuburb) : null;
      const pickupArea = pickupResolved?.area ?? "other";
      const destArea = destResolved?.area ?? pickupArea;
      const outOfArea = pickupArea === "secondary" || destArea === "secondary" || pickupArea === "other" || destArea === "other";
      let distanceKm = input.distanceKm ?? 0;
      if (pickupResolved && destResolved) {
        distanceKm = calculateDistance(pickupResolved.lat, pickupResolved.lng, destResolved.lat, destResolved.lng);
      } else if (input.pickupSuburb && input.destinationSuburb) {
        const estimated = estimateDistance(input.pickupSuburb, input.destinationSuburb);
        if (estimated !== null) distanceKm = estimated;
      }
      const breakdown = await calculatePrice({
        serviceType: input.serviceType,
        distanceKm,
        pickupHour: input.pickupHour,
        pickupDateStr: input.pickupDateStr || "",
        isOutOfArea: outOfArea,
        needsSupportVan: input.needsSupportVan,
        paymentMethod: input.paymentMethod,
        hireHours: input.hireHours,
        additionalPickupCount: input.additionalPickupCount,
        additionalDropoffCount: input.additionalDropoffCount,
        isPetFriendly: input.isPetFriendly,
        numberOfPets: input.numberOfPets,
        freightWeight: input.freightWeight,
        pickupSuburb: input.pickupSuburb,
        destinationSuburb: input.destinationSuburb,
        preferTollFree: input.preferTollFree
      });
      return {
        ...breakdown,
        distanceKm,
        isOutOfArea: outOfArea,
        pickupArea,
        destinationArea: input.destinationSuburb ? destArea : null
      };
    }),
    // Public: lookup suburb info (checks static data first, then DB landmarks)
    lookupSuburb: publicProcedure.input(z2.object({ suburb: z2.string() })).query(async ({ input }) => {
      const staticResult = lookupSuburb(input.suburb);
      if (staticResult) return staticResult;
      const dbLandmarks = await getActiveLandmarks();
      const cleaned = input.suburb.trim().toLowerCase();
      const match = dbLandmarks.find((lm) => lm.name.toLowerCase() === cleaned);
      if (match) {
        return {
          name: match.name,
          lga: match.lga,
          area: classifyLGA(match.lga),
          lat: parseFloat(String(match.lat)),
          lng: parseFloat(String(match.lng)),
          isLandmark: true
        };
      }
      return null;
    }),
    // Public: get all suburb names for autocomplete (includes DB landmarks)
    suburbs: publicProcedure.query(async () => {
      const staticNames = getAllSuburbNames();
      const dbLandmarks = await getActiveLandmarks();
      const nameSet = new Set(staticNames.map((n) => n.toLowerCase()));
      const merged = [...staticNames];
      for (const lm of dbLandmarks) {
        if (!nameSet.has(lm.name.toLowerCase())) {
          merged.push(lm.name);
          nameSet.add(lm.name.toLowerCase());
        }
      }
      return merged.sort();
    }),
    // Get all locations (suburbs + landmarks) with type info
    // Merges static SUBURB_DATA with active DB landmarks
    locationsWithType: publicProcedure.query(async () => {
      const staticLocations = getAllLocationsWithType();
      const dbLandmarks = await getActiveLandmarks();
      const existingNames = new Set(staticLocations.map((l) => l.name.toLowerCase()));
      const merged = [...staticLocations];
      for (const lm of dbLandmarks) {
        if (!existingNames.has(lm.name.toLowerCase())) {
          merged.push({ name: lm.name, isLandmark: true, address: lm.address || null });
          existingNames.add(lm.name.toLowerCase());
        } else {
          const existing = merged.find((m) => m.name.toLowerCase() === lm.name.toLowerCase());
          if (existing && lm.address) {
            existing.address = lm.address;
          }
        }
      }
      return merged.sort((a, b) => a.name.localeCompare(b.name));
    }),
    // Admin: update a pricing setting
    update: adminProcedure.input(
      z2.object({
        id: z2.number(),
        value: z2.string(),
        isActive: z2.number().optional()
      })
    ).mutation(async ({ input }) => {
      return updatePricingSetting(input.id, input.value, input.isActive);
    })
  }),
  publicHolidays: router({
    // Public: get active holidays (for booking form to show holiday indicator)
    active: publicProcedure.query(async () => {
      return getActivePublicHolidays();
    }),
    // Admin: list all holidays (including inactive)
    list: adminProcedure.query(async () => {
      return getAllPublicHolidays();
    }),
    // Admin: create a new holiday
    create: adminProcedure.input(z2.object({
      name: z2.string().min(1, "Holiday name is required"),
      date: z2.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD"),
      isRecurring: z2.number().min(0).max(1).default(0),
      isActive: z2.number().min(0).max(1).default(1)
    })).mutation(async ({ input }) => {
      return createPublicHoliday(input);
    }),
    // Admin: update a holiday
    update: adminProcedure.input(z2.object({
      id: z2.number(),
      name: z2.string().optional(),
      date: z2.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
      isRecurring: z2.number().min(0).max(1).optional(),
      isActive: z2.number().min(0).max(1).optional()
    })).mutation(async ({ input }) => {
      const { id, ...data } = input;
      return updatePublicHoliday(id, data);
    }),
    // Admin: delete a holiday
    delete: adminProcedure.input(z2.object({ id: z2.number() })).mutation(async ({ input }) => {
      await deletePublicHoliday(input.id);
      return { success: true };
    })
  }),
  reviews: router({
    // Public: get approved reviews for homepage testimonials
    approved: publicProcedure.query(async () => {
      return getApprovedReviews();
    }),
    // Public: get aggregate stats (average rating + count of approved reviews)
    publicStats: publicProcedure.query(async () => {
      return getReviewStats();
    }),
    // Public: check if a booking already has a review
    checkBooking: publicProcedure.input(z2.object({ bookingId: z2.number() })).query(async ({ input }) => {
      const review = await getReviewByBookingId(input.bookingId);
      return { hasReview: !!review, review };
    }),
    // Protected: submit a review (logged-in users only, for completed bookings)
    submit: protectedProcedure.input(z2.object({
      bookingId: z2.number(),
      rating: z2.number().min(1).max(5),
      comment: z2.string().max(1e3).optional()
    })).mutation(async ({ input, ctx }) => {
      const booking = await getBookingById(input.bookingId);
      if (!booking) throw new Error("Booking not found");
      if (booking.clientEmail !== ctx.user.email) throw new Error("You can only review your own bookings");
      if (booking.status !== "completed") throw new Error("You can only review completed bookings");
      const existing = await getReviewByBookingId(input.bookingId);
      if (existing) throw new Error("You have already reviewed this booking");
      const review = await createReview({
        bookingId: input.bookingId,
        bookingReference: booking.referenceNumber,
        userId: ctx.user.id,
        reviewerName: booking.clientName,
        rating: input.rating,
        comment: input.comment ?? null,
        serviceType: booking.serviceType
      });
      try {
        await notifyOwner({
          title: `New Review: ${input.rating} stars`,
          content: `${booking.clientName} left a ${input.rating}-star review for booking ${booking.referenceNumber}.
${input.comment ? `Comment: ${input.comment}` : "No comment."}

Review is pending approval.`
        });
      } catch (e) {
        console.warn("Failed to send review notification:", e);
      }
      return { success: true, review };
    }),
    // Admin: list all reviews
    list: adminProcedure.input(z2.object({
      status: z2.string().optional(),
      limit: z2.number().optional(),
      offset: z2.number().optional()
    })).query(async ({ input }) => {
      return listReviews(input);
    }),
    // Admin: get review stats
    stats: adminProcedure.query(async () => {
      return getReviewStats();
    }),
    // Admin: get single review
    getById: adminProcedure.input(z2.object({ id: z2.number() })).query(async ({ input }) => {
      return getReviewById(input.id);
    }),
    // Admin: update review status (approve/reject)
    updateStatus: adminProcedure.input(z2.object({
      id: z2.number(),
      status: z2.enum(["pending", "approved", "rejected"]),
      adminNotes: z2.string().optional()
    })).mutation(async ({ input }) => {
      return updateReviewStatus(input.id, input.status, input.adminNotes);
    }),
    // Admin: delete a review
    delete: adminProcedure.input(z2.object({ id: z2.number() })).mutation(async ({ input }) => {
      await deleteReview(input.id);
      return { success: true };
    })
  }),
  googleReviews: router({
    // Public: get Google reviews (cached, auto-refreshes every 24h)
    get: publicProcedure.query(async () => {
      const placeId = await getAppSetting("google_place_id");
      if (!placeId) return { reviews: [], rating: 0, totalRatings: 0, configured: false };
      const CACHE_TTL = 24 * 60 * 60 * 1e3;
      const cacheAge = await getGoogleReviewsCacheAge(placeId);
      if (cacheAge !== null && cacheAge < CACHE_TTL) {
        const cached = await getCachedGoogleReviews(placeId);
        const avgRating = cached.length > 0 ? Math.round(cached.reduce((sum, r) => sum + r.rating, 0) / cached.length * 10) / 10 : 0;
        return {
          reviews: cached.map((r) => ({
            id: r.id,
            authorName: r.authorName,
            rating: r.rating,
            text: r.text,
            relativeTimeDescription: r.relativeTimeDescription,
            publishTime: r.publishTime,
            profilePhotoUrl: r.profilePhotoUrl,
            source: "google"
          })),
          rating: avgRating,
          totalRatings: cached.length,
          configured: true
        };
      }
      try {
        const result = await makeRequest(
          "/maps/api/place/details/json",
          { place_id: placeId, fields: "reviews,rating,user_ratings_total" }
        );
        if (result.status !== "OK" || !result.result) {
          const cached = await getCachedGoogleReviews(placeId);
          const avgRating = cached.length > 0 ? Math.round(cached.reduce((sum, r) => sum + r.rating, 0) / cached.length * 10) / 10 : 0;
          return {
            reviews: cached.map((r) => ({
              id: r.id,
              authorName: r.authorName,
              rating: r.rating,
              text: r.text,
              relativeTimeDescription: r.relativeTimeDescription,
              publishTime: r.publishTime,
              profilePhotoUrl: r.profilePhotoUrl,
              source: "google"
            })),
            rating: avgRating,
            totalRatings: cached.length,
            configured: true
          };
        }
        const googleReviews = result.result.reviews ?? [];
        await clearGoogleReviewsCache(placeId);
        if (googleReviews.length > 0) {
          await insertGoogleReviews(googleReviews.map((r) => ({
            placeId,
            authorName: r.author_name || "Anonymous",
            rating: r.rating,
            text: r.text || null,
            relativeTimeDescription: null,
            publishTime: r.time ? r.time * 1e3 : null,
            profilePhotoUrl: null
          })));
        }
        return {
          reviews: googleReviews.map((r, i) => ({
            id: i + 1,
            authorName: r.author_name || "Anonymous",
            rating: r.rating,
            text: r.text || null,
            relativeTimeDescription: null,
            publishTime: r.time ? r.time * 1e3 : null,
            profilePhotoUrl: null,
            source: "google"
          })),
          rating: result.result.rating ?? 0,
          totalRatings: result.result.user_ratings_total ?? 0,
          configured: true
        };
      } catch (error) {
        console.error("[GoogleReviews] Failed to fetch:", error);
        const cached = await getCachedGoogleReviews(placeId);
        const avgRating = cached.length > 0 ? Math.round(cached.reduce((sum, r) => sum + r.rating, 0) / cached.length * 10) / 10 : 0;
        return {
          reviews: cached.map((r) => ({
            id: r.id,
            authorName: r.authorName,
            rating: r.rating,
            text: r.text,
            relativeTimeDescription: r.relativeTimeDescription,
            publishTime: r.publishTime,
            profilePhotoUrl: r.profilePhotoUrl,
            source: "google"
          })),
          rating: avgRating,
          totalRatings: cached.length,
          configured: true
        };
      }
    }),
    // Admin: get current Google Place ID setting
    getPlaceId: adminProcedure.query(async () => {
      const placeId = await getAppSetting("google_place_id");
      return { placeId: placeId ?? "" };
    }),
    // Admin: update Google Place ID
    setPlaceId: adminProcedure.input(z2.object({ placeId: z2.string() })).mutation(async ({ input }) => {
      await setAppSetting("google_place_id", input.placeId);
      if (input.placeId) {
        await clearGoogleReviewsCache(input.placeId);
      }
      return { success: true };
    }),
    // Admin: force refresh Google reviews cache
    refresh: adminProcedure.mutation(async () => {
      const placeId = await getAppSetting("google_place_id");
      if (!placeId) throw new Error("Google Place ID not configured");
      const result = await makeRequest(
        "/maps/api/place/details/json",
        { place_id: placeId, fields: "reviews,rating,user_ratings_total" }
      );
      if (result.status !== "OK" || !result.result) {
        throw new Error("Failed to fetch reviews from Google");
      }
      const googleReviews = result.result.reviews ?? [];
      await clearGoogleReviewsCache(placeId);
      if (googleReviews.length > 0) {
        await insertGoogleReviews(googleReviews.map((r) => ({
          placeId,
          authorName: r.author_name || "Anonymous",
          rating: r.rating,
          text: r.text || null,
          relativeTimeDescription: null,
          publishTime: r.time ? r.time * 1e3 : null,
          profilePhotoUrl: null
        })));
      }
      return {
        success: true,
        count: googleReviews.length,
        rating: result.result.rating ?? 0,
        totalRatings: result.result.user_ratings_total ?? 0
      };
    })
  }),
  enquiries: router({
    // Public: submit an enquiry (no login required)
    submit: publicProcedure.input(z2.object({
      name: z2.string().min(1, "Name is required"),
      email: z2.string().email("Valid email is required"),
      phone: z2.string().optional(),
      subject: z2.string().min(1, "Subject is required"),
      message: z2.string().min(10, "Message must be at least 10 characters")
    })).mutation(async ({ input }) => {
      const enquiry = await createEnquiry({
        name: input.name,
        email: input.email,
        phone: input.phone ?? null,
        subject: input.subject,
        message: input.message
      });
      try {
        await notifyOwner({
          title: `New Enquiry: ${input.subject}`,
          content: `New enquiry from ${input.name} (${input.email})
Subject: ${input.subject}

${input.message}`
        });
      } catch (e) {
        console.warn("Failed to send enquiry notification:", e);
      }
      return { success: true, id: enquiry.id };
    }),
    // Admin: list all enquiries
    list: adminProcedure.input(
      z2.object({
        status: z2.string().optional(),
        limit: z2.number().optional(),
        offset: z2.number().optional()
      })
    ).query(async ({ input }) => {
      return listEnquiries(input);
    }),
    // Admin: get single enquiry
    getById: adminProcedure.input(z2.object({ id: z2.number() })).query(async ({ input }) => {
      const enquiry = await getEnquiryById(input.id);
      if (enquiry && enquiry.status === "new") {
        return updateEnquiryStatus(input.id, "read");
      }
      return enquiry;
    }),
    // Admin: update enquiry status
    updateStatus: adminProcedure.input(z2.object({
      id: z2.number(),
      status: z2.enum(["new", "read", "replied", "archived"]),
      adminNotes: z2.string().optional()
    })).mutation(async ({ input }) => {
      return updateEnquiryStatus(input.id, input.status, input.adminNotes);
    }),
    // Admin: get enquiry stats
    stats: adminProcedure.query(async () => {
      return getEnquiryStats();
    })
  }),
  landmarks: router({
    // Public: get active landmarks for autocomplete
    active: publicProcedure.query(async () => {
      return getActiveLandmarks();
    }),
    // Admin: list all landmarks (including inactive)
    list: adminProcedure.query(async () => {
      return getAllLandmarks();
    }),
    // Admin: get landmark stats
    stats: adminProcedure.query(async () => {
      return getLandmarkStats();
    }),
    // Admin: get single landmark by ID
    getById: adminProcedure.input(z2.object({ id: z2.number() })).query(async ({ input }) => {
      return getLandmarkById(input.id);
    }),
    // Admin: create a new landmark
    create: adminProcedure.input(z2.object({
      name: z2.string().min(1, "Landmark name is required"),
      lat: z2.string().regex(/^-?\d+\.\d+$/, "Latitude must be a decimal number"),
      lng: z2.string().regex(/^-?\d+\.\d+$/, "Longitude must be a decimal number"),
      lga: z2.string().min(1, "LGA is required"),
      category: z2.enum(["resort", "golf_course", "venue", "hospital", "university", "airport", "shopping", "stadium", "theme_park", "attraction", "other"]),
      address: z2.string().max(500).optional(),
      isActive: z2.number().min(0).max(1).default(1)
    })).mutation(async ({ input }) => {
      return createLandmark(input);
    }),
    // Admin: update a landmark
    update: adminProcedure.input(z2.object({
      id: z2.number(),
      name: z2.string().optional(),
      lat: z2.string().optional(),
      lng: z2.string().optional(),
      lga: z2.string().optional(),
      category: z2.enum(["resort", "golf_course", "venue", "hospital", "university", "airport", "shopping", "stadium", "theme_park", "attraction", "other"]).optional(),
      address: z2.string().max(500).optional(),
      isActive: z2.number().min(0).max(1).optional()
    })).mutation(async ({ input }) => {
      const { id, ...data } = input;
      return updateLandmark(id, data);
    }),
    // Admin: toggle landmark active/inactive
    toggleActive: adminProcedure.input(z2.object({ id: z2.number() })).mutation(async ({ input }) => {
      return toggleLandmarkActive(input.id);
    }),
    // Admin: delete a landmark
    delete: adminProcedure.input(z2.object({ id: z2.number() })).mutation(async ({ input }) => {
      await deleteLandmark(input.id);
      return { success: true };
    })
  })
});

// server/_core/context.ts
async function createContext(opts) {
  let user = null;
  try {
    user = await authenticateRequest(opts.req);
  } catch (error) {
    user = null;
  }
  return {
    req: opts.req,
    res: opts.res,
    user
  };
}

// server/_core/vite.ts
import express from "express";
import fs from "fs";
import { nanoid } from "nanoid";
import path from "path";
async function setupVite(app, server) {
  const { createServer: createViteServer } = await import("vite");
  const { default: react } = await import("@vitejs/plugin-react");
  const { default: tailwindcss } = await import("@tailwindcss/vite");
  const serverOptions = {
    middlewareMode: true,
    hmr: { server },
    allowedHosts: true
  };
  const vite = await createViteServer({
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        "@": path.resolve(import.meta.dirname, "../..", "client", "src"),
        "@shared": path.resolve(import.meta.dirname, "../..", "shared"),
        "@assets": path.resolve(import.meta.dirname, "../..", "attached_assets")
      }
    },
    envDir: path.resolve(import.meta.dirname, "../.."),
    root: path.resolve(import.meta.dirname, "../..", "client"),
    publicDir: path.resolve(import.meta.dirname, "../..", "client", "public"),
    configFile: false,
    server: serverOptions,
    appType: "custom"
  });
  app.use(vite.middlewares);
  app.use("*", async (req, res, next) => {
    const url = req.originalUrl;
    try {
      const clientTemplate = path.resolve(
        import.meta.dirname,
        "../..",
        "client",
        "index.html"
      );
      let template = await fs.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}"`
      );
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e);
      next(e);
    }
  });
}
function serveStatic(app) {
  const distPath = process.env.NODE_ENV === "development" ? path.resolve(import.meta.dirname, "../..", "dist", "public") : path.resolve(import.meta.dirname, "public");
  if (!fs.existsSync(distPath)) {
    console.error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`
    );
  }
  app.use(express.static(distPath));
  app.use("*", (_req, res) => {
    res.sendFile(path.resolve(distPath, "index.html"));
  });
}

// server/_core/index.ts
init_db();
function isPortAvailable(port) {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}
async function findAvailablePort(startPort = 3e3) {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found starting from ${startPort}`);
}
async function startServer() {
  const app = express2();
  const server = createServer(app);
  app.post("/api/stripe/webhook", express2.raw({ type: "application/json" }), async (req, res) => {
    const signature = req.headers["stripe-signature"];
    try {
      const event = constructWebhookEvent(req.body, signature);
      if (event.id.startsWith("evt_test_")) {
        console.log("[Webhook] Test event detected, returning verification response");
        return res.json({ verified: true });
      }
      console.log(`[Webhook] Received event: ${event.type} (${event.id})`);
      switch (event.type) {
        case "checkout.session.completed": {
          const session = event.data.object;
          const bookingId = session.metadata?.booking_id;
          const paymentStatus = session.payment_status;
          if (bookingId && paymentStatus === "paid") {
            await updateBookingPaymentStatus(parseInt(bookingId), "paid");
            console.log(`[Webhook] Payment completed for booking ${bookingId}`);
            try {
              const booking = await getBookingById(parseInt(bookingId));
              if (booking) {
                await sendPaymentReceiptEmail({
                  referenceNumber: booking.referenceNumber,
                  clientName: booking.clientName,
                  clientEmail: booking.clientEmail,
                  serviceType: booking.serviceType,
                  pickupAddress: booking.pickupAddress,
                  dropoffAddress: booking.dropoffAddress,
                  pickupDate: booking.pickupDate,
                  passengerCount: booking.passengerCount,
                  vehicleName: booking.vehicleName,
                  totalPrice: booking.totalPrice ?? "0",
                  paymentMethod: booking.paymentMethod ?? "stripe_prepay",
                  isPetFriendly: booking.isPetFriendly === 1,
                  numberOfPets: booking.numberOfPets,
                  petDescription: booking.petDescription,
                  publicHolidayName: booking.publicHolidayName,
                  publicHolidaySurcharge: booking.publicHolidaySurcharge,
                  routePreference: booking.routePreference ?? void 0
                });
              }
            } catch (emailErr) {
              console.warn(`[Webhook] Failed to send payment receipt email for booking ${bookingId}:`, emailErr);
            }
          }
          break;
        }
        case "checkout.session.expired": {
          const session = event.data.object;
          const bookingId = session.metadata?.booking_id;
          if (bookingId) {
            console.log(`[Webhook] Checkout session expired for booking ${bookingId}`);
          }
          break;
        }
        case "payment_intent.payment_failed": {
          const paymentIntent = event.data.object;
          const failureMessage = paymentIntent.last_payment_error?.message ?? "Unknown error";
          console.log(`[Webhook] Payment failed: ${failureMessage}`);
          break;
        }
        default:
          console.log(`[Webhook] Unhandled event type: ${event.type}`);
      }
      res.json({ received: true });
    } catch (err) {
      console.error("[Webhook] Error:", err.message);
      res.status(400).send(`Webhook Error: ${err.message}`);
    }
  });
  app.use(express2.json({ limit: "50mb" }));
  app.use(express2.urlencoded({ limit: "50mb", extended: true }));
  app.get("/api/health", async (req, res) => {
    const { getDb: getDb2 } = await Promise.resolve().then(() => (init_db(), db_exports));
    try {
      const db = await getDb2();
      if (!db) {
        return res.json({ status: "error", message: "Database not initialized", dbUrl: process.env.DATABASE_URL ? "SET" : "NOT SET" });
      }
      const { sql: sql2 } = await import("drizzle-orm");
      const result = await db.execute(sql2`SELECT 1 as ok`);
      return res.json({ status: "ok", db: "connected" });
    } catch (err) {
      return res.json({ status: "error", message: err.message, code: err.code });
    }
  });
  registerAuthRoutes(app);
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext
    })
  );
  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }
  const preferredPort = parseInt(process.env.PORT || "3000");
  const port = await findAvailablePort(preferredPort);
  if (port !== preferredPort) {
    console.log(`Port ${preferredPort} is busy, using port ${port} instead`);
  }
  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);
  });
}
startServer().catch(console.error);
