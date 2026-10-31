export interface CropStage {
  id: string;
  stageName: string;
  stageNameHi: string;
  startDay: number; // Days after sowing (DAS)
  endDay: number;
  category: "FIELD_PREP" | "SOWING" | "FERTILIZER" | "IRRIGATION" | "SPRAY" | "HARVEST";
  title: string;
  titleHi: string;
  description: string;
  descriptionHi: string;
  dosage?: string;
  dosageHi?: string;
  weatherPrecaution?: string;
  weatherPrecautionHi?: string;
  isSprayStage?: boolean;
}

export interface CropInfo {
  id: string;
  name: string;
  nameHi: string;
  season: "Rabi" | "Kharif" | "Zaid";
  durationDays: number;
  optimalSowingWindow: string;
  optimalSowingWindowHi: string;
  stages: CropStage[];
}

export interface DistrictInfo {
  state: string;
  district: string;
  zone: string;
  soilType: string;
}

export const SUPPORTED_DISTRICTS: DistrictInfo[] = [
  { state: "Punjab", district: "Ludhiana", zone: "Central Plain Zone", soilType: "Alluvial / Loamy" },
  { state: "Punjab", district: "Bathinda", zone: "South Western Zone", soilType: "Sandy Loam" },
  { state: "Punjab", district: "Sangrur", zone: "Central Plain Zone", soilType: "Loamy" },
  { state: "Haryana", district: "Karnal", zone: "Eastern Agroclimatic Zone", soilType: "Clay Loam" },
  { state: "Haryana", district: "Hisar", zone: "Western Agroclimatic Zone", soilType: "Sandy Loam" },
  { state: "Uttar Pradesh", district: "Agra", zone: "South Western Semi-Arid", soilType: "Alluvial" },
  { state: "Uttar Pradesh", district: "Gorakhpur", zone: "North Eastern Plain", soilType: "Alluvial Clay" },
  { state: "Uttar Pradesh", district: "Varanasi", zone: "Eastern Plain", soilType: "Alluvial Sandy" },
  { state: "Madhya Pradesh", district: "Indore", zone: "Malwa Plateau", soilType: "Medium Deep Black" },
  { state: "Madhya Pradesh", district: "Ujjain", zone: "Malwa Plateau", soilType: "Deep Black" },
  { state: "Maharashtra", district: "Nashik", zone: "Western Maharashtra Plain", soilType: "Medium Black" },
  { state: "Maharashtra", district: "Pune", zone: "Sub-Montane Zone", soilType: "Coarse Shallow Black" },
  { state: "Maharashtra", district: "Nagpur", zone: "Central Vidarbha Zone", soilType: "Clayey Black" },
  { state: "Rajasthan", district: "Kota", zone: "South Eastern Humid Plain", soilType: "Black Cotton" },
  { state: "Rajasthan", district: "Sri Ganganagar", zone: "Irrigated North Western Plain", soilType: "Desert Loam" },
  { state: "Gujarat", district: "Surat", zone: "South Gujarat Zone", soilType: "Deep Black Heavy" },
  { state: "Gujarat", district: "Rajkot", zone: "North Saurashtra Zone", soilType: "Medium Black" },
  { state: "Telangana", district: "Warangal", zone: "Central Telangana Zone", soilType: "Red Chalkas & Black" },
  { state: "Andhra Pradesh", district: "Guntur", zone: "Krishna Godavari Zone", soilType: "Black Cotton" },
  { state: "Karnataka", district: "Belagavi", zone: "Northern Transition Zone", soilType: "Medium Black" },
  { state: "Tamil Nadu", district: "Coimbatore", zone: "Western Zone", soilType: "Red Loamy" },
  { state: "Bihar", district: "Patna", zone: "South Bihar Alluvial Plain", soilType: "Old Alluvial" },
];

