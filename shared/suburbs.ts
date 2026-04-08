/**
 * SE Queensland suburb-to-LGA mapping and distance estimation.
 * 
 * Primary Area: Sunshine Coast Region, Noosa Shire
 * Secondary Area: Fraser Coast, Gympie, Somerset, Moreton Bay, Brisbane, Logan, Gold Coast, Redland, Scenic Rim, Ipswich
 * Other: everything else
 */

export type AreaType = "primary" | "secondary" | "other";

export interface SuburbInfo {
  name: string;
  lga: string;
  area: AreaType;
  /** Approximate lat/lng for distance estimation */
  lat: number;
  lng: number;
}

// LGA classification
const PRIMARY_LGAS = ["Sunshine Coast", "Noosa"];
const SECONDARY_LGAS = [
  "Fraser Coast", "Gympie", "Somerset", "Moreton Bay",
  "Brisbane", "Logan", "Gold Coast", "Redland", "Scenic Rim", "Ipswich"
];

export function classifyLGA(lga: string): AreaType {
  if (PRIMARY_LGAS.includes(lga)) return "primary";
  if (SECONDARY_LGAS.includes(lga)) return "secondary";
  return "other";
}

/**
 * Comprehensive suburb database for SE Queensland.
 * Each entry: [suburb, LGA, lat, lng]
 */
const SUBURB_DATA: [string, string, number, number][] = [
  // === SUNSHINE COAST REGION (Primary) ===
  ["Alexandra Headland", "Sunshine Coast", -26.667, 153.103],
  ["Aroona", "Sunshine Coast", -26.738, 153.082],
  ["Bald Knob", "Sunshine Coast", -26.762, 152.880],
  ["Banksia Beach", "Sunshine Coast", -27.057, 153.138],
  ["Battery Hill", "Sunshine Coast", -26.784, 153.118],
  ["Beerwah", "Sunshine Coast", -26.858, 152.960],
  ["Bells Creek", "Sunshine Coast", -26.808, 153.062],
  ["Birtinya", "Sunshine Coast", -26.738, 153.112],
  ["Bli Bli", "Sunshine Coast", -26.618, 153.030],
  ["Bokarina", "Sunshine Coast", -26.738, 153.128],
  ["Bongaree", "Sunshine Coast", -27.080, 153.158],
  ["Buddina", "Sunshine Coast", -26.695, 153.128],
  ["Buderim", "Sunshine Coast", -26.680, 153.060],
  ["Burnside", "Sunshine Coast", -26.620, 153.068],
  ["Caloundra", "Sunshine Coast", -26.798, 153.128],
  ["Caloundra West", "Sunshine Coast", -26.810, 153.098],
  ["Chevallum", "Sunshine Coast", -26.700, 152.980],
  ["Coes Creek", "Sunshine Coast", -26.638, 152.968],
  ["Coolum Beach", "Sunshine Coast", -26.528, 153.088],
  ["Cotton Tree", "Sunshine Coast", -26.650, 153.098],
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
  ["Morayfield", "Moreton Bay", -27.107, 152.950],
  ["Burpengary", "Moreton Bay", -27.158, 152.958],
  ["Narangba", "Moreton Bay", -27.200, 152.978],
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
  ["Brisbane CBD", "Brisbane", -27.470, 153.025],
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
  ["Surfers Paradise", "Gold Coast", -28.000, 153.430],
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
];

// Build lookup map (lowercase suburb name -> SuburbInfo)
const suburbMap = new Map<string, SuburbInfo>();
for (const [name, lga, lat, lng] of SUBURB_DATA) {
  const key = name.toLowerCase();
  // If duplicate, prefer primary area
  const existing = suburbMap.get(key);
  const area = classifyLGA(lga);
  if (!existing || (area === "primary" && existing.area !== "primary")) {
    suburbMap.set(key, { name, lga, area, lat, lng });
  }
}

/**
 * Look up a suburb by name (case-insensitive, fuzzy match).
 * Returns the suburb info or null if not found.
 */
export function lookupSuburb(input: string): SuburbInfo | null {
  const cleaned = input.trim().toLowerCase();
  
  // Exact match
  if (suburbMap.has(cleaned)) return suburbMap.get(cleaned)!;
  
  // Try removing common suffixes like "QLD", "Queensland", postcode
  const withoutState = cleaned
    .replace(/,?\s*(qld|queensland)\s*$/i, "")
    .replace(/,?\s*\d{4}\s*$/, "")
    .trim();
  if (suburbMap.has(withoutState)) return suburbMap.get(withoutState)!;
  
  // Partial match - check if input starts with or contains a known suburb
  for (const entry of Array.from(suburbMap.entries())) {
    if (withoutState.includes(entry[0]) || entry[0].includes(withoutState)) {
      return entry[1];
    }
  }
  
  return null;
}

/**
 * Calculate approximate distance between two points using Haversine formula.
 * Returns distance in kilometres.
 */
export function calculateDistance(
  lat1: number, lng1: number,
  lat2: number, lng2: number
): number {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const straightLine = R * c;
  // Apply road factor (roads are ~1.3x straight line distance)
  return Math.round(straightLine * 1.3);
}

/**
 * Determine if either pickup or destination is in a secondary area.
 */
export function isOutOfArea(
  pickupSuburb: string,
  destinationSuburb: string
): boolean {
  const pickup = lookupSuburb(pickupSuburb);
  const destination = lookupSuburb(destinationSuburb);
  
  // If suburb not found, treat as "other" (out of area)
  const pickupArea = pickup?.area ?? "other";
  const destArea = destination?.area ?? "other";
  
  return pickupArea === "secondary" || destArea === "secondary" ||
         pickupArea === "other" || destArea === "other";
}

/**
 * Estimate distance between two suburbs.
 * Returns distance in km, or null if either suburb is unknown.
 */
export function estimateDistance(
  pickupSuburb: string,
  destinationSuburb: string
): number | null {
  const pickup = lookupSuburb(pickupSuburb);
  const destination = lookupSuburb(destinationSuburb);
  
  if (!pickup || !destination) return null;
  
  return calculateDistance(pickup.lat, pickup.lng, destination.lat, destination.lng);
}

/**
 * Get all known suburb names for autocomplete.
 */
export function getAllSuburbNames(): string[] {
  return Array.from(new Set(SUBURB_DATA.map(([name]) => name))).sort();
}
