import { useState, useEffect, useMemo } from "react";
import {
  TrendingUp,
  TrendingDown,
  Navigation,
  MapPin,
  Truck,
  Sparkles,
  Trophy,
  Calendar,
  Layers,
  ArrowRight,
  Info,
  Loader2,
  CheckCircle2,
  Scale,
  DollarSign,
  AlertCircle,
  Clock,
  Compass,
} from "lucide-react";
import {
  fetchMandiTrends,
  fetchNearbyBestMarkets,
  MandiTrendAnalysis,
  NearbyBestMarketsResponse,
  NearbyMandiResult,
} from "../../services/mandi.service";
import TapToHearButton from "../common/TapToHearButton";
import { getCurrentCoordinates } from "../../utils/geolocation";

const POPULAR_COMMODITIES = [
  "Wheat",
  "Basmati Rice",
  "Paddy (Dhan)",
  "Mustard",
  "Cotton",
  "Soybean",
  "Gram (Chana)",
  "Potato",
  "Tomato",
  "Onion",
  "Maize",
];

const MAJOR_DISTRICTS = [
  "Ludhiana",
  "Karnal",
  "Hisar",
  "Nashik",
  "Pune",
  "Nagpur",
  "Indore",
  "Ujjain",
  "Kota",
  "Agra",
  "Gorakhpur",
  "Varanasi",
  "Guntur",
  "Warangal",
  "Surat",
  "Rajkot",
  "Patna",
];

