/**
 * SE Queensland suburb-to-LGA mapping and distance estimation.
 * 
 * Primary Area: Sunshine Coast Region, Noosa Shire
 * Secondary Area: Fraser Coast, Gympie, Somerset, Moreton Bay, Brisbane, Logan, Gold Coast, Redland, Scenic Rim, Ipswich
 * Other: everything else
 */

import { LANDMARK_ADDRESSES } from "./landmarkAddresses";

export type AreaType = "primary" | "secondary" | "other";

export interface SuburbInfo {
  name: string;
  lga: string;
  area: AreaType;
  /** Approximate lat/lng for distance estimation */
  lat: number;
  lng: number;
  /** Whether this is a landmark rather than a suburb */
  isLandmark?: boolean;
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

  // === LANDMARKS & KEY LOCATIONS ===
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

  // Sunshine Coast & Noosa — Resorts & Accommodation
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

  // Sunshine Coast & Noosa — Golf Courses
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

  // Sunshine Coast & Noosa — Event Venues & Function Centres
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

// Landmark names — entries after this marker in SUBURB_DATA are landmarks
const LANDMARK_START_INDEX = SUBURB_DATA.findIndex(([name]) => name === "Sunshine Coast Airport");

// Build lookup map (lowercase suburb name -> SuburbInfo)
const suburbMap = new Map<string, SuburbInfo>();
for (let i = 0; i < SUBURB_DATA.length; i++) {
  const [name, lga, lat, lng] = SUBURB_DATA[i];
  const key = name.toLowerCase();
  // If duplicate, prefer primary area
  const existing = suburbMap.get(key);
  const area = classifyLGA(lga);
  const isLandmark = LANDMARK_START_INDEX >= 0 && i >= LANDMARK_START_INDEX;
  if (!existing || (area === "primary" && existing.area !== "primary")) {
    suburbMap.set(key, { name, lga, area, lat, lng, isLandmark });
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

/**
 * Check if a location name is a landmark (not a suburb).
 */
export function isLandmark(name: string): boolean {
  const info = suburbMap.get(name.toLowerCase());
  return info?.isLandmark ?? false;
}

/**
 * Get all locations with their type for the autocomplete.
 */
export function getAllLocationsWithType(): { name: string; isLandmark: boolean; address?: string | null }[] {
  const seen = new Set<string>();
  const results: { name: string; isLandmark: boolean; address?: string | null }[] = [];
  for (let i = 0; i < SUBURB_DATA.length; i++) {
    const name = SUBURB_DATA[i][0];
    if (!seen.has(name)) {
      seen.add(name);
      const landmark = LANDMARK_START_INDEX >= 0 && i >= LANDMARK_START_INDEX;
      const address = landmark ? (LANDMARK_ADDRESSES[name] || null) : null;
      results.push({ name, isLandmark: landmark, address });
    }
  }
  return results.sort((a, b) => a.name.localeCompare(b.name));
}
