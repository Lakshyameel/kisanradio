export interface AgriNewsItem {
  id: string;
  title: string;
  slug: string;
  source: "MINISTRY" | "KVK" | "PIB" | "ICAR";
  sourceName: string; // e.g. "Ministry of Agriculture & Farmers Welfare", "KVK Ludhiana (PAU)", "ICAR-IARI"
  ministryDivision?: string; // e.g. "Department of Agriculture & Farmers Welfare (DA&FW)", "Crops Division"
  kvkDetails?: {
    name?: string;
    kvkName: string;
    hostUniversity: string;
    district: string;
    state: string;
    pinCode?: string;
  };
  category: "SCHEMES" | "CROP_SCIENCE" | "PEST_ALERT" | "SUBSIDY_MSP" | "TECHNOLOGY" | "ORGANIC_NATURAL";
  categoryLabel: string;
  summary: string;
  fullBody: string;
  publishedAt: string;
  readTimeMin: number;
  audioDurationSec: number;
  audioUrl: string;
  narrator: string;
  language: string;
  state?: string;
  district?: string;
  keyTakeaways: string[];
  actionItemsForFarmers: string[];
  officialReferenceUrl?: string;
  link?: string;
  matchedBy?: string;
  isUrgent?: boolean;
  isTrending?: boolean;
  isSample?: boolean;
  isLive?: boolean;
  sourceLabel?: string;
  tags: string[];
}

export interface KvkCenterInfo {
  id: string;
  name: string;       // alias for kvkName — standard REST convention
  kvkName: string;
  hostUniversity: string;
  state: string;
  district: string;
  address: string;
  programCoordinator: string;
  contactNumber: string;
  email: string;
  specialtyCrops: string[];
  keyDemonstrations: string[];
  establishedYear: number;
}

