import api from "../lib/api";

export interface MandiPriceItem {
  id: string;
  state: string;
  district: string;
  market: string;
  commodity: string;
  variety?: string;
  minPrice: number | null;
  maxPrice: number | null;
  modalPrice: number | null;
  arrivals?: number | null;
  source?: "AGMARKNET" | "ENAM" | "LOCAL" | "SAMPLE" | string;
  sourceLabel?: string;
  isSample?: boolean;
  tradeStatus?: string;
  trend: "UP" | "DOWN" | "STABLE";
  priceDate: string | null;
}

export interface MandiResponse {
  prices: MandiPriceItem[];
  count: number;
}

export interface MandiMetaResponse {
  states: string[];
  commodities: string[];
  districts: string[];
  sources?: string[];
}

export interface AgmarknetPriceItem extends Omit<MandiPriceItem, "arrivals"> {
  arrivals?: number | null;
  grade?: string;
}

export interface AgmarknetResponse {
  source: string;
  agency: string;
  portal: string;
  count: number;
  total: number;
  prices: AgmarknetPriceItem[];
}

export interface AgmarknetSummaryResponse {
  activeMandisCount: number;
  reportingStates: number;
  totalArrivalsQuintals: number;
  marketTrends: {
    upward: number;
    downward: number;
    stable: number;
  };
  lastUpdated: string;
}

export interface EnamTradeItem {
  id: string;
  state: string;
  district?: string;
  apmc: string;
  mandiCode?: string;
  commodity: string;
  variety: string;
  minBidPrice: number;
  maxBidPrice: number;
  modalPrice: number;
  tradedQuantity: number;
  tradeValueLakhs?: number;
  lotsTraded?: number;
  tradeStatus: "AUCTION_SETTLED" | "ACTIVE_BIDDING" | "WEIGHMENT_IN_PROGRESS" | string;
  tradeDate: string;
  trend: "UP" | "DOWN" | "STABLE";
  source: "ENAM";
}

export interface EnamResponse {
  source: string;
  portal: string;
  agency: string;
  count: number;
  total: number;
  trades: EnamTradeItem[];
}

export interface EnamStatsResponse {
  connectedMandisTotal: number;
  integratedStatesTotal: number;
  onboardedCommoditiesTotal: number;
  todayTotalTradedVolumeQuintals: number;
  todayTotalTradeValueCrores: number;
  activeBiddingCount: number;
  completedAuctionsCount: number;
  lastSyncTimestamp: string;
}

export interface MandiComparisonResponse {
  commodity: string;
  state: string;
  agmarknet: {
    averageModalPrice: number;
    topMandis: MandiPriceItem[];
    sampleCount: number;
  };
  enam: {
    averageModalPrice: number;
    topAuctions: MandiPriceItem[];
    sampleCount: number;
  };
  comparison: {
    spreadRupees: number;
    spreadPercentage: number;
    betterPlatform: "ENAM" | "AGMARKNET" | "EQUAL";
    recommendation: string;
  };
  timestamp: string;
}

// Unified Mandi APIs
export async function fetchMandiPrices(params?: {
  state?: string;
  district?: string;
  commodity?: string;
  source?: string;
  search?: string;
  limit?: number;
}): Promise<MandiResponse> {
  const res = await api.get<MandiResponse>("/mandi", { params });
  return res.data;
}

export async function fetchMandiMeta(): Promise<MandiMetaResponse> {
  const res = await api.get<MandiMetaResponse>("/mandi/meta");
  return res.data;
}

// Dedicated AGMARKNET APIs
export async function fetchAgmarknetPrices(params?: {
  state?: string;
  district?: string;
  commodity?: string;
  market?: string;
  search?: string;
  limit?: number;
  offset?: number;
}): Promise<AgmarknetResponse> {
  const res = await api.get<AgmarknetResponse>("/agmarknet/prices", { params });
  return res.data;
}

export async function fetchAgmarknetCommodities(): Promise<{ commodities: string[]; count: number }> {
  const res = await api.get<{ commodities: string[]; count: number }>("/agmarknet/commodities");
  return res.data;
}

