import React from "react";
import LiveWeatherReport from "../../components/weather/LiveWeatherReport";

export default function LiveWeatherPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      <LiveWeatherReport />
    </div>
  );
}