export const AGRI_NEWS_DATA: AgriNewsItem[] = [
  // --- LATEST OCTOBER 2026 WEATHER & FARMING HEADLINES ---
  {
    id: "news-imd-2026-001",
    title: "IMD Weather Alert: Northeast Monsoon 2026 Active Over South Peninsula; Heavy Rain Warning for Tamil Nadu & Coastal Andhra",
    slug: "imd-northeast-monsoon-2026-south-peninsula-alert",
    source: "MINISTRY",
    sourceName: "India Meteorological Department (IMD) / MoA&FW",
    ministryDivision: "Agromet Advisory Services Division (AASD) / IMD",
    category: "CROP_SCIENCE",
    categoryLabel: "Weather & Agromet Advisory",
    summary: "IMD forecasts an active spell of rainfall under Northeast Monsoon across Tamil Nadu, Kerala, South Interior Karnataka, and Coastal Andhra Pradesh. Farmers advised on field drainage and safeguarding mature Kharif crops.",
    fullBody: `The India Meteorological Department (IMD) has issued a comprehensive agromet advisory regarding the active phase of the Northeast Monsoon across Peninsular India. A well-marked low-pressure area over the Southwest Bay of Bengal is inducing widespread rainfall, with heavy to very heavy falls expected across coastal Tamil Nadu (Cauvery delta districts), Rayalaseema, and coastal Andhra Pradesh.

Key Weather Advisory Points for Farmers:
1. Paddy (Samba / Thaladi Season): Provide proper surface drainage in direct-seeded and transplanted paddy fields to prevent waterlogging and seed displacement.
2. Harvested Produce: Immediately shift harvested paddy, groundnut, and pulses to covered threshing floors or tarpaulin-sheltered granaries.
3. Pest & Disease Alert: Postpone foliar spraying of chemical fertilizers and pesticides during continuous rain spells. Prepare for sheath rot and leaf blast monitoring once rainfall subsides.
4. Cotton & Vegetables: Ensure raised beds in vegetable fields (chillies, tomato, bhendi) are drained promptly to avoid damping off and root rot.`,
    publishedAt: "2026-10-27T10:00:00.000Z",
    readTimeMin: 4,
    audioDurationSec: 150,
    audioUrl: "",
    narrator: "IMD Agromet Advisory Desk",
    isSample: true,
    sourceLabel: "Archived Sample",
    language: "English",
    state: "Tamil Nadu, Andhra Pradesh, Kerala, Karnataka",
    keyTakeaways: [
      "Heavy to very heavy rainfall expected across coastal Tamil Nadu and Andhra Pradesh.",
      "Clear drainage channels in samba paddy nurseries to prevent seed decay.",
      "Move harvested produce under rainproof shelters immediately.",
    ],
    actionItemsForFarmers: [
      "Dig 30 cm drainage trenches around low-lying paddy and cotton plots.",
      "Delay urea top-dressing until the intense rainfall spell concludes.",
    ],
    officialReferenceUrl: "https://mausam.imd.gov.in",
    isUrgent: true,
    isTrending: true,
    tags: ["IMD", "Northeast Monsoon", "Weather Alert", "Paddy", "Drainage", "Tamil Nadu", "Andhra Pradesh"],
  },
  {
    id: "news-icar-2026-002",
    title: "Early Rabi Sowing 2026: ICAR Issues Advisory for Climate-Smart Wheat (PBW-826 & HD-3385) to Beat Terminal Heat",
    slug: "icar-climate-smart-wheat-rabi-2026-pbw826-hd3385",
    source: "ICAR",
    sourceName: "Indian Council of Agricultural Research (ICAR-IARI, Pusa)",
    ministryDivision: "Division of Agronomy & Crop Genetics",
    category: "CROP_SCIENCE",
    categoryLabel: "Crop Science & Agronomy",
    summary: "ICAR and State Agricultural Universities urge wheat growers in Punjab, Haryana, Rajasthan, UP, and MP to adopt early sowing (Oct 25 - Nov 10) of heat-resilient wheat varieties to prevent grain yield loss from spring heat waves.",
    fullBody: `To mitigate climate-induced yield fluctuations caused by sudden terminal heat spikes in February and March, the Indian Council of Agricultural Research (ICAR) and Punjab Agricultural University (PAU) have released specialized agronomical protocols for the 2026-27 Rabi season.

Key Recommendations:
1. Recommended Varieties: PBW-826, HD-3385, and DBW-327 (Karan Shivani), which exhibit physiological tolerance to early season warmer temperatures and high tillering capacity.
2. Optimal Sowing Window: October 25 to November 10 provides the ideal thermo-photoperiod, allowing plants to maximize vegetative growth before high temperature onset.
3. Seed Treatment: Treat seed with Trichoderma viride @ 4g/kg seed or Carboxin + Thiram @ 2g/kg to manage loose smut and flag smut.
4. In-Situ Soil Moisture: Utilize residual soil moisture immediately following paddy harvest using Happy Seeder or Super Seeder without field burning.`,
    publishedAt: "2026-10-26T14:30:00.000Z",
    readTimeMin: 5,
    audioDurationSec: 180,
    audioUrl: "",
    narrator: "ICAR Wheat Research Directorate",
    isSample: true,
    sourceLabel: "Archived Sample",
    language: "Hindi",
    state: "Punjab, Haryana, Uttar Pradesh, Rajasthan, Madhya Pradesh",
    keyTakeaways: [
      "Early sowing window (Oct 25 - Nov 10) prevents terminal heat damage in spring.",
      "Heat-tolerant varieties PBW-826 and HD-3385 yield 60-65 q/ha with less water.",
      "Seed treatment with bio-fungicides mandatory for healthy root emergence.",
    ],
    actionItemsForFarmers: [
      "Procure certified seed packets from authorized NSC, KVK, or State Seeds Corporation centers.",
      "Calibrate seed-cum-fertilizer drills for optimal depth of 4-5 cm.",
    ],
    officialReferenceUrl: "https://icar.org.in",
    isUrgent: false,
    isTrending: true,
    tags: ["Wheat", "Rabi 2026", "ICAR", "Climate Smart", "Heat Tolerant", "PAU", "Agronomy"],
  },
  {
    id: "news-imd-2026-003",
    title: "Western Disturbance Triggers Scattered Showers in North-West India; Beneficial for Mustard & Gram Seedbeds",
    slug: "western-disturbance-northwest-india-mustard-gram-advisory",
    source: "MINISTRY",
    sourceName: "Regional Meteorological Centre (RMC New Delhi) / IMD",
    ministryDivision: "Weather Forecast Division",
    category: "CROP_SCIENCE",
    categoryLabel: "Weather & Agromet Advisory",
    summary: "A fresh Western Disturbance over northern plains has brought scattered light rain and a drop in night temperatures across Punjab, Haryana, and Rajasthan, creating favorable soil moisture for mustard and chickpea sowing.",
    fullBody: `A moderate Western Disturbance passing over the Western Himalayan region and adjoining plains has induced widespread moisture incursion across North-West India, resulting in overcast skies and light to moderate rainfall.

Agricultural Impact & Advisory:
1. Mustard (Raya/Sarson): The rainfall provides crucial natural moisture for germination in rainfed tracts of Rajasthan (Bharatpur, Alwar, Nagaur) and South Haryana (Mahendragarh, Rewari). Farmers should ensure seed is sown at a depth of 3–5 cm once the surface topsoil dries sufficiently.
2. Chickpea (Desi & Kabuli Chana): Excellent conditions for root establishment in dryland areas. Sowing should be undertaken using bio-fertilizer Rhizobium and PSB cultures.
3. Temperature Trend: Night temperatures have dipped by 2–4°C, signaling the onset of winter conditions favorable for Rabi crop emergence. Avoid excessive irrigation in low-lying fields where standing moisture is present.`,
    publishedAt: "2026-10-25T11:00:00.000Z",
    readTimeMin: 3,
    audioDurationSec: 130,
    audioUrl: "",
    narrator: "Agri Weather Extension Desk",
    isSample: true,
    sourceLabel: "Archived Sample",
    language: "Hindi",
    state: "Rajasthan, Haryana, Punjab, Uttar Pradesh",
    keyTakeaways: [
      "Western Disturbance creates natural soil moisture boost for dryland sowing.",
      "Night temperature drop of 2-4°C accelerates mustard and gram emergence.",
      "Wait for field capacity (wapsa) before running heavy tractor implements.",
    ],
    actionItemsForFarmers: [
      "Take advantage of residual moisture to sow mustard seed with Pusa Bold or RH-725.",
      "Incorporate sulfur @ 20 kg/ha in mustard fields for higher oil recovery.",
    ],
    officialReferenceUrl: "https://mausam.imd.gov.in",
    isUrgent: false,
    isTrending: true,
    tags: ["Weather", "Western Disturbance", "Mustard", "Gram", "IMD", "Rainfall", "Rajasthan"],
  },
  {
    id: "news-moa-2026-004",
    title: "All-India Kharif Procurement 2026 Crosses 120 Lakh MT; Over ₹24,000 Crore Disbursed to Farmers via DBT",
    slug: "kharif-procurement-2026-120-lakh-mt-dbt-disbursement",
    source: "MINISTRY",
    sourceName: "Ministry of Agriculture & Farmers Welfare (MoA&FW)",
    ministryDivision: "Department of Food & Public Distribution / DA&FW",
    category: "SUBSIDY_MSP",
    categoryLabel: "MSP & Pricing Policy",
    summary: "Food Corporation of India (FCI) and state agencies record smooth procurement operations across 4,200 mandis. Direct Benefit Transfer reaches 14.5 lakh farmers directly in bank accounts within 48 hours of sale.",
    fullBody: `The ongoing Kharif Marketing Season (KMS 2026-27) has crossed the 120 Lakh Metric Tonnes (LMT) mark in paddy procurement, with Punjab, Haryana, and Uttar Pradesh leading procurement volumes.

Salient Achievements:
1. Direct Benefit Transfer (DBT): Over ₹24,250 crore transferred directly into farmers' Aadhaar-seeded bank accounts within 48 hours of mandi weighment, eliminating middlemen and commission deductions.
2. Transparency through e-Samridhi: Automated weighbridges and moisture testing meters integrated with the Central Digital Portal have ensured zero rejection disputes.
3. Coarse Grains (Shree Anna): Increased procurement of Bajra (Pearl Millet), Ragi, and Jowar under MSP to supply decentralized distribution systems (PDS) and mid-day meal schemes.`,
    publishedAt: "2026-10-24T16:00:00.000Z",
    readTimeMin: 4,
    audioDurationSec: 140,
    audioUrl: "",
    narrator: "MoA&FW Information Cell",
    isSample: true,
    sourceLabel: "Archived Sample",
    language: "English",
    state: "All India",
    keyTakeaways: [
      "120 LMT Kharif paddy procured under MSP with zero payment delays.",
      "₹24,250 crore credited directly via DBT within 48 hours.",
      "Moisture limit standardized at 17% maximum for Fair Average Quality.",
    ],
    actionItemsForFarmers: [
      "Dry paddy grain on pucca threshing yards to ensure moisture stays within 17% limit.",
      "Check SMS alerts for mandi slot booking token before hauling tractor trolleys.",
    ],
    officialReferenceUrl: "https://fci.gov.in",
    isUrgent: false,
    isTrending: false,
    tags: ["Procurement", "Paddy", "MSP", "DBT", "Food Corporation", "Kharif", "e-Samridhi"],
  },
  {
    id: "news-caqm-2026-005",
    title: "Bio-Decomposer & CRM Machinery Drive Cuts Paddy Stubble Burning by 48% Across Indo-Gangetic Plains",
    slug: "bio-decomposer-crm-machinery-cuts-stubble-burning-2026",
    source: "MINISTRY",
    sourceName: "Commission for Air Quality Management (CAQM) / ICAR-IARI",
    ministryDivision: "Crop Residue Management Task Force",
    category: "TECHNOLOGY",
    categoryLabel: "AgriTech & Machinery",
    summary: "Enhanced subsidies on Crop Residue Management (CRM) machinery including Super Seeder, Smart Seeder, and free Pusa Bio-Decomposer spraying have dramatically reduced farm fires while building soil organic carbon.",
    fullBody: `Joint satellite monitoring by ISRO, IMD, and the Commission for Air Quality Management (CAQM) indicates a 48% reduction in active stubble burning incidents in Punjab, Haryana, and NCR regions compared to the same period in previous years.

Key Highlights of the Initiative:
1. Mechanization Support: Over 2.4 lakh Crop Residue Management machines (Super Seeder, Happy Seeder, Surface Seeder, Straw Balers) deployed with 50% individual and 80% custom hiring centre (CHC) subsidies.
2. Free Bio-Decomposer Spraying: State agriculture departments completed micro-bacterial consortium spraying on 1.8 million hectares, accelerating straw decomposition within 15–20 days.
3. Soil Health Boost: In-situ straw retention has added approximately 12–15 kg nitrogen, 4–5 kg phosphorus, and 50–60 kg potassium per hectare naturally into the topsoil layer.`,
    publishedAt: "2026-10-23T12:00:00.000Z",
    readTimeMin: 4,
    audioDurationSec: 155,
    audioUrl: "",
    narrator: "Soil Health Mission Technical Cell",
    isSample: true,
    sourceLabel: "Archived Sample",
    language: "Hindi",
    state: "Punjab, Haryana, Uttar Pradesh, Delhi",
    keyTakeaways: [
      "48% reduction in stubble fire hotspots detected by satellite imagery.",
      "Bio-decomposer retains NPK soil nutrients equivalent to 1 bag DAP per acre.",
      "80% subsidy available for farmer groups setting up Custom Hiring Centres.",
    ],
    actionItemsForFarmers: [
      "Rent Super Seeder from nearby village CHC via the Farukh / i-Khet mobile application.",
      "Avoid straw burning to protect soil earthworms and beneficial microbial flora.",
    ],
    officialReferenceUrl: "https://caqm.nic.in",
    isUrgent: false,
    isTrending: false,
    tags: ["Stubble Burning", "Pusa Bio-Decomposer", "CRM", "Soil Carbon", "Super Seeder", "Air Quality"],
  },
  {
    id: "news-kvk-2026-006",
    title: "KVK Weather & Pest Warning: Post-Rain Humidity Triggers Whitefly and Brown Planthopper (BPH) Alert in Rice & Cotton",
    slug: "kvk-pest-alert-bph-whitefly-humid-weather",
    source: "KVK",
    sourceName: "KVK Bathinda (PAU) & KVK Sirsa (CCSHAU)",
    kvkDetails: {
      kvkName: "KVK Bathinda",
      hostUniversity: "Punjab Agricultural University (PAU)",
      district: "Bathinda",
      state: "Punjab",
    },
    category: "PEST_ALERT",
    categoryLabel: "Pest & Disease Alert",
    summary: "Prolonged relative humidity (>85%) following late rains prompts urgent advisory for monitoring Brown Planthopper in maturing paddy and whitefly in cotton belts. Specific biological control steps advised.",
    fullBody: `Krishi Vigyan Kendra (KVK) agronomists have issued an urgent warning for paddy and cotton growing districts of Punjab, Haryana, and Rajasthan following sustained post-rain high relative humidity and warm daytime temperatures.

Pest Management Protocols:
1. Brown Planthopper (BPH) in Paddy:
   - Part the rice canopy and inspect the base of plants. If 5–10 hoppers per hill are observed, avoid synthetic pyrethroids which trigger pest resurgence.
   - Practice Alternate Wetting and Drying (AWD) to lower micro-canopy humidity.
   - Spray Pymetrozine 50% WDG @ 120 g/acre or Triflumezopyrim 10% SC @ 94 ml/acre with hollow cone nozzles aimed at the plant base.
2. Whitefly in Cotton:
   - Monitor lower leaf surfaces using yellow sticky traps (10 traps per acre).
   - Spray Neem oil formulation (Azadirachtin 10,000 ppm) @ 2 ml/litre or Diafenthiuron 50% WP @ 200 g/acre during calm hours.`,
    publishedAt: "2026-10-22T09:30:00.000Z",
    readTimeMin: 4,
    audioDurationSec: 140,
    audioUrl: "",
    narrator: "KVK Plant Protection Cell",
    isSample: true,
    sourceLabel: "Archived Sample",
    language: "Punjabi",
    state: "Punjab, Haryana, Rajasthan",
    keyTakeaways: [
      "High humidity post-rainfall escalates BPH and Whitefly infestation risk.",
      "Inspect lower rice stem bases; do not use non-selective synthetic pyrethroids.",
      "Alternate Wetting and Drying (AWD) reduces pest population naturally by 35%.",
    ],
    actionItemsForFarmers: [
      "Install yellow sticky traps @ 10/acre in cotton fields.",
      "Ensure nozzle reaches bottom of crop canopy when spraying against planthoppers.",
    ],
    officialReferenceUrl: "https://pau.edu",
    isUrgent: true,
    isTrending: false,
    tags: ["Pest Alert", "BPH", "Whitefly", "Rice", "Cotton", "KVK Advisory", "Punjab", "Haryana"],
  },

  // --- MINISTRY OF AGRICULTURE & FARMERS WELFARE (MoA&FW) ---
  {
    id: "news-moa-001",
    title: "Cabinet Approves Enhanced MSP for 14 Kharif Crops; Paddy MSP Raised to Ensure 50% Profit Margin Over Cost",
    slug: "cabinet-enhanced-msp-kharif-crops-paddy",
    source: "MINISTRY",
    sourceName: "Ministry of Agriculture & Farmers Welfare (MoA&FW)",
    ministryDivision: "Department of Agriculture & Farmers Welfare (DA&FW) / CCEA",
    category: "SUBSIDY_MSP",
    categoryLabel: "MSP & Pricing Policy",
    summary: "The Union Cabinet chaired by the Prime Minister has approved the increase in Minimum Support Prices (MSP) for all mandated Kharif crops for 2026-27 season to ensure remunerative prices to growers.",
    fullBody: `The Cabinet Committee on Economic Affairs (CCEA) approved significant revisions in the Minimum Support Prices (MSP) for 14 mandated Kharif crops. The MSP of common paddy has been fixed to ensure a guaranteed margin of at least 50% over the all-India weighted average cost of production (Cost A2+FL).

Key commodity enhancements include:
1. Paddy (Common & Grade A): Assured procurement across all state APMC and FCI nodal centers.
2. Pulses (Arhar/Tur, Moong, Urad): Maximum price increase to incentivize domestic pulse production and reduce import dependency.
3. Oilseeds (Groundnut, Soybean, Sunflower seed): Higher returns to boost the National Mission on Edible Oils - Oilseeds (NMEO-OS).

The Ministry reiterated that procurement will be backed by the Price Support Scheme (PSS) and e-NAM integration across 1,361+ mandis.`,
    publishedAt: "2026-09-20T10:30:00.000Z",
    readTimeMin: 4,
    audioDurationSec: 145,
    audioUrl: "/audio/news/msp-kharif-briefing.mp3",
    narrator: "MoA&FW Pulse Development Desk",
    isSample: true,
    sourceLabel: "Archived Sample",
    language: "Hindi",
    state: "All India",
    keyTakeaways: [
      "Paddy MSP guarantees minimum 50% return over cost of production (A2+FL).",
      "Special incentives allocated for pulses (Tur, Urad) and oilseeds (Groundnut, Soybean).",
      "Direct Bank Transfer (DBT) payments within 48 hours of mandi weighment.",
    ],
    actionItemsForFarmers: [
      "Register on your State e-Uparjan or Food Corporation procurement portal with Aadhaar & Land Record.",
      "Ensure grain moisture content remains within FAQ (Fair Average Quality) standards (14% max for paddy).",
    ],
    officialReferenceUrl: "https://agricoop.gov.in/en/MSP",
    isUrgent: false,
    isTrending: true,
    tags: ["MSP", "Cabinet", "Paddy", "Pulses", "MoA&FW", "Procurement"],
  },
  {
    id: "news-moa-002",
    title: "PM-KISAN: Ministry Issues Mandatory Operational Guidelines for Aadhaar e-KYC & Land Seeding Verification",
    slug: "pm-kisan-mandatory-guidelines-ekyc-land-seeding",
    source: "MINISTRY",
    sourceName: "Ministry of Agriculture & Farmers Welfare (MoA&FW)",
    ministryDivision: "PM-KISAN Operational Cell, DA&FW",
    category: "SCHEMES",
    categoryLabel: "Government Scheme",
    summary: "The Department of Agriculture & Farmers Welfare urges all registered farm beneficiaries to complete OTP-based or biometric e-KYC and ensure land map seeding before the upcoming Direct Benefit Transfer installment.",
    fullBody: `Under the Pradhan Mantri Kisan Samman Nidhi (PM-KISAN), eligible landholding farmer families receive financial assistance of ₹6,000 per annum distributed across three equal installments of ₹2,000 each.

To maintain transparency and eliminate ineligible transfers, the Ministry has mandated:
1. e-KYC via PM-KISAN Portal, PM-KISAN Mobile App (Face Authentication feature), or nearest Common Service Centre (CSC).
2. Aadhaar Linking with Active Bank Account enabled for NPCI Aadhaar Payment Bridge (APB).
3. Land Record Seeding (Bhulekh linkage) with state revenue databases.

Farmers can inspect their beneficiary status and verify land verification approvals directly via the Farmer Corner on pmkisan.gov.in.`,
    publishedAt: "2026-09-18T14:00:00.000Z",
    readTimeMin: 3,
    audioDurationSec: 120,
    audioUrl: "/audio/news/pmkisan-guidelines.mp3",
    narrator: "National Extension Advisory Cell",
    isSample: true,
    sourceLabel: "Archived Sample",
    language: "Hindi",
    state: "All India",
    keyTakeaways: [
      "Mandatory e-KYC via PM-KISAN App Face Authentication or CSC biometric.",
      "Bank account must be NPCI-mapped for Aadhaar Direct Benefit Transfer.",
      "Land deed verification is compulsory for continuous disbursement.",
    ],
    actionItemsForFarmers: [
      "Download PM-KISAN mobile app from Google Play Store for instant face-authentication e-KYC.",
      "Visit your local CSC or Post Office Bank to verify NPCI mapping on your bank account.",
    ],
    officialReferenceUrl: "https://pmkisan.gov.in",
    isUrgent: true,
    isTrending: true,
    tags: ["PM-KISAN", "e-KYC", "DBT", "Financial Assistance", "MoA&FW"],
  },
  {
    id: "news-moa-003",
    title: "Digital Agriculture Mission: ₹2,817 Crore Approved to Launch AgriStack and Digital Crop Survey Across States",
    slug: "digital-agriculture-mission-agristack-crop-survey",
    source: "MINISTRY",
    sourceName: "Ministry of Agriculture & Farmers Welfare (MoA&FW)",
    ministryDivision: "Digital Agriculture Division, MoA&FW",
    category: "TECHNOLOGY",
    categoryLabel: "Digital Farm Technology",
    summary: "Government approves the landmark Digital Agriculture Mission to build digital public infrastructure including AgriStack (Farmers' Registry, Village Land Maps, Crop Sown Registry) and Krishi-DSS.",
    fullBody: `The Union Government has greenlit the Digital Agriculture Mission with an outlay of ₹2,817 Crore. The mission establishes foundational Digital Public Infrastructure (DPI) for agriculture.

Core Pillars:
1. AgriStack:
   - Farmers' Registry: Unique digital Farmer ID linked with Aadhaar and land parcels.
   - Geo-referenced Village Maps: GIS demarcation of individual farm boundaries.
   - Crop Sown Registry: Mobile-based Digital Crop Survey (DCS) verifying standing crops in each plot.
2. Krishi Decision Support System (Krishi-DSS): Integrating satellite imagery, weather nowcasts, and soil data for automated farm advisory.
3. Soil Profile Mapping: Digital soil nutrient mapping for targeted fertilizer advice.`,
    publishedAt: "2026-09-15T09:15:00.000Z",
    readTimeMin: 4,
    audioDurationSec: 135,
    audioUrl: "/audio/news/digital-agri-mission.mp3",
    narrator: "AgTech & Digital Agriculture Desk",
    isSample: true,
    sourceLabel: "Archived Sample",
    language: "English",
    state: "All India",
    keyTakeaways: [
      "Unique Farmer ID provides single-window access to credit, crop insurance, and inputs.",
      "Digital Crop Survey replaces manual inspection for speedy insurance claims.",
      "Interoperable data ecosystem connects state departments with ICAR and KVKs.",
    ],
    actionItemsForFarmers: [
      "Cooperate with local village surveyors during the Digital Crop Survey (DCS) in your village.",
      "Obtain your digital Farmer ID when enrollment opens in your district.",
    ],
    officialReferenceUrl: "https://agricoop.gov.in",
    isUrgent: false,
    isTrending: false,
    tags: ["AgriStack", "Digital Agriculture", "Krishi-DSS", "Farmer ID", "Crop Survey"],
  },
  {
    id: "news-moa-004",
    title: "PMFBY Launches 'DigiClaim' Portal: Crop Insurance Claims to Be Settled Digitally within 10 Days Post Survey",
    slug: "pmfby-digiclaim-automated-settlement",
    source: "MINISTRY",
    sourceName: "Ministry of Agriculture & Farmers Welfare (MoA&FW)",
    ministryDivision: "Credit & Insurance Division / PMFBY",
    category: "SCHEMES",
    categoryLabel: "Crop Insurance",
    summary: "Pradhan Mantri Fasal Bima Yojana deploys satellite CCE (Crop Cutting Experiments) and automated DigiClaim disbursement directly into farmers' bank accounts.",
    fullBody: `The Ministry of Agriculture has rolled out the 'DigiClaim' module within the National Crop Insurance Portal (NCIP). The system automates claim calculation based on yield loss assessment submitted through the CCE Agri App and satellite vegetation indices.

Key Highlights:
- Claims calculated automatically upon entry of CCE data.
- Electronic fund transfer directly to the insured farmer's bank account.
- Integration with YES-TECH (Yield Estimation System based on Technology) and WINDS (Weather Information Network Data Systems).
- Localized calamity claims (hailstorm, inundation, landslide) can be reported within 72 hours via the Crop Insurance App.`,
    publishedAt: "2026-09-12T11:00:00.000Z",
    readTimeMin: 3,
    audioDurationSec: 110,
    audioUrl: "/audio/news/pmfby-digiclaim.mp3",
    narrator: "Organic Farming Editorial Desk",
    isSample: true,
    sourceLabel: "Archived Sample",
    language: "Hindi",
    state: "All India",
    keyTakeaways: [
      "Claims settled electronically without delays through automated DigiClaim integration.",
      "Inundation and hailstorm loss must be reported within 72 hours via app or toll-free 14447.",
      "Premium remains affordable: 1.5% for Rabi, 2% for Kharif, 5% for Commercial/Horticultural crops.",
    ],
    actionItemsForFarmers: [
      "Install the 'Crop Insurance' app on Android to lodge instant photo-evidence in case of hailstorm or inundation.",
      "Keep policy receipt / enrollment certificate safe for claim status tracking.",
    ],
    officialReferenceUrl: "https://pmfby.gov.in",
    isUrgent: false,
    isTrending: false,
    tags: ["PMFBY", "DigiClaim", "Crop Insurance", "Yield Loss", "MoA&FW"],
  },

  // --- KRISHI VIGYAN KENDRAS (KVKs under ICAR) ---
  {
    id: "news-kvk-001",
    title: "KVK Ludhiana Advisory: Early In-Situ Paddy Straw Management Using Smart Seeder and Bio-Decomposer Consortia",
    slug: "kvk-ludhiana-paddy-straw-management-smart-seeder",
    source: "KVK",
    sourceName: "Krishi Vigyan Kendra, Ludhiana (PAU)",
    kvkDetails: {
      name: "Krishi Vigyan Kendra, Samrala / Ludhiana",
      kvkName: "Krishi Vigyan Kendra, Samrala / Ludhiana",
      hostUniversity: "Punjab Agricultural University (PAU)",
      district: "Ludhiana",
      state: "Punjab",
      pinCode: "141114",
    },
    category: "CROP_SCIENCE",
    categoryLabel: "Crop Science & Machinery",
    summary: "Scientists at KVK Ludhiana release guidelines on zero-burn wheat sowing using Smart Seeder, Surface Seeder, and PUSA microbial decomposers to build soil organic carbon.",
    fullBody: `As the paddy harvest gathers momentum, KVK Ludhiana scientists advise farmers against crop residue burning and recommend adopting in-situ stubble management machines.

Recommended Techniques:
1. Smart Seeder / Happy Seeder: Directly drills wheat seed and fertilizer into standing paddy residue without prior tillage, saving ₹2,500-3,000 per acre in land prep costs.
2. PAU Surface Seeder: Low-cost attachment behind combine harvesters that drops seeds and spreads straw simultaneously.
3. Bio-Decomposer Spray: Apply microbial spray @ 300g/acre mixed with 200L water along with 10 kg urea per acre to accelerate residue decomposition into humus.

Soil health monitoring reveals that retaining crop residue increases soil organic carbon from 0.42% to 0.68% over 3 seasons and curtails weed infestation by 60%.`,
    publishedAt: "2026-09-21T08:00:00.000Z",
    readTimeMin: 4,
    audioDurationSec: 150,
    audioUrl: "/audio/news/kvk-ludhiana-stubble.mp3",
    narrator: "KVK Extension Advisory Cell",
    isSample: true,
    sourceLabel: "Archived Sample",
    language: "Punjabi",
    state: "Punjab",
    district: "Ludhiana",
    keyTakeaways: [
      "In-situ stubble retention increases soil organic matter and conserves residual soil moisture.",
      "Smart Seeder / Surface Seeder saves ₹2,500/acre and suppresses Phalaris minor (Gullidanda) weed.",
      "Apply 10 kg urea per acre with microbial consortia to speed up straw breakdown.",
    ],
    actionItemsForFarmers: [
      "Book Custom Hiring Centre (CHC) machinery in advance through the i-Khedut / CRM mobile portal.",
      "Maintain combine cutter bar height at 10-12 inches for optimal spreader distribution.",
    ],
    officialReferenceUrl: "https://www.pau.edu/kvk",
    isUrgent: true,
    isTrending: true,
    tags: ["KVK Ludhiana", "Stubble Management", "Smart Seeder", "Wheat Sowing", "PAU"],
  },
  {
    id: "news-kvk-002",
    title: "KVK Baramati Alert: Pink Bollworm Monitoring in Bt Cotton; Pheromone Traps and Biological Spray Protocols",
    slug: "kvk-baramati-pink-bollworm-monitoring-cotton",
    source: "KVK",
    sourceName: "Krishi Vigyan Kendra, Baramati (Agricultural Development Trust / MPKV)",
    kvkDetails: {
      name: "KVK Baramati (Shardanagar)",
      kvkName: "KVK Baramati (Shardanagar)",
      hostUniversity: "Mahatma Phule Krishi Vidyapeeth (MPKV)",
      district: "Pune",
      state: "Maharashtra",
      pinCode: "413115",
    },
    category: "PEST_ALERT",
    categoryLabel: "Pest & Disease Alert",
    summary: "KVK Baramati entomologists issue an urgent pest alert for cotton farmers in Western Maharashtra and Marathwada following trapped moth counts of Pectinophora gossypiella.",
    fullBody: `During regular farm surveillance in Indapur and Baramati blocks, KVK crop protection scientists observed an uptick in Pink Bollworm (*Pectinophora gossypiella*) moth catches in surveillance traps (exceeding Economic Threshold Level of 8 moths/trap for 3 consecutive nights).

Recommended Integrated Pest Management (IPM) Schedule:
1. Pheromone Trapping: Install 5 pheromone traps per acre with Gossyplure septa for monitoring; 15-20 traps per acre for mass trapping and mating disruption.
2. Trichogramma Cards: Release *Trichogramma bactrae* egg parasitoids @ 60,000 eggs/acre at weekly intervals during square formation and flowering.
3. Bio-Pesticide: Spray neem seed kernel extract (NSKE 5%) or Azadirachtin 1500 ppm @ 5 ml/L water during initial rosette flower stage.
4. Chemical Intervention (Only if ETL breached): Spray Chlorantraniliprole 18.5% SC @ 0.3 ml/L or Emamectin Benzoate 5% SG @ 0.4 g/L during late evening hours.`,
    publishedAt: "2026-09-19T16:30:00.000Z",
    readTimeMin: 4,
    audioDurationSec: 160,
    audioUrl: "/audio/news/kvk-baramati-pest.mp3",
    narrator: "KVK Baramati Advisory Unit",
    isSample: true,
    sourceLabel: "Archived Sample",
    language: "Marathi",
    state: "Maharashtra",
    district: "Pune",
    keyTakeaways: [
      "Economic Threshold Level (ETL): 8 moths/trap for 3 nights or 10% rosette flowers in field.",
      "Release Trichogramma egg parasitoids before larval entry into bolls.",
      "Avoid synthetic pyrethroids to prevent flare-up of secondary sucking pests.",
    ],
    actionItemsForFarmers: [
      "Scout your cotton fields between 08:00 AM and 10:00 AM for rosette flowers and collect/destroy damaged squares.",
      "Replace pheromone septa every 21 days to ensure attractant potency.",
    ],
    officialReferenceUrl: "https://kvkbaramati.com",
    isUrgent: true,
    isTrending: true,
    tags: ["KVK Baramati", "Cotton", "Pink Bollworm", "Pest Alert", "IPM"],
  },
  {
    id: "news-kvk-003",
    title: "KVK Gorakhpur Releases High-Yielding Zinc & Iron Enriched Paddy 'Sabour Kundan' for Sodic & Floodplain Soils",
    slug: "kvk-gorakhpur-biofortified-paddy-sabour-kundan",
    source: "KVK",
    sourceName: "Krishi Vigyan Kendra, Gorakhpur (ANDUAT)",
    kvkDetails: {
      name: "KVK Belghat, Gorakhpur",
      kvkName: "KVK Belghat, Gorakhpur",
      hostUniversity: "Acharya Narendra Deva University of Agriculture & Technology (ANDUAT)",
      district: "Gorakhpur",
      state: "Uttar Pradesh",
      pinCode: "273404",
    },
    category: "CROP_SCIENCE",
    categoryLabel: "High-Yielding Varieties",
    summary: "Frontline demonstration trials show 18% higher yield and high blast resistance with newly introduced biofortified paddy variety suited for Terai and Gangetic alluvial tracts.",
    fullBody: `KVK Gorakhpur has concluded 45 frontline demonstrations (FLDs) across Belghat and Sahjanwa blocks evaluating biofortified paddy cultivars. The variety 'Sabour Kundan' recorded an average grain yield of 58.4 quintals per hectare compared to 49.2 quintals in traditional check varieties.

Salient Characteristics:
- Grain Quality: Medium slender grain with zinc content of 24.2 ppm and iron content of 12.5 ppm.
- Duration: 125-130 days maturity (permits timely sowing of Rabi mustard and potato).
- Stress Tolerance: Tolerant to early flash floods (up to 10 days submergence) and resistant to bacterial leaf blight (BLB) and leaf blast.
- Certified seeds and foundation seed stocks are being made available for the upcoming season through the KVK Farm Seed Hub.`,
    publishedAt: "2026-09-17T12:00:00.000Z",
    readTimeMin: 3,
    audioDurationSec: 130,
    audioUrl: "/audio/news/kvk-gorakhpur-paddy.mp3",
    narrator: "KVK Agronomy Unit",
    isSample: true,
    sourceLabel: "Archived Sample",
    language: "Hindi",
    state: "Uttar Pradesh",
    district: "Gorakhpur",
    keyTakeaways: [
      "Zinc content 24.2 ppm provides higher market price and nutritional enrichment.",
      "125-130 days maturity enables timely planting of Rabi potatoes or mustard.",
      "Tolerates temporary water stagnation common in Eastern UP lowlands.",
    ],
    actionItemsForFarmers: [
      "Contact KVK Belghat Seed Hub to pre-register for certified breeder/foundation seed indent for next Kharif.",
      "Participate in the Kisan Mela at ANDUAT Ayodhya on the 5th of next month.",
    ],
    officialReferenceUrl: "https://nduat.org/kvk",
    isUrgent: false,
    isTrending: false,
    tags: ["KVK Gorakhpur", "Biofortified Paddy", "ANDUAT", "Seed Hub", "Eastern UP"],
  },
  {
    id: "news-kvk-004",
    title: "KVK Coimbatore Protocol: Root Wilt and Stem Bleeding Management in Coconut Plantations Using Trichoderma",
    slug: "kvk-coimbatore-coconut-root-wilt-management",
    source: "KVK",
    sourceName: "Krishi Vigyan Kendra, Coimbatore (TNAU)",
    kvkDetails: {
      name: "KVK Sandhiyur / Coimbatore",
      kvkName: "KVK Sandhiyur / Coimbatore",
      hostUniversity: "Tamil Nadu Agricultural University (TNAU)",
      district: "Coimbatore",
      state: "Tamil Nadu",
      pinCode: "641003",
    },
    category: "PEST_ALERT",
    categoryLabel: "Plant Pathology & Disease Care",
    summary: "TNAU-KVK scientists recommend root feeding of hexaconazole and ring application of neem cake enriched with Trichoderma harzianum for root wilt affected coconut palms.",
    fullBody: `Coconut groves in Pollachi and Anaimalai tracts experiencing basal stem bleeding (*Thielaviopsis paradoxa*) and root wilt flushes are advised to follow TNAU's 3-tier bio-sanitation protocol.

Control Protocol:
1. Scraping & Wound Dressing: Chisel out diseased cortical tissues from trunk oozing points and swab with hot coal tar or Bordeaux paste (10%).
2. Root Feeding: Identify active orange-red roots, make a clean slant cut, and insert into a polythene bag containing 2 ml Hexaconazole 5% SC mixed in 100 ml water.
3. Soil Enrichment: Apply 5 kg neem cake mixed with 100 g *Trichoderma harzianum* and 50 kg farmyard manure (FYM) per tree in basin rings (1.8m radius) twice a year during post-monsoon showers.
4. Water Drainage: Avoid flood irrigation across tree basins; adopt micro-sprinklers or drip rings to prevent fungal spore dispersal.`,
    publishedAt: "2026-09-14T10:00:00.000Z",
    readTimeMin: 4,
    audioDurationSec: 140,
    audioUrl: "/audio/news/kvk-coimbatore-coconut.mp3",
    narrator: "KVK Plant Protection Unit",
    isSample: true,
    sourceLabel: "Archived Sample",
    language: "Tamil",
    state: "Tamil Nadu",
    district: "Coimbatore",
    keyTakeaways: [
      "Root feeding with 2 ml Hexaconazole in 100 ml water arrests internal fungal hyphae.",
      "Neem cake + Trichoderma basin application builds protective soil microbiomes.",
      "Prevent flood irrigation which spreads Thielaviopsis spores across neighboring palms.",
    ],
    actionItemsForFarmers: [
      "Procure authentic Trichoderma bio-formulations from the TNAU biocontrol lab or local KVK.",
      "Treat affected palms immediately after morning dew dries.",
    ],
    officialReferenceUrl: "https://tnau.ac.in/kvk",
    isUrgent: false,
    isTrending: false,
    tags: ["KVK Coimbatore", "Coconut", "Root Wilt", "TNAU", "Biocontrol"],
  },
  {
    id: "news-kvk-005",
    title: "KVK Bikaner Demonstrates Low-Water Drip-Fertigated Pomegranate and Moth Bean Cultivation in Arid Tracts",
    slug: "kvk-bikaner-arid-horticulture-moth-bean",
    source: "KVK",
    sourceName: "Krishi Vigyan Kendra, Bikaner (SKRAU)",
    kvkDetails: {
      name: "KVK Bikaner-I (Beechwal)",
      kvkName: "KVK Bikaner-I (Beechwal)",
      hostUniversity: "Swami Keshwanand Rajasthan Agricultural University (SKRAU)",
      district: "Bikaner",
      state: "Rajasthan",
      pinCode: "334006",
    },
    category: "CROP_SCIENCE",
    categoryLabel: "Arid Agriculture",
    summary: "SKRAU-KVK demonstrates 42% water savings using subsurface drip fertigation and black plastic mulching for pomegranate orchards intercropped with drought-hardy Moth Bean.",
    fullBody: `In the hyper-arid partial irrigated zones of Bikaner and Jaisalmer, KVK Beechwal demonstrated innovative water-saving horticultural systems.

Trial Results:
- Pomegranate (*Bhagwa* variety) grown under subsurface drip irrigation with 25-micron UV-stabilized silver-black mulch recorded 42% water saving compared to surface flood irrigation.
- Intercropping with drought-hardy Moth bean (Variety RMO-40 / RMO-257) provided ₹32,000/ha supplementary income while adding 28 kg/ha atmospheric nitrogen to the soil.
- KVK organized on-farm vocational training on micro-irrigation maintenance, acid flushing of emitters, and fertigation scheduling with water-soluble 19:19:19 fertilizers.`,
    publishedAt: "2026-09-11T14:45:00.000Z",
    readTimeMin: 3,
    audioDurationSec: 125,
    audioUrl: "/audio/news/kvk-bikaner-arid.mp3",
    narrator: "KVK Horticulture Unit",
    isSample: true,
    sourceLabel: "Archived Sample",
    language: "Hindi",
    state: "Rajasthan",
    district: "Bikaner",
    keyTakeaways: [
      "Subsurface drip + mulching reduces evapotranspiration loss by over 40%.",
      "Moth bean RMO-40 intercrop fixes nitrogen and provides bonus revenue in dry seasons.",
      "Acid flushing of drip emitters twice a year prevents carbonate and algae clogging in saline groundwater.",
    ],
    actionItemsForFarmers: [
      "Apply for 70% state subsidy on drip irrigation equipment through Rajasthan RajKisan Saathi portal.",
      "Collect soil & tubewell water samples for free testing at KVK Bikaner soil testing lab.",
    ],
    officialReferenceUrl: "https://raubikaner.org",
    isUrgent: false,
    isTrending: false,
    tags: ["KVK Bikaner", "Drip Irrigation", "Pomegranate", "Moth Bean", "Arid Zone", "SKRAU"],
  },
  {
    id: "news-kvk-006",
    title: "KVK Kamrup (Assam) Launches High-Density Assam Lemon Training and Bio-Formulation Distribution",
    slug: "kvk-kamrup-assam-lemon-high-density-training",
    source: "KVK",
    sourceName: "Krishi Vigyan Kendra, Kamrup (AAU)",
    kvkDetails: {
      name: "KVK Kamrup, Kahikuchi",
      kvkName: "KVK Kamrup, Kahikuchi",
      hostUniversity: "Assam Agricultural University (AAU)",
      district: "Kamrup",
      state: "Assam",
      pinCode: "781017",
    },
    category: "CROP_SCIENCE",
    categoryLabel: "Horticulture & Training",
    summary: "Assam Agricultural University's KVK Kahikuchi conducts Hands-on Training on High-Density Planting (HDP) of GI-tagged Assam Lemon (Kaji Nemu) with bio-fertilizer packages.",
    fullBody: `Under the Mission for Integrated Development of Horticulture (MIDH), KVK Kamrup conducted a 3-day capacity building workshop for 60 youth farmers on commercial cultivation of GI-tagged Assam Lemon (*Citrus limon* cv. Assam Lemon).

Key Highlights:
- Spacing: High-Density Planting at 3m x 3m accommodates 1,111 plants/ha, doubling early yield per unit area compared to traditional 5m x 5m spacing.
- Disease Management: Prevention of Citrus Canker (*Xanthomonas citri*) using copper oxychloride (0.3%) + Streptocycline (100 ppm) sprays during flush stages.
- Processing & Marketing: Training on lemon juice extraction, essential oil distillation from rind, and collective marketing through Farmer Producer Companies (FPCs).`,
    publishedAt: "2026-09-08T11:20:00.000Z",
    readTimeMin: 3,
    audioDurationSec: 135,
    audioUrl: "/audio/news/kvk-kamrup-lemon.mp3",
    narrator: "AAU Agricultural Extension Unit",
    isSample: true,
    sourceLabel: "Archived Sample",
    language: "Assamese",
    state: "Assam",
    district: "Kamrup",
    keyTakeaways: [
      "High-Density Planting (3m x 3m) accommodates 1,111 trees/hectare with high early returns.",
      "GI-tagged Kaji Nemu enjoys steady export demand to Middle East and European markets.",
      "Timely copper oxychloride sprays control citrus canker blemishes on fruits.",
    ],
    actionItemsForFarmers: [
      "Register with local FPC (Farmer Producer Company) in Kamrup to participate in collective export shipments.",
      "Collect certified disease-free air-layered saplings from KVK Kahikuchi nursery.",
    ],
    officialReferenceUrl: "https://aau.ac.in",
    isUrgent: false,
    isTrending: false,
    tags: ["KVK Kamrup", "Assam Lemon", "Kaji Nemu", "AAU", "Horticulture", "North-East"],
  },
];

