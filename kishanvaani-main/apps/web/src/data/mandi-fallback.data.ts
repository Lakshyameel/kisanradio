/**
 * Static fallback data for Mandi Prices (AGMARKNET + e-NAM).
 * Used when the API server is unreachable (offline / different device).
 */

export interface FallbackMandiPrice {
  id: string;
  commodity: string;
  variety: string;
  market: string;
  district: string;
  state: string;
  minPrice: number;
  maxPrice: number;
  modalPrice: number;
  arrivals: number;
  unit: string;
  date: string;
  trend: "UP" | "DOWN" | "STABLE";
  source: "AGMARKNET" | "eNAM";
}

export const FALLBACK_MANDI_PRICES: FallbackMandiPrice[] = [
  { id: "m001", commodity: "Wheat", variety: "Lok-1", market: "Ludhiana", district: "Ludhiana", state: "Punjab", minPrice: 2250, maxPrice: 2350, modalPrice: 2300, arrivals: 8420, unit: "Quintal", date: "2026-09-22", trend: "STABLE", source: "AGMARKNET" },
  { id: "m002", commodity: "Paddy", variety: "Pusa Basmati 1121", market: "Amritsar", district: "Amritsar", state: "Punjab", minPrice: 3800, maxPrice: 4200, modalPrice: 4050, arrivals: 5200, unit: "Quintal", date: "2026-09-22", trend: "UP", source: "AGMARKNET" },
  { id: "m003", commodity: "Soybean", variety: "JS-335", market: "Indore", district: "Indore", state: "Madhya Pradesh", minPrice: 4700, maxPrice: 5100, modalPrice: 4850, arrivals: 12000, unit: "Quintal", date: "2026-09-22", trend: "UP", source: "AGMARKNET" },
  { id: "m004", commodity: "Cotton", variety: "H-4 Desi", market: "Sirsa", district: "Sirsa", state: "Haryana", minPrice: 7200, maxPrice: 7800, modalPrice: 7500, arrivals: 3500, unit: "Quintal", date: "2026-09-22", trend: "DOWN", source: "AGMARKNET" },
  { id: "m005", commodity: "Maize", variety: "Yellow Hybrid", market: "Gulbarga", district: "Kalaburagi", state: "Karnataka", minPrice: 2100, maxPrice: 2300, modalPrice: 2200, arrivals: 7800, unit: "Quintal", date: "2026-09-22", trend: "STABLE", source: "AGMARKNET" },
  { id: "m006", commodity: "Onion", variety: "Nashik Red", market: "Lasalgaon", district: "Nashik", state: "Maharashtra", minPrice: 1800, maxPrice: 2800, modalPrice: 2250, arrivals: 25000, unit: "Quintal", date: "2026-09-22", trend: "UP", source: "AGMARKNET" },
  { id: "m007", commodity: "Potato", variety: "Kufri Jyoti", market: "Agra", district: "Agra", state: "Uttar Pradesh", minPrice: 1200, maxPrice: 1600, modalPrice: 1400, arrivals: 18000, unit: "Quintal", date: "2026-09-22", trend: "DOWN", source: "AGMARKNET" },
  { id: "m008", commodity: "Tomato", variety: "Hybrid", market: "Kolar", district: "Kolar", state: "Karnataka", minPrice: 800, maxPrice: 1500, modalPrice: 1100, arrivals: 9500, unit: "Quintal", date: "2026-09-22", trend: "UP", source: "AGMARKNET" },
  { id: "m009", commodity: "Mustard", variety: "Pusa Bold", market: "Bharatpur", district: "Bharatpur", state: "Rajasthan", minPrice: 5400, maxPrice: 5800, modalPrice: 5600, arrivals: 6200, unit: "Quintal", date: "2026-09-22", trend: "STABLE", source: "AGMARKNET" },
  { id: "m010", commodity: "Groundnut", variety: "Bold", market: "Rajkot", district: "Rajkot", state: "Gujarat", minPrice: 5800, maxPrice: 6400, modalPrice: 6100, arrivals: 8900, unit: "Quintal", date: "2026-09-22", trend: "UP", source: "AGMARKNET" },
  { id: "m011", commodity: "Sugarcane", variety: "Co-0238", market: "Muzaffarnagar", district: "Muzaffarnagar", state: "Uttar Pradesh", minPrice: 350, maxPrice: 380, modalPrice: 365, arrivals: 42000, unit: "Quintal", date: "2026-09-22", trend: "STABLE", source: "AGMARKNET" },
  { id: "m012", commodity: "Arhar (Tur)", variety: "ICPL-87119", market: "Gulbarga", district: "Kalaburagi", state: "Karnataka", minPrice: 7000, maxPrice: 7800, modalPrice: 7400, arrivals: 4500, unit: "Quintal", date: "2026-09-22", trend: "UP", source: "AGMARKNET" },
  { id: "m013", commodity: "Moong Dal", variety: "K-851", market: "Nagpur", district: "Nagpur", state: "Maharashtra", minPrice: 7500, maxPrice: 8200, modalPrice: 7850, arrivals: 2800, unit: "Quintal", date: "2026-09-22", trend: "UP", source: "AGMARKNET" },
  { id: "m014", commodity: "Chana (Chickpea)", variety: "Desi", market: "Sehore", district: "Sehore", state: "Madhya Pradesh", minPrice: 5200, maxPrice: 5600, modalPrice: 5400, arrivals: 9200, unit: "Quintal", date: "2026-09-22", trend: "DOWN", source: "AGMARKNET" },
  { id: "m015", commodity: "Urad Dal", variety: "T-9", market: "Indore", district: "Indore", state: "Madhya Pradesh", minPrice: 6800, maxPrice: 7400, modalPrice: 7100, arrivals: 3100, unit: "Quintal", date: "2026-09-22", trend: "STABLE", source: "AGMARKNET" },
  { id: "m016", commodity: "Rice (Raw)", variety: "IR-64", market: "Kakinada", district: "Kakinada", state: "Andhra Pradesh", minPrice: 2200, maxPrice: 2600, modalPrice: 2400, arrivals: 14000, unit: "Quintal", date: "2026-09-22", trend: "STABLE", source: "AGMARKNET" },
  { id: "m017", commodity: "Jowar", variety: "Maldandi", market: "Solapur", district: "Solapur", state: "Maharashtra", minPrice: 2900, maxPrice: 3400, modalPrice: 3150, arrivals: 5600, unit: "Quintal", date: "2026-09-22", trend: "UP", source: "AGMARKNET" },
  { id: "m018", commodity: "Bajra (Pearl Millet)", variety: "HHB-67", market: "Hisar", district: "Hisar", state: "Haryana", minPrice: 2100, maxPrice: 2450, modalPrice: 2300, arrivals: 7200, unit: "Quintal", date: "2026-09-22", trend: "STABLE", source: "AGMARKNET" },
  { id: "m019", commodity: "Turmeric", variety: "Erode", market: "Erode", district: "Erode", state: "Tamil Nadu", minPrice: 13000, maxPrice: 15000, modalPrice: 14000, arrivals: 3800, unit: "Quintal", date: "2026-09-22", trend: "UP", source: "AGMARKNET" },
  { id: "m020", commodity: "Cardamom (Green)", variety: "Malabar", market: "Idukki", district: "Idukki", state: "Kerala", minPrice: 220000, maxPrice: 250000, modalPrice: 238000, arrivals: 180, unit: "Quintal", date: "2026-09-22", trend: "UP", source: "AGMARKNET" },
];

