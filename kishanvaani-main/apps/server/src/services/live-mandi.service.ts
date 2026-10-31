import prisma from "../prisma.js";
import { getDataGovKey, hasDataGovKey, redactUrlApiKey } from "../config/env.js";

export function parseOgdDate(s: string): string {
  const [d, m, y] = s.split("/");
  return y ? `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}` : s;
}

export interface LiveMandiRecord {
  state: string;
  district: string;
  market: string;
  commodity: string;
  variety: string;
  arrivalDate: string | null;
  minPrice: number;
  maxPrice: number;
  modalPrice: number;
  trend: "UP" | "DOWN" | "STABLE";
  sourceLabel?: string;
  isSample?: boolean;
}

export interface StateMandiSummary {
  state: string;
  totalMarkets: number;
  totalCommodities: number;
  topCommodities: { commodity: string; avgModalPrice: number; marketCount: number }[];
  avgModalPrice: number;
  totalRecords: number;
}

export interface LiveMandiStats {
  totalRecords: number;
  uniqueStates: number;
  uniqueCommodities: number;
  uniqueMarkets: number;
  lastRefreshed: string;
  dataSource: "LIVE_API" | "CACHED" | "BENCHMARK_FALLBACK";
}

export interface LiveMandiPricesResponse {
  records: LiveMandiRecord[];
  count: number;
  total: number;
  stats: LiveMandiStats;
}

export interface StatesSummaryResponse {
  states: StateMandiSummary[];
  count: number;
  stats: LiveMandiStats;
}

export interface CommodityPriceMapResponse {
  commodity: string;
  records: LiveMandiRecord[];
  count: number;
  avgModalPrice: number;
  minPrice: number;
  maxPrice: number;
  statesReporting: number;
}

export interface LiveMandiQueryParams {
  state?: string;
  district?: string;
  commodity?: string;
  search?: string;
  limit?: number;
  offset?: number;
}

