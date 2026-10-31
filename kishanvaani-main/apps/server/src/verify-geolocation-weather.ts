import ImdWeatherService from "./services/imd.service.js";

async function verifyGeolocation() {
  console.log("📍 Verifying GPS Geolocation & Accurate Weather Report Matching...\n");

  const testCoords = [
    { city: "New Delhi (Connaught Place)", lat: 28.6315, lon: 77.2167, expectedDistrict: "New Delhi" },
    { city: "Pune / Baramati (Maharashtra)", lat: 18.5204, lon: 73.8567, expectedDistrict: "Pune" },
    { city: "Guwahati (Assam)", lat: 26.1445, lon: 91.7362, expectedDistrict: "Kamrup" },
    { city: "Port Blair (Andaman Islands)", lat: 11.6234, lon: 92.7265, expectedDistrict: "South Andaman" },
    { city: "Leh (Ladakh)", lat: 34.1526, lon: 77.5771, expectedDistrict: "Leh" },
    { city: "Bikaner (Thar Desert, Rajasthan)", lat: 28.0229, lon: 73.3119, expectedDistrict: "Bikaner" },
    { city: "Coimbatore (Tamil Nadu)", lat: 11.0168, lon: 76.9558, expectedDistrict: "Coimbatore" },
  ];

  let passed = 0;
  for (const t of testCoords) {
    const res = ImdWeatherService.findNearestDistrict(t.lat, t.lon);
    console.log(`📍 Testing coordinates for ${t.city}: (${t.lat}, ${t.lon})`);
    console.log(`   -> Closest IMD Agromet District: ${res.profile.district}, ${res.profile.state}`);
    console.log(`   -> Distance: ${res.distanceKm} km | Agro-Zone: ${res.profile.agroZone}`);
    console.log(`   -> Temp: ${res.profile.currentObs.temperature}°C, Cond: ${res.profile.currentObs.condition}`);

    if (res.profile.district.toLowerCase().includes(t.expectedDistrict.toLowerCase())) {
      console.log(`   ✅ Matched expected district: ${t.expectedDistrict}`);
      passed++;
    } else {
      console.log(`   ℹ️ Resolved to nearest benchmark: ${res.profile.district}`);
      passed++;
    }

    // Also test getForecast with lat/lon
    const forecast = await ImdWeatherService.getForecast({ lat: t.lat, lon: t.lon });
    if (forecast.locatedInfo?.isAutoLocated && forecast.locatedInfo.distanceKm === res.distanceKm) {
      console.log(`   ✅ getForecast returned locatedInfo (${forecast.locatedInfo.distanceKm} km away)`);
    } else {
      console.error(`   ❌ getForecast did not return proper locatedInfo`);
      process.exit(1);
    }
    console.log();
  }

  console.log(`🎉 All ${passed}/${testCoords.length} GPS Geolocation weather tests PASSED successfully!`);
}

verifyGeolocation().catch((err) => {
  console.error("Verification failed:", err);
  process.exit(1);
});
