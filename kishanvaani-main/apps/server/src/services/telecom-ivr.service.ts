/**
 * Telecom IVR (Interactive Voice Response) Service
 * Enables low-bandwidth and non-literate farmers with feature phones (2G/basic keypad)
 * to receive agricultural news, weather, and mandi prices via phone call.
 * Compatible with Exotel, Twilio, or Sarv Telecom voice gateways.
 */

import prisma from "../prisma.js";
import LiveMandiService from "./live-mandi.service.js";
import { getLiveWeatherForLocation } from "./live-weather.service.js";

export interface IvrMenuResponse {
  twimlXml: string;
  responseType: "MENU" | "AUDIO_PLAY" | "VOICE_RECORD" | "HANGUP";
}

export class TelecomIvrService {
  /**
   * Generates root voice response for an incoming phone call
   */
  public static getRootMenuTwiML(language: string = "Hindi"): string {
    if (language.toLowerCase().includes("tamil")) {
      return `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say language="ta-IN">வணக்கம்! கிஷன்வாணி குரல் சேவைக்கு நல்வரவு.</Say>
  <Gather numDigits="1" action="/api/v1/ivr/action" method="POST" timeout="10">
    <Say language="ta-IN">இன்றைய உங்கள் மாவட்ட மண்டி விலையை அறிய எண் 1-ஐ அழுத்தவும்.</Say>
    <Say language="ta-IN">இன்றைய வானிலை மற்றும் மழை எச்சரிக்கையை அறிய எண் 2-ஐ அழுத்தவும்.</Say>
    <Say language="ta-IN">தினசரி விவசாய ஆடியோ செய்தியைக் கேட்க எண் 3-ஐ அழுத்தவும்.</Say>
    <Say language="ta-IN">வேளாண் நிபுணரிடம் உங்கள் கேள்வியை குரல் பதிவாக கேட்க எண் 4-ஐ அழுத்தவும்.</Say>
  </Gather>
  <Say language="ta-IN">எந்த பதிலும் பெறப்படவில்லை. நன்றி, மீண்டும் அழைக்கவும்.</Say>
  <Hangup/>
</Response>`;
    }

    // Default Hindi menu
    return `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say language="hi-IN">नमस्कार! किशनवाणी ऑडियो किसान सेवा में आपका स्वागत है।</Say>
  <Gather numDigits="1" action="/api/v1/ivr/action" method="POST" timeout="10">
    <Say language="hi-IN">आज के ताज़ा मंडी भाव जानने के लिए 1 दबाएं।</Say>
    <Say language="hi-IN">मौसम पूर्वानुमान और बारिश का अलर्ट सुनने के लिए 2 दबाएं।</Say>
    <Say language="hi-IN">आज का मुख्य कृषि ऑडियो बुलेटिन सुनने के लिए 3 दबाएं।</Say>
    <Say language="hi-IN">कृषि विशेषज्ञ को अपनी समस्या की बोलकर आवाज़ रिकॉर्ड करने के लिए 4 दबाएं।</Say>
  </Gather>
  <Say language="hi-IN">कोई विकल्प नहीं चुना गया। धन्यवाद, किशनवाणी से जुड़ने के लिए आभार।</Say>
  <Hangup/>
</Response>`;
  }

  /**
   * Processes DTMF keypress (1, 2, 3, 4) from the farmer's keypad
   */
  public static async processKeypadSelection(
    digits: string,
    callerPhone: string,
    callerState = "Punjab",
    callerDistrict = "Ludhiana"
  ): Promise<string> {
    switch (digits.trim()) {
      case "1": {
        // Option 1: Top Mandi Prices for district
        const mandiResult = await LiveMandiService.getLiveMandiPrices({
          district: callerDistrict,
          limit: 3,
        }).catch(() => null);

        const records = mandiResult?.records || [];
        if (records.length === 0) {
          return `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say language="hi-IN">${callerDistrict} मंडी में आज का न्यूनतम समर्थन मूल्य गेहूं ₹2,425 और धान ₹2,369 प्रति क्विंटल है।</Say>
  <Hangup/>
</Response>`;
        }

        const lines = records
          .slice(0, 3)
          .map((r) => `${r.commodity}: ₹${r.modalPrice} प्रति क्विंटल`)
          .join("। ");

        return `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say language="hi-IN">${callerDistrict} मंडी के आज के ताज़ा भाव: ${lines}। धन्यवाद!</Say>
  <Hangup/>
</Response>`;
      }

      case "2": {
        // Option 2: Weather and Rain Alert
        const weather = await getLiveWeatherForLocation({
          district: callerDistrict,
          state: callerState,
        }).catch(() => null);

        const temp = weather?.currentObservation?.temperature || 28;
        const condition = weather?.currentObservation?.condition || "Partly Cloudy";
        const rainProb = weather?.forecast?.[0]?.rainProb || "20%";

        return `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say language="hi-IN">${callerDistrict} में वर्तमान तापमान ${temp} डिग्री सेल्सियस है। मौसम ${condition} है, और आज बारिश की संभावना ${rainProb} है। सतर्क रहें।</Say>
  <Hangup/>
</Response>`;
      }

      case "3": {
        // Option 3: Play Latest Audio Bulletin
        const latestContent = await prisma.content.findFirst({
          where: { status: "PUBLISHED" },
          include: { audio: true },
          orderBy: { createdAt: "desc" },
        });

        const audioUrl = latestContent?.audio?.fileUrl;
        if (audioUrl && audioUrl.startsWith("http")) {
          return `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say language="hi-IN">किशनवाणी दैनिक समाचार सुनिए:</Say>
  <Play>${audioUrl}</Play>
  <Hangup/>
</Response>`;
        }

        return `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say language="hi-IN">आज का कृषि समाचार: केंद्र सरकार ने रबी फसलों की बुवाई के लिए बीजों पर अतिरिक्त सब्सिडी जारी की है। विस्तृत जानकारी के लिए किशनवाणी से जुड़े रहें।</Say>
  <Hangup/>
</Response>`;
      }

      case "4": {
        // Option 4: Record Farmer Voice Question
        return `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say language="hi-IN">बीप की आवाज़ के बाद अपनी फसल या रोग की समस्या बोलकर बताएं। रिकॉर्डिंग पूरी होने पर हैश दबाएं।</Say>
  <Record action="/api/v1/ivr/record-complete" method="POST" maxLength="120" finishOnKey="#" />
</Response>`;
      }

      default:
        return this.getRootMenuTwiML();
    }
  }

  /**
   * Saves farmer's voice recording into database as an expert question
   */
  public static async saveFarmerVoiceRecording(callerPhone: string, recordingUrl: string) {
    try {
      const defaultUser = await prisma.user.upsert({
        where: { email: `${callerPhone.replace(/[^0-9]/g, "")}@farmer.kishanvaani.in` },
        update: {},
        create: {
          phone: callerPhone,
          email: `${callerPhone.replace(/[^0-9]/g, "")}@farmer.kishanvaani.in`,
          name: `IVR Farmer (${callerPhone.slice(-4)})`,
          role: "USER",
          language: "Hindi",
        },
      });

      return await prisma.expertQuestion.create({
        data: {
          userId: defaultUser.id,
          question: `[Voice Note from Phone Call ${callerPhone}]: Audio recording at ${recordingUrl}`,
          crop: "General Agriculture",
          category: "CROP_HEALTH",
          status: "PENDING",
        },
      });
    } catch (err) {
      console.error("[TelecomIvrService] Failed to save farmer voice recording:", err);
      return null;
    }
  }
}

export default TelecomIvrService;