// Comprehensive realistic daily benchmark data covering ALL Indian states & Union Territories
const FALLBACK_BENCHMARKS: Omit<LiveMandiRecord, "arrivalDate">[] = [
  // ── 1. Punjab ─────────────────────────────────────────────────────────────
  { state: "Punjab", district: "Ludhiana", market: "Khanna Mandi", commodity: "Wheat", variety: "PBW-725", minPrice: 2425, maxPrice: 2600, modalPrice: 2520, trend: "UP" },
  { state: "Punjab", district: "Amritsar", market: "Amritsar Grain Market", commodity: "Basmati Rice", variety: "1121 Pusa", minPrice: 3800, maxPrice: 4250, modalPrice: 4100, trend: "UP" },
  { state: "Punjab", district: "Jalandhar", market: "Jalandhar APMC Yard", commodity: "Potato", variety: "Kufri Jyoti", minPrice: 1100, maxPrice: 1550, modalPrice: 1380, trend: "DOWN" },
  { state: "Punjab", district: "Bathinda", market: "Bathinda Mandi", commodity: "Cotton", variety: "American Bt", minPrice: 6900, maxPrice: 7400, modalPrice: 7200, trend: "STABLE" },

  // ── 2. Haryana ────────────────────────────────────────────────────────────
  { state: "Haryana", district: "Karnal", market: "Karnal New Grain Market", commodity: "Basmati Rice", variety: "Sugandh-5", minPrice: 3400, maxPrice: 3750, modalPrice: 3620, trend: "STABLE" },
  { state: "Haryana", district: "Sirsa", market: "Sirsa Grain Market", commodity: "Cotton", variety: "Desi Bt", minPrice: 6700, maxPrice: 7350, modalPrice: 7100, trend: "UP" },
  { state: "Haryana", district: "Hisar", market: "Hisar Mandi", commodity: "Mustard", variety: "Pusa Bold", minPrice: 5350, maxPrice: 5750, modalPrice: 5580, trend: "UP" },

  // ── 3. Maharashtra ────────────────────────────────────────────────────────
  { state: "Maharashtra", district: "Nashik", market: "Lasalgaon Mandi", commodity: "Onion", variety: "Red Onion", minPrice: 1600, maxPrice: 2200, modalPrice: 1950, trend: "STABLE" },
  { state: "Maharashtra", district: "Akola", market: "Akola Cotton Market", commodity: "Cotton", variety: "Medium Staple", minPrice: 6800, maxPrice: 7500, modalPrice: 7250, trend: "UP" },
  { state: "Maharashtra", district: "Pune", market: "Gultekdi Market Yard", commodity: "Tomato", variety: "Hybrid Red", minPrice: 1200, maxPrice: 1800, modalPrice: 1550, trend: "DOWN" },
  { state: "Maharashtra", district: "Nagpur", market: "Kalamna Market", commodity: "Orange", variety: "Nagpur Santra", minPrice: 3200, maxPrice: 4600, modalPrice: 4100, trend: "UP" },
  { state: "Maharashtra", district: "Solapur", market: "Solapur APMC", commodity: "Jowar", variety: "Maldandi", minPrice: 2850, maxPrice: 3350, modalPrice: 3100, trend: "STABLE" },

  // ── 4. Madhya Pradesh ─────────────────────────────────────────────────────
  { state: "Madhya Pradesh", district: "Indore", market: "Laxmibai Nagar Mandi", commodity: "Soybean", variety: "Yellow JS-9560", minPrice: 4600, maxPrice: 5050, modalPrice: 4890, trend: "UP" },
  { state: "Madhya Pradesh", district: "Sehore", market: "Sehore Krishi Upaj Mandi", commodity: "Wheat", variety: "Sharbati C-306", minPrice: 3200, maxPrice: 3900, modalPrice: 3650, trend: "UP" },
  { state: "Madhya Pradesh", district: "Ujjain", market: "Ujjain Mandi", commodity: "Gram", variety: "Desi Chana", minPrice: 5100, maxPrice: 5550, modalPrice: 5380, trend: "STABLE" },
  { state: "Madhya Pradesh", district: "Mandsaur", market: "Mandsaur Mandi", commodity: "Garlic", variety: "Ooti", minPrice: 9500, maxPrice: 14200, modalPrice: 12500, trend: "UP" },

  // ── 5. Rajasthan ──────────────────────────────────────────────────────────
  { state: "Rajasthan", district: "Bharatpur", market: "Bharatpur Grain Market", commodity: "Mustard", variety: "Mustard Seed 42% Oil", minPrice: 5300, maxPrice: 5650, modalPrice: 5520, trend: "UP" },
  { state: "Rajasthan", district: "Kota", market: "Bhamashah Mandi", commodity: "Soybean", variety: "JS-335", minPrice: 4500, maxPrice: 4950, modalPrice: 4800, trend: "STABLE" },
  { state: "Rajasthan", district: "Nagaur", market: "Nagaur Mandi", commodity: "Cumin", variety: "Jeera Grade-1", minPrice: 24000, maxPrice: 29500, modalPrice: 27800, trend: "DOWN" },
  { state: "Rajasthan", district: "Bikaner", market: "Bikaner Mandi", commodity: "Groundnut", variety: "Bold", minPrice: 5700, maxPrice: 6300, modalPrice: 6050, trend: "UP" },

  // ── 6. Uttar Pradesh ──────────────────────────────────────────────────────
  { state: "Uttar Pradesh", district: "Agra", market: "Agra Mandi Yard", commodity: "Potato", variety: "Kufri Bahar", minPrice: 1150, maxPrice: 1450, modalPrice: 1320, trend: "DOWN" },
  { state: "Uttar Pradesh", district: "Muzaffarnagar", market: "Naveen Mandi Sthal", commodity: "Sugarcane", variety: "Chaku Gur", minPrice: 3600, maxPrice: 4050, modalPrice: 3880, trend: "UP" },
  { state: "Uttar Pradesh", district: "Bareilly", market: "Bareilly Mandi", commodity: "Paddy", variety: "Common FAQ", minPrice: 2300, maxPrice: 2420, modalPrice: 2360, trend: "STABLE" },
  { state: "Uttar Pradesh", district: "Hapur", market: "Hapur Grain Market", commodity: "Wheat", variety: "Dara", minPrice: 2425, maxPrice: 2580, modalPrice: 2500, trend: "UP" },

  // ── 7. Gujarat ────────────────────────────────────────────────────────────
  { state: "Gujarat", district: "Rajkot", market: "Rajkot Marketing Yard", commodity: "Groundnut", variety: "G-20 Bold", minPrice: 5800, maxPrice: 6450, modalPrice: 6200, trend: "UP" },
  { state: "Gujarat", district: "Mehsana", market: "APMC Unjha", commodity: "Cumin", variety: "Machine Clean", minPrice: 26500, maxPrice: 32000, modalPrice: 29800, trend: "DOWN" },
  { state: "Gujarat", district: "Surat", market: "Surat APMC", commodity: "Banana", variety: "Robusta", minPrice: 1400, maxPrice: 2100, modalPrice: 1800, trend: "UP" },

  // ── 8. Telangana ──────────────────────────────────────────────────────────
  { state: "Telangana", district: "Nizamabad", market: "Nizamabad APMC", commodity: "Turmeric", variety: "Nizamabad Finger", minPrice: 11500, maxPrice: 13800, modalPrice: 12900, trend: "UP" },
  { state: "Telangana", district: "Warangal", market: "Enumamula Market", commodity: "Chilli", variety: "Teja S-17", minPrice: 17500, maxPrice: 22000, modalPrice: 20200, trend: "UP" },
  { state: "Telangana", district: "Suryapet", market: "Suryapet Mandi", commodity: "Paddy", variety: "BPT-5204 Samba", minPrice: 2400, maxPrice: 2750, modalPrice: 2600, trend: "STABLE" },

  // ── 9. Andhra Pradesh ─────────────────────────────────────────────────────
  { state: "Andhra Pradesh", district: "Guntur", market: "Guntur Mirchi Yard", commodity: "Chilli", variety: "Teja Super Hot", minPrice: 18200, maxPrice: 23500, modalPrice: 21400, trend: "UP" },
  { state: "Andhra Pradesh", district: "Kurnool", market: "Kurnool APMC", commodity: "Groundnut", variety: "Bold Pods", minPrice: 5700, maxPrice: 6350, modalPrice: 6100, trend: "STABLE" },
  { state: "Andhra Pradesh", district: "Krishna", market: "Gollapudi Market", commodity: "Rice", variety: "Sona Masoori Raw", minPrice: 3600, maxPrice: 4100, modalPrice: 3900, trend: "UP" },

  // ── 10. Karnataka ─────────────────────────────────────────────────────────
  { state: "Karnataka", district: "Kalaburagi", market: "Kalaburagi APMC", commodity: "Pigeon Pea (Tur)", variety: "Maruti Red", minPrice: 7200, maxPrice: 8100, modalPrice: 7800, trend: "UP" },
  { state: "Karnataka", district: "Kolar", market: "Kolar APMC Yard", commodity: "Tomato", variety: "Hybrid Red Round", minPrice: 900, maxPrice: 1650, modalPrice: 1350, trend: "DOWN" },
  { state: "Karnataka", district: "Shivamogga", market: "Shimoga APMC", commodity: "Arecanut", variety: "Rashi", minPrice: 42000, maxPrice: 48000, modalPrice: 45500, trend: "STABLE" },

  // ── 11. Kerala ────────────────────────────────────────────────────────────
  { state: "Kerala", district: "Idukki", market: "Vandanmettu Cardamom Market", commodity: "Cardamom", variety: "8mm Bold Green", minPrice: 225000, maxPrice: 265000, modalPrice: 248000, trend: "UP" },
  { state: "Kerala", district: "Wayanad", market: "Kalpetta APMC", commodity: "Black Pepper", variety: "Malabar Garbled", minPrice: 58000, maxPrice: 64000, modalPrice: 61500, trend: "UP" },
  { state: "Kerala", district: "Kottayam", market: "Rubber Market Kottayam", commodity: "Rubber", variety: "RSS-4", minPrice: 17800, maxPrice: 19500, modalPrice: 18800, trend: "STABLE" },

  // ── 12. Tamil Nadu ────────────────────────────────────────────────────────
  { state: "Tamil Nadu", district: "Erode", market: "Erode Semmampalayam Mandi", commodity: "Turmeric", variety: "Erode Finger Double Polish", minPrice: 13200, maxPrice: 15400, modalPrice: 14500, trend: "UP" },
  { state: "Tamil Nadu", district: "Madurai", market: "Mattuthavani Central Market", commodity: "Banana", variety: "Nendran", minPrice: 2800, maxPrice: 3600, modalPrice: 3250, trend: "UP" },
  { state: "Tamil Nadu", district: "Coimbatore", market: "Pollachi Market", commodity: "Coconut", variety: "Medium Grade", minPrice: 2400, maxPrice: 3100, modalPrice: 2800, trend: "STABLE" },

  // ── 13. West Bengal ───────────────────────────────────────────────────────
  { state: "West Bengal", district: "Purba Bardhaman", market: "Burdwan APMC", commodity: "Paddy", variety: "Swarna Rice", minPrice: 2300, maxPrice: 2450, modalPrice: 2380, trend: "STABLE" },
  { state: "West Bengal", district: "Hooghly", market: "Sheoraphuli Market", commodity: "Potato", variety: "Jyoti Cold Store", minPrice: 1250, maxPrice: 1550, modalPrice: 1420, trend: "DOWN" },
  { state: "West Bengal", district: "Darjeeling", market: "Siliguri Regulated Market", commodity: "Pineapple", variety: "Giant Kew", minPrice: 2100, maxPrice: 2800, modalPrice: 2500, trend: "UP" },

  // ── 14. Bihar ─────────────────────────────────────────────────────────────
  { state: "Bihar", district: "Muzaffarpur", market: "Muzaffarpur Mandi", commodity: "Maize", variety: "Yellow Hybrid", minPrice: 2050, maxPrice: 2300, modalPrice: 2210, trend: "STABLE" },
  { state: "Bihar", district: "Patna", market: "Mithapur Wholesale Market", commodity: "Potato", variety: "Lal Gulab", minPrice: 1200, maxPrice: 1500, modalPrice: 1390, trend: "DOWN" },
  { state: "Bihar", district: "Purnia", market: "Gulabbagh Mandi", commodity: "Maize", variety: "Feed Grade", minPrice: 2100, maxPrice: 2350, modalPrice: 2250, trend: "UP" },

  // ── 15. Odisha ────────────────────────────────────────────────────────────
  { state: "Odisha", district: "Bargarh", market: "Bargarh Regulated Market", commodity: "Paddy", variety: "Common Grade", minPrice: 2300, maxPrice: 2420, modalPrice: 2360, trend: "STABLE" },
  { state: "Odisha", district: "Cuttack", market: "Cuttack Malgodown", commodity: "Moong Dal", variety: "Desi Green", minPrice: 7400, maxPrice: 8100, modalPrice: 7850, trend: "UP" },
  { state: "Odisha", district: "Koraput", market: "Koraput Market Yard", commodity: "Ginger", variety: "Fresh Green", minPrice: 4500, maxPrice: 5800, modalPrice: 5200, trend: "UP" },

  // ── 16. Chhattisgarh ──────────────────────────────────────────────────────
  { state: "Chhattisgarh", district: "Raipur", market: "Pandri Krishi Upaj Mandi", commodity: "Paddy", variety: "Mahamaya", minPrice: 2300, maxPrice: 2460, modalPrice: 2380, trend: "STABLE" },
  { state: "Chhattisgarh", district: "Rajnandgaon", market: "Rajnandgaon Mandi", commodity: "Soybean", variety: "Yellow Bold", minPrice: 4550, maxPrice: 4950, modalPrice: 4790, trend: "UP" },
  { state: "Chhattisgarh", district: "Bilaspur", market: "Bilaspur Mandi", commodity: "Gram", variety: "Chana Desi", minPrice: 5150, maxPrice: 5500, modalPrice: 5350, trend: "STABLE" },

  // ── 17. Jharkhand ─────────────────────────────────────────────────────────
  { state: "Jharkhand", district: "Ranchi", market: "Pandara Market Yard", commodity: "Tomato", variety: "Hybrid Swarna", minPrice: 1100, maxPrice: 1700, modalPrice: 1450, trend: "DOWN" },
  { state: "Jharkhand", district: "Hazaribagh", market: "Hazaribagh APMC", commodity: "Potato", variety: "Kufri Kanchan", minPrice: 1200, maxPrice: 1600, modalPrice: 1420, trend: "DOWN" },
  { state: "Jharkhand", district: "Dumka", market: "Dumka Sub-Yard", commodity: "Paddy", variety: "Local Paddy", minPrice: 2300, maxPrice: 2420, modalPrice: 2350, trend: "STABLE" },

  // ── 18. Assam ─────────────────────────────────────────────────────────────
  { state: "Assam", district: "Kamrup", market: "Pamohi APMC Yard", commodity: "Mustard", variety: "Toria M-27", minPrice: 5400, maxPrice: 5900, modalPrice: 5720, trend: "UP" },
  { state: "Assam", district: "Nagaon", market: "Nagaon Regulated Market", commodity: "Jute", variety: "TD-5 Tossah", minPrice: 5100, maxPrice: 5800, modalPrice: 5520, trend: "UP" },
  { state: "Assam", district: "Jorhat", market: "Jorhat Mandi", commodity: "Rice", variety: "Joha Aromatic", minPrice: 4800, maxPrice: 5600, modalPrice: 5200, trend: "STABLE" },

  // ── 19. Himachal Pradesh ──────────────────────────────────────────────────
  { state: "Himachal Pradesh", district: "Shimla", market: "Dhalli Market Yard", commodity: "Apple", variety: "Royal Delicious Fancy", minPrice: 6500, maxPrice: 9800, modalPrice: 8400, trend: "UP" },
  { state: "Himachal Pradesh", district: "Solan", market: "Solan Sabzi Mandi", commodity: "Tomato", variety: "Himsona Hybrid", minPrice: 1400, maxPrice: 2200, modalPrice: 1850, trend: "UP" },
  { state: "Himachal Pradesh", district: "Kullu", market: "Kullu APMC Yard", commodity: "Garlic", variety: "Hill Garlic Bold", minPrice: 11000, maxPrice: 16000, modalPrice: 13800, trend: "UP" },

  // ── 20. Uttarakhand ───────────────────────────────────────────────────────
  { state: "Uttarakhand", district: "Nainital", market: "Haldwani Mandi", commodity: "Apple", variety: "Golden Delicious", minPrice: 5500, maxPrice: 7800, modalPrice: 6900, trend: "UP" },
  { state: "Uttarakhand", district: "Dehradun", market: "Dehradun APMC Yard", commodity: "Basmati Rice", variety: "Type-3 Basmati", minPrice: 4200, maxPrice: 5100, modalPrice: 4750, trend: "STABLE" },
  { state: "Uttarakhand", district: "Udham Singh Nagar", market: "Kashipur Grain Market", commodity: "Wheat", variety: "PBW-502", minPrice: 2425, maxPrice: 2560, modalPrice: 2490, trend: "STABLE" },

  // ── 21. Goa ───────────────────────────────────────────────────────────────
  { state: "Goa", district: "North Goa", market: "Mapusa Municipal Market", commodity: "Coconut", variety: "Dehusked Large", minPrice: 2600, maxPrice: 3200, modalPrice: 2900, trend: "STABLE" },
  { state: "Goa", district: "North Goa", market: "Ponda Sub-Yard", commodity: "Cashew Nut", variety: "Raw Sun Dried", minPrice: 12800, maxPrice: 15200, modalPrice: 14200, trend: "UP" },
  { state: "Goa", district: "South Goa", market: "Margao APMC", commodity: "Arecanut", variety: "Mangalore Grade", minPrice: 41000, maxPrice: 46000, modalPrice: 44000, trend: "STABLE" },

  // ── 22. Arunachal Pradesh ─────────────────────────────────────────────────
  { state: "Arunachal Pradesh", district: "East Siang", market: "Pasighat APMC Yard", commodity: "Ginger", variety: "Organic Nadia", minPrice: 4800, maxPrice: 6200, modalPrice: 5600, trend: "UP" },
  { state: "Arunachal Pradesh", district: "Papum Pare", market: "Naharlagun Daily Market", commodity: "Maize", variety: "Yellow Hill", minPrice: 2150, maxPrice: 2450, modalPrice: 2320, trend: "STABLE" },
  { state: "Arunachal Pradesh", district: "Papum Pare", market: "Itanagar Market", commodity: "Orange", variety: "Mandarin", minPrice: 3800, maxPrice: 5200, modalPrice: 4600, trend: "UP" },

  // ── 23. Manipur ───────────────────────────────────────────────────────────
  { state: "Manipur", district: "Imphal West", market: "Khwairamband Bazaar", commodity: "Pineapple", variety: "Queen Variety", minPrice: 2800, maxPrice: 3800, modalPrice: 3400, trend: "UP" },
  { state: "Manipur", district: "Thoubal", market: "Thoubal APMC Yard", commodity: "Paddy", variety: "Moirangphou Black Rice", minPrice: 5200, maxPrice: 6500, modalPrice: 5900, trend: "UP" },
  { state: "Manipur", district: "Churachandpur", market: "Churachandpur Market", commodity: "Ginger", variety: "Local Hill", minPrice: 4200, maxPrice: 5400, modalPrice: 4900, trend: "STABLE" },

  // ── 24. Meghalaya ─────────────────────────────────────────────────────────
  { state: "Meghalaya", district: "East Khasi Hills", market: "Mawiong Regulated Market", commodity: "Ginger", variety: "Thingpui Organic", minPrice: 5200, maxPrice: 6800, modalPrice: 6100, trend: "UP" },
  { state: "Meghalaya", district: "West Garo Hills", market: "Tura APMC Yard", commodity: "Turmeric", variety: "Lakadong High Curcumin", minPrice: 16500, maxPrice: 21000, modalPrice: 18800, trend: "UP" },
  { state: "Meghalaya", district: "West Jaintia Hills", market: "Jowai Market", commodity: "Potato", variety: "Shillong Red", minPrice: 1600, maxPrice: 2100, modalPrice: 1850, trend: "STABLE" },

  // ── 25. Mizoram ───────────────────────────────────────────────────────────
  { state: "Mizoram", district: "Aizawl", market: "Aizawl New Market", commodity: "Ginger", variety: "Local Zingiber", minPrice: 4600, maxPrice: 5900, modalPrice: 5300, trend: "UP" },
  { state: "Mizoram", district: "Kolasib", market: "Kolasib APMC", commodity: "Turmeric", variety: "Lakadong Grade", minPrice: 15500, maxPrice: 19800, modalPrice: 18000, trend: "UP" },
  { state: "Mizoram", district: "Champhai", market: "Champhai Town Market", commodity: "Chilli", variety: "Bird Eye Chilli", minPrice: 28000, maxPrice: 36000, modalPrice: 32500, trend: "UP" },

  // ── 26. Nagaland ──────────────────────────────────────────────────────────
  { state: "Nagaland", district: "Kohima", market: "Kohima Town Market", commodity: "Chilli", variety: "Naga King Chilli", minPrice: 38000, maxPrice: 52000, modalPrice: 45000, trend: "UP" },
  { state: "Nagaland", district: "Dimapur", market: "Dimapur APMC Yard", commodity: "Maize", variety: "Local White", minPrice: 2200, maxPrice: 2600, modalPrice: 2420, trend: "STABLE" },
  { state: "Nagaland", district: "Mokokchung", market: "Mokokchung APMC", commodity: "Cardamom", variety: "Large Cardamom", minPrice: 82000, maxPrice: 96000, modalPrice: 91000, trend: "UP" },

  // ── 27. Sikkim ────────────────────────────────────────────────────────────
  { state: "Sikkim", district: "East Sikkim", market: "Gangtok Market Yard", commodity: "Cardamom", variety: "Ramsey Organic", minPrice: 85000, maxPrice: 98000, modalPrice: 92500, trend: "UP" },
  { state: "Sikkim", district: "South Sikkim", market: "Namchi Market", commodity: "Ginger", variety: "Majhaulee Organic", minPrice: 5400, maxPrice: 6700, modalPrice: 6150, trend: "UP" },
  { state: "Sikkim", district: "West Sikkim", market: "Geyzing APMC", commodity: "Orange", variety: "Sikkim Mandarin", minPrice: 4100, maxPrice: 5600, modalPrice: 4900, trend: "STABLE" },

  // ── 28. Tripura ───────────────────────────────────────────────────────────
  { state: "Tripura", district: "West Tripura", market: "Battala Market", commodity: "Pineapple", variety: "Tripura Queen GI", minPrice: 2900, maxPrice: 3900, modalPrice: 3500, trend: "UP" },
  { state: "Tripura", district: "Gomati", market: "Udaipur APMC Yard", commodity: "Paddy", variety: "Swarna Sub-1", minPrice: 2300, maxPrice: 2430, modalPrice: 2360, trend: "STABLE" },
  { state: "Tripura", district: "Khowai", market: "Teliamura Market", commodity: "Jackfruit", variety: "Local Sweet", minPrice: 1200, maxPrice: 1800, modalPrice: 1500, trend: "STABLE" },

  // ── 29. Delhi (UT) ────────────────────────────────────────────────────────
  { state: "Delhi", district: "North Delhi", market: "Azadpur Mandi", commodity: "Tomato", variety: "Hybrid Grade A", minPrice: 1300, maxPrice: 1950, modalPrice: 1680, trend: "DOWN" },
  { state: "Delhi", district: "North West Delhi", market: "Narela Grain Mandi", commodity: "Wheat", variety: "Mill Quality", minPrice: 2425, maxPrice: 2620, modalPrice: 2530, trend: "UP" },
  { state: "Delhi", district: "East Delhi", market: "Ghazipur Mandi", commodity: "Onion", variety: "Nashik Quality", minPrice: 1800, maxPrice: 2350, modalPrice: 2100, trend: "STABLE" },

  // ── 30. Jammu and Kashmir (UT) ────────────────────────────────────────────
  { state: "Jammu and Kashmir", district: "Baramulla", market: "Sopore Fruit Mandi", commodity: "Apple", variety: "Delicious Grade-A", minPrice: 5800, maxPrice: 8600, modalPrice: 7450, trend: "UP" },
  { state: "Jammu and Kashmir", district: "Srinagar", market: "Parimpora Fruit Mandi", commodity: "Walnut", variety: "Kagzi Inshell", minPrice: 28000, maxPrice: 36000, modalPrice: 32500, trend: "UP" },
  { state: "Jammu and Kashmir", district: "Jammu", market: "Narwal Mandi", commodity: "Basmati Rice", variety: "Ranbir Basmati", minPrice: 3900, maxPrice: 4500, modalPrice: 4280, trend: "STABLE" },

  // ── 31. Ladakh (UT) ───────────────────────────────────────────────────────
  { state: "Ladakh", district: "Leh", market: "Skalzangling Yard", commodity: "Apricot", variety: "Halman Raktsey Karpo", minPrice: 22000, maxPrice: 31000, modalPrice: 27500, trend: "UP" },
  { state: "Ladakh", district: "Kargil", market: "Kargil Sabzi Mandi", commodity: "Barley", variety: "Ladakh Hulled", minPrice: 2600, maxPrice: 3200, modalPrice: 2950, trend: "STABLE" },

  // ── 32. Puducherry (UT) ───────────────────────────────────────────────────
  { state: "Puducherry", district: "Puducherry", market: "Thattanchavady APMC Yard", commodity: "Paddy", variety: "ADT-37", minPrice: 2300, maxPrice: 2440, modalPrice: 2370, trend: "STABLE" },
  { state: "Puducherry", district: "Karaikal", market: "Karaikal Market Yard", commodity: "Coconut", variety: "Pollachi Grade", minPrice: 2350, maxPrice: 3000, modalPrice: 2720, trend: "UP" },

  // ── 33. Chandigarh (UT) ───────────────────────────────────────────────────
  { state: "Chandigarh", district: "Chandigarh", market: "Sector 26 Grain Market", commodity: "Wheat", variety: "Sharbati Punjab", minPrice: 2425, maxPrice: 2600, modalPrice: 2520, trend: "UP" },
  { state: "Chandigarh", district: "Chandigarh", market: "Sector 26 Sabzi Mandi", commodity: "Tomato", variety: "Hybrid Fresh", minPrice: 1250, maxPrice: 1850, modalPrice: 1580, trend: "STABLE" },

  // ── 34. Andaman and Nicobar Islands (UT) ──────────────────────────────────
  { state: "Andaman and Nicobar Islands", district: "South Andaman", market: "Port Blair APMC Yard", commodity: "Coconut", variety: "Nicobar Tall Copra", minPrice: 2700, maxPrice: 3400, modalPrice: 3100, trend: "STABLE" },
  { state: "Andaman and Nicobar Islands", district: "South Andaman", market: "Bathu Basti Market", commodity: "Banana", variety: "Red Banana", minPrice: 3200, maxPrice: 4200, modalPrice: 3750, trend: "UP" },

  // ── 35. Dadra and Nagar Haveli and Daman and Diu (UT) ─────────────────────
  { state: "Dadra and Nagar Haveli and Daman and Diu", district: "Dadra and Nagar Haveli", market: "Silvassa APMC Yard", commodity: "Paddy", variety: "Gujarat-17", minPrice: 2300, maxPrice: 2450, modalPrice: 2370, trend: "STABLE" },
  { state: "Dadra and Nagar Haveli and Daman and Diu", district: "Daman", market: "Daman Market Yard", commodity: "Sapota", variety: "Kalipatti", minPrice: 2500, maxPrice: 3500, modalPrice: 3050, trend: "UP" },

  // ── 36. Lakshadweep (UT) ──────────────────────────────────────────────────
  { state: "Lakshadweep", district: "Lakshadweep", market: "Kavaratti Island Yard", commodity: "Coconut", variety: "Micro Tall Dried Copra", minPrice: 2900, maxPrice: 3700, modalPrice: 3350, trend: "STABLE" },
  { state: "Lakshadweep", district: "Lakshadweep", market: "Minicoy Tuna & Copra Depot", commodity: "Coconut", variety: "Island Copra Grade-1", minPrice: 3000, maxPrice: 3800, modalPrice: 3450, trend: "UP" },
];