export async function fetchAgmarknetStates(): Promise<{ states: string[]; districts: string[]; markets: string[] }> {
  const res = await api.get<{ states: string[]; districts: string[]; markets: string[] }>("/agmarknet/states");
  return res.data;
}

export async function fetchAgmarknetSummary(): Promise<AgmarknetSummaryResponse> {
  const res = await api.get<AgmarknetSummaryResponse>("/agmarknet/summary");
  return res.data;
}

// Dedicated e-NAM APIs
export async function fetchEnamTradeData(params?: {
  state?: string;
  apmc?: string;
  commodity?: string;
  tradeStatus?: string;
  search?: string;
  limit?: number;
  offset?: number;
}): Promise<EnamResponse> {
  const res = await api.get<EnamResponse>("/enam/trade-data", { params });
  return res.data;
}

export async function fetchEnamCommodities(): Promise<{ commodities: string[]; count: number }> {
  const res = await api.get<{ commodities: string[]; count: number }>("/enam/commodities");
  return res.data;
}

export async function fetchEnamStats(): Promise<EnamStatsResponse> {
  const res = await api.get<EnamStatsResponse>("/enam/stats");
  return res.data;
}

// Price Comparator API
export async function fetchMandiComparison(commodity: string, state?: string): Promise<MandiComparisonResponse> {
  const res = await api.get<MandiComparisonResponse>("/mandi/compare", {
    params: { commodity, state: state === "ALL" ? undefined : state },
  });
  return res.data;
}

export interface HistoricalPricePoint {
  date: string;
  dayLabel: string;
  modalPrice: number;
  minPrice: number;
  maxPrice: number;
  arrivalsQtl: number;
  movingAvg7: number;
}

export interface MandiTrendAnalysis {
  commodity: string;
  market: string;
  district: string;
  state: string;
  currentModalPrice: number;
  price7DaysAgo: number;
  price30DaysAgo: number;
  change7DaysPercent: number;
  change30DaysPercent: number;
  peakPrice30Days: number;
  troughPrice30Days: number;
  momentum: "BULLISH" | "BEARISH" | "STABLE";
  momentumLabel: string;
  advisory: string;
  advisoryHi: string;
  history: HistoricalPricePoint[];
  sourceLabel: string;
}

export interface NearbyMandiResult {
  marketId: string;
  marketName: string;
  district: string;
  state: string;
  commodity: string;
  modalPrice: number;
  minPrice: number;
  maxPrice: number;
  crowflightDistanceKm: number;
  estimatedRoadDistanceKm: number;
  estimatedTravelTimeHours: number;
  transportCostPerQtl: number;
  netRealizablePricePerQtl: number;
  isLocalMandi: boolean;
  netAdvantageVsLocalPerQtl: number;
  netGainForTruckload50Qtl: number;
  rank: number;
  isBestMarket: boolean;
  sourceLabel: string;
}

export interface NearbyBestMarketsResponse {
  origin: { district: string; state: string; lat: number; lon: number };
  commodity: string;
  radiusKm: number;
  freightPerQtlPerKm: number;
  bestMarket: NearbyMandiResult | null;
  localMarket: NearbyMandiResult | null;
  markets: NearbyMandiResult[];
  recommendation: string;
  recommendationHi: string;
  sourceLabel: string;
}

export async function fetchMandiTrends(params: {
  commodity?: string;
  district?: string;
  days?: number;
}): Promise<MandiTrendAnalysis> {
  const res = await api.get<{ success: boolean; data: MandiTrendAnalysis }>("/mandi/trends", { params });
  return res.data.data;
}

export async function fetchNearbyBestMarkets(params: {
  commodity?: string;
  district?: string;
  lat?: number;
  lon?: number;
  radiusKm?: number;
  freightPerQtlPerKm?: number;
}): Promise<NearbyBestMarketsResponse> {
  const res = await api.get<{ success: boolean; data: NearbyBestMarketsResponse }>("/mandi/nearby-best", { params });
  return res.data.data;
}

