import { Outlet } from "react-router-dom";

import Header from "../components/layout/Header";
import Footer from "../components/layout/Footer";
import GlobalAudioPlayer from "../components/layout/audio/GlobalAudioPlayer";
import UploadFloatingButton from "../components/layout/UploadFloatingButton";
import InstallPromptBanner from "../components/pwa/InstallPromptBanner";

export default function AppShell() {
  return (
    <div className="app-shell flex flex-col min-h-screen">
      <InstallPromptBanner />
      <Header />

      <main className="content flex-1">
        <Outlet />
      </main>

      <Footer />
      <UploadFloatingButton />
      <GlobalAudioPlayer />
    </div>
  );
}