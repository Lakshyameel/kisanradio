import { Link } from "react-router-dom";
import { Home, Compass, CloudSun, TrendingUp, Radio, Search } from "lucide-react";
import { useLanguage } from "../context/LanguageContext";

export default function NotFoundPage() {
  const { t } = useLanguage();

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 py-16 bg-stone-50/50">
      <div className="max-w-lg w-full text-center space-y-6 bg-white p-8 sm:p-10 rounded-3xl shadow-sm border border-stone-200">
        <div className="w-20 h-20 bg-emerald-100 text-emerald-700 rounded-3xl mx-auto flex items-center justify-center text-4xl shadow-inner">
          🌾
        </div>

        <div className="space-y-2">
          <span className="text-emerald-700 font-bold tracking-widest text-xs uppercase bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
            404 — पृष्ठ नहीं मिला / Page Not Found
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-stone-900 tracking-tight">
            {t("notFoundTitle", "यह पृष्ठ उपलब्ध नहीं है")}
          </h1>
          <p className="text-stone-600 text-sm leading-relaxed">
            {t(
              "notFoundDesc",
              "क्षमा करें, जिस पृष्ठ की आप तलाश कर रहे हैं वह स्थानांतरित कर दिया गया है या मौजूद नहीं है। आप नीचे दिए गए प्रमुख विकल्पों से आगे बढ़ सकते हैं।"
            )}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3 pt-2 text-left text-xs">
          <Link
            to="/"
            className="flex items-center gap-2 p-3 rounded-xl bg-stone-50 hover:bg-emerald-50 border border-stone-200 hover:border-emerald-300 text-stone-700 hover:text-emerald-900 font-medium transition-all"
          >
            <Home className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{t("home", "मुख्य पृष्ठ (Home)")}</span>
          </Link>
          <Link
            to="/agriculture/weather"
            className="flex items-center gap-2 p-3 rounded-xl bg-stone-50 hover:bg-emerald-50 border border-stone-200 hover:border-emerald-300 text-stone-700 hover:text-emerald-900 font-medium transition-all"
          >
            <CloudSun className="w-4 h-4 text-amber-500 shrink-0" />
            <span>{t("weather", "मौसम पूर्वानुमान")}</span>
          </Link>
          <Link
            to="/agriculture/mandi"
            className="flex items-center gap-2 p-3 rounded-xl bg-stone-50 hover:bg-emerald-50 border border-stone-200 hover:border-emerald-300 text-stone-700 hover:text-emerald-900 font-medium transition-all"
          >
            <TrendingUp className="w-4 h-4 text-green-600 shrink-0" />
            <span>{t("mandiPrices", "मंडी भाव (Mandi)")}</span>
          </Link>
          <Link
            to="/audio"
            className="flex items-center gap-2 p-3 rounded-xl bg-stone-50 hover:bg-emerald-50 border border-stone-200 hover:border-emerald-300 text-stone-700 hover:text-emerald-900 font-medium transition-all"
          >
            <Radio className="w-4 h-4 text-blue-600 shrink-0" />
            <span>{t("audioLibrary", "ऑडियो लाइब्रेरी")}</span>
          </Link>
        </div>

        <div className="pt-2">
          <Link
            to="/search"
            className="inline-flex items-center justify-center gap-2 w-full py-3 px-4 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-medium text-sm transition shadow-sm"
          >
            <Search className="w-4 h-4" />
            <span>{t("searchWebsite", "किसानवाणी पर खोजें / Search")}</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
