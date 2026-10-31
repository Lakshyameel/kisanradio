import ImdWeatherService from "./services/imd.service.js";

async function verifyImdApis() {
  console.log("🌦️ Verifying India Meteorological Department (IMD) APIs...");

  // 1. Forecast test
  const forecast = await ImdWeatherService.getForecast({ state: "Punjab", district: "Ludhiana", days: 7 });
  console.log(`✅ [IMD Forecast] Ludhiana, Punjab: ${forecast.forecast.length} days forecast generated.`);
  console.log(`   Agency: ${forecast.agency}`);
  console.log(`   Temp: ${forecast.currentObservation.temperature}°C, Condition: ${forecast.currentObservation.condition}, Humidity: ${forecast.currentObservation.humidity}%`);
  console.log(`   Day 1 Max/Min: ${forecast.forecast[0].maxTemp}°C / ${forecast.forecast[0].minTemp}°C, Rain Prob: ${forecast.forecast[0].rainProb}`);

  // 2. Agromet Bulletin test
  const bulletin = await ImdWeatherService.getAgrometAdvisory({ state: "Punjab", district: "Ludhiana" });
  console.log(`✅ [IMD Agromet] Bulletin No: ${bulletin.bulletinNumber}`);
  console.log(`   Spray Window: Safe=${bulletin.sprayWindow.safeToSpray}, Hours=${bulletin.sprayWindow.recommendedHours}`);
  console.log(`   Irrigation: ${bulletin.irrigationAdvisory.status} - ${bulletin.irrigationAdvisory.message}`);
  console.log(`   Crops monitored: ${bulletin.cropAdvisories.map((c) => c.crop).join(", ")}`);

  // 3. Warnings test
  const warnings = await ImdWeatherService.getWarnings({ state: "Maharashtra", district: "Nashik" });
  console.log(`✅ [IMD Warnings] Nashik, Maharashtra Alert: [${warnings.warning.alertLevel}] ${warnings.warning.levelName}`);
  console.log(`   Phenomenon: ${warnings.warning.phenomenon}`);
  console.log(`   Farmer Action: ${warnings.warning.farmerAction}`);

  // 4. Nowcast test
  const nowcast = await ImdWeatherService.getNowcast({ state: "Kerala", district: "Wayanad" });
  console.log(`✅ [IMD Nowcast] Wayanad Radar: ${nowcast.nowcast.radarStation}`);
  console.log(`   Status: ${nowcast.nowcast.status} - ${nowcast.nowcast.headline}`);

  // 5. States & Districts Directory
  const dir = await ImdWeatherService.getStatesAndDistricts();
  console.log(`✅ [IMD Directory] States/UTs count: ${dir.count}`);
  console.log(`   Sample States: ${dir.states.slice(0, 8).map((s) => s.state).join(", ")}`);

  // 6. National Summary
  const summary = await ImdWeatherService.getNationalSummary();
  console.log(`✅ [IMD National Summary] Active systems: ${summary.activeSystems.length}`);
  console.log(`   Alert Breakdown: Green=${summary.alertCounts.green}, Yellow=${summary.alertCounts.yellow}, Orange=${summary.alertCounts.orange}, Red=${summary.alertCounts.red}`);

  console.log("\n🎉 All IMD Meteorological APIs verified successfully!");
}

verifyImdApis().catch((err) => {
  console.error("❌ Verification failed:", err);
  process.exit(1);
});
