import { getDataGovKey } from "../config/env.js";

const RESOURCE_ID = "9ef84268-d588-465a-a308-a864a43d0070";
const BASE_URL = `https://api.data.gov.in/resource/${RESOURCE_ID}`;

async function checkMandi() {
  const key = getDataGovKey();

  if (!key) {
    console.log("Status: Key not set in apps/server/.env");
    process.exit(1);
  }

  const url = new URL(BASE_URL);
  url.searchParams.set("api-key", key);
  url.searchParams.set("format", "json");
  url.searchParams.set("limit", "1");

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 15000);

  try {
    const res = await fetch(url.toString(), {
      signal: controller.signal,
      headers: {
        Accept: "application/json",
      },
    });
    clearTimeout(timer);

    console.log(`HTTP Status: ${res.status}`);

    if (res.status === 401 || res.status === 403) {
      console.log("Status: Key rejected: check you copied it fully and that it is activated");
      process.exit(1);
    }

    if (res.status === 429) {
      console.log("Status: Rate limited: wait and retry");
      process.exit(1);
    }

    if (!res.ok) {
      console.log(`Status: API returned unexpected status ${res.status}`);
      process.exit(1);
    }

    const data: any = await res.json();
    const records = data?.records;
    const recordCount = Array.isArray(records) ? records.length : 0;

    console.log(`Records Returned: ${recordCount}`);

    if (recordCount === 0) {
      console.log("Status: API reachable but returned no data");
      return;
    }

    const first = records[0];
    const state = first.state || first.State || "N/A";
    const market = first.market || first.Market || "N/A";
    const commodity = first.commodity || first.Commodity || "N/A";
    const modalPrice = first.modal_price ?? first.Modal_Price ?? first.modalPrice ?? "N/A";
    const arrivalDate = first.arrival_date || first.Arrival_Date || first.arrivalDate || "N/A";

    console.log(`First Record:`);
    console.log(`  State:        ${state}`);
    console.log(`  Market:       ${market}`);
    console.log(`  Commodity:    ${commodity}`);
    console.log(`  Modal Price:  ₹${modalPrice}`);
    console.log(`  Arrival Date: ${arrivalDate}`);
    console.log("Status: OK - Real-time Agmarknet connection verified");
  } catch (err: any) {
    clearTimeout(timer);
    if (err?.name === "AbortError") {
      console.log("Status: Cannot reach api.data.gov.in (Request timed out after 15s)");
    } else {
      console.log("Status: Cannot reach api.data.gov.in");
    }
    process.exit(1);
  }
}

checkMandi();