export class LiveMandiService {
  private static readonly OGD_BASE_URL = "https://api.data.gov.in/resource/9ef84268-d588-465a-a308-a864a43d0070";
  private static readonly LIVE_CACHE_TTL_MS = 15 * 60 * 1000; // 15 minutes TTL for genuine live data
  private static readonly FALLBACK_CACHE_TTL_MS = 30 * 1000;  // 30 seconds TTL for fallback; allows quick retry

  private static cachedRecords: LiveMandiRecord[] | null = null;
  private static lastRefreshedTime = 0;
  private static lastRefreshedIso = "";
  private static currentDataSource: LiveMandiStats["dataSource"] = "BENCHMARK_FALLBACK";
  private static justFetchedLive = false;
  private static previousPriceMap = new Map<string, number>();

  /**
   * Explicitly invalidate cached data so fresh government records are fetched on the next call
   */
  public static invalidateCache(): void {
    console.log("[LiveMandiService] Invalidate cache requested: resetting in-memory mandi cache");
    this.cachedRecords = null;
    this.lastRefreshedTime = 0;
    this.lastRefreshedIso = "";
    this.currentDataSource = "BENCHMARK_FALLBACK";
  }

  /**
   * Internal helper: Ensure records are present in cache.
   * If cache has expired or forceRefresh is true, fetch live or fallback.
   */
  private static async ensureData(forceRefresh = false, state?: string): Promise<LiveMandiRecord[]> {
    // Dynamic TTL: 15 minutes if we have real live data, 30 seconds if we're in fallback mode
    const ttl =
      this.currentDataSource === "LIVE_API" || this.currentDataSource === "CACHED"
        ? this.LIVE_CACHE_TTL_MS
        : this.FALLBACK_CACHE_TTL_MS;

    const isCacheValid =
      !forceRefresh &&
      this.cachedRecords !== null &&
      this.cachedRecords.length > 0 &&
      Date.now() - this.lastRefreshedTime < ttl;

    if (isCacheValid && this.cachedRecords) {
      const ageSec = Math.round((Date.now() - this.lastRefreshedTime) / 1000);
      console.log(`[LiveMandiService] Cache HIT (${this.currentDataSource}, ${this.cachedRecords.length} records, cache age: ${ageSec}s / max: ${ttl / 1000}s)`);
      return this.cachedRecords;
    }

    console.log(`[LiveMandiService] Cache MISS or expired (currentSource: ${this.currentDataSource}, forceRefresh: ${forceRefresh}). Fetching from Government OGD API...`);

    // Try fetching from Government OGD API
    const liveRecords = await this.fetchFromGovernmentOGD(state);

    if (liveRecords && liveRecords.length > 0) {
      const recordsWithTrend = this.calculateTrends(liveRecords);
      this.cachedRecords = recordsWithTrend;
      this.lastRefreshedTime = Date.now();
      this.lastRefreshedIso = new Date().toISOString();
      this.currentDataSource = "LIVE_API";
      this.justFetchedLive = true;
      console.log(`[LiveMandiService] Serving LIVE data: Ingested ${liveRecords.length} records from data.gov.in`);
      return this.cachedRecords;
    }

    // Fallback to comprehensive benchmark data covering all states & UTs
    console.warn(`[LiveMandiService] Serving BENCHMARK_FALLBACK data: Live API unavailable or failed. Will retry live API in ${this.FALLBACK_CACHE_TTL_MS / 1000}s.`);
    const fallbackRecords: LiveMandiRecord[] = FALLBACK_BENCHMARKS.map((b) => ({
      ...b,
      arrivalDate: null,
      sourceLabel: "Sample Data",
      isSample: true,
    }));

    const recordsWithTrend = this.calculateTrends(fallbackRecords);
    this.cachedRecords = recordsWithTrend;
    this.lastRefreshedTime = Date.now();
    this.lastRefreshedIso = new Date().toISOString();
    this.currentDataSource = "BENCHMARK_FALLBACK";
    this.justFetchedLive = false;

    return this.cachedRecords;
  }

