/**
 * Seed script: Extract all hardcoded landmarks from SUBURB_DATA and insert into the landmarks DB table.
 * Run with: node scripts/seed-landmarks.mjs
 */

import mysql from "mysql2/promise";

// Category mapping based on landmark name patterns
function categorize(name) {
  const n = name.toLowerCase();
  // Airports
  if (n.includes("airport")) return "airport";
  // Hospitals
  if (n.includes("hospital") || n === "rbwh" || n.includes("pa hospital")) return "hospital";
  // Universities
  if (n.includes("university") || n.includes("usc ") || n.includes("uq ") || n.includes("qut ") || n.includes("usq ") || n.includes("griffith university") || n.includes("bond university")) return "university";
  // Theme parks / attractions
  if (["dreamworld", "movie world", "sea world", "wet'n'wild", "whitewater world", "australia zoo", "aussie world", "sea life sunshine coast", "big pineapple", "lone pine koala sanctuary", "currumbin wildlife sanctuary"].some(t => n.includes(t) || n === t)) return "theme_park";
  // Stadiums
  if (n.includes("stadium") || n.includes("the gabba") || n.includes("showgrounds")) return "stadium";
  // Shopping centres
  if (n.includes("plaza") || n.includes("shopping") || n.includes("westfield") || n.includes("dfo ") || n.includes("stockland") || n.includes("harbour town") || n.includes("riverlink") || n.includes("orion ") || n.includes("grand central") || n.includes("pacific fair") || n.includes("robina town") || n.includes("noosa civic") || n.includes("noosa junction")) return "shopping";
  // Golf courses
  if (n.includes("golf")) return "golf_course";
  // Resorts / accommodation
  if (n.includes("resort") || n.includes("retreat") || n.includes("manor") || n.includes("b&b") || n.includes("ecolodge") || n.includes("eco lodge") || n.includes("cabins") || n.includes("oceans mooloolaba") || n.includes("sea pearl") || n.includes("mantra ") || n.includes("novotel") || n.includes("palmer coolum") || n.includes("ramada") || n.includes("rumba beach") || n.includes("oaks seaforth") || n.includes("spicers clovelly") || n.includes("narrows escape") || n.includes("flaxton gardens") || n.includes("secrets on the lake") || n.includes("montville country") || n.includes("kondalilla eco") || n.includes("glass house mountains eco") || n.includes("surfair marcoola") || n.includes("sofitel") || n.includes("netanya") || n.includes("peppers") || n.includes("seahaven") || n.includes("south pacific resort") || n.includes("tingirana") || n.includes("sun lagoon") || n.includes("elysium") || n.includes("eumarella") || n.includes("racv")) return "resort";
  // Venues / event centres / function centres
  if (n.includes("convention") || n.includes("surf club") || n.includes("rsl") || n.includes("pier ") || n.includes("wharf") || n.includes("boathouse") || n.includes("the j ") || n.includes("surfair events") || n.includes("clios") || n.includes("spicers tamarind") || n.includes("maleny manor") || n.includes("tiffany") || n.includes("weddings at") || n.includes("ginger factory") || n.includes("venue 114") || n.includes("lake kawana") || n.includes("peregian beach hotel") || n.includes("rickys") || n.includes("eat street") || n.includes("howard smith") || n.includes("eagle street") || n.includes("star casino") || n.includes("treasury casino") || n.includes("queens wharf") || n.includes("entertainment centre") || n.includes("qpac")) return "venue";
  // Attractions / points of interest
  if (n.includes("beach") || n.includes("national park") || n.includes("falls") || n.includes("lookout") || n.includes("botanic") || n.includes("parkland") || n.includes("park") || n.includes("esplanade") || n.includes("village") || n.includes("markets") || n.includes("marina") || n.includes("hastings street") || n.includes("queen street") || n.includes("skypoint") || n.includes("springbrook") || n.includes("museum") || n.includes("goma") || n.includes("state library") || n.includes("city hall") || n.includes("cruise terminal") || n.includes("portside") || n.includes("observation")) return "attraction";
  return "other";
}

