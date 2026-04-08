import mysql from "mysql2/promise";
import dotenv from "dotenv";
dotenv.config();

const conn = await mysql.createConnection(process.env.DATABASE_URL);

const settings = [
  // Base prices per service
  { settingKey: "base_airport_transfer", settingValue: 95.00, label: "Airport Transfer – Base Price", description: "Starting price for airport transfer service", category: "base_price" },
  { settingKey: "base_hourly_hire", settingValue: 85.00, label: "Hourly Hire – Base Price (per hour)", description: "Hourly rate for chauffeur hire service", category: "base_price" },
  { settingKey: "base_point_to_point", settingValue: 75.00, label: "Point to Point – Base Price", description: "Starting price for point-to-point transfers", category: "base_price" },
  { settingKey: "base_special_events", settingValue: 150.00, label: "Special Events – Base Price", description: "Starting price for weddings, corporate events, funerals", category: "base_price" },
  // Per-km rate
  { settingKey: "rate_per_km", settingValue: 2.50, label: "Per Kilometre Rate", description: "Additional charge per kilometre travelled", category: "rate" },
  // Support van rate
  { settingKey: "rate_support_van", settingValue: 120.00, label: "Support Van – Base Price", description: "Base price for support van (large luggage / freight)", category: "rate" },
  // Surcharges
  { settingKey: "surcharge_out_of_hours", settingValue: 25.00, label: "Out-of-Hours Pickup Surcharge", description: "Applied for pickups between 8pm and 6am", category: "surcharge" },
  { settingKey: "surcharge_out_of_area", settingValue: 50.00, label: "Out-of-Area Surcharge", description: "Applied for pickups/drop-offs outside primary service area", category: "surcharge" },
  { settingKey: "surcharge_fuel_levy", settingValue: 5.00, label: "Fuel Levy Surcharge (%)", description: "Percentage-based fuel levy applied to base + distance charges. Set to 0 to disable.", category: "toggle" },
];

for (const s of settings) {
  await conn.execute(
    `INSERT INTO pricing_settings (settingKey, settingValue, label, description, category, isActive)
     VALUES (?, ?, ?, ?, ?, 1)
     ON DUPLICATE KEY UPDATE settingValue = VALUES(settingValue), label = VALUES(label), description = VALUES(description)`,
    [s.settingKey, s.settingValue, s.label, s.description, s.category]
  );
  console.log(`✓ ${s.label}: $${s.settingValue}`);
}

console.log("\nAll pricing settings seeded successfully!");
await conn.end();