export const KVK_DIRECTORY: KvkCenterInfo[] = [
  {
    id: "kvk-dir-001",
    name: "KVK Ludhiana (Samrala)",
    kvkName: "KVK Ludhiana (Samrala)",
    hostUniversity: "Punjab Agricultural University (PAU)",
    state: "Punjab",
    district: "Ludhiana",
    address: "KVK Campus, Samrala Road, Ludhiana, Punjab - 141114",
    programCoordinator: "Senior Scientist & Head, KVK",
    contactNumber: "+91-161-2401960",
    email: "kvkludhiana@pau.edu",
    specialtyCrops: ["Wheat", "Paddy", "Mustard", "Potato", "Kinnow"],
    keyDemonstrations: ["Smart Seeder Wheat Sowing", "Direct Seeded Rice (DSR)", "Soil Health Testing"],
    establishedYear: 1982,
  },
  {
    id: "kvk-dir-002",
    name: "KVK Baramati",
    kvkName: "KVK Baramati",
    hostUniversity: "Mahatma Phule Krishi Vidyapeeth (MPKV) / ADT",
    state: "Maharashtra",
    district: "Pune",
    address: "Agricultural Development Trust, Shardanagar, Baramati, Pune - 413115",
    programCoordinator: "Senior Scientist & Head, KVK",
    contactNumber: "+91-2112-255227",
    email: "kvkbaramati@yahoo.com",
    specialtyCrops: ["Sugarcane", "Table Grapes", "Pomegranate", "Bt Cotton", "Soybean"],
    keyDemonstrations: ["Precision Drip Automation", "Bio-Control Agents Production", "Hydroponic Fodder"],
    establishedYear: 1993,
  },
  {
    id: "kvk-dir-003",
    name: "KVK Gorakhpur (Belghat)",
    kvkName: "KVK Gorakhpur (Belghat)",
    hostUniversity: "Acharya Narendra Deva University of Agriculture & Technology (ANDUAT)",
    state: "Uttar Pradesh",
    district: "Gorakhpur",
    address: "KVK Belghat, Post Belghat, Gorakhpur, Uttar Pradesh - 273404",
    programCoordinator: "Senior Scientist & Head, KVK",
    contactNumber: "+91-551-2283012",
    email: "kvkgorakhpur@nduat.org",
    specialtyCrops: ["Paddy (Submergence Tolerant)", "Wheat", "Sugarcane", "Mustard", "Lentil"],
    keyDemonstrations: ["Biofortified Paddy Trials", "System of Mustard Intensification", "Mushroom Spawn Lab"],
    establishedYear: 2004,
  },
  {
    id: "kvk-dir-004",
    name: "KVK Coimbatore",
    kvkName: "KVK Coimbatore",
    hostUniversity: "Tamil Nadu Agricultural University (TNAU)",
    state: "Tamil Nadu",
    district: "Coimbatore",
    address: "TNAU Campus, Marudhamalai Road, Coimbatore, Tamil Nadu - 641003",
    programCoordinator: "Senior Scientist & Head, KVK",
    contactNumber: "+91-422-6611200",
    email: "kvkcoimbatore@tnau.ac.in",
    specialtyCrops: ["Coconut", "Banana", "Turmeric", "Millets", "Cotton"],
    keyDemonstrations: ["Root Feeding for Coconut Wilt", "TNAU Pulse Wonder Foliar Spray", "Micro-Irrigation"],
    establishedYear: 1979,
  },
  {
    id: "kvk-dir-005",
    name: "KVK Bikaner-I (Beechwal)",
    kvkName: "KVK Bikaner-I (Beechwal)",
    hostUniversity: "Swami Keshwanand Rajasthan Agricultural University (SKRAU)",
    state: "Rajasthan",
    district: "Bikaner",
    address: "SKRAU Campus, Beechwal, Bikaner, Rajasthan - 334006",
    programCoordinator: "Senior Scientist & Head, KVK",
    contactNumber: "+91-151-2250025",
    email: "kvkbikaner@raubikaner.org",
    specialtyCrops: ["Moth Bean", "Cluster Bean (Guar)", "Groundnut", "Pomegranate", "Date Palm"],
    keyDemonstrations: ["Arid Horticulture Under Mulch", "Water Conservation in Canal Commands", "Mineral Mixture for Camels"],
    establishedYear: 1989,
  },
  {
    id: "kvk-dir-006",
    name: "KVK Kamrup (Kahikuchi)",
    kvkName: "KVK Kamrup (Kahikuchi)",
    hostUniversity: "Assam Agricultural University (AAU)",
    state: "Assam",
    district: "Kamrup",
    address: "HRS Campus, Kahikuchi, Guwahati, Assam - 781017",
    programCoordinator: "Senior Scientist & Head, KVK",
    contactNumber: "+91-361-2840224",
    email: "kvkkamrup@aau.ac.in",
    specialtyCrops: ["Assam Lemon", "Boro Rice", "Arecanut", "Black Pepper", "Ginger"],
    keyDemonstrations: ["High-Density Kaji Nemu Planting", "Organic Vermicomposting Units", "SRI Paddy Method"],
    establishedYear: 2002,
  },
  {
    id: "kvk-dir-007",
    name: "KVK Wayanad (Ambalavayal)",
    kvkName: "KVK Wayanad (Ambalavayal)",
    hostUniversity: "Kerala Agricultural University (KAU)",
    state: "Kerala",
    district: "Wayanad",
    address: "Regional Agricultural Research Station, Ambalavayal, Wayanad - 673593",
    programCoordinator: "Senior Scientist & Head, KVK",
    contactNumber: "+91-4936-260421",
    email: "kvkwayanad@kau.in",
    specialtyCrops: ["Black Pepper", "Coffee", "Cardamom", "Ginger", "Rice (Wayanad Jeerakasala)"],
    keyDemonstrations: ["Bush Pepper Technology", "Trichoderma Biocontrol Lab", "Integrated Dairy Farming"],
    establishedYear: 1994,
  },
  {
    id: "kvk-dir-008",
    name: "KVK Shimla (Rohru)",
    kvkName: "KVK Shimla (Rohru)",
    hostUniversity: "Dr. Y.S. Parmar University of Horticulture & Forestry (YSPUHF)",
    state: "Himachal Pradesh",
    district: "Shimla",
    address: "Horticultural Research Station, Rohru, Shimla, Himachal Pradesh - 171207",
    programCoordinator: "Senior Scientist & Head, KVK",
    contactNumber: "+91-1781-240128",
    email: "kvkshimla@yspuniversity.ac.in",
    specialtyCrops: ["Apple", "Pear", "Cherry", "Off-Season Vegetables", "Walnut"],
    keyDemonstrations: ["High-Density Apple Orchards (M9 Rootstock)", "Apple Scab Warning Station", "Anti-Hail Nets"],
    establishedYear: 1985,
  },
];