  /**
   * Fetch live prices from Data.gov.in OGD API
   */
  private static async fetchFromGovernmentOGD(state?: string): Promise<LiveMandiRecord[] | null> {
    const apiKey = getDataGovKey();
    if (!apiKey) {
      console.warn("[LiveMandiService] DATA_GOV_IN_API_KEY not configured in .env. Serving fallback benchmark data.");
      return null;
    }

    const url = new URL(this.OGD_BASE_URL);
    url.searchParams.set("api-key", apiKey);
    url.searchParams.set("format", "json");
    url.searchParams.set("limit", "1000");
    url.searchParams.set("offset", "0");
    // Note: Do not pass sort[arrival_date]=desc because arrival_date is a text field on data.gov.in's Elasticsearch,
    // which causes an illegal_argument_exception. Records are sorted descending by arrivalDate in Node.js memory.
    if (state && state !== "ALL") {
      url.searchParams.set("filters[state.keyword]", state);
    }

    const redactedUrl = redactUrlApiKey(url.toString());
    console.log(`[LiveMandiService] Calling data.gov.in API: ${redactedUrl}`);

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000);

      const res = await fetch(url.toString(), { signal: controller.signal });
      clearTimeout(timeoutId);

      console.log(`[LiveMandiService] data.gov.in response HTTP status: ${res.status} ${res.statusText}`);

