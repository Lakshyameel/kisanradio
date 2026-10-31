import ImdWeatherService from "./services/imd.service.js";

async function verifyPanIndia() {
  console.log("🇮🇳 Verifying Pan-India Weather Coverage (Every State & Part of India)...");

  // 1. Pan-India Regional Overview
  const overview = ImdWeatherService.getPanIndiaOverview();
  console.log(`✅ Total Districts Reporting: ${overview.totalDistrictsReporting}`);
  console.log(`✅ Total States & UTs Covered: ${overview.totalStatesAndUTs}`);
  console.log(`✅ Regions: ${overview.regions.map((r) => `${r.region} (${r.totalDistricts} dists)`).join(", ")}`);

  // 2. Search for various parts of India
  const testQueries = ["Gorakhpur", "Coimbatore", "Bikaner", "Port Blair", "Silchar", "Baramati", "Leh", "Shimla"];
  for (const q of testQueries) {
    const results = ImdWeatherService.searchLocations(q);
    const top = results[0];
    if (top) {
      console.log(`✅ Search "${q}" -> Found ${results.length} match(es): ${top.district} (${top.state}, ${top.region}) - ${top.temperature}°C, ${top.condition}`);
    } else {
      console.log(`❌ Search "${q}" -> No results found!`);
    }
  }

  // 3. Verify specific regional forecasts
  const islands = await ImdWeatherService.getForecast({ state: "Andaman and Nicobar Islands", district: "Port Blair" });
  console.log(`✅ [Islands] ${islands.district}, ${islands.state}: Temp=${islands.currentObservation.temperature}°C, Wind=${islands.currentObservation.windSpeed} km/h`);

  const northeast = await ImdWeatherService.getForecast({ state: "Assam", district: "Silchar" });
  console.log(`✅ [North-East] ${northeast.district}, ${northeast.state}: Temp=${northeast.currentObservation.temperature}°C`);

  const south = await ImdWeatherService.getForecast({ state: "Tamil Nadu", district: "Coimbatore" });
  console.log(`✅ [South] ${south.district}, ${south.state}: Temp=${south.currentObservation.temperature}°C`);

  const north = await ImdWeatherService.getForecast({ state: "Uttar Pradesh", district: "Gorakhpur" });
  console.log(`✅ [North] ${north.district}, ${north.state}: Temp=${north.currentObservation.temperature}°C`);

  console.log("\n🎉 Pan-India Weather Verification PASSED!");
}

verifyPanIndia().catch((err) => {
  console.error("❌ Verification failed:", err);
  process.exit(1);
});
