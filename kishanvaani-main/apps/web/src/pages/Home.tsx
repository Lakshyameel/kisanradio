import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAudioPlayer, AudioTrack } from "../context/AudioPlayerContext";
import { useLanguage } from "../context/LanguageContext";
import { fetchFeaturedContent, ContentItem, likeContent } from "../services/content.service";
import { fetchWeather, WeatherResponse } from "../services/weather.service";
import { fetchMandiPrices, MandiPriceItem } from "../services/mandi.service";
import { fetchContinueListening, ContinueListeningItem } from "../services/history.service";
import {
  Play,
  Pause,
  CloudSun,
  TrendingUp,
  TrendingDown,
  Volume2,
  Sparkles,
  BookOpen,
  Users,
  ShieldCheck,
  ChevronRight,
  Droplets,
  Wind,
  CheckCircle2,
  Heart,
  Headphones,
  Sprout,
  ArrowRight,
  UploadCloud,
  Feather,
  PlusCircle,
  BadgeCheck,
  Navigation,
  Loader2,
} from "lucide-react";
import { locateNearestDistrict } from "../services/imd.service";
import { getCurrentCoordinates } from "../utils/geolocation";
import TapToHearButton from "../components/common/TapToHearButton";

export default function Home() {
  const { currentTrack, isPlaying, playTrack, togglePlayPause } = useAudioPlayer();
  const { t, translateContent } = useLanguage();

  const [featuredData, setFeaturedData] = useState<{
    heroFeatured: ContentItem | null;
    featured: ContentItem[];
    latestNews: ContentItem[];
    recommendations: ContentItem[];
    literatureSpotlight: ContentItem[];
  } | null>(null);

  const [weatherData, setWeatherData] = useState<WeatherResponse | null>(null);
  const [selectedLocation, setSelectedLocation] = useState("Ludhiana");
  const [mandiPrices, setMandiPrices] = useState<MandiPriceItem[]>([]);
  const [continueTracks, setContinueTracks] = useState<ContinueListeningItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Home Weather GPS Geolocation
  const [isLocating, setIsLocating] = useState(false);
  const [homeLocationText, setHomeLocationText] = useState<string | null>(null);

  const handleDetectHomeLocation = async () => {
    setIsLocating(true);
    try {
      const coords = await getCurrentCoordinates();
      const match = await locateNearestDistrict(coords.latitude, coords.longitude);
      if (match && match.district) {
        setSelectedLocation(match.district);
        setHomeLocationText(
          `${match.district}, ${match.state} (${match.distanceKm} km away)`
        );
      }
    } catch {
      // Fallback
    } finally {
      setIsLocating(false);
    }
  };

  useEffect(() => {
    async function loadHomeData() {
      try {
        setLoading(true);
        const [featured, weather, mandi, continueList] = await Promise.all([
          fetchFeaturedContent().catch(() => null),
          fetchWeather(selectedLocation).catch(() => null),
          fetchMandiPrices({ limit: 8 }).catch(() => ({ prices: [], count: 0 })),
          fetchContinueListening().catch(() => ({ continueListening: [] })),
        ]);

        if (featured) setFeaturedData(featured);
        if (weather) setWeatherData(weather);
        if (mandi) setMandiPrices(mandi.prices);
        if (continueList) setContinueTracks(continueList.continueListening);
      } catch (err) {
        console.error("Failed to load home data:", err);
      } finally {
        setLoading(false);
      }
    }

    loadHomeData();
  }, [selectedLocation]);

  const handlePlayContent = async (item: ContentItem) => {
    const track: AudioTrack = {
      id: item.id,
      title: item.title,
      description: item.description,
      audioUrl: item.audioUrl || "",
      duration: item.durationSec,
      durationSec: item.durationSec,
      category: item.category,
      language: item.language,
      narrator: item.narrator,
      transcript: item.transcript,
      isBookmarked: item.isBookmarked,
    };

    if (currentTrack?.id === item.id) {
      await togglePlayPause();
    } else {
      await playTrack(track);
    }
  };

  const handleLike = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await likeContent(id);
    } catch {
      // Ignore
    }
  };

  const heroItem = featuredData?.heroFeatured;

  return (
    <div className="space-y-12 pb-16">
      {/* Hero Section */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-900 via-emerald-800 to-green-950 text-white p-6 sm:p-10 shadow-xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />
        
        <div className="relative z-10 max-w-3xl space-y-5">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-700/60 border border-emerald-500/30 text-emerald-200 text-xs font-semibold tracking-wide uppercase">
            <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
            {t("dailyAudioBulletin", "Daily Agricultural Audio Bulletin")}
          </div>

          <h1 className="text-3xl sm:text-5xl font-black tracking-tight leading-tight">
            {heroItem ? translateContent(heroItem.title) : t("heroTitle", "Trusted Farming Knowledge, Made Easy to Listen.")}
          </h1>

          <p className="text-emerald-100/90 text-sm sm:text-base leading-relaxed max-w-2xl font-normal">
            {heroItem ? translateContent(heroItem.description) : t("heroDesc", "KishanVaani delivers daily crop advisory, real-time mandi prices, agro-weather forecasts, and inspiring farmer stories in your regional language.")}
          </p>

          <div className="pt-2 flex flex-wrap items-center gap-3">
            {heroItem && (
              <button
                type="button"
                onClick={() => handlePlayContent(heroItem)}
                className="flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-amber-400 hover:bg-amber-300 text-gray-950 font-bold text-sm sm:text-base shadow-lg transition-transform active:scale-95"
              >
                {currentTrack?.id === heroItem.id && isPlaying ? (
                  <>
                    <Pause className="w-5 h-5 fill-current" /> {t("pauseBulletin", "Pause Audio")}
                  </>
                ) : (
                  <>
                    <Play className="w-5 h-5 fill-current ml-0.5" /> {t("startListening", "Start Listening (Audio)")}
                  </>
                )}
              </button>
            )}

            <Link
              to="/agriculture"
              className="flex items-center gap-2 px-5 py-3.5 rounded-2xl bg-emerald-800/80 hover:bg-emerald-700 text-white font-semibold text-sm border border-emerald-600/50 transition-colors"
            >
              <Sprout className="w-4 h-4 text-emerald-400" />
              {t("exploreAgriculture", "Explore Agriculture Hub")}
            </Link>
          </div>
        </div>
      </section>

      {/* Live Agro-Weather & Mandi Ticker Grid */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Live Weather Card */}
        <div className="lg:col-span-5 bg-white rounded-3xl p-6 border border-gray-100 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-amber-50 text-amber-600">
                  <CloudSun className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <h3 className="font-bold text-gray-900 text-sm">{t("liveWeather", "Live Agro-Weather")}</h3>
                    <span className="inline-flex items-center gap-0.5 text-[9px] font-extrabold text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200">
                      <BadgeCheck className="w-2.5 h-2.5 text-blue-600" /> IMD Mausam
                    </span>
                  </div>
                  <p className="text-[10px] text-gray-500 truncate max-w-[170px]">
                    {homeLocationText || weatherData?.current?.agroZone || "GKMS Agromet Advisory"}
                  </p>
                </div>
              </div>

              {/* District Switcher with GPS Auto-Locate Button */}
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={handleDetectHomeLocation}
                  disabled={isLocating}
                  className="p-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 transition-colors cursor-pointer"
                  title={t("autoDetectLocation", "Auto-detect nearest agro-weather station via GPS")}
                >
                  {isLocating ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Navigation className="w-3.5 h-3.5 fill-current" />
                  )}
                </button>

                <select
                  value={selectedLocation}
                  onChange={(e) => {
                    setSelectedLocation(e.target.value);
                    setHomeLocationText(null);
                  }}
                  className="text-xs font-semibold bg-gray-50 border border-gray-200 rounded-lg px-2 py-1 text-gray-700 outline-none focus:border-emerald-600 max-w-[150px]"
                >
                  {weatherData?.availableLocations && weatherData.availableLocations.length > 0 ? (
                    weatherData.availableLocations.map((loc) => (
                      <option key={loc.locationKey} value={loc.district}>
                        {loc.state} - {loc.district}
                      </option>
                    ))
                  ) : (
                    <>
                      <option value="Ludhiana">Punjab (Ludhiana)</option>
                      <option value="Nashik">Maharashtra (Nashik)</option>
                      <option value="Warangal">Telangana (Warangal)</option>
                      <option value="Agra">Uttar Pradesh (Agra)</option>
                    </>
                  )}
                </select>
              </div>
            </div>

            {weatherData?.current && (
              <div className="pt-4 space-y-4">
                <div className="flex items-baseline justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-4xl font-extrabold text-gray-900">
                        {weatherData.current.temperature}°C
                      </span>
                      {weatherData.source === "STATIC" && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
                          Estimated, not live
                        </span>
                      )}
                    </div>
                    <p className="text-xs font-semibold text-emerald-800 mt-0.5">
                      {weatherData.current.condition}
                    </p>
                  </div>
                  <div className="text-right space-y-1">
                    <span className="text-xs text-gray-500 flex items-center justify-end gap-1">
                      <Droplets className="w-3.5 h-3.5 text-blue-500" />
                      Humidity: {weatherData.current.humidity}%
                    </span>
                    <span className="text-xs text-gray-500 flex items-center justify-end gap-1">
                      <Wind className="w-3.5 h-3.5 text-teal-500" />
                      Wind: {weatherData.current.windSpeed} km/h
                    </span>
                  </div>
                </div>

                {/* Spray Advisory Banner */}
                <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-start justify-between gap-2.5">
                  <div className="flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-700 flex-shrink-0 mt-0.5" />
                    <div className="text-xs text-emerald-950">
                      <strong>Farming Advisory: </strong>
                      <span>{weatherData.current.advisory}</span>
                    </div>
                  </div>
                  <TapToHearButton
                    size="sm"
                    iconOnly
                    text={`आज का मौसम: तापमान ${weatherData.current.temperature} डिग्री। ${weatherData.current.condition}। कृषि सलाह: ${weatherData.current.advisory}`}
                  />
                </div>

                {/* 5-Day Mini Forecast */}
                <div className="grid grid-cols-5 gap-1.5 pt-1">
                  {weatherData.forecast.map((f, i) => (
                    <div key={i} className="text-center p-2 rounded-xl bg-gray-50 text-[11px]">
                      <p className="font-semibold text-gray-600">{f.day}</p>
                      <p className="font-bold text-gray-900 mt-1">{f.temp}°</p>
                      <span className="text-[9px] text-blue-600">{f.rainProb}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="mt-4 pt-3 border-t border-gray-100 flex justify-between items-center text-xs">
            <span className="text-gray-500">Live Satellite & GPS Feed</span>
            <div className="flex items-center gap-3">
              <Link to="/weather" className="font-bold text-teal-700 hover:text-teal-900 hover:underline flex items-center gap-1">
                Statewide Monitor <ChevronRight className="w-3.5 h-3.5" />
              </Link>
              <Link to="/agriculture/weather" className="font-semibold text-emerald-800 hover:underline flex items-center gap-1">
                Agro Advisory <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>

        {/* Live Mandi Prices Ticker */}
        <div className="lg:col-span-7 bg-white rounded-3xl p-6 border border-gray-100 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-emerald-50 text-emerald-700">
                  <TrendingUp className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 text-sm">{t("liveMandiPrices", "Today's Mandi Benchmark Rates")}</h3>
                  <p className="text-[11px] text-gray-500">{t("liveTradingYards", "Real-time APMC mandi modal prices (₹/Quintal)")}</p>
                </div>
              </div>

              <Link
                to="/mandi-prices"
                className="text-xs font-semibold text-emerald-800 hover:text-emerald-900 bg-emerald-50 px-2.5 py-1 rounded-lg"
              >
                {t("viewAllMandis", "All Mandis")}
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-4">
              {mandiPrices.slice(0, 6).map((mandi) => (
                <div
                  key={mandi.id}
                  className="p-3 rounded-2xl border border-gray-100 bg-gray-50/70 hover:bg-white hover:shadow-md transition-all flex items-center justify-between"
                >
                  <div>
                    <div className="flex items-center gap-1.5">
                      <h4 className="font-bold text-gray-900 text-sm">{translateContent(mandi.commodity)}</h4>
                      {mandi.trend === "UP" ? (
                        <span className="flex items-center text-[10px] font-bold text-emerald-700 bg-emerald-100 px-1 py-0.5 rounded">
                          <TrendingUp className="w-3 h-3 mr-0.5" /> +₹50
                        </span>
                      ) : mandi.trend === "DOWN" ? (
                        <span className="flex items-center text-[10px] font-bold text-rose-600 bg-rose-100 px-1 py-0.5 rounded">
                          <TrendingDown className="w-3 h-3 mr-0.5" /> -₹30
                        </span>
                      ) : null}
                    </div>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <p className="text-[11px] text-gray-500">{translateContent(mandi.market)} ({translateContent(mandi.state)})</p>
                      <span className="text-[9px] font-semibold text-gray-500 bg-gray-100 px-1 rounded">
                        {mandi.sourceLabel || (mandi.source === "SAMPLE" ? "Sample data" : "Live from Agmarknet")}
                      </span>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-base font-extrabold text-gray-950">
                      {mandi.modalPrice != null ? `₹${mandi.modalPrice.toLocaleString("en-IN")}` : "—"}
                    </span>
                    <p className="text-[10px] text-gray-400">
                      {mandi.minPrice != null && mandi.maxPrice != null ? `₹${mandi.minPrice} - ₹${mandi.maxPrice}` : "—"}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-gray-100 flex justify-between items-center text-xs text-gray-500">
            <span>{t("directApmcConnection", "Direct APMC data connection")}</span>
            <Link to="/mandi-prices" className="font-semibold text-emerald-800 hover:underline flex items-center gap-1">
              {t("filterByStateCrop", "Filter by State & Crop")} <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </section>

      {/* Continue Listening Section (If Available) */}
      {continueTracks.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <Headphones className="w-5 h-5 text-emerald-700" />
                {t("continueListening", "Continue Listening")}
              </h2>
              <p className="text-xs text-gray-500">{t("pickUpLeftOff", "Pick up right where you left off")}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {continueTracks.map((item) => (
              <div
                key={item.id}
                onClick={() =>
                  handlePlayContent({
                    id: item.id,
                    title: item.title,
                    description: item.description,
                    slug: item.slug,
                    type: item.type,
                    category: item.category,
                    language: item.language,
                    audioUrl: item.audioUrl,
                    durationSec: item.durationSec,
                    viewsCount: 0,
                    likesCount: 0,
                    status: "PUBLISHED",
                    createdAt: item.lastPlayedAt,
                  })
                }
                className="cursor-pointer p-4 rounded-2xl bg-white border border-gray-100 shadow-sm hover:shadow-md hover:border-emerald-200 transition-all flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-center justify-between text-xs text-emerald-800 font-bold mb-1">
                    <span>{item.category}</span>
                    <span className="text-gray-400 font-normal">{Math.floor(item.progressSeconds / 60)}m played</span>
                  </div>
                  <h3 className="font-bold text-gray-900 text-sm line-clamp-2 group-hover:text-emerald-800">
                    {translateContent(item.title)}
                  </h3>
                </div>

                <div className="mt-4 space-y-2">
                  <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
                    <div
                      className="bg-emerald-600 h-full rounded-full transition-all"
                      style={{ width: `${item.progressPercent}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-xs text-emerald-700 font-semibold">
                    <span>Resume</span>
                    <Play className="w-3.5 h-3.5 fill-current" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Top Agriculture News with 1-Click Audio */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <Volume2 className="w-5 h-5 text-emerald-700" />
              {t("latestNews", "Latest Agriculture Audio News")}
            </h2>
            <p className="text-xs text-gray-500">{t("latestNewsSubtitle", "Official Ministry of Agriculture & ICAR-KVK bulletins with 1-click audio")}</p>
          </div>
          <Link
            to="/agriculture/news"
            className="text-xs font-semibold text-emerald-800 hover:underline flex items-center gap-1"
          >
            {t("viewAllNews", "View All News")} <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {featuredData?.latestNews.map((news) => {
            const isThisPlaying = currentTrack?.id === news.id && isPlaying;
            return (
              <article
                key={news.id}
                className="p-5 rounded-3xl bg-white border border-gray-100 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md uppercase">
                      {news.category}
                    </span>
                    <span className="text-xs text-gray-400">{Math.floor(news.durationSec / 60)} {t("minAudio", "min audio")}</span>
                  </div>

                  <h3 className="font-bold text-gray-900 text-base leading-snug line-clamp-2">
                    {translateContent(news.title)}
                  </h3>

                  <p className="text-xs text-gray-600 mt-2 line-clamp-2 leading-relaxed">
                    {translateContent(news.description)}
                  </p>
                </div>

                <div className="mt-5 pt-3 border-t border-gray-100 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handlePlayContent(news)}
                      className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-semibold transition-transform active:scale-95"
                    >
                      {isThisPlaying ? (
                        <>
                          <Pause className="w-3.5 h-3.5 fill-current" /> {t("playingAudio", "Playing...")}
                        </>
                      ) : (
                        <>
                          <Play className="w-3.5 h-3.5 fill-current ml-0.5" /> {t("listenAudio", "Listen Audio")}
                        </>
                      )}
                    </button>
                    <TapToHearButton
                      size="sm"
                      text={`${translateContent(news.title)}. ${translateContent(news.description)}`}
                    />
                  </div>

                  <div className="flex items-center gap-3 text-xs text-gray-500">
                    <button
                      type="button"
                      onClick={(e) => handleLike(news.id, e)}
                      className="flex items-center gap-1 hover:text-rose-600"
                    >
                      <Heart className="w-3.5 h-3.5" /> {news.likesCount}
                    </button>
                    <span>{news.language}</span>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      {/* Curated Recommendations Grid */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-500" />
              {t("recommended", "Recommended for Farmers")}
            </h2>
            <p className="text-xs text-gray-500">Practical advisory, livestock care, and farmer experiences</p>
          </div>
          <Link
            to="/audio"
            className="text-xs font-semibold text-emerald-800 hover:underline flex items-center gap-1"
          >
            Audio Library <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {featuredData?.recommendations.map((item) => {
            const isThisPlaying = currentTrack?.id === item.id && isPlaying;
            return (
              <div
                key={item.id}
                className="p-5 rounded-3xl bg-white border border-gray-100 shadow-sm hover:shadow-md hover:border-emerald-200 transition-all flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-center justify-between text-xs text-emerald-800 font-bold mb-2">
                    <span className="bg-emerald-50 px-2 py-0.5 rounded-md">{item.type.replace(/_/g, " ")}</span>
                    <span className="text-gray-400 font-normal">{item.language}</span>
                  </div>

                  <h3 className="font-bold text-gray-900 text-sm sm:text-base leading-snug line-clamp-2 group-hover:text-emerald-800">
                    {translateContent(item.title)}
                  </h3>

                  <p className="text-xs text-gray-600 mt-2 line-clamp-3 leading-relaxed">
                    {translateContent(item.description)}
                  </p>
                </div>

                <div className="mt-5 pt-3 border-t border-gray-100 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => handlePlayContent(item)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-semibold"
                  >
                    {isThisPlaying ? (
                      <Pause className="w-3.5 h-3.5 fill-current" />
                    ) : (
                      <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
                    )}
                    <span>{isThisPlaying ? t("pauseBulletin", "Pause") : t("listenAudio", "Play")}</span>
                  </button>

                  <span className="text-[11px] text-gray-400">
                    {Math.floor(item.durationSec / 60)}:{(item.durationSec % 60).toString().padStart(2, "0")}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Literature & Folklore Spotlight */}
      <section className="p-6 sm:p-8 rounded-3xl bg-amber-50/70 border border-amber-200/60 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-amber-800 uppercase tracking-wide">
              {t("literature", "Literature & Culture")}
            </span>
            <h2 className="text-xl font-bold text-gray-900 mt-1 flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-amber-700" />
              {t("ruralStoriesSpotlight", "Rural Stories, Poems & Audiobooks")}
            </h2>
          </div>
          <div className="flex items-center gap-2">
            <Link
              to="/upload"
              className="text-xs font-black text-gray-950 bg-amber-400 px-3.5 py-1.5 rounded-xl hover:bg-amber-300 transition-colors shadow-sm flex items-center gap-1.5"
            >
              <UploadCloud className="w-3.5 h-3.5" />
              {t("uploadYourStory", "+ Upload Your Story")}
            </Link>
            <Link
              to="/literature"
              className="text-xs font-bold text-amber-900 bg-amber-200/80 px-3 py-1.5 rounded-xl hover:bg-amber-300 transition-colors"
            >
              {t("exploreLiteratureHub", "Explore Hub")}
            </Link>
          </div>
        </div>

        {/* Creator Studio Quick Upload Bar */}
        <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-emerald-900 via-emerald-950 to-green-950 text-white flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm">
          <div className="space-y-1 text-center sm:text-left">
            <h4 className="font-extrabold text-sm sm:text-base text-amber-300 flex items-center justify-center sm:justify-start gap-2">
              <Sparkles className="w-4 h-4 text-amber-400" />
              {t("shareCreativeVoice", "Share Your Creative Voice with KishanVaani")}
            </h4>
            <p className="text-xs text-emerald-100 max-w-lg">
              {t(
                "shareCreativeVoiceDesc",
                "Are you a farmer, poet, or rural storyteller? Upload your poems, folk tales, or audiobooks directly to our audio platform!"
              )}
            </p>
          </div>
          <div className="flex flex-wrap gap-2 justify-center">
            <Link
              to="/upload?format=STORY"
              className="px-3 py-1.5 rounded-xl bg-amber-400 text-gray-950 font-bold text-xs hover:bg-amber-300 shadow-sm flex items-center gap-1"
            >
              <BookOpen className="w-3.5 h-3.5" /> {t("addStory", "+ Story")}
            </Link>
            <Link
              to="/upload?format=POEM"
              className="px-3 py-1.5 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white font-bold text-xs shadow-sm flex items-center gap-1 border border-emerald-500/40"
            >
              <Feather className="w-3.5 h-3.5" /> {t("addPoem", "+ Poem")}
            </Link>
            <Link
              to="/upload?format=FOLK_TALE"
              className="px-3 py-1.5 rounded-xl bg-amber-800/80 hover:bg-amber-700 text-white font-bold text-xs shadow-sm flex items-center gap-1 border border-amber-600/40"
            >
              <Sparkles className="w-3.5 h-3.5" /> {t("addFolkTale", "+ Folk Tale")}
            </Link>
            <Link
              to="/upload?format=AUDIO_BOOK"
              className="px-3 py-1.5 rounded-xl bg-teal-800 hover:bg-teal-700 text-white font-bold text-xs shadow-sm flex items-center gap-1 border border-teal-500/40"
            >
              <Headphones className="w-3.5 h-3.5" /> {t("addAudiobook", "+ Audiobook")}
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {featuredData?.literatureSpotlight.map((lit) => (
            <div
              key={lit.id}
              onClick={() => handlePlayContent(lit)}
              className="cursor-pointer p-4 rounded-2xl bg-white border border-amber-100 shadow-sm hover:shadow-md transition-all flex flex-col justify-between group"
            >
              <div>
                <span className="text-[10px] font-bold text-amber-800 uppercase">{lit.type}</span>
                <h4 className="font-bold text-gray-900 text-sm mt-1 line-clamp-2 group-hover:text-amber-900">
                  {translateContent(lit.title)}
                </h4>
                <p className="text-xs text-gray-500 mt-1 line-clamp-2">{translateContent(lit.description)}</p>
              </div>

              <div className="mt-4 pt-2 border-t border-gray-100 flex items-center justify-between text-xs text-amber-900 font-semibold">
                <span>{t("by", "By")} {lit.authorName || "KishanVaani"}</span>
                <Play className="w-3.5 h-3.5 fill-current text-amber-700" />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Community CTA */}
      <section className="p-6 sm:p-8 rounded-3xl bg-emerald-900 text-white flex flex-col sm:flex-row items-center justify-between gap-6 shadow-md">
        <div className="space-y-2 max-w-xl text-center sm:text-left">
          <h3 className="text-xl sm:text-2xl font-bold">{t("communityCtaTitle", "Have a farming question or success story?")}</h3>
          <p className="text-emerald-200 text-xs sm:text-sm">
            {t(
              "communityCtaDesc",
              "Ask our agricultural agronomists and veterinary specialists or share your own farm experience with thousands of Indian farmers."
            )}
          </p>
        </div>
        <div className="flex gap-3">
          <Link
            to="/community"
            className="px-5 py-3 rounded-2xl bg-white text-emerald-950 font-bold text-xs sm:text-sm hover:bg-emerald-50 transition-colors shadow-sm"
          >
            {t("askAnExpertBtn", "Ask an Expert")}
          </Link>
        </div>
      </section>
    </div>
  );
}