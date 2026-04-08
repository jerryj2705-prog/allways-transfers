import mysql from "mysql2/promise";

const conn = await mysql.createConnection(process.env.DATABASE_URL);

// Check if the new setting already exists
const [existing] = await conn.execute(
  "SELECT id FROM pricing_settings WHERE settingKey = 'distance_surcharge_per_50km'"
);

if (existing.length === 0) {
  // Insert the new tiered distance surcharge setting
  await conn.execute(
    `INSERT INTO pricing_settings (settingKey, settingValue, label, description, category, isActive)
     VALUES ('distance_surcharge_per_50km', 25.00, 'Distance Surcharge (per 50km)', 'Surcharge per additional 50km block beyond the first 50km', 'surcharge', 1)`
  );
  console.log("Inserted distance_surcharge_per_50km = $25.00");
} else {
  console.log("distance_surcharge_per_50km already exists, skipping.");
}

// Deactivate the old rate_per_km setting (keep it for reference but don't use it)
const [oldSetting] = await conn.execute(
  "SELECT id FROM pricing_settings WHERE settingKey = 'rate_per_km'"
);
if (oldSetting.length > 0) {
  await conn.execute(
    "UPDATE pricing_settings SET isActive = 0 WHERE settingKey = 'rate_per_km'"
  );
  console.log("Deactivated old rate_per_km setting.");
}

await conn.end();