      if (!res.ok) {
        console.warn(`[LiveMandiService] data.gov.in HTTP error ${res.status} for ${redactedUrl}`);
        return null;
      }

      const data: any = await res.json();
      if (!data) {
        console.warn("[LiveMandiService] data.gov.in returned empty response body");
        return null;
      }

      // Check whether API returned error inside body despite HTTP 200
      if (data.status === "error" || data.status === "FAILED") {
        console.warn(`[LiveMandiService] data.gov.in returned error in payload: ${data?.message || JSON.stringify(data.error || data.status)}`);
        return null;
      }

      if (!Array.isArray(data.records)) {
        console.warn(`[LiveMandiService] data.gov.in records field is not an array: ${typeof data.records}`);
        return null;
      }

      console.log(`[LiveMandiService] data.gov.in returned ${data.records.length} raw records (total reported: ${data.total ?? "N/A"})`);

      if (data.records.length === 0) {
        console.warn("[LiveMandiService] data.gov.in returned 0 records");
        return null;
      }

      const parsedRecords: LiveMandiRecord[] = [];

      for (const r of data.records) {
        const minPrice = Number(r.min_price || r.Min_Price || r.minPrice) || 0;
        const maxPrice = Number(r.max_price || r.Max_Price || r.maxPrice) || minPrice;
        const modalPrice = Number(r.modal_price || r.Modal_Price || r.modalPrice) || minPrice;

        // Drop rows where modalPrice is 0
        if (modalPrice <= 0) {
          continue;
        }

        const rawDate = String(r.arrival_date || r.Arrival_Date || r.arrivalDate || "").trim();
        const arrivalDate = rawDate ? parseOgdDate(rawDate) : null;

        const stateName = (r.state || r.State || "India").trim();
        const district = (r.district || r.District || "").trim();
        const market = (r.market || r.Market || "").trim();
        const commodity = (r.commodity || r.Commodity || "").trim();
        const variety = (r.variety || r.Variety || "FAQ").trim();

        let formattedDate = "";
        if (arrivalDate) {
          const dateObj = new Date(arrivalDate);
          if (!isNaN(dateObj.getTime())) {
            formattedDate = dateObj.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
          }
        }

        parsedRecords.push({
          state: stateName,
          district,
          market,
          commodity,
          variety,
          arrivalDate,
          minPrice,
          maxPrice,
          modalPrice,
          trend: "STABLE",
          sourceLabel: formattedDate ? `Live from Agmarknet, ${formattedDate}` : "Live from Agmarknet",
          isSample: false,
        });
      }

