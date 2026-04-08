import mysql from "mysql2/promise";
import dotenv from "dotenv";
dotenv.config();

const conn = await mysql.createConnection(process.env.DATABASE_URL);

await conn.execute(
  `INSERT INTO pricing_settings (settingKey, settingValue, label, description, category, isActive)
   VALUES (?, ?, ?, ?, ?, 1)
   ON DUPLICATE KEY UPDATE label = VALUES(label), description = VALUES(description)`,
  ["min_hourly_hours", "3", "Hourly Hire – Minimum Hours", "Minimum number of hours required for Hourly Hire bookings", "rate"]
);
console.log("✓ min_hourly_hours seeded with default value of 3");

await conn.end();
