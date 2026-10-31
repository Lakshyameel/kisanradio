import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { IMD_DISTRICT_BENCHMARKS } from "./services/imd.service.js";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting KishanVaani Database Seed...");

  // Prevent accidental seeding of default demo credentials in production
  if (process.env.NODE_ENV === "production" && !process.env.ALLOW_PRODUCTION_SEED) {
    console.error("FATAL: Database seeding with default demo credentials (password123) is blocked in production.");
    console.error("To seed in production, explicitly set ALLOW_PRODUCTION_SEED=true and rotate credentials.");
    process.exit(1);
  }

  // 1. Clear existing data
  await prisma.bookmark.deleteMany();
  await prisma.listeningHistory.deleteMany();
  await prisma.audio.deleteMany();
  await prisma.content.deleteMany();
  await prisma.communityStory.deleteMany();
  await prisma.expertQuestion.deleteMany();
  await prisma.mandiPrice.deleteMany();
  await prisma.weatherCache.deleteMany();
  await prisma.user.deleteMany();

  console.log("🧹 Cleaned existing records.");

  // 2. Create Users
  const hashedPassword = await bcrypt.hash("password123", 10);

  const farmerUser = await prisma.user.create({
    data: {
      email: "farmer@kishanvaani.in",
      password: hashedPassword,
      name: "Ramesh Patel",
      role: "USER",
      phone: "+91 98765 43210",
      state: "Punjab",
      district: "Ludhiana",
      language: "Hindi",
      avatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
    },
  });

  const expertUser = await prisma.user.create({
    data: {
      email: "expert@kishanvaani.in",
      password: hashedPassword,
      name: "Dr. S. K. Sharma (Senior Agronomist)",
      role: "EXPERT",
      phone: "+91 98123 45678",
      state: "Delhi",
      district: "IARI Pusa",
      language: "Hindi",
      avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
    },
  });

  const adminUser = await prisma.user.create({
    data: {
      email: "admin@kishanvaani.in",
      password: hashedPassword,
      name: "KishanVaani Chief Editor",
      role: "ADMIN",
      phone: "+91 99999 88888",
      state: "All India",
      district: "National Desk",
      language: "English",
      avatarUrl: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80",
    },
  });

  console.log("👤 Created 3 core demo users (Farmer, Expert, Admin).");

  // 3. Create Content & Audio Items
  const contentItems = [
    // --- NEWS ---
    {
      title: "IMD Weather Alert: Northeast Monsoon 2026 Active Over South Peninsula; Heavy Rain Warning for Tamil Nadu & Coastal Andhra",
      slug: "imd-northeast-monsoon-2026-south-peninsula-alert",
      description: "IMD forecasts an active spell of rainfall under Northeast Monsoon across Tamil Nadu, Kerala, South Interior Karnataka, and Coastal Andhra Pradesh. Farmers advised on field drainage and safeguarding mature Kharif crops.",
      body: "The India Meteorological Department (IMD) has issued a comprehensive agromet advisory regarding the active phase of the Northeast Monsoon across Peninsular India. A well-marked low-pressure area over the Southwest Bay of Bengal is inducing widespread rainfall, with heavy to very heavy falls expected across coastal Tamil Nadu (Cauvery delta districts), Rayalaseema, and coastal Andhra Pradesh. Farmers are advised to provide proper surface drainage in direct-seeded and transplanted paddy fields to prevent waterlogging, immediately shift harvested produce to covered granaries, and postpone foliar spraying until rain subsides.",
      type: "NEWS",
      category: "Agriculture",
      language: "English",
      authorName: "India Meteorological Department (IMD) / MoA&FW",
      thumbnailUrl: "https://images.unsplash.com/photo-1534274988757-a28bf1a57c17?w=600&auto=format&fit=crop&q=80",
      tags: "IMD, Northeast Monsoon, Weather Alert, Paddy, Drainage, Tamil Nadu, Andhra Pradesh",
      audioUrl: "",
      durationSec: 150,
      narrator: "Dr. K. Senthil Nathan (IMD Agromet)",
      transcript: "This is a special agromet bulletin from KishanVaani. The India Meteorological Department has issued heavy rainfall alerts under the Northeast Monsoon across Tamil Nadu, Kerala, and Coastal Andhra. Farmers with standing samba paddy are advised to maintain open drainage channels and clear low-lying furrows...",
    },
    {
      title: "Early Rabi Sowing 2026: ICAR Issues Advisory for Climate-Smart Wheat (PBW-826 & HD-3385) to Beat Terminal Heat",
      slug: "icar-climate-smart-wheat-rabi-2026-pbw826-hd3385",
      description: "ICAR and State Agricultural Universities urge wheat growers in Punjab, Haryana, Rajasthan, UP, and MP to adopt early sowing (Oct 25 - Nov 10) of heat-resilient wheat varieties to prevent grain yield loss from spring heat waves.",
      body: "To mitigate climate-induced yield fluctuations caused by sudden terminal heat spikes in February and March, the Indian Council of Agricultural Research (ICAR) and Punjab Agricultural University (PAU) have released specialized agronomical protocols for the 2026-27 Rabi season. Recommended varieties include PBW-826, HD-3385, and DBW-327 (Karan Shivani), which exhibit physiological tolerance to early season warmer temperatures and high tillering capacity. Sowing between October 25 and November 10 provides optimal thermo-photoperiod and utilizes residual soil moisture.",
      type: "NEWS",
      category: "Agriculture",
      language: "Hindi",
      authorName: "Indian Council of Agricultural Research (ICAR-IARI, Pusa)",
      thumbnailUrl: "https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=600&auto=format&fit=crop&q=80",
      tags: "Wheat, Rabi 2026, ICAR, Climate Smart, Heat Tolerant, PAU, Agronomy",
      audioUrl: "",
      durationSec: 180,
      narrator: "Dr. Gyanendra Singh (ICAR Wheat Director)",
      transcript: "नमस्कार किसान भाइयों! भारतीय कृषि अनुसंधान परिषद (ICAR) ने रबी 2026 के लिए जलवायु-अनुकूल गेहूं की उन्नत किस्मों जैसे PBW-826 और HD-3385 की समय पर बुवाई की सलाह दी है...",
    },
    {
      title: "Western Disturbance Triggers Scattered Showers in North-West India; Beneficial for Mustard & Gram Seedbeds",
      slug: "western-disturbance-northwest-india-mustard-gram-advisory",
      description: "A fresh Western Disturbance over northern plains has brought scattered light rain and a drop in night temperatures across Punjab, Haryana, and Rajasthan, creating favorable soil moisture for mustard and chickpea sowing.",
      body: "A moderate Western Disturbance passing over the Western Himalayan region and adjoining plains has induced widespread moisture incursion across North-West India, resulting in overcast skies and light to moderate rainfall. The rainfall provides crucial natural moisture for germination in rainfed tracts of Rajasthan and South Haryana. Farmers should sow mustard seed at 3-5 cm depth once topsoil reaches field capacity, and incorporate sulfur for higher oil yield.",
      type: "NEWS",
      category: "Agriculture",
      language: "Hindi",
      authorName: "Regional Meteorological Centre (RMC New Delhi) / IMD",
      thumbnailUrl: "https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=600&auto=format&fit=crop&q=80",
      tags: "Weather, Western Disturbance, Mustard, Gram, IMD, Rainfall, Rajasthan",
      audioUrl: "",
      durationSec: 130,
      narrator: "Om Prakash Sharma (Agri Weather Desk)",
      transcript: "मौसम अपडेट: उत्तर-पश्चिम भारत में सक्रिय पश्चिमी विक्षोभ के चलते राजस्थान, हरियाणा और पंजाब के कई हिस्सों में हल्की से मध्यम बारिश दर्ज की गई है...",
    },
    {
      title: "All-India Kharif Procurement 2026 Crosses 120 Lakh MT; Over ₹24,000 Crore Disbursed to Farmers via DBT",
      slug: "kharif-procurement-2026-120-lakh-mt-dbt-disbursement",
      description: "Food Corporation of India (FCI) and state agencies record smooth procurement operations across 4,200 mandis. Direct Benefit Transfer reaches 14.5 lakh farmers directly in bank accounts within 48 hours of sale.",
      body: "The ongoing Kharif Marketing Season (KMS 2026-27) has crossed the 120 Lakh Metric Tonnes (LMT) mark in paddy procurement, with Punjab, Haryana, and Uttar Pradesh leading procurement volumes. Over ₹24,250 crore has been transferred directly into farmers' Aadhaar-seeded bank accounts within 48 hours of mandi weighment. Automated weighbridges and moisture testing meters integrated with e-Samridhi portal have ensured zero rejection disputes.",
      type: "NEWS",
      category: "Agriculture",
      language: "English",
      authorName: "Ministry of Agriculture & Farmers Welfare (MoA&FW)",
      thumbnailUrl: "https://images.unsplash.com/photo-1595855759920-86582396756a?w=600&auto=format&fit=crop&q=80",
      tags: "Procurement, Paddy, MSP, DBT, Food Corporation, Kharif, e-Samridhi",
      audioUrl: "",
      durationSec: 140,
      narrator: "Pooja Verma (MoA&FW Bulletin)",
      transcript: "Welcome to KishanVaani National Agricultural Update. Kharif paddy procurement has crossed the 120 Lakh Metric Tonnes milestone with over 24,000 crore rupees disbursed directly into farmers accounts...",
    },
    {
      title: "Bio-Decomposer & CRM Machinery Drive Cuts Paddy Stubble Burning by 48% Across Indo-Gangetic Plains",
      slug: "bio-decomposer-crm-machinery-cuts-stubble-burning-2026",
      description: "Enhanced subsidies on Crop Residue Management (CRM) machinery including Super Seeder, Smart Seeder, and free Pusa Bio-Decomposer spraying have dramatically reduced farm fires while building soil organic carbon.",
      body: "Joint satellite monitoring by ISRO, IMD, and the Commission for Air Quality Management (CAQM) indicates a 48% reduction in active stubble burning incidents in Punjab, Haryana, and NCR regions compared to previous years. Over 2.4 lakh CRM machines have been deployed with 50% individual and 80% custom hiring centre subsidies, while free microbial bio-decomposer spraying was completed over 1.8 million hectares, accelerating straw decomposition into natural soil organic carbon within 15-20 days.",
      type: "NEWS",
      category: "Agriculture",
      language: "Hindi",
      authorName: "Commission for Air Quality Management (CAQM) / ICAR-IARI",
      thumbnailUrl: "https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=600&auto=format&fit=crop&q=80",
      tags: "Stubble Burning, Pusa Bio-Decomposer, CRM, Soil Carbon, Super Seeder, Air Quality",
      audioUrl: "",
      durationSec: 155,
      narrator: "Dr. Ashok Yadav (Soil Health Mission)",
      transcript: "पराली प्रबंधन पर बड़ी राहत: इस वर्ष पूसा बायो-डीकंपोज़र और सुपर सीडर मशीनों के व्यापक प्रयोग से पराली जलाने की घटनाओं में 48 प्रतिशत की भारी कमी आई है...",
    },
    {
      title: "KVK Weather & Pest Warning: Post-Rain Humidity Triggers Whitefly and Brown Planthopper (BPH) Alert in Rice & Cotton",
      slug: "kvk-pest-alert-bph-whitefly-humid-weather",
      description: "Prolonged relative humidity (>85%) following late rains prompts urgent advisory for monitoring Brown Planthopper in maturing paddy and whitefly in cotton belts. Specific biological control steps advised.",
      body: "Krishi Vigyan Kendra (KVK) agronomists have issued an urgent warning for paddy and cotton growing districts of Punjab, Haryana, and Rajasthan following sustained post-rain high relative humidity and warm daytime temperatures. For Brown Planthopper (BPH) in paddy, inspect the base of plants; if 5-10 hoppers per hill are observed, drain standing water for 2-3 days and apply Triflumezopyrim 10% SC. For cotton whitefly, install yellow sticky traps and spray neem-based Azadirachtin 1500 ppm.",
      type: "NEWS",
      category: "Agriculture",
      language: "Hindi",
      authorName: "KVK Bathinda (PAU) & KVK Sirsa (CCSHAU)",
      thumbnailUrl: "https://images.unsplash.com/photo-1606041008023-472dfb5e530f?w=600&auto=format&fit=crop&q=80",
      tags: "KVK, Pest Alert, BPH, Whitefly, Rice, Cotton, Humidity, Weather Alert",
      audioUrl: "",
      durationSec: 165,
      narrator: "Dr. Baljit Singh (KVK Senior Scientist)",
      transcript: "कृषि विज्ञान केंद्र की विशेष चेतावनी: बारिश के बाद बढ़ी हुई उमस और आर्द्रता के कारण धान में भूरा फुदका (BPH) और कपास में सफेद मक्खी का प्रकोप बढ़ सकता है...",
    },
    {
      title: "Monsoon 2026: IMD Predicts Favorable Rainfall for Kharif Crops Across North & Central India",
      slug: "monsoon-2026-imd-kharif-forecast",
      description: "Indian Meteorological Department issues normal to above-normal monsoon forecast, providing major relief for paddy, cotton and soybean sowing.",
      body: "The Indian Meteorological Department (IMD) released its comprehensive monsoon outlook for 2026. The southwest monsoon is expected to arrive on schedule in Kerala by late May and progress rapidly across Maharashtra, Madhya Pradesh, Gujarat, and the northern plains. Agricultural experts advise farmers to prepare nursery beds for paddy and plan seed treatment for soybean and cotton to take early advantage of initial rains.",
      type: "NEWS",
      category: "Agriculture",
      language: "Hindi",
      authorName: "KishanVaani Agri Desk",
      thumbnailUrl: "https://images.unsplash.com/photo-1534274988757-a28bf1a57c17?w=600&auto=format&fit=crop&q=80",
      tags: "Monsoon, Weather, Kharif, IMD, Sowing",
      audioUrl: "/audio/kishanvaani-demo.mp3",
      durationSec: 195,
      narrator: "Vikas Sharma (Hindi)",
      transcript: "नमस्कार किसान भाइयों! मौसम विभाग ने इस वर्ष खरीफ फसलों के लिए सामान्य से अधिक बारिश का अनुमान लगाया है। पंजाब, हरियाणा, उत्तर प्रदेश, मध्य प्रदेश और महाराष्ट्र के किसानों के लिए यह बहुत ही शुभ संकेत है। आइए जानें धान और कपास की बुवाई के लिए क्या सावधानियां बरतनी चाहिए...",
    },
    {
      title: "Cabinet Approves 12% MSP Hike on Pulses, Oilseeds and Cotton for 2026 Season",
      slug: "msp-hike-pulses-oilseeds-cotton-2026",
      description: "Central government raises Minimum Support Price to boost domestic production and ensure 50% profit margin over production cost for growers.",
      body: "The Cabinet Committee on Economic Affairs (CCEA) chaired by the Prime Minister has approved an upward revision of Minimum Support Prices (MSP) for 14 Kharif crops. Arhar (Tur) MSP has been increased by ₹550 per quintal, while Moong and Urad see increases of ₹480 and ₹420 respectively. Cotton (Medium Staple) sees a substantial increase of ₹520 per quintal.",
      type: "NEWS",
      category: "Agriculture",
      language: "Hindi",
      authorName: "Ministry of Agriculture",
      thumbnailUrl: "https://images.unsplash.com/photo-1595855759920-86582396756a?w=600&auto=format&fit=crop&q=80",
      tags: "MSP, Government, Pulses, Cotton, Economy",
      audioUrl: "/audio/kishanvaani-demo.mp3",
      durationSec: 160,
      narrator: "Pooja Verma",
      transcript: "किसान भाइयों और बहनों, केंद्र सरकार ने खरीफ सीजन 2026 के लिए न्यूनतम समर्थन मूल्य यानी एमएसपी में ऐतिहासिक वृद्धि की घोषणा की है। दलहन, तिलहन और कपास की खेती करने वाले किसानों को अब सीधे बैंक खातों में अधिक मूल्य मिलेगा...",
    },
    {
      title: "PM-KUSUM Phase 3: 80% Subsidy on Solar Water Pumps for Small & Marginal Farmers",
      slug: "pm-kusum-phase-3-solar-pump-subsidy",
      description: "Step-by-step application guide for installing 3HP, 5HP and 7.5HP solar pumps with subsidized state and central grants.",
      body: "Under PM-KUSUM Scheme Phase 3, individual farmers can replace diesel pumps with grid-independent solar irrigation systems. Central financial assistance covers 30%, state government provides 30-50%, and bank loans cover the rest, meaning farmers only need to pay 10-20% upfront cost.",
      type: "NEWS",
      category: "Agriculture",
      language: "English",
      authorName: "Rural Energy Desk",
      thumbnailUrl: "https://images.unsplash.com/photo-1509391365360-2e959784a276?w=600&auto=format&fit=crop&q=80",
      tags: "Solar, PM-KUSUM, Subsidy, Irrigation, Energy",
      audioUrl: "/audio/kishanvaani-demo.mp3",
      durationSec: 210,
      narrator: "Arun Nair",
      transcript: "Welcome to KishanVaani. In this audio bulletin, we break down how small farmers can secure up to 80% subsidy for solar water pumps under PM-KUSUM Phase 3. Cut your electricity bills and eliminate diesel costs permanently...",
    },

    // --- CROP ADVISORY ---
    {
      title: "Yellow Rust Management in Wheat: Immediate Symptoms and Fungicide Protocols",
      slug: "wheat-yellow-rust-management-guide",
      description: "How to identify stripe rust pustules early on leaves and apply Propiconazole 25% EC before damage spreads across fields.",
      body: "Yellow rust (Puccinia striiformis) thrives in cool, humid temperatures between 10°C and 20°C. If you notice bright yellow stripe-like powder on wheat leaves, spray Propiconazole 25% EC (Tilt) @ 1 ml per litre of water or Tebuconazole 25.9% EC. Spray during calm morning hours with adequate water volume (200 litres per acre).",
      type: "CROP_ADVISORY",
      category: "Agriculture",
      language: "Hindi",
      authorName: "Dr. S. K. Sharma",
      thumbnailUrl: "https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=600&auto=format&fit=crop&q=80",
      tags: "Wheat, Disease, Rust, Fungicide, Advisory",
      audioUrl: "/audio/kishanvaani-demo.mp3",
      durationSec: 240,
      narrator: "Dr. S. K. Sharma (Hindi)",
      transcript: "गेहूं के काश्तकार ध्यान दें! अगर आपकी गेहूं की फसल में पत्तियों पर पीले रंग की धारियां या पाउडर दिखाई दे रहा है, तो यह पीला रतुआ यानी येलो रस्ट हो सकता है। तुरंत प्रोपिकोनाज़ोल 25 ईसी का 200 मिलीलीटर प्रति एकड़ के हिसाब से छिड़काव करें...",
    },
    {
      title: "Pink Bollworm Control in Bt Cotton: Pheromone Traps and Biological Solutions",
      slug: "cotton-pink-bollworm-control",
      description: "Integrated pest management strategy to safeguard cotton bolls using neem oil, Trichogramma cards and mating disruption lures.",
      body: "Pink bollworm (Pectinophora gossypiella) has developed resistance in certain regions. Install 5-8 pheromone traps per acre at 45 days after sowing. If 8 moths are caught per trap for 3 consecutive days, release Trichogramma egg parasitoids @ 60,000 per acre and spray neem-based azadirachtin 1500 ppm.",
      type: "CROP_ADVISORY",
      category: "Agriculture",
      language: "Telugu",
      authorName: "Acharya NG Ranga Agri University",
      thumbnailUrl: "https://images.unsplash.com/photo-1606041008023-472dfb5e530f?w=600&auto=format&fit=crop&q=80",
      tags: "Cotton, Pest, IPM, Bio-fertilizer",
      audioUrl: "/audio/kishanvaani-demo.mp3",
      durationSec: 220,
      narrator: "R. Venkatesh (Telugu)",
      transcript: "ప్రత్తి రైతులకు ముఖ్య గమనిక: గులాబీ రంగు పురుగు నివారణకు సమగ్ర సస్యరక్షణ చర్యలు పాటించండి. ఎకరానికి 5 నుండి 8 లింగాకర్షక బుట్టలను అమర్చి సకాలంలో నివారణ చర్యలు చేపట్టండి...",
    },
    {
      title: "தமிழ்நாடு சம்பா நெல் சாகுபடி: காவேரி டெல்டா பாசன மேலாண்மை மற்றும் இலை சுருட்டு புழு கட்டுப்பாடு",
      slug: "tamil-nadu-samba-paddy-cauvery-delta-advisory",
      description: "காவேரி டெல்டா மாவட்டங்களில் சம்பா நெல் பயிரில் நீர் மேலாண்மை, இலை சுருட்டு புழு மற்றும் இலைக்கருகல் நோய் தடுப்பு முறைகள் குறித்த TNAU வேளாண் ஆலோசனை.",
      body: "தமிழ்நாடு வேளாண் பல்கலைக்கழகம் (TNAU) மற்றும் ஆடுதுறை நெல் ஆராய்ச்சி நிலையம் வெளியிட்டுள்ள சம்பா பருவ நெல் சாகுபடி ஆலோசனை: காவேரி டெல்டா மாவட்டங்களில் (தஞ்சாவூர், திருவாரூர், நாகப்பட்டினம்) சம்பா நெல் பயிரில் தண்டு துளைப்பான் மற்றும் இலை சுருட்டு புழு தாக்குதலைக் கட்டுப்படுத்த வேப்பங்கொட்டை சாறு 5% அல்லது அசாடிராக்டின் 1500 பிபிஎம் தெளிக்கவும். வயலில் தேங்கியுள்ள உபரி நீரை வடித்து விட்டு தேவையான அளவு மட்டும் காய்ச்சலும் பாய்ச்சலுமாக நீர் பாய்ச்சவும்.",
      type: "CROP_ADVISORY",
      category: "Agriculture",
      language: "Tamil",
      authorName: "Tamil Nadu Agricultural University (TNAU, Coimbatore)",
      thumbnailUrl: "https://images.unsplash.com/photo-1534274988757-a28bf1a57c17?w=600&auto=format&fit=crop&q=80",
      tags: "Tamil, Samba Paddy, Cauvery Delta, TNAU, Rice, Pest Control",
      audioUrl: "/audio/kishanvaani-demo.mp3",
      durationSec: 210,
      narrator: "M. Selvam (Tamil Desk)",
      transcript: "வணக்கம் விவசாய பெருமக்களே! இது கிஷன்வாணி சிறப்பு வேளாண் செய்தி மடல். காவேரி டெல்டா மாவட்டங்களில் சம்பா நெல் பயிர் செய்துள்ள விவசாயிகள் கவனத்திற்கு...",
    },
    {
      title: "தென்னை மரங்களில் வெள்ளை ஈ மற்றும் காண்டாமிருக வண்டு ஒருங்கிணைந்த மேலாண்மை",
      slug: "tamil-nadu-coconut-rugose-spiralling-whitefly-management",
      description: "பொள்ளாச்சி மற்றும் தஞ்சாவூர் தென்னை விவசாயிகளுக்கான உயிரியல் பூச்சி கட்டுப்பாடு மற்றும் ஒட்டுண்ணி குளவிகள் பயன்பாட்டு வழிகாட்டி.",
      body: "தென்னை மரங்களைத் தாக்கும் சுருள் வெள்ளை ஈக்களைக் கட்டுப்படுத்த மஞ்சள் நிற ஒட்டும் பொறிகளை ஏக்கருக்கு 10 இடங்களில் கட்ட வேண்டும். பூச்சிக்கொல்லிகளைத் தவிர்த்து என்கார்சியா ஒட்டுண்ணி குளவிகளை மரம் ஒன்றுக்கு 100 என்ற எண்ணிக்கையில் விட வேண்டும். வேப்ப எண்ணெய் கரைசல் தெளிப்பது இயற்கை முறையில் நல்ல பலனைத் தரும்.",
      type: "CROP_ADVISORY",
      category: "Agriculture",
      language: "Tamil",
      authorName: "Coconut Research Station (CRS Aliyarnagar / TNAU)",
      thumbnailUrl: "https://images.unsplash.com/photo-1544816155-12df9643f363?w=600&auto=format&fit=crop&q=80",
      tags: "Tamil, Coconut, Whitefly, TNAU, Pollachi, Organic IPM",
      audioUrl: "/audio/kishanvaani-demo.mp3",
      durationSec: 190,
      narrator: "Dr. R. Kannan (TNAU)",
      transcript: "தென்னை விவசாயிகளுக்கு ஒரு முக்கிய கள ஆலோசனை: சுருள் வெள்ளை ஈ தாக்குதலை கட்டுப்படுத்த ரசாயன மருந்துகளுக்கு பதிலாக உயிரியல் கட்டுப்பாட்டு முறைகளை கையாளவும்...",
    },
    {
      title: "Direct Seeded Rice (DSR) Guide: Save 35% Water and ₹4,000 per Acre in Labor",
      slug: "direct-seeded-rice-dsr-technique",
      description: "Complete methodology for sowing paddy directly with seed drills, weed management with Stomp/Nominee Gold, and yield optimization.",
      body: "Direct Seeded Rice eliminates the labor-intensive nursery transplantation and continuous field puddling. Use Tar-Wattar technique with laser-leveled land. Apply Pre-emergence herbicide Pendimethalin within 24 hours of sowing, followed by Bispyribac-sodium at 20 days.",
      type: "CROP_ADVISORY",
      category: "Agriculture",
      language: "Punjabi",
      authorName: "Punjab Agricultural University (PAU)",
      thumbnailUrl: "https://images.unsplash.com/photo-1536657464919-892534f60d6e?w=600&auto=format&fit=crop&q=80",
      tags: "Rice, DSR, Water Saving, Punjab, Technology",
      audioUrl: "/audio/kishanvaani-demo.mp3",
      durationSec: 260,
      narrator: "Gurpreet Singh (Punjabi)",
      transcript: "ਸਤਿ ਸ੍ਰੀ ਅਕਾਲ ਕਿਸਾਨ ਵੀਰੋ! ਝੋਨੇ ਦੀ ਸਿੱਧੀ ਬਿਜਾਈ ਯਾਨੀ ਡੀਐਸਆਰ ਤਕਨੀਕ ਰਾਹੀਂ ਤੁਸੀਂ ਪਾਣੀ ਦੀ ਭਾਰੀ ਬੱਚਤ ਦੇ ਨਾਲ-ਨਾਲ ਖਰਚਾ ਵੀ ਘਟਾ ਸਕਦੇ ਹੋ। ਆਓ ਜਾਣਦੇ ਹਾਂ ਤਰ-ਵੱਤਰ ਵਿਧੀ ਬਾਰੇ...",
    },

    // --- LIVESTOCK ---
    {
      title: "Increasing Dairy Cow & Buffalo Milk Yield: Balanced Ration and Green Silage Making",
      slug: "dairy-cattle-milk-yield-silage",
      description: "Nutrition guidelines for high-yielding Murrah and HF breeds. Mineral mixtures, bypass fat, and corn silage preparation.",
      body: "Milk production directly depends on Dry Matter Intake (DMI). Feed 3 kg dry fodder (wheat straw), 20-25 kg green fodder (sorghum/maize/berseem), and 1 kg concentrate for every 2.5 litres of milk produced. Add 50g chelated mineral mixture and 30g common salt daily.",
      type: "LIVESTOCK",
      category: "Agriculture",
      language: "Hindi",
      authorName: "National Dairy Research Institute (NDRI)",
      thumbnailUrl: "https://images.unsplash.com/photo-1546445317-29f4545e9d53?w=600&auto=format&fit=crop&q=80",
      tags: "Dairy, Buffalo, Cattle, Silage, Milk",
      audioUrl: "/audio/kishanvaani-demo.mp3",
      durationSec: 280,
      narrator: "Dr. Anil Mehta (Hindi)",
      transcript: "पशुपालक भाइयों, दुधारू गाय और भैंसों से भरपूर दूध उत्पादन के लिए संतुलित पशुआहार बेहद जरूरी है। साइलेज यानी हरे चारे का अचार बनाकर आप साल भर पौष्टिक चारा उपलब्ध करा सकते हैं...",
    },
    {
      title: "Commercial Goat Farming for Small Landholders: Sirohi & Black Bengal Care",
      slug: "commercial-goat-farming-guide",
      description: "Low investment, high returns: Housing design, PPR/Enterotoxemia vaccination schedule, and breed selection.",
      body: "Goat farming requires minimal land and capital. Sirohi and Black Bengal breeds are resilient with high twinning rates. Ensure elevated slatted wooden flooring to keep sheds dry and disease-free. Vaccinate every 6 months for PPR and Enterotoxemia.",
      type: "LIVESTOCK",
      category: "Agriculture",
      language: "Marathi",
      authorName: "Maharashtra Sheep & Goat Board",
      thumbnailUrl: "https://images.unsplash.com/photo-1524024973431-2ad916746881?w=600&auto=format&fit=crop&q=80",
      tags: "Goat, Livestock, Dairy, Maharashtra",
      audioUrl: "/audio/kishanvaani-demo.mp3",
      durationSec: 210,
      narrator: "Sanjay Patil (Marathi)",
      transcript: "शेतकरी मित्रांनो, शेळीपालन हा अत्यंत फायदेशीर व्यवसाय आहे. कमी जागेत आणि कमी भांडवलात उस्मानाबादी आणि सिरोही शेळ्यांचे संगोपन कसे करावे, जाणून घ्या या सविस्तर ऑडिओमध्ये...",
    },

    // --- GOVERNMENT SCHEMES ---
    {
      title: "PM-KISAN Samman Nidhi: How to Complete e-KYC and Fix Pending Installment Issues",
      slug: "pm-kisan-ekyc-and-status-guide",
      description: "Everything you need to know about the ₹6,000 yearly benefit, Aadhaar-NPCI bank account linking, and land seeding corrections.",
      body: "Under PM-KISAN, eligible farmer families receive ₹6,000 per year in three equal instalments of ₹2,000. If your instalment is pending, check three things on the PM-KISAN portal: (1) Aadhaar-based e-KYC status, (2) Land Seeding confirmation from Patwari/Tehsildar, and (3) Aadhaar-NPCI active DBT link with bank account.",
      type: "GOVERNMENT_SCHEME",
      category: "Schemes",
      language: "Hindi",
      authorName: "Department of Agriculture & Farmers Welfare",
      thumbnailUrl: "https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=600&auto=format&fit=crop&q=80",
      tags: "PM-KISAN, Scheme, DBT, Subsidy, Finance",
      audioUrl: "/audio/kishanvaani-demo.mp3",
      durationSec: 180,
      narrator: "Sunita Yadav",
      transcript: "प्रधानमंत्री किसान सम्मान निधि योजना के तहत अगर आपकी किस्त रुकी हुई है, तो घबराएं नहीं। अपने मोबाइल से ओटीपी आधारित ई-केवाईसी कैसे करें और बैंक खाते में डीबीटी कैसे चालू करवाएं, सुनिए पूरा मार्गदर्शन...",
    },
    {
      title: "Pradhan Mantri Fasal Bima Yojana (PMFBY): Crop Damage Claim Process in 72 Hours",
      slug: "pmfby-crop-insurance-claim-process",
      description: "How to report localized crop damage caused by unseasonal hail, heavy rain, or landslides through the Crop Insurance Mobile App.",
      body: "Farmers must report localized natural calamity loss within 72 hours via the Crop Insurance App, toll-free helpline 14447, or nearest agriculture office. Take geo-tagged photographs of affected fields to accelerate surveyor assessment.",
      type: "GOVERNMENT_SCHEME",
      category: "Schemes",
      language: "Hindi",
      authorName: "PMFBY Cell",
      thumbnailUrl: "https://images.unsplash.com/photo-1523741543316-beb7fc7023d8?w=600&auto=format&fit=crop&q=80",
      tags: "Insurance, PMFBY, Damage, Claim, Weather",
      audioUrl: "/audio/kishanvaani-demo.mp3",
      durationSec: 200,
      narrator: "KishanVaani Helpdesk",
      transcript: "प्राकृतिक आपदा, ओलावृष्टि या भारी बारिश से फसल को नुकसान होने पर 72 घंटे के अंदर फसल बीमा क्लेम कैसे दर्ज करें? जानिए संपूर्ण प्रक्रिया...",
    },

    // --- COMMUNITY (SUCCESS & FAILURE STORIES) ---
    {
      title: "From Debt to ₹14 Lakhs Profit: Harishchandra's Exotic Dragon Fruit & Drip Farming",
      slug: "success-story-harishchandra-dragon-fruit",
      description: "A small farmer from Barabanki transformed sandy, degraded land into a thriving organic dragon fruit and guava orchard.",
      body: "Harishchandra struggled with traditional mono-cropping losses. In 2021, he invested in drip irrigation, trellis poles, and Red Dragon Fruit cuttings. Today, he harvests 15 tonnes per acre and supplies directly to organic retail chains in Lucknow and Delhi.",
      type: "SUCCESS_STORY",
      category: "Community",
      language: "Hindi",
      authorName: "Harishchandra (Farmer)",
      thumbnailUrl: "https://images.unsplash.com/photo-1550989460-0adf9ea622e2?w=600&auto=format&fit=crop&q=80",
      tags: "Success, Dragon Fruit, Organic, Innovation, Income",
      audioUrl: "/audio/kishanvaani-demo.mp3",
      durationSec: 310,
      narrator: "Harishchandra (Interview)",
      transcript: "मेरा नाम हरिश्चंद्र है, मैं बाराबंकी का रहने वाला हूँ। जब मैंने ड्रैगन फ्रूट की खेती शुरू की तो लोगों ने मना किया था। आज ड्रिप सिंचाई और जीवामृत के प्रयोग से मेरी सालाना कमाई 14 लाख रुपये तक पहुँच चुकी है...",
    },
    {
      title: "Learning from Failure: How Excessive Pesticide Damaged My Brinjal Crop and Soil",
      slug: "failure-story-excessive-pesticide-lesson",
      description: "Farmer Jagdish shares his honest experience of pest resurgence caused by non-stop chemical spraying, and his recovery back to bio-control.",
      body: "When shoot and fruit borer attacked my brinjal crop, I sprayed chemicals every 4th day. This killed all beneficial predatory spiders and ladybird beetles, causing pest resistance and costing ₹45,000 in lost produce. Here is what I learned about IPM and neem oil.",
      type: "FAILURE_STORY",
      category: "Community",
      language: "Hindi",
      authorName: "Jagdish Meena (Farmer)",
      thumbnailUrl: "https://images.unsplash.com/photo-1560493676-04071c5f467b?w=600&auto=format&fit=crop&q=80",
      tags: "Failure, Lessons, Pesticide, Soil, Experience",
      audioUrl: "/audio/kishanvaani-demo.mp3",
      durationSec: 230,
      narrator: "Jagdish Meena",
      transcript: "साथी किसान भाइयों, मैं अपनी गलती आपके साथ साझा कर रहा हूँ ताकि आप यह नुकसान न उठाएँ। कीटनाशकों के अंधाधुंध इस्तेमाल से न केवल जमीन खराब होती है बल्कि मित्र कीट भी मर जाते हैं...",
    },
    {
      title: "My Experience with Low-Cost Bamboo Greenhouses for Off-Season Vegetables",
      slug: "farmer-experience-bamboo-greenhouse",
      description: "Building an affordable polyhouse using local bamboo poles to grow off-season coriander and cucumber during winter.",
      body: "Commercial steel polyhouses cost over ₹10 lakhs per acre. Using treated local bamboo poles and UV-stabilized 200-micron plastic sheet, I built a 500 sq. meter greenhouse for just ₹45,000. Off-season coriander fetched me ₹120/kg in early winter.",
      type: "FARMER_EXPERIENCE",
      category: "Community",
      language: "Hindi",
      authorName: "Balwinder Singh",
      thumbnailUrl: "https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?w=600&auto=format&fit=crop&q=80",
      tags: "Polyhouse, Greenhouse, Low Cost, Innovation",
      audioUrl: "/audio/kishanvaani-demo.mp3",
      durationSec: 250,
      narrator: "Balwinder Singh",
      transcript: "मैंने अपने गांव में बांस और 200 माइक्रोन की प्लास्टिक शीट से कम खर्च वाला पॉलीहाउस तैयार किया। इसमें बेमौसम धनिया और खीरा उगाकर अच्छा मुनाफा कमाया...",
    },

    // --- LITERATURE (STORIES, POEMS, FOLK TALES, AUDIO BOOKS) ---
    {
      title: "Dharti Ka Lal (Son of the Soil): An Inspiring Village Tale of Resilience",
      slug: "literature-story-dharti-ka-lal",
      description: "A touching rural story of an old farmer, Ramu Kaka, who restored a dry village pond through community unity and traditional water harvesting.",
      body: "When consecutive droughts dried the village wells, Ramu Kaka gathered youth from neighboring hamlets to rebuild the earthen embankment of the old stepwell. With monsoon rains, the groundwater rose across 400 acres, bringing lush green fields back to life.",
      type: "STORY",
      category: "Literature",
      language: "Hindi",
      authorName: "Premchand Heritage Series",
      thumbnailUrl: "https://images.unsplash.com/photo-1516214104703-d870798883c5?w=600&auto=format&fit=crop&q=80",
      tags: "Story, Rural Life, Water, Village, Premchand",
      audioUrl: "/audio/kishanvaani-demo.mp3",
      durationSec: 340,
      narrator: "Rameshwar Dayal (Storyteller)",
      transcript: "गांव की चौपाल पर जब शाम ढलती, तो रामू काका अपनी लाठी टेकते हुए पुराने सूखे तालाब की ओर देखते। उन्होंने मन ही मन ठाना कि इस बार गांव का पानी गांव में ही रोकेंगे...",
    },
    {
      title: "Fasal Ki Sugandh (The Fragrance of Harvest): A Poem for the Peasant",
      slug: "literature-poem-fasal-ki-sugandh",
      description: "A classic Hindi lyrical poem celebrating the golden wheat ears, flowing canebrakes, and the sweat of the Indian farmer.",
      body: "जब हवा में लहराती है सोने जैसी बालियां, मुस्कुराती हैं खेतों में हरियाली की क्यारियां। पसीने की हर बूंद से सींचा जिसने इस धरा को, नमन है उस किसान को जिसने जीवन दिया जहां को...",
      type: "POEM",
      category: "Literature",
      language: "Hindi",
      authorName: "Kavi Maithili Sharan Gupt",
      thumbnailUrl: "https://images.unsplash.com/photo-1500937386664-56d1dfef3854?w=600&auto=format&fit=crop&q=80",
      tags: "Poem, Poetry, Literature, Harvest, Hindi",
      audioUrl: "/audio/kishanvaani-demo.mp3",
      durationSec: 150,
      narrator: "Meera Joshi (Voice Artist)",
      transcript: "जब हवा में लहराती है सोने जैसी बालियां... सुनिए किसान और मिट्टी के अटूट संबंध को दर्शाती यह मनभावन कविता...",
    },
    {
      title: "The Clever Farmer and the Golden Seed: An Ancient Panchatantra Folk Tale",
      slug: "folk-tale-clever-farmer-golden-seed",
      description: "A timeless Indian fable about patience, honest labor, and the true treasure hidden beneath fertile soil.",
      body: "An old farmer on his deathbed told his lazy sons that a pot of gold was buried in the 5-acre field. The sons dug every inch of the land looking for gold. Finding nothing, they sowed wheat seeds. The soil produced the largest harvest ever seen, teaching them that hard work in fertile soil is the real gold.",
      type: "FOLK_TALE",
      category: "Literature",
      language: "Hindi",
      authorName: "Traditional Folk Wisdom",
      thumbnailUrl: "https://images.unsplash.com/photo-1464226184884-fa280b87c399?w=600&auto=format&fit=crop&q=80",
      tags: "Folk Tale, Panchatantra, Wisdom, Children, Morals",
      audioUrl: "/audio/kishanvaani-demo.mp3",
      durationSec: 270,
      narrator: "Dadaji Stories",
      transcript: "बहुत पुरानी बात है, एक गांव में एक बूढ़ा किसान रहता था। उसके चार आलसी बेटे थे जो खेत में काम नहीं करते थे। एक दिन किसान ने उन्हें बुलाया और कहा...",
    },
    {
      title: "Organic Farming Mastery - Chapter 1: The Secret Life of Soil Microbes",
      slug: "audiobook-organic-farming-chapter-1",
      description: "Full audiobook chapter on building living soil, mycorrhizal fungi, vermiwash, and natural fertility without synthetic NPK.",
      body: "Healthy soil contains more microorganisms in a single teaspoon than there are humans on Earth. This chapter explores how organic matter feeds beneficial bacteria and earthworms, creating spongy soil structure that holds moisture during droughts.",
      type: "AUDIO_BOOK",
      category: "Literature",
      language: "English",
      authorName: "Dr. Subhash Palekar",
      thumbnailUrl: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=600&auto=format&fit=crop&q=80",
      tags: "Audiobook, Natural Farming, Soil, Microbes, Book",
      audioUrl: "/audio/kishanvaani-demo.mp3",
      durationSec: 420,
      narrator: "Prof. Arvind Roy",
      transcript: "Chapter 1: The Living Earth. Welcome to KishanVaani Audiobooks. In this chapter, we explore how soil is not just dirt, but a living, breathing biological ecosystem that sustains all plant life on Earth...",
    },
  ];

  for (const item of contentItems) {
    const { audioUrl, durationSec, narrator, transcript, ...contentData } = item;

    const createdContent = await prisma.content.create({
      data: {
        ...contentData,
        viewsCount: Math.floor(Math.random() * 800) + 120,
        likesCount: Math.floor(Math.random() * 150) + 30,
      },
    });

    await prisma.audio.create({
      data: {
        contentId: createdContent.id,
        fileUrl: audioUrl,
        durationSec,
        narrator,
        transcript,
      },
    });
  }

  console.log(`📚 Created ${contentItems.length} Content and Audio tracks.`);

  // 4. Create Mandi Prices (AGMARKNET Physical APMC & e-NAM Electronic Market)
  const mandiPrices = [
    // AGMARKNET Records
    { state: "Punjab", district: "Ludhiana", market: "Khanna Mandi", commodity: "Wheat", variety: "PBW-725", minPrice: 2275, maxPrice: 2450, modalPrice: 2380, arrivals: 4200, source: "AGMARKNET", tradeStatus: "AUCTION_SETTLED", trend: "UP" },
    { state: "Punjab", district: "Amritsar", market: "Amritsar Grain Market", commodity: "Basmati Rice", variety: "1121 Pusa", minPrice: 3800, maxPrice: 4250, modalPrice: 4100, arrivals: 3100, source: "AGMARKNET", tradeStatus: "AUCTION_SETTLED", trend: "UP" },
    { state: "Punjab", district: "Jalandhar", market: "Jalandhar APMC Yard", commodity: "Potato", variety: "Kufri Jyoti", minPrice: 1100, maxPrice: 1550, modalPrice: 1380, arrivals: 2800, source: "AGMARKNET", tradeStatus: "AUCTION_SETTLED", trend: "DOWN" },
    { state: "Haryana", district: "Karnal", market: "Karnal New Grain Market", commodity: "Basmati Rice", variety: "Sugandh-5", minPrice: 3400, maxPrice: 3750, modalPrice: 3620, arrivals: 1950, source: "AGMARKNET", tradeStatus: "AUCTION_SETTLED", trend: "STABLE" },
    { state: "Maharashtra", district: "Nashik", market: "Lasalgaon Mandi", commodity: "Onion", variety: "Red Onion", minPrice: 1600, maxPrice: 2200, modalPrice: 1950, arrivals: 6800, source: "AGMARKNET", tradeStatus: "AUCTION_SETTLED", trend: "STABLE" },
    { state: "Maharashtra", district: "Akola", market: "Akola Cotton Market", commodity: "Cotton", variety: "Medium Staple", minPrice: 6800, maxPrice: 7500, modalPrice: 7250, arrivals: 2100, source: "AGMARKNET", tradeStatus: "AUCTION_SETTLED", trend: "UP" },
    { state: "Madhya Pradesh", district: "Indore", market: "Indore Chhoithram Mandi", commodity: "Soybean", variety: "Yellow Soybean", minPrice: 4400, maxPrice: 4850, modalPrice: 4680, arrivals: 5200, source: "AGMARKNET", tradeStatus: "AUCTION_SETTLED", trend: "DOWN" },
    { state: "Madhya Pradesh", district: "Ujjain", market: "Ujjain Krishi Mandi", commodity: "Gram (Chana)", variety: "Desi Chana", minPrice: 5300, maxPrice: 5800, modalPrice: 5650, arrivals: 2600, source: "AGMARKNET", tradeStatus: "AUCTION_SETTLED", trend: "UP" },
    { state: "Rajasthan", district: "Kota", market: "Kota Bhamashah Mandi", commodity: "Mustard", variety: "Black Mustard", minPrice: 5200, maxPrice: 5650, modalPrice: 5480, arrivals: 3200, source: "AGMARKNET", tradeStatus: "AUCTION_SETTLED", trend: "UP" },
    { state: "Rajasthan", district: "Sri Ganganagar", market: "Ganganagar Mandi", commodity: "Guar Seed", variety: "Local", minPrice: 4900, maxPrice: 5300, modalPrice: 5120, arrivals: 1400, source: "AGMARKNET", tradeStatus: "AUCTION_SETTLED", trend: "STABLE" },
    { state: "Uttar Pradesh", district: "Agra", market: "Agra Khandari Mandi", commodity: "Potato", variety: "Kufri Bahar", minPrice: 1100, maxPrice: 1450, modalPrice: 1300, arrivals: 7400, source: "AGMARKNET", tradeStatus: "AUCTION_SETTLED", trend: "DOWN" },
    { state: "Uttar Pradesh", district: "Kanpur", market: "Chaubepur Mandi", commodity: "Mustard", variety: "Yellow Mustard", minPrice: 5400, maxPrice: 5850, modalPrice: 5700, arrivals: 1650, source: "AGMARKNET", tradeStatus: "AUCTION_SETTLED", trend: "UP" },
    { state: "Telangana", district: "Warangal", market: "Warangal Enamamula Mandi", commodity: "Red Chilli", variety: "Teja Super", minPrice: 14000, maxPrice: 18500, modalPrice: 16800, arrivals: 3800, source: "AGMARKNET", tradeStatus: "AUCTION_SETTLED", trend: "UP" },
    { state: "Telangana", district: "Nizamabad", market: "Nizamabad APMC Yard", commodity: "Turmeric", variety: "Finger", minPrice: 12500, maxPrice: 15200, modalPrice: 14100, arrivals: 2900, source: "AGMARKNET", tradeStatus: "AUCTION_SETTLED", trend: "UP" },
    { state: "Andhra Pradesh", district: "Guntur", market: "Guntur Mirchi Yard", commodity: "Cotton", variety: "Shankar-6", minPrice: 7100, maxPrice: 7650, modalPrice: 7420, arrivals: 3300, source: "AGMARKNET", tradeStatus: "AUCTION_SETTLED", trend: "STABLE" },
    { state: "Karnataka", district: "Kolar", market: "Kolar APMC Yard", commodity: "Tomato", variety: "Hybrid Tomato", minPrice: 1800, maxPrice: 2600, modalPrice: 2250, arrivals: 5400, source: "AGMARKNET", tradeStatus: "AUCTION_SETTLED", trend: "UP" },
    { state: "Gujarat", district: "Rajkot", market: "Rajkot Bedi Yard APMC", commodity: "Groundnut", variety: "Bold Seed", minPrice: 5800, maxPrice: 6500, modalPrice: 6250, arrivals: 4100, source: "AGMARKNET", tradeStatus: "AUCTION_SETTLED", trend: "STABLE" },
    { state: "Gujarat", district: "Patan", market: "Unjha Spice Mandi", commodity: "Jeera (Cumin)", variety: "Gujarat Cumin-4", minPrice: 26000, maxPrice: 31000, modalPrice: 28500, arrivals: 2200, source: "AGMARKNET", tradeStatus: "AUCTION_SETTLED", trend: "UP" },

    // e-NAM Electronic Auction Trading Records
    { state: "Telangana", district: "Nizamabad", market: "Nizamabad APMC (e-NAM)", commodity: "Turmeric", variety: "Finger Double Polished", minPrice: 12800, maxPrice: 15600, modalPrice: 14450, arrivals: 1850, source: "ENAM", tradeStatus: "AUCTION_SETTLED", trend: "UP" },
    { state: "Telangana", district: "Warangal", market: "Warangal Enamamula (e-NAM)", commodity: "Red Chilli", variety: "Teja Best Quality", minPrice: 14300, maxPrice: 18900, modalPrice: 17150, arrivals: 2400, source: "ENAM", tradeStatus: "ACTIVE_BIDDING", trend: "UP" },
    { state: "Punjab", district: "Ludhiana", market: "Khanna Mandi (e-NAM)", commodity: "Wheat", variety: "PBW-725 Super", minPrice: 2310, maxPrice: 2480, modalPrice: 2420, arrivals: 5800, source: "ENAM", tradeStatus: "AUCTION_SETTLED", trend: "UP" },
    { state: "Punjab", district: "Amritsar", market: "Amritsar Bhagtanwala (e-NAM)", commodity: "Basmati Rice", variety: "1121 Pusa Steamed", minPrice: 3880, maxPrice: 4320, modalPrice: 4180, arrivals: 3650, source: "ENAM", tradeStatus: "AUCTION_SETTLED", trend: "UP" },
    { state: "Madhya Pradesh", district: "Indore", market: "Indore APMC (e-NAM)", commodity: "Soybean", variety: "Yellow Grade-A", minPrice: 4450, maxPrice: 4920, modalPrice: 4740, arrivals: 4900, source: "ENAM", tradeStatus: "ACTIVE_BIDDING", trend: "UP" },
    { state: "Madhya Pradesh", district: "Ujjain", market: "Ujjain Krishi Mandi (e-NAM)", commodity: "Gram (Chana)", variety: "Desi Bold Chana", minPrice: 5380, maxPrice: 5870, modalPrice: 5720, arrivals: 2100, source: "ENAM", tradeStatus: "AUCTION_SETTLED", trend: "UP" },
    { state: "Maharashtra", district: "Nashik", market: "Lasalgaon (e-NAM Electronic Yard)", commodity: "Onion", variety: "Red Onion Polished", minPrice: 1650, maxPrice: 2280, modalPrice: 2020, arrivals: 8200, source: "ENAM", tradeStatus: "ACTIVE_BIDDING", trend: "UP" },
    { state: "Maharashtra", district: "Akola", market: "Akola Cotton Yard (e-NAM)", commodity: "Cotton", variety: "Medium Staple Certified", minPrice: 6920, maxPrice: 7620, modalPrice: 7380, arrivals: 2750, source: "ENAM", tradeStatus: "AUCTION_SETTLED", trend: "UP" },
    { state: "Gujarat", district: "Rajkot", market: "Rajkot APMC (e-NAM)", commodity: "Groundnut", variety: "Bold 44/48", minPrice: 5900, maxPrice: 6650, modalPrice: 6380, arrivals: 3900, source: "ENAM", tradeStatus: "AUCTION_SETTLED", trend: "UP" },
    { state: "Gujarat", district: "Gondal", market: "Gondal Mandi (e-NAM)", commodity: "Jeera (Cumin)", variety: "Unjha Grade 1", minPrice: 26500, maxPrice: 31800, modalPrice: 29200, arrivals: 1450, source: "ENAM", tradeStatus: "AUCTION_SETTLED", trend: "UP" },
    { state: "Rajasthan", district: "Kota", market: "Kota Bhamashah (e-NAM)", commodity: "Mustard", variety: "Black High Oil Content", minPrice: 5280, maxPrice: 5740, modalPrice: 5560, arrivals: 3300, source: "ENAM", tradeStatus: "ACTIVE_BIDDING", trend: "UP" },
    { state: "Rajasthan", district: "Sri Ganganagar", market: "Sri Ganganagar (e-NAM)", commodity: "Guar Seed", variety: "Local Screened", minPrice: 4950, maxPrice: 5380, modalPrice: 5180, arrivals: 1820, source: "ENAM", tradeStatus: "AUCTION_SETTLED", trend: "STABLE" },
    { state: "Uttar Pradesh", district: "Agra", market: "Agra Khandari (e-NAM)", commodity: "Potato", variety: "Kufri Bahar Fresh", minPrice: 1150, maxPrice: 1520, modalPrice: 1350, arrivals: 6200, source: "ENAM", tradeStatus: "WEIGHMENT_IN_PROGRESS", trend: "DOWN" },
    { state: "Uttar Pradesh", district: "Kanpur", market: "Kanpur Chaubepur (e-NAM)", commodity: "Mustard", variety: "Yellow Pure", minPrice: 5460, maxPrice: 5920, modalPrice: 5780, arrivals: 1980, source: "ENAM", tradeStatus: "AUCTION_SETTLED", trend: "UP" },
    { state: "Andhra Pradesh", district: "Guntur", market: "Guntur Market Yard (e-NAM)", commodity: "Cotton", variety: "Shankar-6 High Tenacity", minPrice: 7200, maxPrice: 7780, modalPrice: 7520, arrivals: 2800, source: "ENAM", tradeStatus: "AUCTION_SETTLED", trend: "STABLE" },
    { state: "Karnataka", district: "Kolar", market: "Kolar Yard (e-NAM)", commodity: "Tomato", variety: "Hybrid Table Red", minPrice: 1880, maxPrice: 2720, modalPrice: 2340, arrivals: 4600, source: "ENAM", tradeStatus: "ACTIVE_BIDDING", trend: "UP" },
    { state: "Karnataka", district: "Shimoga", market: "Shimoga Mandi (e-NAM)", commodity: "Maize", variety: "Yellow Feed Grade", minPrice: 2190, maxPrice: 2470, modalPrice: 2360, arrivals: 2300, source: "ENAM", tradeStatus: "AUCTION_SETTLED", trend: "UP" },

    // Additional All-India States (AGMARKNET & e-NAM)
    { state: "Arunachal Pradesh", district: "East Siang", market: "Pasighat APMC Market", commodity: "Ginger", variety: "Nadia Fresh", minPrice: 4200, maxPrice: 5100, modalPrice: 4750, arrivals: 650, source: "AGMARKNET", tradeStatus: "AUCTION_SETTLED", trend: "UP" },
    { state: "Arunachal Pradesh", district: "East Siang", market: "Pasighat (e-NAM)", commodity: "Ginger", variety: "Organic Fresh Nadia", minPrice: 4300, maxPrice: 5250, modalPrice: 4880, arrivals: 720, source: "ENAM", tradeStatus: "AUCTION_SETTLED", trend: "UP" },
    { state: "Assam", district: "Darrang", market: "Kharupetia Mandi", commodity: "Cabbage", variety: "Golden Acre", minPrice: 850, maxPrice: 1300, modalPrice: 1100, arrivals: 3400, source: "AGMARKNET", tradeStatus: "AUCTION_SETTLED", trend: "DOWN" },
    { state: "Assam", district: "Golaghat", market: "Golaghat APMC Yard", commodity: "Mustard", variety: "M-27 Yellow", minPrice: 5100, maxPrice: 5600, modalPrice: 5380, arrivals: 1250, source: "AGMARKNET", tradeStatus: "AUCTION_SETTLED", trend: "UP" },
    { state: "Assam", district: "Darrang", market: "Kharupetia Market Yard (e-NAM)", commodity: "Cabbage", variety: "Golden Acre Fresh", minPrice: 880, maxPrice: 1350, modalPrice: 1150, arrivals: 3600, source: "ENAM", tradeStatus: "ACTIVE_BIDDING", trend: "DOWN" },
    { state: "Bihar", district: "Muzaffarpur", market: "Muzaffarpur Krishi Yard", commodity: "Maize", variety: "Hybrid Yellow", minPrice: 2050, maxPrice: 2320, modalPrice: 2210, arrivals: 4600, source: "AGMARKNET", tradeStatus: "AUCTION_SETTLED", trend: "STABLE" },
    { state: "Bihar", district: "Purnia", market: "Gulabbagh Mandi", commodity: "Maize", variety: "Rabi Maize Premium", minPrice: 2120, maxPrice: 2410, modalPrice: 2280, arrivals: 8500, source: "AGMARKNET", tradeStatus: "AUCTION_SETTLED", trend: "UP" },
    { state: "Bihar", district: "Purnia", market: "Gulabbagh APMC (e-NAM)", commodity: "Maize", variety: "Rabi Yellow Premium", minPrice: 2150, maxPrice: 2460, modalPrice: 2320, arrivals: 9100, source: "ENAM", tradeStatus: "ACTIVE_BIDDING", trend: "UP" },
    { state: "Bihar", district: "Patna", market: "Patna Mithapur Mandi", commodity: "Potato", variety: "Lal Gulab", minPrice: 1150, maxPrice: 1500, modalPrice: 1350, arrivals: 5200, source: "AGMARKNET", tradeStatus: "AUCTION_SETTLED", trend: "DOWN" },
    { state: "Chhattisgarh", district: "Raipur", market: "Raipur Pandri APMC", commodity: "Paddy (Dhan)", variety: "Swarna (Grade A)", minPrice: 2183, maxPrice: 2350, modalPrice: 2280, arrivals: 6400, source: "AGMARKNET", tradeStatus: "AUCTION_SETTLED", trend: "UP" },
    { state: "Chhattisgarh", district: "Raipur", market: "Raipur Pandri (e-NAM)", commodity: "Paddy (Dhan)", variety: "Swarna Grade-A", minPrice: 2210, maxPrice: 2390, modalPrice: 2320, arrivals: 6800, source: "ENAM", tradeStatus: "AUCTION_SETTLED", trend: "UP" },
    { state: "Chhattisgarh", district: "Rajnandgaon", market: "Rajnandgaon Mandi", commodity: "Soybean", variety: "JS-335", minPrice: 4350, maxPrice: 4780, modalPrice: 4620, arrivals: 3100, source: "AGMARKNET", tradeStatus: "AUCTION_SETTLED", trend: "STABLE" },
    { state: "Goa", district: "North Goa", market: "Ponda Sanquelim Market", commodity: "Cashew Nut", variety: "Raw Goa Cashew", minPrice: 11500, maxPrice: 13800, modalPrice: 12600, arrivals: 420, source: "AGMARKNET", tradeStatus: "AUCTION_SETTLED", trend: "UP" },
    { state: "Goa", district: "North Goa", market: "Ponda Sanquelim (e-NAM)", commodity: "Cashew Nut", variety: "Raw Sun-Dried Cashew", minPrice: 11800, maxPrice: 14200, modalPrice: 12900, arrivals: 480, source: "ENAM", tradeStatus: "AUCTION_SETTLED", trend: "UP" },
    { state: "Himachal Pradesh", district: "Shimla", market: "Shimla Dhalli Fruit Mandi", commodity: "Apple", variety: "Royal Delicious", minPrice: 6500, maxPrice: 10500, modalPrice: 8800, arrivals: 5600, source: "AGMARKNET", tradeStatus: "AUCTION_SETTLED", trend: "UP" },
    { state: "Himachal Pradesh", district: "Shimla", market: "Shimla Dhalli (e-NAM)", commodity: "Apple", variety: "Royal Delicious Extra", minPrice: 6800, maxPrice: 11000, modalPrice: 9200, arrivals: 6200, source: "ENAM", tradeStatus: "ACTIVE_BIDDING", trend: "UP" },
    { state: "Himachal Pradesh", district: "Solan", market: "Solan Sabzi Mandi", commodity: "Tomato", variety: "Hilly Hybrid Himsona", minPrice: 1950, maxPrice: 2800, modalPrice: 2450, arrivals: 3800, source: "AGMARKNET", tradeStatus: "AUCTION_SETTLED", trend: "UP" },
    { state: "Jharkhand", district: "Ranchi", market: "Ranchi Pandra Market Yard", commodity: "Tomato", variety: "Local Hybrid", minPrice: 1550, maxPrice: 2250, modalPrice: 1900, arrivals: 2900, source: "AGMARKNET", tradeStatus: "AUCTION_SETTLED", trend: "DOWN" },
    { state: "Jharkhand", district: "Ranchi", market: "Ranchi Pandra (e-NAM)", commodity: "Tomato", variety: "Table Red Hybrid", minPrice: 1600, maxPrice: 2320, modalPrice: 1960, arrivals: 3100, source: "ENAM", tradeStatus: "ACTIVE_BIDDING", trend: "DOWN" },
    { state: "Jharkhand", district: "Hazaribagh", market: "Hazaribagh APMC", commodity: "Potato", variety: "Kufri Kanchan", minPrice: 1180, maxPrice: 1480, modalPrice: 1320, arrivals: 2200, source: "AGMARKNET", tradeStatus: "AUCTION_SETTLED", trend: "STABLE" },
    { state: "Kerala", district: "Wayanad", market: "Kalpetta Spices Market", commodity: "Black Pepper", variety: "Panniyur-1 Garbled", minPrice: 58000, maxPrice: 64500, modalPrice: 61800, arrivals: 580, source: "AGMARKNET", tradeStatus: "AUCTION_SETTLED", trend: "UP" },
    { state: "Kerala", district: "Wayanad", market: "Kalpetta Spices Yard (e-NAM)", commodity: "Black Pepper", variety: "Garbled Bold Malabar", minPrice: 59000, maxPrice: 65800, modalPrice: 62900, arrivals: 640, source: "ENAM", tradeStatus: "AUCTION_SETTLED", trend: "UP" },
    { state: "Kerala", district: "Kozhikode", market: "Vengeri APMC Market Yard", commodity: "Coconut", variety: "Milling Copra", minPrice: 10200, maxPrice: 11600, modalPrice: 10950, arrivals: 1800, source: "AGMARKNET", tradeStatus: "AUCTION_SETTLED", trend: "UP" },
    { state: "Kerala", district: "Idukki", market: "Nedumkandam Spices Yard", commodity: "Cardamom (Green)", variety: "Small 8mm Bold", minPrice: 215000, maxPrice: 258000, modalPrice: 238000, arrivals: 320, source: "AGMARKNET", tradeStatus: "AUCTION_SETTLED", trend: "UP" },
    { state: "Manipur", district: "Imphal West", market: "Khwairamband Bazar", commodity: "Black Rice", variety: "Chak-hao Organic", minPrice: 13500, maxPrice: 16800, modalPrice: 15200, arrivals: 410, source: "AGMARKNET", tradeStatus: "AUCTION_SETTLED", trend: "UP" },
    { state: "Manipur", district: "Imphal West", market: "Imphal Central (e-NAM)", commodity: "Black Rice", variety: "Chak-hao Aromatic GI", minPrice: 13900, maxPrice: 17200, modalPrice: 15600, arrivals: 450, source: "ENAM", tradeStatus: "AUCTION_SETTLED", trend: "UP" },
    { state: "Meghalaya", district: "East Khasi Hills", market: "Shillong Iewduh Market", commodity: "Ginger", variety: "Nadia Aromatic", minPrice: 4100, maxPrice: 4950, modalPrice: 4600, arrivals: 780, source: "AGMARKNET", tradeStatus: "AUCTION_SETTLED", trend: "UP" },
    { state: "Meghalaya", district: "East Khasi Hills", market: "Shillong Market Yard (e-NAM)", commodity: "Ginger", variety: "Himalayan Nadia", minPrice: 4200, maxPrice: 5080, modalPrice: 4720, arrivals: 840, source: "ENAM", tradeStatus: "ACTIVE_BIDDING", trend: "UP" },
    { state: "Meghalaya", district: "West Jaintia Hills", market: "Jowai Mandi Yard", commodity: "Turmeric", variety: "Lakadong (Curcumin 7%+)", minPrice: 18500, maxPrice: 24000, modalPrice: 21500, arrivals: 520, source: "AGMARKNET", tradeStatus: "AUCTION_SETTLED", trend: "UP" },
    { state: "Mizoram", district: "Aizawl", market: "Bawngkawn Agri Market", commodity: "Red Chilli", variety: "Bird's Eye Hilly Chilli", minPrice: 32000, maxPrice: 39000, modalPrice: 35800, arrivals: 280, source: "AGMARKNET", tradeStatus: "AUCTION_SETTLED", trend: "UP" },
    { state: "Mizoram", district: "Aizawl", market: "Aizawl Agri Yard (e-NAM)", commodity: "Red Chilli", variety: "Bird's Eye Hilly", minPrice: 32800, maxPrice: 39800, modalPrice: 36500, arrivals: 310, source: "ENAM", tradeStatus: "AUCTION_SETTLED", trend: "UP" },
    { state: "Nagaland", district: "Kohima", market: "Kohima State Agricultural Yard", commodity: "Red Chilli", variety: "Naga King Chilli (Bhut Jolokia)", minPrice: 42000, maxPrice: 52000, modalPrice: 47500, arrivals: 210, source: "AGMARKNET", tradeStatus: "AUCTION_SETTLED", trend: "UP" },
    { state: "Nagaland", district: "Kohima", market: "Kohima APMC (e-NAM)", commodity: "Red Chilli", variety: "Bhut Jolokia Hot GI", minPrice: 43500, maxPrice: 53200, modalPrice: 48600, arrivals: 240, source: "ENAM", tradeStatus: "AUCTION_SETTLED", trend: "UP" },
    { state: "Odisha", district: "Bargarh", market: "Attabira Regulated Market", commodity: "Paddy (Dhan)", variety: "Common Fine", minPrice: 2183, maxPrice: 2380, modalPrice: 2290, arrivals: 7200, source: "AGMARKNET", tradeStatus: "AUCTION_SETTLED", trend: "UP" },
    { state: "Odisha", district: "Bargarh", market: "Attabira Market Yard (e-NAM)", commodity: "Paddy (Dhan)", variety: "Common Fine Milling", minPrice: 2220, maxPrice: 2420, modalPrice: 2330, arrivals: 7600, source: "ENAM", tradeStatus: "AUCTION_SETTLED", trend: "UP" },
    { state: "Odisha", district: "Cuttack", market: "Malgodown Wholesale Mandi", commodity: "Moong (Green Gram)", variety: "Sujata Desi", minPrice: 7800, maxPrice: 8650, modalPrice: 8320, arrivals: 1650, source: "AGMARKNET", tradeStatus: "AUCTION_SETTLED", trend: "UP" },
    { state: "Sikkim", district: "East Sikkim", market: "Gangtok Tadong Krishi Mandi", commodity: "Large Cardamom", variety: "Ramsey Organic Certified", minPrice: 110000, maxPrice: 135000, modalPrice: 124000, arrivals: 340, source: "AGMARKNET", tradeStatus: "AUCTION_SETTLED", trend: "UP" },
    { state: "Sikkim", district: "East Sikkim", market: "Tadong Krishi Yard (e-NAM)", commodity: "Large Cardamom", variety: "Organic Ramsey Export", minPrice: 112000, maxPrice: 139000, modalPrice: 127500, arrivals: 380, source: "ENAM", tradeStatus: "AUCTION_SETTLED", trend: "UP" },
    { state: "Tamil Nadu", district: "Erode", market: "Erode Perundurai Mandi Yard", commodity: "Turmeric", variety: "Erode Finger GI", minPrice: 13200, maxPrice: 16400, modalPrice: 15100, arrivals: 4800, source: "AGMARKNET", tradeStatus: "AUCTION_SETTLED", trend: "UP" },
    { state: "Tamil Nadu", district: "Erode", market: "Erode Perundurai (e-NAM)", commodity: "Turmeric", variety: "Erode Finger Double Polished", minPrice: 13400, maxPrice: 16800, modalPrice: 15450, arrivals: 5200, source: "ENAM", tradeStatus: "ACTIVE_BIDDING", trend: "UP" },
    { state: "Tamil Nadu", district: "Coimbatore", market: "Coimbatore APMC Yard", commodity: "Coconut", variety: "Pollachi Tall", minPrice: 10800, maxPrice: 12200, modalPrice: 11500, arrivals: 3600, source: "AGMARKNET", tradeStatus: "AUCTION_SETTLED", trend: "UP" },
    { state: "Tamil Nadu", district: "Madurai", market: "Mattuthavani Central Market", commodity: "Banana", variety: "Robusta / Grand Naine", minPrice: 2200, maxPrice: 3100, modalPrice: 2650, arrivals: 4200, source: "AGMARKNET", tradeStatus: "AUCTION_SETTLED", trend: "STABLE" },
    { state: "Tripura", district: "West Tripura", market: "Agartala Maharajganj Bazar", commodity: "Pineapple", variety: "Queen Pineapple GI", minPrice: 2800, maxPrice: 3900, modalPrice: 3400, arrivals: 1950, source: "AGMARKNET", tradeStatus: "AUCTION_SETTLED", trend: "UP" },
    { state: "Tripura", district: "West Tripura", market: "Agartala Maharajganj (e-NAM)", commodity: "Pineapple", variety: "Queen Pineapple Grade-1", minPrice: 2880, maxPrice: 3990, modalPrice: 3480, arrivals: 2100, source: "ENAM", tradeStatus: "AUCTION_SETTLED", trend: "UP" },
    { state: "Uttarakhand", district: "Dehradun", market: "Niranjanpur APMC Mandi", commodity: "Basmati Rice", variety: "Type-3 Dehraduni Basmati", minPrice: 4200, maxPrice: 4950, modalPrice: 4680, arrivals: 2100, source: "AGMARKNET", tradeStatus: "AUCTION_SETTLED", trend: "UP" },
    { state: "Uttarakhand", district: "Dehradun", market: "Niranjanpur Mandi (e-NAM)", commodity: "Basmati Rice", variety: "Type-3 Dehraduni", minPrice: 4280, maxPrice: 5040, modalPrice: 4760, arrivals: 2250, source: "ENAM", tradeStatus: "AUCTION_SETTLED", trend: "UP" },
    { state: "Uttarakhand", district: "Nainital", market: "Haldwani Sabzi Mandi", commodity: "Tomato", variety: "Pahadi Red", minPrice: 1700, maxPrice: 2450, modalPrice: 2150, arrivals: 2600, source: "AGMARKNET", tradeStatus: "AUCTION_SETTLED", trend: "UP" },
    { state: "West Bengal", district: "Purba Bardhaman", market: "Memari APMC Market", commodity: "Paddy (Dhan)", variety: "Minikit Super Fine", minPrice: 2320, maxPrice: 2580, modalPrice: 2460, arrivals: 8100, source: "AGMARKNET", tradeStatus: "AUCTION_SETTLED", trend: "UP" },
    { state: "West Bengal", district: "Purba Bardhaman", market: "Memari Market (e-NAM)", commodity: "Paddy (Dhan)", variety: "Minikit Super Fine", minPrice: 2360, maxPrice: 2640, modalPrice: 2510, arrivals: 8600, source: "ENAM", tradeStatus: "ACTIVE_BIDDING", trend: "UP" },
    { state: "West Bengal", district: "Hooghly", market: "Sheoraphuli Market Yard", commodity: "Potato", variety: "Jyoti Fresh", minPrice: 1120, maxPrice: 1460, modalPrice: 1310, arrivals: 9200, source: "AGMARKNET", tradeStatus: "AUCTION_SETTLED", trend: "DOWN" },
    { state: "West Bengal", district: "Malda", market: "Samsi Regulated Market", commodity: "Jute", variety: "TD-5 Golden Fibre", minPrice: 5300, maxPrice: 6100, modalPrice: 5750, arrivals: 3400, source: "AGMARKNET", tradeStatus: "AUCTION_SETTLED", trend: "UP" },
    { state: "Delhi", district: "North Delhi", market: "Azadpur Fruit & Vegetable Mandi", commodity: "Onion", variety: "Nashik Big Red", minPrice: 1850, maxPrice: 2450, modalPrice: 2200, arrivals: 14500, source: "AGMARKNET", tradeStatus: "AUCTION_SETTLED", trend: "STABLE" },
    { state: "Delhi", district: "North Delhi", market: "Azadpur APMC (e-NAM)", commodity: "Onion", variety: "Nashik Big Red Export", minPrice: 1910, maxPrice: 2520, modalPrice: 2260, arrivals: 15800, source: "ENAM", tradeStatus: "ACTIVE_BIDDING", trend: "STABLE" },
    { state: "Delhi", district: "North West Delhi", market: "Narela Grain Mandi", commodity: "Wheat", variety: "MP Sharbati 306", minPrice: 2450, maxPrice: 2750, modalPrice: 2620, arrivals: 5800, source: "AGMARKNET", tradeStatus: "AUCTION_SETTLED", trend: "UP" },
    { state: "Jammu and Kashmir", district: "Srinagar", market: "Parimpora Fruit Mandi", commodity: "Apple", variety: "Kashmiri Delicious", minPrice: 6200, maxPrice: 9800, modalPrice: 8300, arrivals: 7400, source: "AGMARKNET", tradeStatus: "AUCTION_SETTLED", trend: "UP" },
    { state: "Jammu and Kashmir", district: "Srinagar", market: "Parimpora Fruit Market (e-NAM)", commodity: "Apple", variety: "Kashmiri Delicious Premium", minPrice: 6400, maxPrice: 10200, modalPrice: 8650, arrivals: 7900, source: "ENAM", tradeStatus: "ACTIVE_BIDDING", trend: "UP" },
    { state: "Jammu and Kashmir", district: "Jammu", market: "Narwal APMC Yard", commodity: "Basmati Rice", variety: "RS Pura Basmati", minPrice: 4100, maxPrice: 4750, modalPrice: 4450, arrivals: 2800, source: "AGMARKNET", tradeStatus: "AUCTION_SETTLED", trend: "UP" },
    { state: "Ladakh", district: "Leh", market: "Skalzangling Agri Yard", commodity: "Apricot", variety: "Raktsey Karpo (Sweet Pit)", minPrice: 38000, maxPrice: 46000, modalPrice: 42500, arrivals: 320, source: "AGMARKNET", tradeStatus: "AUCTION_SETTLED", trend: "UP" },
    { state: "Puducherry", district: "Puducherry", market: "Uzhavar Sandhai Mandi", commodity: "Paddy (Dhan)", variety: "ADT-37 Local", minPrice: 2150, maxPrice: 2360, modalPrice: 2260, arrivals: 1450, source: "AGMARKNET", tradeStatus: "AUCTION_SETTLED", trend: "STABLE" },
  ];

  for (const price of mandiPrices) {
    await prisma.mandiPrice.create({ data: price });
  }

  console.log(`🌾 Created ${mandiPrices.length} live Mandi Price benchmarks (AGMARKNET & e-NAM).`);

  // 5. Create IMD Agro-Weather Data across all 28 States & 8 UTs (120+ Districts)
  for (const b of IMD_DISTRICT_BENCHMARKS) {
    const locationKey = `${b.state}_${b.district}`.replace(/[\s()&'-]+/g, "_");
    await prisma.weatherCache.create({
      data: {
        locationKey,
        state: b.state,
        district: b.district,
        temperature: b.currentObs.temperature,
        condition: b.currentObs.condition,
        humidity: b.currentObs.humidity,
        windSpeed: b.currentObs.windSpeed,
        rainfallForecast: b.currentObs.rainfall24hMm > 0 ? `${b.currentObs.rainfall24hMm} mm recorded; showers expected` : "Dry weather across district",
        advisory: b.agromet.general,
      },
    });
  }

  console.log(`☀️ Created ${IMD_DISTRICT_BENCHMARKS.length} Pan-India Agro-Weather benchmarks across all 28 states & 8 UTs.`);

  // 6. Create Expert Questions & Answers
  const expertQAs = [
    {
      userId: farmerUser.id,
      question: "My wheat leaves are turning yellow from the tip downwards. Is this nitrogen deficiency or sulfur deficiency?",
      crop: "Wheat",
      category: "Nutrient Management",
      answer: "Yellowing starting from older leaves and lower tips indicates Nitrogen deficiency. If yellowing starts on new top leaves first, it is Sulfur deficiency. If it is Nitrogen, apply top-dressing of Urea @ 25 kg/acre just before irrigation.",
      answeredBy: "Dr. S. K. Sharma (Senior Agronomist)",
      audioAnswerUrl: "/audio/kishanvaani-demo.mp3",
      status: "ANSWERED",
    },
    {
      userId: farmerUser.id,
      question: "White flies are spreading across my Bt cotton crop despite one round of pesticide. What biological spray can I use?",
      crop: "Cotton",
      category: "Pest Control",
      answer: "White flies quickly develop resistance to single synthetic chemicals. Spray Neem oil (Azadirachtin 10,000 ppm) @ 2 ml/litre with 1 ml liquid soap. Install yellow sticky traps (15 traps per acre) at canopy height to capture adult flies.",
      answeredBy: "Dr. S. K. Sharma (Senior Agronomist)",
      audioAnswerUrl: "/audio/kishanvaani-demo.mp3",
      status: "ANSWERED",
    },
    {
      userId: farmerUser.id,
      question: "How can I prevent mastitis in my HF dairy cows during the rainy season?",
      crop: "Dairy Livestock",
      category: "Animal Health",
      answer: "Mastitis is caused by bacterial entry through open teat canals after milking. Always practice post-milking teat dipping using 0.5% Povidone-Iodine solution. Keep the barn floor clean, dry, and sprinkle slaked lime powder weekly.",
      answeredBy: "Dr. Priya Kurup (Veterinary Specialist)",
      audioAnswerUrl: "/audio/kishanvaani-demo.mp3",
      status: "ANSWERED",
    },
    {
      userId: farmerUser.id,
      question: "What is the optimal spacing for drip lines when planting high-density guava?",
      crop: "Horticulture",
      category: "Irrigation & Spacing",
      answer: "For meadow orchard / high-density guava, adopt 2 meters between rows and 1 meter between plants. Lay 16mm inline drip laterals with 4 LPH drippers spaced at 40cm. This delivers uniform water directly to the root zone.",
      answeredBy: "Dr. S. K. Sharma (Senior Agronomist)",
      audioAnswerUrl: "/audio/kishanvaani-demo.mp3",
      status: "ANSWERED",
    },
  ];

  for (const qa of expertQAs) {
    await prisma.expertQuestion.create({ data: qa });
  }

  console.log(`💬 Created ${expertQAs.length} Expert Q&As.`);

  // 7. Create Community Stories
  const stories = [
    {
      userId: farmerUser.id,
      title: "How I Reduced Water Usage by 40% Using Rainwater Harvesting Ponds",
      body: "Three years ago, our borewells went dry by March. We dug a 100x80 ft farm pond lined with HDPE membrane at the lowest corner of our 10-acre farm. It captures entire runoff from monsoon rains. Today we irrigate two crops effortlessly.",
      category: "SUCCESS_STORY",
      farmerName: "Sukhwinder Singh",
      location: "Sangrur, Punjab",
      status: "PUBLISHED",
      likesCount: 84,
      audioUrl: "/audio/kishanvaani-demo.mp3",
    },
    {
      userId: farmerUser.id,
      title: "Beware of Uncertified Seed Dealers: My Bitter Experience in Cotton",
      body: "Last Kharif, I bought cheap seeds from an unverified traveling vendor. Germination was barely 30% and plants lacked boll resistance. Always buy seeds with genuine tag, QR code, and tax invoice from registered cooperative societies.",
      category: "FAILURE_STORY",
      farmerName: "Devendra Rao",
      location: "Adilabad, Telangana",
      status: "PUBLISHED",
      likesCount: 62,
      audioUrl: "/audio/kishanvaani-demo.mp3",
    },
  ];

  for (const s of stories) {
    await prisma.communityStory.create({ data: s });
  }

  console.log(`🌟 Created ${stories.length} Community Stories.`);

  // 8. Create sample bookmark and listening history for demo user
  const firstContent = await prisma.content.findFirst({ include: { audio: true } });
  if (firstContent && firstContent.audio) {
    await prisma.bookmark.create({
      data: {
        userId: farmerUser.id,
        contentId: firstContent.id,
      },
    });

    await prisma.listeningHistory.create({
      data: {
        userId: farmerUser.id,
        audioId: firstContent.audio.id,
        progressSeconds: 45,
        completed: false,
        lastPlayedAt: new Date(),
      },
    });
  }

  // Seed PIB Agriculture NewsSource (idempotent upsert)
  await prisma.newsSource.upsert({
    where: { url: "https://www.pib.gov.in/RssMain.aspx?ModId=6&Lang=2&Regid=3&reg=48" },
    update: {
      name: "PIB Hindi - All Ministries (filtered to Agriculture)",
      language: "hi",
      enabled: true,
    },
    create: {
      name: "PIB Hindi - All Ministries (filtered to Agriculture)",
      url: "https://www.pib.gov.in/RssMain.aspx?ModId=6&Lang=2&Regid=3&reg=48",
      language: "hi",
      enabled: true,
    },
  });
  console.log("📰 Seeded PIB Hindi NewsSource");

  console.log("✅ Seed completed successfully!");
}


main()
  .catch((e) => {
    console.error("❌ Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