      // Sort parsed records by arrivalDate desc in-memory
      parsedRecords.sort((a, b) => {
        if (!a.arrivalDate && !b.arrivalDate) return 0;
        if (!a.arrivalDate) return 1;
        if (!b.arrivalDate) return -1;
        return b.arrivalDate.localeCompare(a.arrivalDate);
      });

      console.log(`[LiveMandiService] Processed ${parsedRecords.length} valid live records (modalPrice > 0)`);
      return parsedRecords.length > 0 ? parsedRecords : null;
    } catch (err: any) {
      console.warn(`[LiveMandiService] data.gov.in fetch failed: ${err?.message || err}`);
      return null;
    }
  }

  /**
   * Calculate trend by comparing current modal price with previous cached modal price
   */
  private static calculateTrends(records: LiveMandiRecord[]): LiveMandiRecord[] {
    const updated = records.map((record) => {
      const key = `${record.state}|${record.market}|${record.commodity}`;
      const prevPrice = this.previousPriceMap.get(key);
      let trend: "UP" | "DOWN" | "STABLE" = record.trend || "STABLE";

      if (prevPrice !== undefined && prevPrice > 0) {
        if (record.modalPrice > prevPrice) {
          trend = "UP";
        } else if (record.modalPrice < prevPrice) {
          trend = "DOWN";
        } else {
          trend = "STABLE";
        }
      }

      return {
        ...record,
        trend,
      };
    });

    // Update previous prices map for next calculation cycle
    for (const r of updated) {
      const key = `${r.state}|${r.market}|${r.commodity}`;
      this.previousPriceMap.set(key, r.modalPrice);
    }

    return updated;
  }

  /**
   * Compute stats for a set of records
   */
  private static computeStats(records: LiveMandiRecord[]): LiveMandiStats {
    let resolvedDataSource: LiveMandiStats["dataSource"] = this.currentDataSource;
    if (this.currentDataSource === "LIVE_API") {
      if (this.justFetchedLive) {
        resolvedDataSource = "LIVE_API";
        this.justFetchedLive = false;
      } else {
        resolvedDataSource = "CACHED";
      }
    }

    const uniqueStates = new Set(records.map((r) => r.state)).size;
    const uniqueCommodities = new Set(records.map((r) => r.commodity)).size;
    const uniqueMarkets = new Set(records.map((r) => r.market)).size;

    return {
      totalRecords: records.length,
      uniqueStates,
      uniqueCommodities,
      uniqueMarkets,
      lastRefreshed: this.lastRefreshedIso || new Date().toISOString(),
      dataSource: resolvedDataSource,
    };
  }

  /**
   * 1. Get Live Mandi Prices with filtering and pagination
   */
  public static async getLiveMandiPrices(params?: LiveMandiQueryParams): Promise<LiveMandiPricesResponse> {
    const allRecords = await this.ensureData(false, params?.state);

    let filtered = allRecords;

    if (params?.state && params.state !== "ALL") {
      const stateQuery = params.state.toLowerCase().trim();
      filtered = filtered.filter((r) => r.state.toLowerCase() === stateQuery);
    }

    if (params?.district && params.district !== "ALL") {
      const districtQuery = params.district.toLowerCase().trim();
      filtered = filtered.filter((r) => r.district.toLowerCase().includes(districtQuery));
    }

    if (params?.commodity && params.commodity !== "ALL") {
      const commodityQuery = params.commodity.toLowerCase().trim();
      filtered = filtered.filter((r) => r.commodity.toLowerCase() === commodityQuery || r.commodity.toLowerCase().includes(commodityQuery));
    }

    if (params?.search && params.search.trim()) {
      const q = params.search.toLowerCase().trim();
      filtered = filtered.filter(
        (r) =>
          r.commodity.toLowerCase().includes(q) ||
          r.market.toLowerCase().includes(q) ||
          r.district.toLowerCase().includes(q) ||
          r.state.toLowerCase().includes(q) ||
          r.variety.toLowerCase().includes(q)
      );
    }

    const total = filtered.length;
    const limit = Math.max(1, Math.min(Number(params?.limit) || 100, 500));
    const offset = Math.max(0, Number(params?.offset) || 0);
    const sliced = filtered.slice(offset, offset + limit);

    const stats = this.computeStats(allRecords);

    return {
      records: sliced,
      count: sliced.length,
      total,
      stats,
    };
  }

  /**
   * 2. Get State-wise Mandi Summary with aggregated metrics
   */
  public static async getStateWiseSummary(): Promise<StatesSummaryResponse> {
    const allRecords = await this.ensureData();

    // Group records by state
    const stateMap = new Map<string, LiveMandiRecord[]>();
    for (const record of allRecords) {
      const existing = stateMap.get(record.state) || [];
      existing.push(record);
      stateMap.set(record.state, existing);
    }

    const summaries: StateMandiSummary[] = [];

    for (const [state, stateRecords] of stateMap.entries()) {
      const totalRecords = stateRecords.length;
      const marketsSet = new Set(stateRecords.map((r) => r.market));
      const commoditiesSet = new Set(stateRecords.map((r) => r.commodity));
      const totalMarkets = marketsSet.size;
      const totalCommodities = commoditiesSet.size;

      const sumModalPrice = stateRecords.reduce((sum, r) => sum + r.modalPrice, 0);
      const avgModalPrice = Math.round(sumModalPrice / (totalRecords || 1));

      // Calculate top commodities in this state
      const commodityGroups = new Map<string, LiveMandiRecord[]>();
      for (const r of stateRecords) {
        const commList = commodityGroups.get(r.commodity) || [];
        commList.push(r);
        commodityGroups.set(r.commodity, commList);
      }

      const topCommodities = Array.from(commodityGroups.entries())
        .map(([commodity, items]) => {
          const itemSum = items.reduce((sum, i) => sum + i.modalPrice, 0);
          const commAvg = Math.round(itemSum / items.length);
          const marketCount = new Set(items.map((i) => i.market)).size;
          return {
            commodity,
            avgModalPrice: commAvg,
            marketCount,
          };
        })
        .sort((a, b) => b.marketCount - a.marketCount || b.avgModalPrice - a.avgModalPrice)
        .slice(0, 5);

      summaries.push({
        state,
        totalMarkets,
        totalCommodities,
        topCommodities,
        avgModalPrice,
        totalRecords,
      });
    }

    // Sort states alphabetically
    summaries.sort((a, b) => a.state.localeCompare(b.state));

    const stats = this.computeStats(allRecords);

    return {
      states: summaries,
      count: summaries.length,
      stats,
    };
  }

  /**
   * 3. Get overall live stats
   */
  public static async getLiveStats(): Promise<LiveMandiStats> {
    const allRecords = await this.ensureData();
    return this.computeStats(allRecords);
  }

  /**
   * 4. Get all prices and aggregated stats for a specific commodity across India
   */
  public static async getCommodityPriceMap(commodity: string): Promise<CommodityPriceMapResponse> {
    const allRecords = await this.ensureData();
    const cleanComm = (commodity || "").toLowerCase().trim();

    const matched = allRecords.filter(
      (r) => r.commodity.toLowerCase() === cleanComm || r.commodity.toLowerCase().includes(cleanComm)
    );

    const count = matched.length;
    let avgModalPrice = 0;
    let minPrice = 0;
    let maxPrice = 0;
    let statesReporting = 0;

    if (count > 0) {
      const sum = matched.reduce((s, r) => s + r.modalPrice, 0);
      avgModalPrice = Math.round(sum / count);
      minPrice = Math.min(...matched.map((r) => r.minPrice));
      maxPrice = Math.max(...matched.map((r) => r.maxPrice));
      statesReporting = new Set(matched.map((r) => r.state)).size;
    }

    return {
      commodity,
      records: matched,
      count,
      avgModalPrice,
      minPrice,
      maxPrice,
      statesReporting,
    };
  }

  /**
   * 5. Force refresh the cache
   */
  public static async refreshCache(): Promise<{ success: boolean; message: string; stats: LiveMandiStats }> {
    const records = await this.ensureData(true);
    const stats = this.computeStats(records);
    return {
      success: true,
      message: `Live mandi cache refreshed successfully (${stats.dataSource})`,
      stats,
    };
  }

  /**
   * 6. Admin Mandi Status: Returns configuration and sync state without exposing any key
   */
  public static async getMandiStatus(): Promise<{
    keyConfigured: boolean;
    lastSync: string | null;
    latestArrivalDate: string | null;
    source: string;
  }> {
    const allRecords = await this.ensureData();
    const stats = this.computeStats(allRecords);

    // Find latest arrival date among records
    const validDates = allRecords
      .map((r) => r.arrivalDate)
      .filter((d): d is string => typeof d === "string" && d.length > 0)
      .sort((a, b) => b.localeCompare(a));

    return {
      keyConfigured: hasDataGovKey(),
      lastSync: this.lastRefreshedIso || null,
      latestArrivalDate: validDates[0] || null,
      source: stats.dataSource,
    };
  }
}

export default LiveMandiService;
