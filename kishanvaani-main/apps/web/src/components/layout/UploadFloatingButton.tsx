import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  UploadCloud,
  BookOpen,
  Feather,
  Sparkles,
  Headphones,
  Plus,
  X,
} from "lucide-react";

export default function UploadFloatingButton() {
  const [expanded, setExpanded] = useState(false);
  const location = useLocation();

  // Hide on the upload page itself to avoid redundancy
  if (location.pathname === "/upload") {
    return null;
  }

  const uploadOptions = [
    {
      format: "STORY",
      label: "Upload Story (कहानी)",
      icon: BookOpen,
      color: "from-amber-600 to-amber-700",
    },
    {
      format: "POEM",
      label: "Upload Poem (कविता)",
      icon: Feather,
      color: "from-emerald-600 to-emerald-700",
    },
    {
      format: "FOLK_TALE",
      label: "Upload Folk Tale (लोक कथा)",
      icon: Sparkles,
      color: "from-amber-700 to-orange-700",
    },
    {
      format: "AUDIO_BOOK",
      label: "Upload Audiobook (ऑडियो बुक)",
      icon: Headphones,
      color: "from-teal-600 to-emerald-800",
    },
  ];

  return (
    <div className="fixed bottom-24 right-4 sm:bottom-28 sm:right-8 z-40 flex flex-col items-end gap-2 select-none">
      {/* Expanded Quick Upload Options Menu */}
      {expanded && (
        <div className="bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl border border-amber-200/80 p-3 space-y-2 mb-2 animate-in slide-in-from-bottom-5 duration-200 w-64">
          <div className="px-2 py-1 flex items-center justify-between border-b border-gray-100">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-emerald-900 flex items-center gap-1.5">
              <UploadCloud className="w-3.5 h-3.5 text-amber-600" />
              Creator Studio
            </span>
            <button
              type="button"
              onClick={() => setExpanded(false)}
              className="text-gray-400 hover:text-gray-700 p-0.5 rounded-md"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-1">
            {uploadOptions.map((opt) => {
              const Icon = opt.icon;
              return (
                <Link
                  key={opt.format}
                  to={`/upload?format=${opt.format}`}
                  onClick={() => setExpanded(false)}
                  className="flex items-center gap-2.5 p-2 rounded-xl text-xs font-semibold text-gray-800 hover:bg-amber-50/80 hover:text-amber-950 transition-colors"
                >
                  <div className={`p-1.5 rounded-lg bg-gradient-to-br ${opt.color} text-white shadow-sm`}>
                    <Icon className="w-3.5 h-3.5" />
                  </div>
                  <span>{opt.label}</span>
                </Link>
              );
            })}
          </div>

          <div className="pt-2 border-t border-gray-100 text-center">
            <Link
              to="/upload"
              onClick={() => setExpanded(false)}
              className="block py-1.5 px-3 rounded-lg bg-emerald-800 text-white font-bold text-[11px] hover:bg-emerald-900 transition-colors shadow-sm"
            >
              Open Full Upload Studio ➔
            </Link>
          </div>
        </div>
      )}

      {/* Main Floating Trigger Button */}
      <div className="flex items-center gap-2">
        <Link
          to="/upload"
          className="hidden sm:flex items-center gap-2 px-4 py-2.5 rounded-full bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-400 text-gray-950 font-black text-xs shadow-xl hover:shadow-2xl hover:scale-105 transition-all border-2 border-white ring-2 ring-amber-400/40"
        >
          <UploadCloud className="w-4 h-4 text-gray-950 stroke-[2.5]" />
          <span>+ Upload Story / Poem</span>
        </Link>

        <button
          type="button"
          onClick={() => setExpanded((prev) => !prev)}
          className="w-12 h-12 sm:w-11 sm:h-11 rounded-full bg-gradient-to-br from-emerald-800 to-green-950 hover:from-emerald-700 hover:to-green-900 text-white flex items-center justify-center shadow-xl hover:shadow-2xl hover:scale-105 transition-all border-2 border-white"
          title="Creator Studio Upload Options"
        >
          {expanded ? <X className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
        </button>
      </div>
    </div>
  );
}