// All landmark entries from SUBURB_DATA (everything from LANDMARK_START_INDEX onward)
const LANDMARKS = [
  // Sunshine Coast Landmarks
  ["Sunshine Coast Airport", "Sunshine Coast", -26.604, 153.091],
  ["Sunshine Coast University Hospital", "Sunshine Coast", -26.737, 153.112],
  ["Sunshine Coast University", "Sunshine Coast", -26.718, 153.063],
  ["USC Sunshine Coast", "Sunshine Coast", -26.718, 153.063],
  ["Sunshine Plaza", "Sunshine Coast", -26.654, 153.070],
  ["Stockland Caloundra", "Sunshine Coast", -26.798, 153.130],
  ["Big Pineapple", "Sunshine Coast", -26.670, 153.000],
  ["Australia Zoo", "Sunshine Coast", -26.836, 152.960],
  ["Aussie World", "Sunshine Coast", -26.810, 153.020],
  ["SEA LIFE Sunshine Coast", "Sunshine Coast", -26.654, 153.100],
  ["Nambour General Hospital", "Sunshine Coast", -26.628, 152.960],
  ["Buderim Private Hospital", "Sunshine Coast", -26.680, 153.050],
  ["Caloundra Private Hospital", "Sunshine Coast", -26.798, 153.125],
  ["Kawana Shoppingworld", "Sunshine Coast", -26.720, 153.118],
  ["Noosa Civic", "Noosa", -26.395, 153.050],
  ["Noosa Junction", "Noosa", -26.385, 153.070],
  ["Noosa Main Beach", "Noosa", -26.378, 153.090],
  ["Noosa National Park", "Noosa", -26.380, 153.098],
  ["Hastings Street Noosa", "Noosa", -26.380, 153.088],
  ["Noosa Marina", "Noosa", -26.393, 153.058],
  ["Eumundi Markets", "Noosa", -26.478, 152.952],
  // Resorts
  ["RACV Noosa Resort", "Noosa", -26.393, 153.065],
  ["Sofitel Noosa Pacific Resort", "Noosa", -26.379, 153.088],
  ["Netanya Noosa Beachfront Resort", "Noosa", -26.380, 153.089],
  ["Peppers Noosa Resort & Villas", "Noosa", -26.394, 153.068],
  ["Noosa Springs Golf & Spa Resort", "Noosa", -26.398, 153.058],
  ["Seahaven Beachfront Resort Noosa", "Noosa", -26.380, 153.087],
  ["South Pacific Resort Noosa", "Noosa", -26.380, 153.085],
  ["Noosa Lakes Resort", "Noosa", -26.400, 153.055],
  ["Noosa Blue Resort", "Noosa", -26.388, 153.078],
  ["Tingirana Noosa", "Noosa", -26.380, 153.086],
  ["Sun Lagoon Resort Noosa", "Noosa", -26.393, 153.060],
  ["Elysium Noosa Resort", "Noosa", -26.379, 153.087],
  ["Noosa Eco Retreat", "Noosa", -26.410, 153.010],
  ["Eumarella Shores Noosa Lake Retreat", "Noosa", -26.420, 153.000],
  ["Noosa Valley Manor B&B", "Noosa", -26.410, 153.020],
  ["Oceans Mooloolaba", "Sunshine Coast", -26.684, 153.120],
  ["Sea Pearl Resort Mooloolaba", "Sunshine Coast", -26.683, 153.118],
  ["Mantra Mooloolaba Beach", "Sunshine Coast", -26.682, 153.119],
  ["Novotel Sunshine Coast Resort", "Sunshine Coast", -26.640, 153.078],
  ["Palmer Coolum Resort", "Sunshine Coast", -26.540, 153.080],
  ["Ramada Resort Marcoola", "Sunshine Coast", -26.590, 153.090],
  ["Rumba Beach Resort Caloundra", "Sunshine Coast", -26.800, 153.140],
  ["Oaks Seaforth Resort Alexandra Headland", "Sunshine Coast", -26.672, 153.115],
  ["Spicers Clovelly Estate", "Sunshine Coast", -26.700, 152.880],
  ["Narrows Escape Rainforest Retreat", "Sunshine Coast", -26.700, 152.870],
  ["Flaxton Gardens", "Sunshine Coast", -26.680, 152.860],
  ["Secrets on the Lake", "Sunshine Coast", -26.700, 152.870],
  ["Montville Country Cabins", "Sunshine Coast", -26.690, 152.880],
  ["Kondalilla Eco Resort", "Sunshine Coast", -26.680, 152.870],
  ["Glass House Mountains Ecolodge", "Sunshine Coast", -26.890, 152.940],
  ["Surfair Marcoola", "Sunshine Coast", -26.590, 153.090],
  // Golf Courses
  ["Noosa Springs Golf Club", "Noosa", -26.398, 153.058],
  ["Noosa Golf Club", "Noosa", -26.400, 153.050],
  ["Noosa Valley Golf Club", "Noosa", -26.410, 153.020],
  ["Tewantin-Noosa Golf Club", "Noosa", -26.395, 153.040],
  ["Twin Waters Golf Club", "Sunshine Coast", -26.628, 153.075],
  ["Peregian Golf Course", "Sunshine Coast", -26.490, 153.078],
  ["Maroochy River Golf Club", "Sunshine Coast", -26.620, 153.050],
  ["Pelican Waters Golf Club", "Sunshine Coast", -26.780, 153.110],
  ["Headland Golf Club", "Sunshine Coast", -26.695, 153.100],
  ["Horton Park Golf Club", "Sunshine Coast", -26.650, 153.080],
  ["Caloundra Golf Club", "Sunshine Coast", -26.810, 153.120],
  ["Maleny Golf Club", "Sunshine Coast", -26.760, 152.850],
  ["Beerwah Golf Club", "Sunshine Coast", -26.860, 152.960],
  ["Mount Coolum Golf Club", "Sunshine Coast", -26.560, 153.070],
  ["Nambour Golf Club", "Sunshine Coast", -26.630, 152.950],
  ["Hinterland Golf Club Buderim", "Sunshine Coast", -26.690, 153.050],
  ["Tanawha Valley Par 3", "Sunshine Coast", -26.710, 153.040],
  ["Bribie Island Golf Club", "Moreton Bay", -27.050, 153.140],
  // Event Venues
  ["Sunshine Coast Convention Centre", "Sunshine Coast", -26.640, 153.078],
  ["The J Noosa", "Noosa", -26.395, 153.050],
  ["Noosa Boathouse", "Noosa", -26.393, 153.058],
  ["Surfair Events Centre", "Sunshine Coast", -26.590, 153.090],
  ["Clios Conferences Montville", "Sunshine Coast", -26.690, 152.880],
  ["Spicers Tamarind Retreat", "Sunshine Coast", -26.700, 152.880],
  ["Maleny Manor", "Sunshine Coast", -26.760, 152.860],
  ["Tiffanys Maleny", "Sunshine Coast", -26.760, 152.850],
  ["Weddings at Tiffanys", "Sunshine Coast", -26.760, 152.850],
  ["The Ginger Factory", "Sunshine Coast", -26.670, 152.950],
  ["Venue 114 Bokarina", "Sunshine Coast", -26.730, 153.130],
  ["Lake Kawana Community Centre", "Sunshine Coast", -26.720, 153.120],
  ["Maroochy RSL", "Sunshine Coast", -26.650, 153.070],
  ["Caloundra RSL", "Sunshine Coast", -26.800, 153.130],
  ["Noosa RSL", "Noosa", -26.395, 153.050],
  ["Peregian Beach Hotel", "Sunshine Coast", -26.490, 153.090],
  ["Coolum Surf Club", "Sunshine Coast", -26.530, 153.090],
  ["Mooloolaba Surf Club", "Sunshine Coast", -26.685, 153.120],
  ["Alexandra Headland Surf Club", "Sunshine Coast", -26.672, 153.118],
  ["Maroochydore Surf Club", "Sunshine Coast", -26.655, 153.100],
  ["Noosa Surf Club", "Noosa", -26.378, 153.090],
  ["Rickys Noosa", "Noosa", -26.393, 153.058],
  ["Pier 33 Mooloolaba", "Sunshine Coast", -26.685, 153.118],
  ["The Wharf Mooloolaba", "Sunshine Coast", -26.685, 153.118],
  ["Montville Village", "Sunshine Coast", -26.690, 152.880],
  ["Mapleton Falls", "Sunshine Coast", -26.660, 152.860],
  ["Mary Cairncross Scenic Reserve", "Sunshine Coast", -26.770, 152.870],
  ["Kondalilla Falls", "Sunshine Coast", -26.680, 152.870],
  ["Mooloolaba Esplanade", "Sunshine Coast", -26.684, 153.120],
  ["Cotton Tree Park", "Sunshine Coast", -26.650, 153.095],
  ["Kings Beach Caloundra", "Sunshine Coast", -26.800, 153.140],
  // Brisbane Landmarks
  ["Roma Street Parkland", "Brisbane", -27.462, 153.014],
  ["Parkland", "Brisbane", -27.462, 153.014],
  ["South Bank Parklands", "Brisbane", -27.480, 153.022],
  ["South Bank", "Brisbane", -27.480, 153.022],
  ["Queen Street Mall", "Brisbane", -27.470, 153.026],
  ["Brisbane Convention Centre", "Brisbane", -27.480, 153.018],
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
  ["Griffith University South Bank", "Brisbane", -27.480, 153.020],
  ["Brisbane Cruise Terminal", "Brisbane", -27.418, 153.168],
  ["Portside Wharf", "Brisbane", -27.418, 153.168],
  ["Eagle Street Pier", "Brisbane", -27.467, 153.030],
  ["Howard Smith Wharves", "Brisbane", -27.461, 153.035],
  ["Eat Street Northshore", "Brisbane", -27.430, 153.080],
  ["Westfield Chermside", "Brisbane", -27.387, 153.032],
  ["Westfield Carindale", "Brisbane", -27.505, 153.102],
  ["Westfield Garden City", "Brisbane", -27.555, 153.072],
  ["Indooroopilly Shopping Centre", "Brisbane", -27.498, 152.972],
  ["DFO Brisbane Airport", "Brisbane", -27.395, 153.108],
  ["Brisbane Entertainment Centre", "Brisbane", -27.450, 153.032],
  ["QPAC", "Brisbane", -27.478, 153.020],
  ["Queensland Museum", "Brisbane", -27.475, 153.018],
  ["GOMA", "Brisbane", -27.472, 153.018],
  ["State Library Queensland", "Brisbane", -27.472, 153.020],
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
  ["WhiteWater World", "Gold Coast", -27.862, 153.310],
  ["Currumbin Wildlife Sanctuary", "Gold Coast", -28.138, 153.478],
  ["Pacific Fair", "Gold Coast", -28.038, 153.432],
  ["Robina Town Centre", "Gold Coast", -28.078, 153.388],
  ["Gold Coast University Hospital", "Gold Coast", -27.962, 153.382],
  ["Griffith University Gold Coast", "Gold Coast", -27.962, 153.380],
  ["Bond University", "Gold Coast", -28.073, 153.415],
  ["Star Casino Gold Coast", "Gold Coast", -28.028, 153.432],
  ["Gold Coast Convention Centre", "Gold Coast", -28.028, 153.428],
  ["Metricon Stadium", "Gold Coast", -28.005, 153.368],
  ["Harbour Town Gold Coast", "Gold Coast", -27.935, 153.368],
  ["Surfers Paradise Beach", "Gold Coast", -28.002, 153.432],
  ["SkyPoint Observation Deck", "Gold Coast", -28.002, 153.430],
  ["Springbrook National Park", "Gold Coast", -28.198, 153.268],
  // Moreton Bay Landmarks
  ["Redcliffe Hospital", "Moreton Bay", -27.230, 153.098],
  ["Westfield North Lakes", "Moreton Bay", -27.230, 153.028],
  ["Morayfield Shopping Centre", "Moreton Bay", -27.098, 152.952],
  // Ipswich Landmarks
  ["Ipswich Hospital", "Ipswich", -27.608, 152.758],
  ["USQ Ipswich", "Ipswich", -27.608, 152.760],
  ["Riverlink Shopping Centre", "Ipswich", -27.608, 152.758],
  ["Orion Springfield Central", "Ipswich", -27.668, 152.908],
  // Toowoomba Landmarks
  ["Toowoomba Hospital", "Toowoomba", -27.558, 151.948],
  ["USQ Toowoomba", "Toowoomba", -27.558, 151.948],
  ["Grand Central Toowoomba", "Toowoomba", -27.558, 151.958],
];

