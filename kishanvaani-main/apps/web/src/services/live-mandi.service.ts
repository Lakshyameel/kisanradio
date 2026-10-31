import api from "../lib/api";

// ────────────────────────────────────────────
// Types
// ────────────────────────────────────────────

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

// ────────────────────────────────────────────
// API functions
// ────────────────────────────────────────────

export async function fetchLiveMandiPrices(params?: {
  state?: string;
  district?: string;
  commodity?: string;
  search?: string;
  limit?: number;
  offset?: number;
}): Promise<LiveMandiPricesResponse> {
  const res = await api.get<LiveMandiPricesResponse>("/live-mandi/prices", { params });
  return res.data;
}

export async function fetchLiveMandiStates(): Promise<StatesSummaryResponse> {
  const res = await api.get<StatesSummaryResponse>("/live-mandi/states");
  return res.data;
}

export async function fetchLiveMandiStats(): Promise<LiveMandiStats> {
  const res = await api.get<LiveMandiStats>("/live-mandi/stats");
  return res.data;
}

export async function fetchCommodityPriceMap(commodity: string): Promise<CommodityPriceMapResponse> {
  const res = await api.get<CommodityPriceMapResponse>(`/live-mandi/commodity/${encodeURIComponent(commodity)}`);
  return res.data;
}

export async function refreshLiveMandiData(): Promise<{ success: boolean; message: string }> {
  const res = await api.post<{ success: boolean; message: string }>("/live-mandi/refresh");
  return res.data;
}
