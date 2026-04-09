import mysql from "mysql2/promise";

const conn = await mysql.createConnection(process.env.DATABASE_URL);

// Create the public_holidays table
await conn.execute(`
  CREATE TABLE IF NOT EXISTS \`public_holidays\` (
    \`id\` int AUTO_INCREMENT NOT NULL,
    \`name\` varchar(200) NOT NULL,
    \`date\` varchar(10) NOT NULL,
    \`isRecurring\` int NOT NULL DEFAULT 0,
    \`isActive\` int NOT NULL DEFAULT 1,
    \`createdAt\` timestamp NOT NULL DEFAULT (now()),
    \`updatedAt\` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT \`public_holidays_id\` PRIMARY KEY(\`id\`)
  )
`);

console.log("✅ public_holidays table created");

// Insert surcharge_public_holiday pricing setting if it doesn't exist
const [existing] = await conn.execute(
  "SELECT id FROM pricing_settings WHERE settingKey = 'surcharge_public_holiday'"
);
if (existing.length === 0) {
  await conn.execute(
    `INSERT INTO pricing_settings (settingKey, settingValue, label, description, category, isActive)
     VALUES ('surcharge_public_holiday', '25.00', 'Public Holiday Surcharge', 'Flat surcharge applied when pickup date falls on a public holiday', 'surcharge', 1)`
  );
  console.log("✅ surcharge_public_holiday pricing setting inserted");
} else {
  console.log("ℹ️ surcharge_public_holiday pricing setting already exists");
}

// Seed Queensland public holidays
const holidays = [
  // Recurring holidays (same date every year)
  { name: "New Year's Day", date: "2026-01-01", isRecurring: 1 },
  { name: "Australia Day", date: "2026-01-26", isRecurring: 1 },
  { name: "Anzac Day", date: "2026-04-25", isRecurring: 1 },
  { name: "Christmas Day", date: "2025-12-25", isRecurring: 1 },
  { name: "Boxing Day", date: "2025-12-26", isRecurring: 1 },

  // 2025 non-recurring holidays
  { name: "Good Friday", date: "2025-04-18", isRecurring: 0 },
  { name: "Easter Saturday", date: "2025-04-19", isRecurring: 0 },
  { name: "Easter Monday", date: "2025-04-21", isRecurring: 0 },
  { name: "Queen's Birthday", date: "2025-10-27", isRecurring: 0 },
  { name: "Royal Queensland Show (Brisbane)", date: "2025-08-13", isRecurring: 0 },

  // 2026 non-recurring holidays
  { name: "Good Friday", date: "2026-04-03", isRecurring: 0 },
  { name: "Easter Saturday", date: "2026-04-04", isRecurring: 0 },
  { name: "Easter Monday", date: "2026-04-06", isRecurring: 0 },
  { name: "Queen's Birthday", date: "2026-10-26", isRecurring: 0 },
  { name: "Royal Queensland Show (Brisbane)", date: "2026-08-12", isRecurring: 0 },

  // 2027 non-recurring holidays
  { name: "Good Friday", date: "2027-03-26", isRecurring: 0 },
  { name: "Easter Saturday", date: "2027-03-27", isRecurring: 0 },
  { name: "Easter Monday", date: "2027-03-29", isRecurring: 0 },
  { name: "Queen's Birthday", date: "2027-10-25", isRecurring: 0 },
  { name: "Royal Queensland Show (Brisbane)", date: "2027-08-11", isRecurring: 0 },
];

for (const h of holidays) {
  const [dup] = await conn.execute(
    "SELECT id FROM public_holidays WHERE name = ? AND date = ?",
    [h.name, h.date]
  );
  if (dup.length === 0) {
    await conn.execute(
      "INSERT INTO public_holidays (name, date, isRecurring, isActive) VALUES (?, ?, ?, 1)",
      [h.name, h.date, h.isRecurring]
    );
    console.log(`  ✅ ${h.name} (${h.date})`);
  } else {
    console.log(`  ℹ️ ${h.name} (${h.date}) already exists`);
  }
}

console.log("\n✅ All Queensland public holidays seeded");
await conn.end();
