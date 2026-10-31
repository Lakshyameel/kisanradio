import { Link } from "react-router-dom";
import { Sprout, PhoneCall, ExternalLink, ShieldCheck, Heart, Radio, CloudSun, TrendingUp, Users, BookOpen } from "lucide-react";
import { useLanguage } from "../../context/LanguageContext";

export default function Footer() {
  const { t } = useLanguage();

  return (
    <footer className="bg-emerald-950 text-emerald-100 border-t border-emerald-800/60 mt-16 pt-12 pb-24 sm:pb-16 text-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
          {/* Col 1: Brand & Mission */}
          <div className="space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-green-600 flex items-center justify-center text-white shadow-md shadow-emerald-900/40">
                <Sprout className="w-6 h-6" />
              </div>
              <div>
                <span className="text-xl font-bold text-white tracking-tight">किसानवाणी</span>
                <span className="block text-xs font-semibold uppercase tracking-wider text-emerald-300/80">KishanVaani</span>
              </div>
            </div>
            <p className="text-emerald-200/80 text-xs leading-relaxed">
              {t(
                "footerDescription",
                "भारत का अग्रणी कृषि एवं ग्रामीण ऑडियो ज्ञान मंच। आधुनिक मौसम उपग्रह रडार, वास्तविक मंडी भाव, वैज्ञानिक परामर्श और लोक साहित्य अब सीधे आपकी अपनी बोली में।"
              )}
            </p>
            <div className="flex items-center gap-2 text-xs text-emerald-300/90 bg-emerald-900/50 py-1.5 px-3 rounded-lg border border-emerald-800/60 w-fit">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{t("govtVerifiedInfo", "सरकारी व वैज्ञानिक संस्थाओं से प्रमाणित जानकारी")}</span>
            </div>
          </div>

          {/* Col 2: Emergency & Helplines */}
          <div className="space-y-3">
            <h3 className="text-white font-semibold text-sm flex items-center gap-2">
              <PhoneCall className="w-4 h-4 text-emerald-400" />
              {t("helplinesTitle", "किसान हेल्पलाइन व सहायता")}
            </h3>
            <div className="p-3 rounded-xl bg-emerald-900/40 border border-emerald-700/40 space-y-1.5">
              <p className="text-xs text-emerald-300 font-medium">{t("kccTitle", "किसान कॉल सेंटर (Toll-Free)")}</p>
              <a
                href="tel:18001801551"
                className="text-lg font-bold text-amber-300 hover:text-amber-200 flex items-center gap-1.5 transition-colors"
              >
                1800-180-1551
              </a>
              <p className="text-[11px] text-emerald-300/70">6:00 AM - 10:00 PM • 22 भारतीय भाषाओं में उपलब्ध</p>
            </div>
            <ul className="space-y-1.5 text-xs text-emerald-200/80">
              <li>
                <a
                  href="https://pmkisan.gov.in"
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-white flex items-center gap-1.5 transition-colors"
                >
                  <ExternalLink className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  PM-KISAN Samman Helpline: 155261
                </a>
              </li>
              <li>
                <a
                  href="https://agricoop.gov.in"
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-white flex items-center gap-1.5 transition-colors"
                >
                  <ExternalLink className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  कृषि मंत्रालय (MoA&FW Portal)
                </a>
              </li>
            </ul>
          </div>

          {/* Col 3: Quick Navigation */}
          <div className="space-y-3">
            <h3 className="text-white font-semibold text-sm flex items-center gap-2">
              <Radio className="w-4 h-4 text-emerald-400" />
              {t("quickSections", "प्रमुख अनुभाग")}
            </h3>
            <ul className="space-y-2 text-xs text-emerald-200/80">
              <li>
                <Link to="/agriculture/weather" className="hover:text-white flex items-center gap-2 transition-colors">
                  <CloudSun className="w-3.5 h-3.5 text-emerald-400" />
                  {t("weatherTitle", "मौसम पूर्वानुमान व डॉपलर रडार")}
                </Link>
              </li>
              <li>
                <Link to="/agriculture/mandi" className="hover:text-white flex items-center gap-2 transition-colors">
                  <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
                  {t("mandiTitle", "दैनिक मंडी भाव (Agmarknet)")}
                </Link>
              </li>
              <li>
                <Link to="/community" className="hover:text-white flex items-center gap-2 transition-colors">
                  <Users className="w-3.5 h-3.5 text-emerald-400" />
                  {t("communityTitle", "किसान समुदाय व सफलता की कहानियां")}
                </Link>
              </li>
              <li>
                <Link to="/literature" className="hover:text-white flex items-center gap-2 transition-colors">
                  <BookOpen className="w-3.5 h-3.5 text-emerald-400" />
                  {t("literatureTitle", "साहित्य, लोककथाएं एवं कविताएं")}
                </Link>
              </li>
              <li>
                <Link to="/audio" className="hover:text-white flex items-center gap-2 transition-colors">
                  <Radio className="w-3.5 h-3.5 text-emerald-400" />
                  {t("audioLibrary", "ऑडियो लाइब्रेरी")}
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 4: Official Portals */}
          <div className="space-y-3">
            <h3 className="text-white font-semibold text-sm flex items-center gap-2">
              <ExternalLink className="w-4 h-4 text-emerald-400" />
              {t("officialPortals", "आधिकारिक राष्ट्रीय पोर्टल")}
            </h3>
            <ul className="space-y-2 text-xs text-emerald-200/80">
              <li>
                <a
                  href="https://mausam.imd.gov.in"
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-white flex items-center justify-between group transition-colors"
                >
                  <span>IMD मौसम (Mausam Gov)</span>
                  <ExternalLink className="w-3 h-3 opacity-60 group-hover:opacity-100" />
                </a>
              </li>
              <li>
                <a
                  href="https://agmarknet.gov.in"
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-white flex items-center justify-between group transition-colors"
                >
                  <span>Agmarknet मंडी नेटवर्क</span>
                  <ExternalLink className="w-3 h-3 opacity-60 group-hover:opacity-100" />
                </a>
              </li>
              <li>
                <a
                  href="https://kvk.icar.gov.in"
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-white flex items-center justify-between group transition-colors"
                >
                  <span>ICAR - कृषि विज्ञान केंद्र (KVK)</span>
                  <ExternalLink className="w-3 h-3 opacity-60 group-hover:opacity-100" />
                </a>
              </li>
              <li>
                <a
                  href="https://enam.gov.in"
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-white flex items-center justify-between group transition-colors"
                >
                  <span>e-NAM राष्ट्रीय कृषि बाजार</span>
                  <ExternalLink className="w-3 h-3 opacity-60 group-hover:opacity-100" />
                </a>
              </li>
              <li>
                <a
                  href="https://fasal.imd.gov.in"
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-white flex items-center justify-between group transition-colors"
                >
                  <span>ग्रामीण कृषि मौसम सेवा (GKMS)</span>
                  <ExternalLink className="w-3 h-3 opacity-60 group-hover:opacity-100" />
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom divider & copyright */}
        <div className="border-t border-emerald-800/60 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-emerald-300/70">
          <p className="flex items-center gap-1">
            © {new Date().getFullYear()} KishanVaani. {t("madeWithLove", "भारतीय अन्नदाता किसानों के सम्मान में समर्पित")}
            <Heart className="w-3.5 h-3.5 text-rose-400 fill-rose-400 inline ml-1" />
          </p>
          <div className="flex items-center gap-4">
            <Link to="/upload" className="hover:text-white transition-colors">
              {t("creatorStudio", "क्रिएटर स्टूडियो")}
            </Link>
            <span>•</span>
            <Link to="/admin" className="hover:text-white transition-colors">
              {t("adminPanel", "एडमिन पोर्टल")}
            </Link>
            <span>•</span>
            <Link to="/profile" className="hover:text-white transition-colors">
              {t("myAccount", "मेरी प्रोफ़ाइल")}
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