async function main() {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    console.error("DATABASE_URL not set");
    process.exit(1);
  }

  const url = new URL(dbUrl);
  const connection = await mysql.createConnection({
    host: url.hostname,
    port: parseInt(url.port || "3306"),
    user: decodeURIComponent(url.username),
    password: decodeURIComponent(url.password),
    database: url.pathname.slice(1),
    ssl: { rejectUnauthorized: true },
  });

  console.log(`Connected. Seeding ${LANDMARKS.length} landmarks...`);

  // Check existing count
  const [rows] = await connection.query("SELECT COUNT(*) as cnt FROM landmarks");
  const existingCount = rows[0].cnt;
  if (existingCount > 0) {
    console.log(`landmarks table already has ${existingCount} rows. Skipping seed.`);
    await connection.end();
    return;
  }

  // Build batch insert
  const values = [];
  const params = [];
  const seen = new Set();
  
  for (const [name, lga, lat, lng] of LANDMARKS) {
    // Skip duplicates (same name)
    const key = name.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    
    const category = categorize(name);
    values.push("(?, ?, ?, ?, ?, 1, NOW(), NOW())");
    params.push(name, lat.toFixed(6), lng.toFixed(6), lga, category);
  }

  const sql = `INSERT INTO landmarks (name, lat, lng, lga, category, isActive, createdAt, updatedAt) VALUES ${values.join(", ")}`;
  await connection.query(sql, params);

  const [countRows] = await connection.query("SELECT COUNT(*) as cnt FROM landmarks");
  console.log(`Seeded ${countRows[0].cnt} landmarks successfully.`);

  // Print category breakdown
  const [cats] = await connection.query("SELECT category, COUNT(*) as cnt FROM landmarks GROUP BY category ORDER BY cnt DESC");
  console.log("\nCategory breakdown:");
  for (const row of cats) {
    console.log(`  ${row.category}: ${row.cnt}`);
  }

  await connection.end();
}

main().catch(err => {
  console.error("Seed failed:", err);
  process.exit(1);
});