export default function MandiTrendsAndNearbyCompare() {
  const [activeTab, setActiveTab] = useState<"NEARBY" | "TRENDS">("NEARBY");

  // Filter States
  const [commodity, setCommodity] = useState<string>("Wheat");
  const [district, setDistrict] = useState<string>("Ludhiana");
  const [radiusKm, setRadiusKm] = useState<number>(100);
  const [freightRate, setFreightRate] = useState<number>(2.8);
  const [days, setDays] = useState<number>(30);

  // GPS State
  const [gpsLoading, setGpsLoading] = useState<boolean>(false);
  const [userCoords, setUserCoords] = useState<{ lat: number; lon: number } | null>(null);

  // Data States
  const [nearbyData, setNearbyData] = useState<NearbyBestMarketsResponse | null>(null);
  const [trendsData, setTrendsData] = useState<MandiTrendAnalysis | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Load Nearby Best Markets
  useEffect(() => {
    async function loadNearby() {
      if (activeTab !== "NEARBY") return;
      setLoading(true);
      setError(null);
      try {
        const res = await fetchNearbyBestMarkets({
          commodity,
          district: userCoords ? undefined : district,
          lat: userCoords?.lat,
          lon: userCoords?.lon,
          radiusKm,
          freightPerQtlPerKm: freightRate,
        });
        setNearbyData(res);
      } catch (err: any) {
        console.error("Failed to fetch nearby mandi comparison:", err);
        setError("Unable to calculate nearby mandi comparisons. Please try another district.");
      } finally {
        setLoading(false);
      }
    }
    loadNearby();
  }, [activeTab, commodity, district, userCoords, radiusKm, freightRate]);

  // Load 30-Day Trends
  useEffect(() => {
    async function loadTrends() {
      if (activeTab !== "TRENDS") return;
      setLoading(true);
      setError(null);
      try {
        const res = await fetchMandiTrends({
          commodity,
          district,
          days,
        });
        setTrendsData(res);
      } catch (err: any) {
        console.error("Failed to fetch mandi price trends:", err);
        setError("Unable to load price trend analytics. Please try another commodity.");
      } finally {
        setLoading(false);
      }
    }
    loadTrends();
  }, [activeTab, commodity, district, days]);

  const handleUseGps = async () => {
    setGpsLoading(true);
    try {
      const coords = await getCurrentCoordinates();
      setUserCoords({ lat: coords.latitude, lon: coords.longitude });
    } catch {
      alert("Unable to acquire GPS coordinates. Please select your district manually.");
    } finally {
      setGpsLoading(false);
    }
  };

  const clearGps = () => {
    setUserCoords(null);
  };

  // SVG Chart Calculation for Trends
  const chartPoints = useMemo(() => {
    if (!trendsData || !trendsData.history || trendsData.history.length === 0) return "";
    const history = trendsData.history;
    const minP = trendsData.troughPrice30Days * 0.98;
    const maxP = trendsData.peakPrice30Days * 1.02;
    const range = maxP - minP || 1;

    const width = 600;
    const height = 180;
    const paddingX = 20;
    const paddingY = 20;

    return history
      .map((h, i) => {
        const x = paddingX + (i / (history.length - 1)) * (width - 2 * paddingX);
        const y = height - paddingY - ((h.modalPrice - minP) / range) * (height - 2 * paddingY);
        return `${x},${y}`;
      })
      .join(" ");
  }, [trendsData]);

  return (
    <div className="space-y-6">
      {/* Tab Switcher Header */}
      <div className="bg-white p-2 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between gap-2 max-w-xl mx-auto">
        <button
          type="button"
          onClick={() => setActiveTab("NEARBY")}
          className={`flex-1 py-2.5 px-4 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all ${
            activeTab === "NEARBY"
              ? "bg-emerald-600 text-white shadow-sm"
              : "text-gray-600 hover:text-emerald-700 hover:bg-emerald-50"
          }`}
        >
          <Compass className="w-4 h-4" />
          <span>Best Market Within {radiusKm} km</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("TRENDS")}
          className={`flex-1 py-2.5 px-4 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all ${
            activeTab === "TRENDS"
              ? "bg-emerald-600 text-white shadow-sm"
              : "text-gray-600 hover:text-emerald-700 hover:bg-emerald-50"
          }`}
        >
          <TrendingUp className="w-4 h-4" />
          <span>30-Day Price Trends & Selling Advice</span>
        </button>
      </div>

      {/* Global Filter Toolbar */}
      <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Commodity Selector */}
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
              Select Crop / Commodity
            </label>
            <select
              value={commodity}
              onChange={(e) => setCommodity(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-gray-50 border border-gray-200 text-xs sm:text-sm font-semibold text-gray-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              {POPULAR_COMMODITIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          {/* District Selector & GPS Button */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">
                Farmer District / Location
              </label>
              {userCoords && (
                <button
                  type="button"
                  onClick={clearGps}
                  className="text-[10px] text-rose-600 font-bold hover:underline"
                >
                  Clear GPS
                </button>
              )}
            </div>

            <div className="flex items-center gap-2">
              <select
                disabled={Boolean(userCoords)}
                value={district}
                onChange={(e) => setDistrict(e.target.value)}
                className="flex-1 px-3 py-2 rounded-xl bg-gray-50 border border-gray-200 text-xs sm:text-sm font-semibold text-gray-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:opacity-60"
              >
                {MAJOR_DISTRICTS.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>

              <button
                type="button"
                onClick={handleUseGps}
                disabled={gpsLoading}
                title="Use device GPS location"
                className={`p-2 rounded-xl border transition-all ${
                  userCoords
                    ? "bg-emerald-600 text-white border-emerald-600"
                    : "bg-gray-50 hover:bg-emerald-50 text-gray-700 border-gray-200"
                }`}
              >
                {gpsLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Navigation className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Radius Selector (for Nearby view) or Days timeframe (for Trends view) */}
          {activeTab === "NEARBY" ? (
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                Search Radius
              </label>
              <select
                value={radiusKm}
                onChange={(e) => setRadiusKm(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl bg-gray-50 border border-gray-200 text-xs sm:text-sm font-semibold text-gray-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value={50}>Within 50 km</option>
                <option value={100}>Within 100 km (Recommended)</option>
                <option value={150}>Within 150 km</option>
              </select>
            </div>
          ) : (
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                Historical Period
              </label>
              <select
                value={days}
                onChange={(e) => setDays(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl bg-gray-50 border border-gray-200 text-xs sm:text-sm font-semibold text-gray-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value={7}>Last 7 Days</option>
                <option value={15}>Last 15 Days</option>
                <option value={30}>Last 30 Days (Full Month)</option>
              </select>
            </div>
          )}

          {/* Freight Rate / Quick Insight */}
          {activeTab === "NEARBY" ? (
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                Freight Rate (₹/Qtl/km)
              </label>
              <select
                value={freightRate}
                onChange={(e) => setFreightRate(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl bg-gray-50 border border-gray-200 text-xs sm:text-sm font-semibold text-gray-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value={2.2}>₹2.20 / Qtl / km (Own Tractor-Trolley)</option>
                <option value={2.8}>₹2.80 / Qtl / km (Standard Freight)</option>
                <option value={3.5}>₹3.50 / Qtl / km (Commercial Mini-Truck)</option>
              </select>
            </div>
          ) : (
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                Data Source & Portal
              </label>
              <div className="px-3 py-2 rounded-xl bg-gray-50 border border-gray-200 text-xs font-bold text-gray-600 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Agmarknet & data.gov.in</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center p-16 space-y-3 bg-white rounded-3xl border border-gray-100">
          <Loader2 className="w-8 h-8 text-emerald-600 animate-spin" />
          <p className="text-xs sm:text-sm font-semibold text-gray-600">
            Fetching authentic Agmarknet records and calculating road distances...
          </p>
        </div>
      ) : error ? (
        <div className="p-6 bg-rose-50 border border-rose-200 rounded-3xl text-rose-800 text-xs sm:text-sm flex items-center gap-3">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{error}</span>
        </div>
      ) : activeTab === "NEARBY" && nearbyData ? (
        /* ══════════════════════════════════════════════════════════════
           TAB 1: BEST MARKET WITHIN 100 KM COMPARISON
           ══════════════════════════════════════════════════════════════ */
        <div className="space-y-6">
          {/* Hero Best Recommendation Card */}
          {nearbyData.bestMarket && (
            <div className="bg-gradient-to-r from-emerald-950 via-emerald-900 to-teal-950 text-white p-6 sm:p-7 rounded-3xl shadow-md border border-emerald-800/40 space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-amber-400 text-emerald-950 rounded-2xl shadow-sm">
                    <Trophy className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-800 text-emerald-200 border border-emerald-700">
                      <span>#1 Highest In-Hand Profit Market</span>
                    </div>
                    <h3 className="text-xl sm:text-2xl font-black mt-1">
                      {nearbyData.bestMarket.marketName}
                    </h3>
                    <p className="text-xs text-emerald-200/80">
                      {nearbyData.bestMarket.district}, {nearbyData.bestMarket.state} • ~
                      {nearbyData.bestMarket.estimatedRoadDistanceKm} km by road (~
                      {nearbyData.bestMarket.estimatedTravelTimeHours} hrs driving)
                    </p>
                  </div>
                </div>

                <div className="text-right bg-white/10 px-4 py-3 rounded-2xl border border-white/10">
                  <div className="text-[11px] font-bold text-emerald-300 uppercase tracking-wider">
                    Net In-Hand Realization
                  </div>
                  <div className="text-2xl sm:text-3xl font-black text-amber-300">
                    ₹{nearbyData.bestMarket.netRealizablePricePerQtl.toLocaleString("en-IN")}{" "}
                    <span className="text-xs font-normal text-emerald-200">/ Qtl</span>
                  </div>
                  <div className="text-[10px] text-emerald-300/80 mt-0.5">
                    (Modal: ₹{nearbyData.bestMarket.modalPrice} - Freight: ₹
                    {nearbyData.bestMarket.transportCostPerQtl})
                  </div>
                </div>
              </div>

              {/* Recommendation Callout & Voice Button */}
              <div className="p-4 bg-emerald-900/60 rounded-2xl border border-emerald-700/50 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <p className="text-xs sm:text-sm text-emerald-100 font-medium leading-relaxed">
                  {nearbyData.recommendation}
                </p>

                <TapToHearButton
                  text={nearbyData.recommendation}
                  label="Hear Recommendation"
                  className="self-start md:self-auto bg-white/10 text-white border-white/20 hover:bg-white/20 shrink-0"
                />
              </div>

              {/* Extra Earnings Breakdown */}
              {nearbyData.bestMarket.netAdvantageVsLocalPerQtl > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 text-xs">
                  <div className="p-3 bg-white/5 rounded-xl border border-white/10">
                    <span className="text-emerald-300 font-bold block mb-1">Local Mandi Net:</span>
                    <span className="text-sm font-extrabold text-white">
                      ₹{nearbyData.localMarket?.netRealizablePricePerQtl.toLocaleString("en-IN") || "—"}/Qtl
                    </span>
                  </div>
                  <div className="p-3 bg-white/5 rounded-xl border border-white/10">
                    <span className="text-emerald-300 font-bold block mb-1">Extra Gain / Quintal:</span>
                    <span className="text-sm font-extrabold text-emerald-300">
                      +₹{nearbyData.bestMarket.netAdvantageVsLocalPerQtl.toLocaleString("en-IN")}/Qtl
                    </span>
                  </div>
                  <div className="p-3 bg-amber-400/10 rounded-xl border border-amber-400/30">
                    <span className="text-amber-300 font-bold block mb-1">Extra on 50 Qtl Trolley:</span>
                    <span className="text-sm font-extrabold text-amber-300">
                      +₹{nearbyData.bestMarket.netGainForTruckload50Qtl.toLocaleString("en-IN")} Extra Net Profit
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Mandi Comparison Table */}
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden space-y-4 p-5 sm:p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h4 className="text-base sm:text-lg font-black text-gray-900">
                  All Mandis within {nearbyData.radiusKm} km Trading {nearbyData.commodity}
                </h4>
                <p className="text-xs text-gray-500">
                  Calculated from {nearbyData.origin.district}, {nearbyData.origin.state} • Freight deduction applied at ₹
                  {nearbyData.freightPerQtlPerKm}/Qtl/km
                </p>
              </div>
              <span className="text-xs font-bold text-gray-400">
                {nearbyData.markets.length} APMC yards found
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-gray-200 text-gray-500 font-bold uppercase tracking-wider text-[11px]">
                    <th className="py-3 px-3">Rank & Mandi</th>
                    <th className="py-3 px-3">Distance</th>
                    <th className="py-3 px-3">Mandi Rate</th>
                    <th className="py-3 px-3">Freight Cost</th>
                    <th className="py-3 px-3">Net Realization</th>
                    <th className="py-3 px-3">Net Gain vs Local</th>
                    <th className="py-3 px-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {nearbyData.markets.map((m) => (
                    <tr
                      key={m.marketId}
                      className={`hover:bg-gray-50 transition-colors ${
                        m.isBestMarket ? "bg-emerald-50/40 font-bold" : ""
                      }`}
                    >
                      <td className="py-3.5 px-3">
                        <div className="flex items-center gap-2">
                          <span
                            className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black ${
                              m.rank === 1
                                ? "bg-amber-400 text-emerald-950"
                                : "bg-gray-200 text-gray-700"
                            }`}
                          >
                            {m.rank}
                          </span>
                          <div>
                            <div className="font-bold text-gray-900">{m.marketName}</div>
                            <div className="text-[10px] text-gray-400 font-normal">
                              {m.district}, {m.state}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-3 text-gray-600">
                        <div>{m.estimatedRoadDistanceKm} km</div>
                        <div className="text-[10px] text-gray-400">~{m.estimatedTravelTimeHours} hrs</div>
                      </td>

                      <td className="py-3.5 px-3">
                        <div className="font-extrabold text-gray-900">₹{m.modalPrice.toLocaleString("en-IN")}</div>
                        <div className="text-[10px] text-gray-400">
                          Range: ₹{m.minPrice} - ₹{m.maxPrice}
                        </div>
                      </td>

                      <td className="py-3.5 px-3 text-rose-600 font-semibold">
                        -₹{m.transportCostPerQtl}
                      </td>

                      <td className="py-3.5 px-3">
                        <span
                          className={`px-2 py-1 rounded-md text-xs font-black ${
                            m.isBestMarket
                              ? "bg-emerald-600 text-white"
                              : "bg-gray-100 text-gray-900"
                          }`}
                        >
                          ₹{m.netRealizablePricePerQtl.toLocaleString("en-IN")}/Qtl
                        </span>
                      </td>

                      <td className="py-3.5 px-3">
                        {m.isLocalMandi ? (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-800">
                            LOCAL MANDI
                          </span>
                        ) : m.netAdvantageVsLocalPerQtl > 0 ? (
                          <span className="text-emerald-700 font-black">
                            +₹{m.netAdvantageVsLocalPerQtl}/Qtl
                          </span>
                        ) : (
                          <span className="text-gray-400 font-normal">
                            -₹{Math.abs(m.netAdvantageVsLocalPerQtl)}/Qtl
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-3 text-right">
                        <TapToHearButton
                          text={`${m.marketName} is ${m.estimatedRoadDistanceKm} km away offering ₹${
                            m.modalPrice
                          } per quintal. After ₹${m.transportCostPerQtl} transport cost, your net profit is ₹${
                            m.netRealizablePricePerQtl
                          } per quintal.`}
                          label="Hear"
                          className="text-xs py-1 px-2"
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <p className="text-[11px] text-gray-400 pt-2 border-t border-gray-100">
              * Source: {nearbyData.sourceLabel}. Net realization excludes local loading/unloading cess and mandi cess.
            </p>
          </div>
        </div>
      ) : activeTab === "TRENDS" && trendsData ? (
        /* ══════════════════════════════════════════════════════════════
           TAB 2: 30-DAY PRICE TRENDS & MOMENTUM ANALYTICS
           ══════════════════════════════════════════════════════════════ */
        <div className="space-y-6">
          {/* Top Metric Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm space-y-1">
              <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                Current Modal Price
              </span>
              <div className="text-2xl sm:text-3xl font-black text-gray-900">
                ₹{trendsData.currentModalPrice.toLocaleString("en-IN")}{" "}
                <span className="text-xs font-normal text-gray-500">/ Qtl</span>
              </div>
              <span className="text-[10px] text-emerald-600 font-semibold block">
                {trendsData.commodity} in {trendsData.district}
              </span>
            </div>

            <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm space-y-1">
              <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                7-Day Price Velocity
              </span>
              <div
                className={`text-2xl sm:text-3xl font-black flex items-center gap-1 ${
                  trendsData.change7DaysPercent >= 0 ? "text-emerald-600" : "text-rose-600"
                }`}
              >
                {trendsData.change7DaysPercent >= 0 ? (
                  <TrendingUp className="w-6 h-6" />
                ) : (
                  <TrendingDown className="w-6 h-6" />
                )}
                <span>{trendsData.change7DaysPercent > 0 ? `+${trendsData.change7DaysPercent}%` : `${trendsData.change7DaysPercent}%`}</span>
              </div>
              <span className="text-[10px] text-gray-500 font-semibold block">
                vs 7 days ago (₹{trendsData.price7DaysAgo})
              </span>
            </div>

            <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm space-y-1">
              <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                30-Day Range (High/Low)
              </span>
              <div className="text-lg sm:text-xl font-black text-gray-900">
                ₹{trendsData.peakPrice30Days}{" "}
                <span className="text-xs font-normal text-gray-400">/ ₹{trendsData.troughPrice30Days}</span>
              </div>
              <span className="text-[10px] text-gray-500 font-semibold block">
                Peak vs Trough (1 Month)
              </span>
            </div>

            <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm space-y-1">
              <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                Market Momentum
              </span>
              <div>
                <span
                  className={`inline-block px-2.5 py-1 rounded-full text-xs font-black ${
                    trendsData.momentum === "BULLISH"
                      ? "bg-emerald-100 text-emerald-800"
                      : trendsData.momentum === "BEARISH"
                      ? "bg-rose-100 text-rose-800"
                      : "bg-blue-100 text-blue-800"
                  }`}
                >
                  {trendsData.momentumLabel}
                </span>
              </div>
              <span className="text-[10px] text-gray-500 font-semibold block">
                Algorithmically Computed
              </span>
            </div>
          </div>

          {/* AI Selling Recommendation Banner */}
          <div className="bg-gradient-to-r from-emerald-900 to-teal-900 text-white p-6 rounded-3xl shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1.5 max-w-2xl">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-800 text-emerald-200 border border-emerald-700">
                <Sparkles className="w-3 h-3 text-amber-300" />
                <span>Optimal Selling Strategy Advice</span>
              </div>
              <p className="text-sm font-semibold text-emerald-50 leading-relaxed">
                {trendsData.advisory}
              </p>
              <p className="text-xs text-emerald-200/90 italic">
                {trendsData.advisoryHi}
              </p>
            </div>

            <TapToHearButton
              text={`${trendsData.advisory}. ${trendsData.advisoryHi}`}
              label="Hear Selling Advice"
              className="self-start md:self-auto bg-white/10 text-white border-white/20 hover:bg-white/20 shrink-0"
            />
          </div>

          {/* Interactive SVG Price Curve Chart */}
          <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-base font-black text-gray-900">
                  {trendsData.commodity} Price Trajectory & Moving Average ({trendsData.history.length} Days)
                </h4>
                <p className="text-xs text-gray-400">
                  Green line = Daily Modal Price (₹/Qtl) • Peak: ₹{trendsData.peakPrice30Days} • Low: ₹{trendsData.troughPrice30Days}
                </p>
              </div>
              <div className="text-xs font-bold text-gray-500">
                Agmarknet Live Series
              </div>
            </div>

            <div className="w-full bg-gray-50/60 rounded-2xl p-4 border border-gray-100 overflow-hidden">
              <svg viewBox="0 0 600 180" className="w-full h-44 overflow-visible">
                {/* Horizontal Grid lines */}
                <line x1="20" y1="20" x2="580" y2="20" stroke="#e5e7eb" strokeDasharray="3,3" />
                <line x1="20" y1="90" x2="580" y2="90" stroke="#e5e7eb" strokeDasharray="3,3" />
                <line x1="20" y1="160" x2="580" y2="160" stroke="#e5e7eb" strokeDasharray="3,3" />

                {/* Polyline for Modal Price curve */}
                {chartPoints && (
                  <polyline
                    fill="none"
                    stroke="#059669"
                    strokeWidth="3.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    points={chartPoints}
                  />
                )}
              </svg>

              <div className="flex justify-between text-[11px] text-gray-400 pt-2 font-medium">
                <span>{trendsData.history[0]?.dayLabel}</span>
                <span>{trendsData.history[Math.floor(trendsData.history.length / 2)]?.dayLabel}</span>
                <span>{trendsData.history[trendsData.history.length - 1]?.dayLabel}</span>
              </div>
            </div>
          </div>

          {/* Detailed Historical Day-by-Day Table */}
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden p-5 sm:p-6 space-y-4">
            <h4 className="text-base font-black text-gray-900">
              Daily Historical Arrival & Price Log
            </h4>

            <div className="overflow-x-auto max-h-72 overflow-y-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead className="sticky top-0 bg-white border-b border-gray-200 text-gray-500 font-bold uppercase tracking-wider text-[11px]">
                  <tr>
                    <th className="py-2.5 px-3">Date</th>
                    <th className="py-2.5 px-3">Modal Price</th>
                    <th className="py-2.5 px-3">Min / Max Range</th>
                    <th className="py-2.5 px-3">7-Day Moving Avg</th>
                    <th className="py-2.5 px-3 text-right">Arrival Volume</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {trendsData.history.slice().reverse().map((h) => (
                    <tr key={h.date} className="hover:bg-gray-50">
                      <td className="py-2.5 px-3 font-semibold text-gray-800">{h.dayLabel}</td>
                      <td className="py-2.5 px-3 font-black text-emerald-800">₹{h.modalPrice}</td>
                      <td className="py-2.5 px-3 text-gray-500">₹{h.minPrice} - ₹{h.maxPrice}</td>
                      <td className="py-2.5 px-3 text-gray-700 font-medium">₹{h.movingAvg7}</td>
                      <td className="py-2.5 px-3 text-right text-gray-600 font-semibold">{h.arrivalsQtl} Quintals</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <p className="text-[11px] text-gray-400 pt-2 border-t border-gray-100">
              {trendsData.sourceLabel}. All values are reported in Indian Rupees per Quintal (100 kg).
            </p>
          </div>
        </div>
      ) : null}
    </div>
  );
}