export const CROPS_DATA: Record<string, CropInfo> = {
  Wheat: {
    id: "Wheat",
    name: "Wheat",
    nameHi: "गेहूं",
    season: "Rabi",
    durationDays: 140,
    optimalSowingWindow: "25 October – 15 November",
    optimalSowingWindowHi: "25 अक्टूबर से 15 नवंबर",
    stages: [
      {
        id: "w-1",
        stageName: "Field Prep & Basal Dressing",
        stageNameHi: "खेत की तैयारी व आधार खाद",
        startDay: 0,
        endDay: 0,
        category: "FERTILIZER",
        title: "Basal Fertilizer Application",
        titleHi: "बुवाई पूर्व खाद डालना",
        description: "Apply full dose of DAP and Potash plus 1/3rd Urea at the final ploughing.",
        descriptionHi: "अंतिम जुताई के समय डीएपी और पोटाश की पूरी मात्रा तथा यूरिया का एक-तिहाई हिस्सा खेत में मिलाएं।",
        dosage: "DAP 55 kg + MOP 20 kg + Urea 25 kg per acre",
        dosageHi: "डीएपी 55 किग्रा + एमओपी 20 किग्रा + यूरिया 25 किग्रा प्रति एकड़",
      },
      {
        id: "w-2",
        stageName: "Sowing & Seed Treatment",
        stageNameHi: "बुवाई व बीज शोधन",
        startDay: 0,
        endDay: 5,
        category: "SOWING",
        title: "Seed Treatment & Line Sowing",
        titleHi: "बीज उपचार व कतारों में बुवाई",
        description: "Treat seeds with Thiram or Carbendazim before sowing to protect against loose smut and root rot.",
        descriptionHi: "बीज को कार्बेन्डाजिम या थीरम से उपचारित करके कतारों में 20 सेमी की दूरी पर बोएं।",
        dosage: "Carbendazim 2.5g/kg seed. Seed rate: 40 kg/acre",
        dosageHi: "कार्बेन्डाजिम 2.5 ग्राम प्रति किग्रा बीज। बीज दर: 40 किग्रा/एकड़",
      },
      {
        id: "w-3",
        stageName: "Crown Root Initiation (CRI)",
        stageNameHi: "ताज जड़ अवस्था (CRI)",
        startDay: 20,
        endDay: 25,
        category: "IRRIGATION",
        title: "First & Most Critical Irrigation",
        titleHi: "पहली एवं सर्वाधिक महत्वपूर्ण सिंचाई",
        description: "CRITICAL: First irrigation must be given at 21 DAS. Delay causes severe yield loss. Top dress with Urea.",
        descriptionHi: "अति महत्वपूर्ण: बुवाई के 20-22 दिन बाद पहली सिंचाई अवश्य करें। साथ ही यूरिया की पहली टॉप-ड्रेसिंग करें।",
        dosage: "Urea 35 kg + Zinc Sulphate (21%) 10 kg per acre",
        dosageHi: "यूरिया 35 किग्रा + जिंक सल्फेट (21%) 10 किग्रा प्रति एकड़",
      },
      {
        id: "w-4",
        stageName: "Tillering & Weed Control",
        stageNameHi: "कल्ले फूटना व खरपतवार नियंत्रण",
        startDay: 30,
        endDay: 40,
        category: "SPRAY",
        isSprayStage: true,
        title: "Foliar Weedicide Spray Window",
        titleHi: "खरपतवार नाशक स्प्रे का समय",
        description: "Spray Sulfosulfuron or Clodinafop for Phalaris minor (गुल्ली डंडा) and 2,4-D for broad-leaf weeds.",
        descriptionHi: "गुल्ली डंडा और चौड़ी पत्ती वाले खरपतवारों के लिए सल्फोसल्फ्यूरॉन या मेटसल्फ्यूरॉन का छिड़काव करें।",
        dosage: "Sulfosulfuron 75% WG @ 13.5g in 150L water per acre",
        dosageHi: "सल्फोसल्फ्यूरॉन 75% डब्ल्यूजी @ 13.5 ग्राम 150 लीटर पानी में प्रति एकड़",
        weatherPrecaution: "Spray only when wind speed < 12 km/h and bright sunshine. Do not spray if rain is forecast within 6 hours.",
        weatherPrecautionHi: "स्प्रे तभी करें जब हवा 12 किमी/घंटा से कम हो। बारिश की संभावना होने पर तुरंत टालें।",
      },
      {
        id: "w-5",
        stageName: "Jointing & Second Irrigation",
        stageNameHi: "गांठ बनना व दूसरी सिंचाई",
        startDay: 45,
        endDay: 55,
        category: "IRRIGATION",
        title: "Second Irrigation & Top Dressing",
        titleHi: "दूसरी सिंचाई व अंतिम यूरिया खुराक",
        description: "Apply remaining Urea followed by second irrigation. Ensures strong stem elongation.",
        descriptionHi: "यूरिया की शेष 1/3 खुराक देकर दूसरी सिंचाई करें। तने की मजबूती के लिए आवश्यक है।",
        dosage: "Urea 30 kg/acre",
        dosageHi: "यूरिया 30 किग्रा प्रति एकड़",
      },
      {
        id: "w-6",
        stageName: "Booting & Rust Prevention",
        stageNameHi: "गोभ अवस्था व पीला रतुआ रोकथाम",
        startDay: 70,
        endDay: 85,
        category: "SPRAY",
        isSprayStage: true,
        title: "Rust & Micronutrient Spray",
        titleHi: "पीला रतुआ व 0:52:34 सूक्ष्म पोषक स्प्रे",
        description: "Scout for Yellow Rust. If symptoms appear, spray Propiconazole (Tilt). Foliar NPK 0:52:34 for grain weight.",
        descriptionHi: "पीला रतुआ की निगरानी करें। लक्षण दिखने पर प्रोपिकोनाज़ोल (टिल्ट) और एनपीके 0:52:34 का छिड़काव करें।",
        dosage: "Propiconazole 25% EC @ 200 ml + NPK 0:52:34 @ 1 kg in 200L water/acre",
        dosageHi: "प्रोपिकोनाज़ोल 200 मिली + एनपीके 0:52:34 @ 1 किग्रा 200 लीटर पानी में प्रति एकड़",
        weatherPrecaution: "Ideal morning spray window: 7:30 AM to 10:30 AM after dew dries up.",
        weatherPrecautionHi: "ओस सूखने के बाद सुबह 7:30 से 10:30 के बीच छिड़काव करें।",
      },
      {
        id: "w-7",
        stageName: "Milking & Grain Filling",
        stageNameHi: "दुग्धिया अवस्था व दाना भराव",
        startDay: 95,
        endDay: 110,
        category: "IRRIGATION",
        title: "Light Irrigation at Grain Filling",
        titleHi: "दाना भराव पर हल्की सिंचाई",
        description: "Light irrigation during grain filling prevents shriveled grain. Avoid heavy water during high wind to prevent lodging.",
        descriptionHi: "दाना भरते समय हल्की सिंचाई करें। तेज हवा के समय पानी न लगाएं ताकि फसल गिरे नहीं।",
      },
      {
        id: "w-8",
        stageName: "Maturity & Harvesting",
        stageNameHi: "पकाई व कटाई",
        startDay: 130,
        endDay: 140,
        category: "HARVEST",
        title: "Combine / Reaper Harvesting",
        titleHi: "कंबाइन या रीपर से कटाई",
        description: "Harvest when grain moisture drops below 12-14%. Store in moisture-proof bins.",
        descriptionHi: "दाने में नमी 12-14% से कम होने पर कटाई करें। सूखे गोदाम में सुरक्षित रखें।",
      },
    ],
  },
  "Paddy/Rice": {
    id: "Paddy/Rice",
    name: "Paddy/Rice",
    nameHi: "धान / चावल",
    season: "Kharif",
    durationDays: 130,
    optimalSowingWindow: "15 June – 05 July (Transplanting)",
    optimalSowingWindowHi: "15 जून से 05 जुलाई (रोपाई)",
    stages: [
      {
        id: "p-1",
        stageName: "Nursery & Seed Treatment",
        stageNameHi: "नर्सरी व बीज उपचार",
        startDay: 0,
        endDay: 5,
        category: "SOWING",
        title: "Pre-soaking & Bio-fertilizer Inoculation",
        titleHi: "बीज भिगोना व ट्राइकोडर्मा उपचार",
        description: "Soak seed for 24h, treat with Pseudomonas fluorescens or Carbendazim. Sow in raised nursery beds.",
        descriptionHi: "बीज को 24 घंटे भिगोकर ट्राइकोडर्मा या कार्बेन्डाजिम से उपचारित करें और नर्सरी में डालें।",
        dosage: "Carbendazim 2g/kg seed + Trichoderma viride 5g/kg",
        dosageHi: "कार्बेन्डाजिम 2 ग्राम + ट्राइकोडर्मा 5 ग्राम प्रति किग्रा बीज",
      },
      {
        id: "p-2",
        stageName: "Transplanting & Puddling",
        stageNameHi: "लेह लगाना व रोपाई",
        startDay: 25,
        endDay: 30,
        category: "FIELD_PREP",
        title: "Puddling & Basal Fertilizer",
        titleHi: "खेत की कदोई व बेसल खाद",
        description: "Transplant 25-day old seedlings (2-3 per hill) at 20x15 cm spacing. Apply full DAP and Potash.",
        descriptionHi: "25 दिन की पौध 20x15 सेमी की दूरी पर लगाएं। डीएपी और पोटाश खेत की तैयारी में डालें।",
        dosage: "DAP 50 kg + MOP 25 kg + Zinc Sulphate (33%) 7 kg per acre",
        dosageHi: "डीएपी 50 किग्रा + पोटाश 25 किग्रा + जिंक सल्फेट 7 किग्रा प्रति एकड़",
      },
      {
        id: "p-3",
        stageName: "Early Tillering & Weedicide",
        stageNameHi: "कल्ले फूटना व खरपतवार नियंत्रण",
        startDay: 40,
        endDay: 50,
        category: "SPRAY",
        isSprayStage: true,
        title: "Post-Emergence Herbicide Spray",
        titleHi: "रोपाई बाद खरपतवार नाशक स्प्रे",
        description: "Apply Bispyribac-sodium (Nominee Gold) within 15-20 days of transplanting when weeds have 2-3 leaves.",
        descriptionHi: "रोपाई के 15-20 दिन बाद बिस्पायरीबैक-सोडियम (नोमिनी गोल्ड) का स्प्रे करें।",
        dosage: "Bispyribac-sodium 10% SC @ 80-100 ml in 150L water/acre",
        dosageHi: "बिस्पायरीबैक-सोडियम @ 80-100 मिली 150 लीटर पानी में प्रति एकड़",
      },
      {
        id: "p-4",
        stageName: "Maximum Tillering",
        stageNameHi: "अधिकतम कल्ले व यूरिया खुराक",
        startDay: 55,
        endDay: 65,
        category: "FERTILIZER",
        title: "Top Dressing with Urea",
        titleHi: "यूरिया की दूसरी टॉप-ड्रेसिंग",
        description: "Top dress with Urea. Maintain 2-3 cm standing water in field.",
        descriptionHi: "खेत में 2-3 सेमी पानी रखकर यूरिया की दूसरी खुराक दें।",
        dosage: "Urea 35 kg per acre",
        dosageHi: "यूरिया 35 किग्रा प्रति एकड़",
      },
      {
        id: "p-5",
        stageName: "Panicle Initiation & Borer Defense",
        stageNameHi: "बाली निकलना व तना छेदक रोकथाम",
        startDay: 75,
        endDay: 90,
        category: "SPRAY",
        isSprayStage: true,
        title: "Stem Borer & False Smut Protection",
        titleHi: "तना छेदक (डेड हार्ट) व हल्दी रोग रोकथाम",
        description: "Scout for yellow stem borer and leaf folder. Spray Chlorantraniliprole (Coragen) and Propiconazole.",
        descriptionHi: "तना छेदक व पत्ता लपेटक के लिए कोराजन (क्लोरेंट्रानिलिप्रोल) और टिल्ट का स्प्रे करें।",
        dosage: "Chlorantraniliprole 18.5% SC @ 60 ml + Propiconazole @ 200 ml per acre",
        dosageHi: "कोराजन @ 60 मिली + प्रोपिकोनाज़ोल @ 200 मिली 200 लीटर पानी में",
        weatherPrecaution: "Do not spray during mid-day rains. Foliar sprays must be completed before afternoon rain showers.",
        weatherPrecautionHi: "दोपहर की बारिश से पहले छिड़काव पूरा करें।",
      },
      {
        id: "p-6",
        stageName: "Harvesting & Drying",
        stageNameHi: "कटाई व सुखाना",
        startDay: 120,
        endDay: 130,
        category: "HARVEST",
        title: "Field Drainage & Combine Harvest",
        titleHi: "पानी निकालना व कटाई",
        description: "Drain water 10 days before harvest. Harvest when 80% grains turn golden yellow.",
        descriptionHi: "कटाई से 10 दिन पूर्व पानी निकाल दें। जब 80% बालियां सुनहरी हो जाएं तब कटाई करें।",
      },
    ],
  },
  Mustard: {
    id: "Mustard",
    name: "Mustard",
    nameHi: "सरसों",
    season: "Rabi",
    durationDays: 125,
    optimalSowingWindow: "01 October – 25 October",
    optimalSowingWindowHi: "01 अक्टूबर से 25 अक्टूबर",
    stages: [
      {
        id: "m-1",
        stageName: "Sowing & Seed Treatment",
        stageNameHi: "बुवाई व बीज शोधन",
        startDay: 0,
        endDay: 5,
        category: "SOWING",
        title: "Sowing with Sulfur & DAP",
        titleHi: "सल्फर व डीएपी के साथ बुवाई",
        description: "Mustard has high sulfur requirement for oil content. Treat seeds with Apron 35 SD or Metalaxyl.",
        descriptionHi: "तेल की मात्रा बढ़ाने के लिए बेंटोनाइट सल्फर अवश्य डालें। बीज को मेटालेक्सिल से उपचारित करें।",
        dosage: "Sulfur 90% @ 10 kg + DAP 35 kg + Urea 20 kg per acre",
        dosageHi: "सल्फर 90% @ 10 किग्रा + डीएपी 35 किग्रा प्रति एकड़",
      },
      {
        id: "m-2",
        stageName: "Thinning & First Irrigation",
        stageNameHi: "छंटाई (विरलीकरण) व पहला पानी",
        startDay: 20,
        endDay: 28,
        category: "IRRIGATION",
        title: "Thinning to 15cm & First Irrigation",
        titleHi: "पौधों की दूरी 15 सेमी व पहली सिंचाई",
        description: "Thin excess plants keeping 12-15 cm spacing. Irrigate at flowering initiation with Urea top dress.",
        descriptionHi: "घने पौधों को उखाड़कर 12-15 सेमी की दूरी बनाएं और पहला पानी लगाकर यूरिया दें।",
        dosage: "Urea 30 kg per acre",
        dosageHi: "यूरिया 30 किग्रा प्रति एकड़",
      },
      {
        id: "m-3",
        stageName: "Flowering & Aphid (माहू) Defense",
        stageNameHi: "फूल अवस्था व चेपा/माहू नियंत्रण",
        startDay: 50,
        endDay: 65,
        category: "SPRAY",
        isSprayStage: true,
        title: "Aphid / Chepa Control Spray Window",
        titleHi: "माहू / चेपा कीट नाशक स्प्रे",
        description: "Inspect top inflorescence for aphids (चेपा). Spray Thiamethoxam or Dimethoate if > 10 aphids/twig.",
        descriptionHi: "सरसों की टहनियों पर चेपा (माहू) दिखने पर थायमेथोक्सम 25% डब्ल्यूजी का छिड़काव करें।",
        dosage: "Thiamethoxam 25% WG @ 80g in 150L water per acre",
        dosageHi: "थायमेथोक्सम 25% डब्ल्यूजी @ 80 ग्राम 150 लीटर पानी में प्रति एकड़",
        weatherPrecaution: "Spray in late afternoon to protect foraging honeybees. Avoid windy weather.",
        weatherPrecautionHi: "मधुमक्खियों की सुरक्षा के लिए शाम 4 बजे के बाद ही छिड़काव करें।",
      },
      {
        id: "m-4",
        stageName: "Pod Formation (Siliqua)",
        stageNameHi: "फलियां (सिलिक्वा) बनना",
        startDay: 75,
        endDay: 85,
        category: "IRRIGATION",
        title: "Second Irrigation at Pod Development",
        titleHi: "फली बनते समय अंतिम सिंचाई",
        description: "Irrigate when pods are filling. Increases test weight and oil percentage.",
        descriptionHi: "फलियों में दाना भरते समय हल्की सिंचाई करें।",
      },
      {
        id: "m-5",
        stageName: "Harvesting & Threshing",
        stageNameHi: "कटाई व गहाई",
        startDay: 115,
        endDay: 125,
        category: "HARVEST",
        title: "Morning Harvesting to Prevent Shattering",
        titleHi: "सुबह के समय कटाई (ताकि फलियां न चटकें)",
        description: "Harvest when 75-80% pods turn yellow. Harvest early morning when dew is present to prevent pod shattering.",
        descriptionHi: "फलियां 75-80% पीली होने पर सुबह के समय कटाई करें ताकि दाना खेत में न बिखरे।",
      },
    ],
  },
  Cotton: {
    id: "Cotton",
    name: "Cotton",
    nameHi: "कपास",
    season: "Kharif",
    durationDays: 165,
    optimalSowingWindow: "15 April – 15 May (North) / June (Central)",
    optimalSowingWindowHi: "15 अप्रैल से 15 मई (उत्तर भारत) / जून (मध्य भारत)",
    stages: [
      {
        id: "c-1",
        stageName: "Sowing & Seed Treatment",
        stageNameHi: "बुवाई व बीज शोधन",
        startDay: 0,
        endDay: 5,
        category: "SOWING",
        title: "Delinted Bt Seed Sowing",
        titleHi: "बीज उपचार व डिबलिंग विधि से बुवाई",
        description: "Treat seeds with Imidacloprid to protect from early sucking pests for first 30 days.",
        descriptionHi: "शुरुआती रस चूसक कीटों से 30 दिन की सुरक्षा के लिए इमिडाक्लोप्रिड से उपचारित करें।",
        dosage: "Imidacloprid 70% WS @ 5g/kg seed. Spacing: 67.5 x 60 cm",
        dosageHi: "इमिडाक्लोप्रिड @ 5 ग्राम प्रति किग्रा बीज। दूरी: 67.5 x 60 सेमी",
      },
      {
        id: "c-2",
        stageName: "Vegetative & Sucking Pest Alert",
        stageNameHi: "बढ़वार व हरा तेला/सफेद मक्खी अलर्ट",
        startDay: 35,
        endDay: 50,
        category: "SPRAY",
        isSprayStage: true,
        title: "Whitefly & Jassid Control Spray",
        titleHi: "सफेद मक्खी व हरा तेला रोकथाम",
        description: "Scout for whitefly and jassids on underside of leaves. Spray Flonicamid or Diafenthiuron.",
        descriptionHi: "पत्तियों के नीचे सफेद मक्खी या हरा तेला दिखने पर फ्लोनिकामिड (उलाला) का छिड़काव करें।",
        dosage: "Flonicamid 50% WG (Ulala) @ 80g in 150L water/acre",
        dosageHi: "फ्लोनिकामिड 50% डब्ल्यूजी @ 80 ग्राम 150 लीटर पानी में प्रति एकड़",
        weatherPrecaution: "Spray with hollow cone nozzle in morning when whitefly adults are less active.",
        weatherPrecautionHi: "सुबह के समय जब सफेद मक्खी कम सक्रिय हो तब छिड़काव करें।",
      },
      {
        id: "c-3",
        stageName: "Square Formation & Boll Development",
        stageNameHi: "फूल-कलियां व टिंडे बनना",
        startDay: 70,
        endDay: 100,
        category: "SPRAY",
        isSprayStage: true,
        title: "Pink Bollworm (गुलाबी सुंडी) Alert & 13:0:45",
        titleHi: "गुलाबी सुंडी रोकथाम व पोटेशियम नाइट्रेट स्प्रे",
        description: "Install pheromone traps (5/acre) for pink bollworm. Spray 13:0:45 + Boron to prevent flower drop.",
        descriptionHi: "गुलाबी सुंडी के लिए फेरोमोन ट्रैप लगाएं। फूल व कलियां झड़ने से रोकने के लिए 13:0:45 का छिड़काव करें।",
        dosage: "Emamectin Benzoate 5% SG @ 100g + Potassium Nitrate (13:0:45) @ 1 kg in 200L water",
        dosageHi: "इमामेक्टिन बेंजोएट @ 100 ग्राम + 13:0:45 @ 1 किग्रा प्रति एकड़",
        weatherPrecaution: "Ensure soil has adequate moisture before foliar nutrition spray.",
        weatherPrecautionHi: "छिड़काव से पहले खेत में पर्याप्त नमी सुनिश्चित करें।",
      },
      {
        id: "c-4",
        stageName: "Boll Bursting & Picking",
        stageNameHi: "टिंडे खिलना व कपास चुनाई",
        startDay: 130,
        endDay: 165,
        category: "HARVEST",
        title: "Clean Picking & Storage",
        titleHi: "साफ चुनाई व धूप में सुखाना",
        description: "Pick cotton in dry sunny weather. Avoid plastic bags; use cotton bags to prevent contamination.",
        descriptionHi: "सूखे मौसम में चुनाई करें। सूती बोरियों में भरकर नमी से दूर रखें।",
      },
    ],
  },
};

