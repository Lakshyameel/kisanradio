import { lazy, Suspense } from "react";
import { Routes, Route } from "react-router-dom";
import AppShell from "./layouts/AppShell";
import ErrorBoundary from "./components/common/ErrorBoundary";
import { AuthProvider } from "./context/AuthContext";
import { LanguageProvider } from "./context/LanguageContext";
import { AudioPlayerProvider } from "./context/AudioPlayerContext";

// Lazy-loaded page components for minimal initial bundle size
const Home = lazy(() => import("./pages/Home"));
const AgriculturePage = lazy(() => import("./pages/Agriculture/AgriculturePage"));
const LiveWeatherPage = lazy(() => import("./pages/Weather/LiveWeatherPage"));
const MandiPricesPage = lazy(() => import("./pages/MandiPrices/MandiPricesPage"));
const CommunityPage = lazy(() => import("./pages/Community/CommunityPage"));
const LiteraturePage = lazy(() => import("./pages/Literature/LiteraturePage"));
const AudioLibrary = lazy(() => import("./pages/AudioLibrary"));
const SearchPage = lazy(() => import("./pages/Search/SearchPage"));
const ProfilePage = lazy(() => import("./pages/Profile/ProfilePage"));
const LoginPage = lazy(() => import("./pages/Auth/LoginPage"));
const AdminDashboard = lazy(() => import("./pages/Admin/AdminDashboard"));
const UploadPage = lazy(() => import("./pages/Upload/UploadPage"));
const NotFoundPage = lazy(() => import("./pages/NotFoundPage"));

function PageLoadingFallback() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="flex flex-col items-center gap-3 text-emerald-800">
        <div className="w-10 h-10 border-4 border-emerald-200 border-t-emerald-800 rounded-full animate-spin" />
        <span className="text-xs font-semibold text-gray-500">Loading KishanVaani...</span>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <LanguageProvider>
          <AudioPlayerProvider>
            <Suspense fallback={<PageLoadingFallback />}>
              <Routes>
                <Route element={<AppShell />}>
                  <Route path="/" element={<Home />} />
                  <Route path="/weather" element={<LiveWeatherPage />} />
                  <Route path="/mandi-prices" element={<MandiPricesPage />} />
                  <Route path="/agriculture/*" element={<AgriculturePage />} />
                  <Route path="/community/*" element={<CommunityPage />} />
                  <Route path="/literature/*" element={<LiteraturePage />} />
                  <Route path="/audio" element={<AudioLibrary />} />
                  <Route path="/upload" element={<UploadPage />} />
                  <Route path="/search" element={<SearchPage />} />
                  <Route path="/profile" element={<ProfilePage />} />
                  <Route path="/login" element={<LoginPage />} />
                  <Route path="/admin" element={<AdminDashboard />} />
                  <Route path="*" element={<NotFoundPage />} />
                </Route>
              </Routes>
            </Suspense>
          </AudioPlayerProvider>
        </LanguageProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}