export const FALLBACK_ENAM_TRADES = [
  { id: "en001", commodity: "Wheat", mandi: "Hapur e-NAM Mandi", state: "Uttar Pradesh", arrivals: 3200, highBid: 2380, lowBid: 2260, winningBid: 2340, tradedVolume: 2950, status: "SETTLED", buyers: 14, auctionTime: "09:15 AM" },
  { id: "en002", commodity: "Soybean", mandi: "Dewas e-NAM Mandi", state: "Madhya Pradesh", arrivals: 5400, highBid: 5050, lowBid: 4780, winningBid: 4980, tradedVolume: 5100, status: "SETTLED", buyers: 22, auctionTime: "10:30 AM" },
  { id: "en003", commodity: "Onion", mandi: "Mahabaleshwar e-NAM Mandi", state: "Maharashtra", arrivals: 9800, highBid: 2750, lowBid: 1950, winningBid: 2400, tradedVolume: 9500, status: "SETTLED", buyers: 31, auctionTime: "07:45 AM" },
  { id: "en004", commodity: "Paddy", mandi: "Nellore e-NAM Mandi", state: "Andhra Pradesh", arrivals: 6700, highBid: 2650, lowBid: 2380, winningBid: 2550, tradedVolume: 6400, status: "SETTLED", buyers: 18, auctionTime: "08:00 AM" },
  { id: "en005", commodity: "Cotton", mandi: "Adilabad e-NAM Mandi", state: "Telangana", arrivals: 2100, highBid: 7900, lowBid: 7200, winningBid: 7650, tradedVolume: 1980, status: "BIDDING", buyers: 9, auctionTime: "11:00 AM" },
];

export const FALLBACK_ENAM_STATS = {
  connectedMandisTotal: 1361,
  statesCovered: 23,
  activeTradersRegistered: 2180000,
  farmersBenefited: 19500000,
  todayTotalTradedVolumeQuintals: 1850000,
  todayTotalTradeValueCrore: 4250,
  topTradedCommodityToday: "Paddy",
};

export const FALLBACK_MANDI_META = {
  states: [
    "Andhra Pradesh", "Assam", "Bihar", "Chhattisgarh", "Gujarat",
    "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka", "Kerala",
    "Madhya Pradesh", "Maharashtra", "Manipur", "Odisha", "Punjab",
    "Rajasthan", "Tamil Nadu", "Telangana", "Uttar Pradesh", "Uttarakhand",
    "West Bengal", "Delhi", "Jammu & Kashmir", "Ladakh", "Goa",
    "Tripura", "Meghalaya", "Nagaland", "Mizoram", "Arunachal Pradesh",
    "Sikkim", "Puducherry",
  ],
  commodities: [
    "Wheat", "Paddy", "Maize", "Soybean", "Cotton", "Onion", "Potato",
    "Tomato", "Mustard", "Groundnut", "Sugarcane", "Arhar (Tur)", "Moong Dal",
    "Chana (Chickpea)", "Urad Dal", "Rice (Raw)", "Jowar", "Bajra",
    "Turmeric", "Cardamom (Green)", "Ginger", "Garlic", "Cabbage",
    "Cauliflower", "Brinjal", "Bitter Gourd", "Bottle Gourd", "Okra",
    "Banana", "Mango",
  ],
  districts: [],
};
