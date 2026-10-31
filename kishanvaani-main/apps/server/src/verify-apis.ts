export {};
process.env.NODE_ENV = "test";
const { default: app } = await import("./server.js");

async function runVerification() {
  const server = await new Promise<any>((resolve) => {
    const s = app.listen(0, () => resolve(s));
  });
  const address = server.address();
  const port = typeof address === "object" && address ? address.port : 4000;
  const baseUrl = `http://localhost:${port}/api/v1`;

  console.log(`🔍 Running automated tests on: ${baseUrl}`);

  try {
    // 1. Test AGMARKNET prices
    const agmarknetRes = await fetch(`${baseUrl}/agmarknet/prices?limit=5`);
    const agmarknetData: any = await agmarknetRes.json();
    console.log(`✅ [AGMARKNET] Prices endpoint: HTTP ${agmarknetRes.status}, count: ${agmarknetData.count}, agency: ${agmarknetData.agency?.substring(0, 30)}...`);
    if (!agmarknetData.prices || agmarknetData.prices.length === 0) throw new Error("No AGMARKNET prices returned");

    // 2. Test AGMARKNET commodities & states
    const agmarknetCommRes = await fetch(`${baseUrl}/agmarknet/commodities`);
    const agmarknetCommData: any = await agmarknetCommRes.json();
    console.log(`✅ [AGMARKNET] Commodities: ${agmarknetCommData.commodities.length} commodities available (${agmarknetCommData.commodities.slice(0, 4).join(", ")}...)`);

    const agmarknetStatesRes = await fetch(`${baseUrl}/agmarknet/states`);
    const agmarknetStatesData: any = await agmarknetStatesRes.json();
    console.log(`✅ [AGMARKNET] States: ${agmarknetStatesData.states.length} states (${agmarknetStatesData.states.slice(0, 4).join(", ")}...)`);

    const agmarknetSummaryRes = await fetch(`${baseUrl}/agmarknet/summary`);
    const agmarknetSummaryData: any = await agmarknetSummaryRes.json();
    console.log(`✅ [AGMARKNET] Summary: ${agmarknetSummaryData.totalArrivalsQuintals} Qtl volume reporting across ${agmarknetSummaryData.reportingStates} states`);

    // 3. Test e-NAM trade data
    const enamRes = await fetch(`${baseUrl}/enam/trade-data?limit=5`);
    const enamData: any = await enamRes.json();
    console.log(`✅ [e-NAM] Trade-data endpoint: HTTP ${enamRes.status}, count: ${enamData.count}, agency: ${enamData.agency?.substring(0, 30)}...`);
    if (!enamData.trades || enamData.trades.length === 0) throw new Error("No e-NAM trades returned");

    // 4. Test e-NAM commodities, mandis, and stats
    const enamCommRes = await fetch(`${baseUrl}/enam/commodities`);
    const enamCommData: any = await enamCommRes.json();
    console.log(`✅ [e-NAM] Commodities: ${enamCommData.commodities.length} commodities (${enamCommData.commodities.slice(0, 4).join(", ")}...)`);

    const enamMandisRes = await fetch(`${baseUrl}/enam/mandis`);
    const enamMandisData: any = await enamMandisRes.json();
    console.log(`✅ [e-NAM] Mandis directory: ${enamMandisData.mandis.length} onboarded electronic mandis`);

    const enamStatsRes = await fetch(`${baseUrl}/enam/stats`);
    const enamStatsData: any = await enamStatsRes.json();
    console.log(`✅ [e-NAM] National Stats: ${enamStatsData.connectedMandisTotal} connected mandis, ₹${enamStatsData.todayTotalTradeValueCrores} Cr traded today`);

    // 5. Test Mandi Comparison
    const compareRes = await fetch(`${baseUrl}/mandi/compare?commodity=Wheat`);
    const compareData: any = await compareRes.json();
    console.log(`✅ [COMPARATOR] Wheat comparison: AGMARKNET avg ₹${compareData.agmarknet.averageModalPrice} vs e-NAM avg ₹${compareData.enam.averageModalPrice} | Spread: ₹${compareData.comparison.spreadRupees}/Qtl | Recommendation: "${compareData.comparison.recommendation.substring(0, 60)}..."`);

    // 6. Test Source Filter on /mandi
    const mandiAgmarkRes = await fetch(`${baseUrl}/mandi?source=AGMARKNET&limit=2`);
    const mandiAgmarkData: any = await mandiAgmarkRes.json();
    console.log(`✅ [UNIFIED MANDI] ?source=AGMARKNET returned ${mandiAgmarkData.prices.length} items`);

    const mandiEnamRes = await fetch(`${baseUrl}/mandi?source=ENAM&limit=2`);
    const mandiEnamData: any = await mandiEnamRes.json();
    console.log(`✅ [UNIFIED MANDI] ?source=ENAM returned ${mandiEnamData.prices.length} items`);

    console.log("🎉 All AGMARKNET and e-NAM API tests PASSED successfully!");
  } finally {
    server.close();
    process.exit(0);
  }
}

runVerification().catch((err) => {
  console.error("❌ Verification failed:", err);
  process.exit(1);
});
