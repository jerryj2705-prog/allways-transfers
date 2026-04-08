import mysql from "mysql2/promise";

const conn = await mysql.createConnection(process.env.DATABASE_URL);

// Check if the setting already exists
const [rows] = await conn.execute(
  "SELECT id FROM pricing_settings WHERE settingKey = 'late_cancel_charge_pct'"
);

if (rows.length === 0) {
  await conn.execute(
    `INSERT INTO pricing_settings (settingKey, settingValue, label, description, category, isActive)
     VALUES ('late_cancel_charge_pct', 50.00, 'Late Cancellation Charge', 'Percentage of booking fee charged for cancellations less than 24 hours before pickup', 'surcharge', 1)`
  );
  console.log("Inserted late_cancel_charge_pct = 50%");
} else {
  console.log("late_cancel_charge_pct already exists, skipping.");
}

await conn.end();