/**
 * Calculate personalized schedule and spray window for a crop in a district
 */
export function calculateCropSchedule(cropName: string, districtName: string, sowingDateStr?: string) {
  const crop = CROPS_DATA[cropName] || CROPS_DATA["Wheat"];
  const district =
    SUPPORTED_DISTRICTS.find((d) => d.district.toLowerCase() === districtName.toLowerCase()) ||
    SUPPORTED_DISTRICTS[0];

  const now = new Date();
  let sowingDate = sowingDateStr ? new Date(sowingDateStr) : new Date(now.getTime() - 25 * 86400000); // Default to 25 DAS if omitted
  if (isNaN(sowingDate.getTime())) {
    sowingDate = new Date(now.getTime() - 25 * 86400000);
  }

  const daysElapsed = Math.max(0, Math.floor((now.getTime() - sowingDate.getTime()) / (1000 * 60 * 60 * 24)));
  const progressPercent = Math.min(100, Math.round((daysElapsed / crop.durationDays) * 100));

  // Determine current active stage
  let currentStage = crop.stages[0];
  for (const stage of crop.stages) {
    if (daysElapsed >= stage.startDay && daysElapsed <= stage.endDay) {
      currentStage = stage;
      break;
    } else if (daysElapsed > stage.endDay) {
      currentStage = stage;
    }
  }

  // Calculate urgent reminders (activities starting within 7 days or active right now)
  const urgentReminders = crop.stages.filter((s) => {
    const startDelta = s.startDay - daysElapsed;
    const endDelta = s.endDay - daysElapsed;
    // Active now or starting within 7 days
    return (daysElapsed >= s.startDay && daysElapsed <= s.endDay) || (startDelta > 0 && startDelta <= 7);
  }).map((s) => {
    const dueInDays = Math.max(0, s.startDay - daysElapsed);
    return {
      stageId: s.id,
      category: s.category,
      title: s.title,
      titleHi: s.titleHi,
      description: s.description,
      descriptionHi: s.descriptionHi,
      dosage: s.dosage,
      dosageHi: s.dosageHi,
      weatherPrecaution: s.weatherPrecaution,
      weatherPrecautionHi: s.weatherPrecautionHi,
      isSprayStage: Boolean(s.isSprayStage),
      dueInDays,
      status: daysElapsed >= s.startDay && daysElapsed <= s.endDay ? "ACTIVE_NOW" : "UPCOMING_SOON",
    };
  });

  return {
    crop: {
      id: crop.id,
      name: crop.name,
      nameHi: crop.nameHi,
      season: crop.season,
      durationDays: crop.durationDays,
      optimalSowingWindow: crop.optimalSowingWindow,
      optimalSowingWindowHi: crop.optimalSowingWindowHi,
    },
    district: {
      district: district.district,
      state: district.state,
      zone: district.zone,
      soilType: district.soilType,
    },
    sowingDate: sowingDate.toISOString().split("T")[0],
    daysElapsed,
    progressPercent,
    currentStage: {
      id: currentStage.id,
      stageName: currentStage.stageName,
      stageNameHi: currentStage.stageNameHi,
      title: currentStage.title,
      titleHi: currentStage.titleHi,
      startDay: currentStage.startDay,
      endDay: currentStage.endDay,
      category: currentStage.category,
    },
    urgentReminders,
    allStages: crop.stages.map((s) => ({
      ...s,
      isCompleted: daysElapsed > s.endDay,
      isCurrent: daysElapsed >= s.startDay && daysElapsed <= s.endDay,
      isFuture: daysElapsed < s.startDay,
    })),
  };
}
