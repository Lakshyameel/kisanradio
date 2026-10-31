import { useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useLanguage, supportedLanguages, LanguageCode } from "../../context/LanguageContext";
import {
  Sprout,
  Menu,
  X,
  Globe,
  User as UserIcon,
  LogOut,
  ShieldCheck,
  ChevronDown,
  Search,
  UploadCloud,
} from "lucide-react";
import { navigationItems } from "../../config/navigation";
import NotificationBell from "./NotificationBell";

export default function Header() {
  const { user, logout } = useAuth();
  const { language, setLanguage, t } = useLanguage();
  const navigate = useNavigate();

  const [menuOpen, setMenuOpen] = useState(false);
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [langDropdownOpen, setLangDropdownOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  const closeMenu = () => {
    setMenuOpen(false);
    setOpenMenu(null);
    setLangDropdownOpen(false);
    setUserDropdownOpen(false);
  };

  const toggleSubmenu = (label: string) => {
    setOpenMenu((current) => (current === label ? null : label));
  };

  const getNavLabel = (label: string) => {
    const keyMap: Record<string, string> = {
      "Home": "home",
      "Agriculture": "agriculture",
      "News": "news",
      "Weather": "weather",
      "Mandi Prices": "mandiPrices",
      "Crop Advisory": "cropAdvisory",
      "Livestock": "livestock",
      "Government Schemes": "schemes",
      "Community": "community",
      "Success Stories": "successStories",
      "Learning from Failure": "failureLessons",
      "Farmer Experiences": "farmerExperiences",
      "Ask an Expert": "askExpert",
      "Literature": "literature",
      "Audiobooks": "audioBooks",
      "Stories": "stories",
      "Poems": "poems",
      "Folk Tales": "folkTales",
      "Audio Library": "audioLibrary",
    };
    const key = keyMap[label];
    return key ? t(key, label) : label;
  };

  return (
    <header className="topbar">
      {/* Brand */}
      <Link to="/" className="brand flex items-center gap-2" onClick={closeMenu}>
        <div className="w-9 h-9 rounded-xl bg-emerald-700 text-white flex items-center justify-center shadow-sm">
          <Sprout className="w-5 h-5" />
        </div>
        <div className="flex flex-col leading-none">
          <span className="text-xl font-extrabold tracking-tight text-emerald-900">KishanVaani</span>
          <span className="text-[10px] text-emerald-700 font-medium tracking-wide uppercase">
            {t("brandSubtitle", "Audio-First Rural Voice")}
          </span>
        </div>
      </Link>

      {/* Desktop Navigation */}
      <nav className="desktop-nav ml-auto flex items-center gap-1.5" aria-label="Primary navigation">
        {navigationItems.map((item) => {
          if (item.children) {
            return (
              <div className="nav-dropdown" key={item.label}>
                <NavLink
                  to={item.path}
                  className={({ isActive }) =>
                    `nav-link flex items-center gap-1 text-sm font-medium ${isActive ? "active font-bold text-emerald-900" : "text-gray-700 hover:text-emerald-800"}`
                  }
                >
                  {getNavLabel(item.label)}
                  <ChevronDown className="w-3.5 h-3.5 opacity-60" />
                </NavLink>

                <div className="dropdown-menu">
                  {item.children.map((child) => (
                    <NavLink
                      key={child.path}
                      to={child.path}
                      className="dropdown-link text-sm"
                      onClick={closeMenu}
                    >
                      {getNavLabel(child.label)}
                    </NavLink>
                  ))}
                </div>
              </div>
            );
          }

          if (item.path === "/upload") {
            return (
              <NavLink
                key={item.path}
                to="/upload"
                className={({ isActive }) =>
                  `flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    isActive
                      ? "bg-amber-400 text-gray-950 shadow-sm"
                      : "bg-amber-100/70 hover:bg-amber-200 text-amber-950 border border-amber-300/60"
                  }`
                }
              >
                <UploadCloud className="w-3.5 h-3.5 text-amber-900" />
                <span>{t("uploadAudio", "+ Upload")}</span>
              </NavLink>
            );
          }

          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `nav-link text-sm font-medium ${isActive ? "active font-bold text-emerald-900" : "text-gray-700 hover:text-emerald-800"}`
              }
            >
              {getNavLabel(item.label)}
            </NavLink>
          );
        })}

        {/* Quick Search Shortcut */}
        <Link
          to="/search"
          className="p-2 rounded-xl text-gray-600 hover:text-emerald-800 hover:bg-emerald-50 transition-colors"
          title="Search KishanVaani"
        >
          <Search className="w-4 h-4" />
        </Link>

        {/* Multilingual Selector */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setLangDropdownOpen((prev) => !prev)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-gray-200 text-xs font-semibold text-gray-700 hover:bg-emerald-50 hover:border-emerald-300 transition-colors"
          >
            <Globe className="w-3.5 h-3.5 text-emerald-700" />
            <span>
              {supportedLanguages.find((l) => l.code === language)?.nativeName || "हिन्दी"}
            </span>
            <ChevronDown className="w-3 h-3 opacity-60" />
          </button>

          {langDropdownOpen && (
            <div className="absolute right-0 mt-1.5 w-36 bg-white rounded-xl shadow-lg border border-gray-100 py-1.5 z-30">
              {supportedLanguages.map((lang) => (
                <button
                  key={lang.code}
                  type="button"
                  onClick={() => {
                    setLanguage(lang.code as LanguageCode);
                    setLangDropdownOpen(false);
                  }}
                  className={`w-full text-left px-3 py-1.5 text-xs flex items-center justify-between hover:bg-emerald-50 ${
                    language === lang.code ? "text-emerald-800 font-bold bg-emerald-50/50" : "text-gray-700"
                  }`}
                >
                  <span>{lang.nativeName}</span>
                  <span className="text-[10px] text-gray-400">{lang.name}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Notification Bell */}
        <NotificationBell />

        {/* User Account / Auth Dropdown */}
        {user ? (
          <div className="relative">
            <button
              type="button"
              onClick={() => setUserDropdownOpen((prev) => !prev)}
              className="flex items-center gap-2 pl-2 pr-3 py-1 rounded-full border border-emerald-200 bg-emerald-50/50 hover:bg-emerald-100 transition-colors text-xs font-semibold text-emerald-900"
            >
              {user.avatarUrl ? (
                <img src={user.avatarUrl} alt={user.name} className="w-6 h-6 rounded-full object-cover" />
              ) : (
                <div className="w-6 h-6 rounded-full bg-emerald-700 text-white flex items-center justify-center text-[10px]">
                  {user.name.charAt(0)}
                </div>
              )}
              <span className="max-w-[100px] truncate">{user.name.split(" ")[0]}</span>
              <ChevronDown className="w-3 h-3 opacity-60" />
            </button>

            {userDropdownOpen && (
              <div className="absolute right-0 mt-1.5 w-48 bg-white rounded-xl shadow-lg border border-gray-100 py-1.5 z-30">
                <div className="px-3 py-2 border-b border-gray-100">
                  <p className="text-xs font-bold text-gray-900 truncate">{user.name}</p>
                  <p className="text-[10px] text-gray-500 truncate">{user.email}</p>
                  <span className="inline-block mt-1 px-1.5 py-0.5 rounded text-[9px] font-semibold uppercase bg-emerald-100 text-emerald-800">
                    {user.role}
                  </span>
                </div>

                <Link
                  to="/upload"
                  className="block px-3 py-2 text-xs text-amber-900 font-bold hover:bg-amber-50 flex items-center gap-2"
                  onClick={closeMenu}
                >
                  <UploadCloud className="w-3.5 h-3.5 text-amber-700" />
                  + Upload Story / Poem
                </Link>

                <Link
                  to="/profile"
                  className="block px-3 py-2 text-xs text-gray-700 hover:bg-emerald-50 flex items-center gap-2"
                  onClick={closeMenu}
                >
                  <UserIcon className="w-3.5 h-3.5 text-emerald-700" />
                  {t("profile", "Profile & Bookmarks")}
                </Link>

                {user.role === "ADMIN" && (
                  <Link
                    to="/admin"
                    className="block px-3 py-2 text-xs text-emerald-800 font-semibold hover:bg-emerald-50 flex items-center gap-2"
                    onClick={closeMenu}
                  >
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" />
                    Admin Dashboard
                  </Link>
                )}

                <button
                  type="button"
                  onClick={() => {
                    logout();
                    closeMenu();
                    navigate("/");
                  }}
                  className="w-full text-left px-3 py-2 text-xs text-rose-600 hover:bg-rose-50 flex items-center gap-2"
                >
                  <LogOut className="w-3.5 h-3.5 text-rose-600" />
                  {t("logout", "Logout")}
                </button>
              </div>
            )}
          </div>
        ) : (
          <Link
            to="/login"
            className="login-link text-xs font-semibold px-3 py-2 rounded-xl bg-emerald-800 text-white hover:bg-emerald-900 transition-colors shadow-sm"
          >
            {t("login", "Login / Demo")}
          </Link>
        )}
      </nav>

      {/* Mobile Menu Button */}
      <button
        type="button"
        className="mobile-menu-button ml-auto"
        onClick={() => setMenuOpen((current) => !current)}
        aria-label={menuOpen ? "Close navigation menu" : "Open navigation menu"}
      >
        {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </button>

      {/* Mobile Navigation Drawer */}
      {menuOpen && (
        <nav id="mobile-navigation" className="mobile-navigation">
          {/* Mobile Language Switcher */}
          <div className="flex items-center justify-between p-2 mb-2 bg-emerald-50 rounded-xl">
            <span className="text-xs font-semibold text-emerald-900 flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5 text-emerald-700" />
              Language
            </span>
            <div className="flex gap-1">
              {supportedLanguages.map((l) => (
                <button
                  key={l.code}
                  type="button"
                  onClick={() => setLanguage(l.code as LanguageCode)}
                  className={`px-2 py-1 text-[11px] rounded-lg font-medium ${
                    language === l.code ? "bg-emerald-800 text-white font-bold" : "text-gray-700 bg-white"
                  }`}
                >
                  {l.nativeName}
                </button>
              ))}
            </div>
          </div>

          <NavLink
            to="/upload"
            className="flex items-center justify-center gap-2 p-3 mb-2 rounded-xl bg-amber-400 text-gray-950 font-bold text-xs shadow-sm"
            onClick={closeMenu}
          >
            <UploadCloud className="w-4 h-4 text-gray-950" />
            {t("uploadAudio", "+ Upload Audio")}
          </NavLink>

          {navigationItems.map((item) => {
            if (item.path === "/upload") return null;

            if (item.children) {
              const isOpen = openMenu === item.label;

              return (
                <div className="mobile-nav-group" key={item.label}>
                  <div className="mobile-nav-row flex items-center justify-between">
                    <NavLink
                      to={item.path}
                      className={({ isActive }) => `mobile-nav-link ${isActive ? "active" : ""}`}
                      onClick={closeMenu}
                    >
                      {getNavLabel(item.label)}
                    </NavLink>

                    <button
                      type="button"
                      className="mobile-submenu-button"
                      onClick={() => toggleSubmenu(item.label)}
                    >
                      {isOpen ? "−" : "+"}
                    </button>
                  </div>

                  {isOpen && (
                    <div className="mobile-submenu">
                      {item.children.map((child) => (
                        <NavLink
                          key={child.path}
                          to={child.path}
                          className={({ isActive }) => `mobile-submenu-link ${isActive ? "active" : ""}`}
                          onClick={closeMenu}
                        >
                          {getNavLabel(child.label)}
                        </NavLink>
                      ))}
                    </div>
                  )}
                </div>
              );
            }

            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) => `mobile-nav-link ${isActive ? "active" : ""}`}
                onClick={closeMenu}
              >
                {getNavLabel(item.label)}
              </NavLink>
            );
          })}

          {/* User links on mobile */}
          {user ? (
            <div className="mt-4 pt-3 border-t border-gray-100 flex flex-col gap-2">
              <Link to="/profile" className="mobile-nav-link" onClick={closeMenu}>
                👤 {user.name} ({t("profile", "Profile")})
              </Link>
              {user.role === "ADMIN" && (
                <Link to="/admin" className="mobile-nav-link text-emerald-800 font-bold" onClick={closeMenu}>
                  🛡️ Admin Dashboard
                </Link>
              )}
              <button
                type="button"
                onClick={() => {
                  logout();
                  closeMenu();
                  navigate("/");
                }}
                className="text-left py-2 text-rose-600 font-semibold text-sm"
              >
                🚪 {t("logout", "Logout")}
              </button>
            </div>
          ) : (
            <NavLink to="/login" className="mobile-login-link mt-4 text-center" onClick={closeMenu}>
              {t("login", "Login / Demo Account")}
            </NavLink>
          )}
        </nav>
      )}
    </header>
  );
}