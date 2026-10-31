import { Router, Request, Response } from "express";
import LiveMandiService from "../services/live-mandi.service.js";
import { getLiveWeatherForLocation } from "../services/live-weather.service.js";
import prisma from "../prisma.js";

const router = Router();

// GET /api/v1/whatsapp/webhook - Meta WhatsApp Verification Challenge
router.get("/webhook", (req: Request, res: Response) => {
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  const expectedToken = process.env.WHATSAPP_VERIFY_TOKEN || "kishanvaani_wa_verify_2026";

  if (mode === "subscribe" && token === expectedToken) {
    res.status(200).send(challenge);
  } else {
    res.status(403).json({ error: "Verification token mismatch" });
  }
});

// POST /api/v1/whatsapp/webhook - Incoming WhatsApp Messages & Voice Notes
router.post("/webhook", async (req: Request, res: Response) => {
  try {
    const entry = req.body.entry?.[0];
    const change = entry?.changes?.[0];
    const value = change?.value;
    const message = value?.messages?.[0];

    if (!message) {
      res.status(200).json({ status: "acknowledged_no_message" });
      return;
    }

    const from = message.from; // Farmer's WhatsApp phone number (e.g. 919876543210)
    const messageType = message.type; // 'text', 'audio', 'image'

    let replyText = "";
    let replyAudioUrl: string | null = null;

    if (messageType === "audio") {
      // Farmer sent an audio voice note
      const audioId = message.audio?.id;
      replyText = `🌾 नमस्ते किसान मित्र! आपकी आवाज़ रिकॉर्डिंग मिल गई है। हमारे कृषि वैज्ञानिक इसे सुनकर 24 घंटे के अंदर आपकी समस्या का समाधान व्हाट्सएप पर भेजेंगे।`;

      // Log voice note as an expert question
      const defaultUser = await prisma.user.upsert({
        where: { email: `${from}@farmer.kishanvaani.in` },
        update: {},
        create: {
          phone: `+${from}`,
          email: `${from}@farmer.kishanvaani.in`,
          name: `WhatsApp Farmer (${from.slice(-4)})`,
          role: "USER",
          language: "Hindi",
        },
      });

      await prisma.expertQuestion.create({
        data: {
          userId: defaultUser.id,
          question: `[WhatsApp Audio Voice Note from +${from} ID: ${audioId}]`,
          crop: "General Agriculture",
          category: "CROP_HEALTH",
          status: "OPEN",
        },
      });
    } else if (messageType === "text") {
      const text = (message.text?.body || "").toLowerCase().trim();

      if (text.includes("mandi") || text.includes("bhav") || text.includes("भाव") || text.includes("விலை")) {
        const mandiResult = await LiveMandiService.getLiveMandiPrices({ limit: 4 }).catch(() => null);
        const records = mandiResult?.records || [];
        const lines = records
          .slice(0, 4)
          .map((r) => `• *${r.commodity}* (${r.market}, ${r.state}): ₹${r.modalPrice}/क्विंटल`)
          .join("\n");
        replyText = `🌾 *ताज़ा मंडी भाव (KishanVaani):*\n\n${lines}\n\nविस्तृत भाव देखें: ${process.env.FRONTEND_URL || "https://kishanvaani.in"}/agriculture/mandi-prices`;
      } else if (text.includes("weather") || text.includes("mausam") || text.includes("मौसम") || text.includes("மழை")) {
        const weather = await getLiveWeatherForLocation({ district: "Ludhiana", state: "Punjab" }).catch(() => null);
        replyText = `🌦️ *आज का मौसम और कृषि सलाह:*\n• तापमान: ${weather?.currentObservation?.temperature || 28}°C\n• स्थिति: ${weather?.currentObservation?.condition || "Partly Cloudy"}\n• बारिश की संभावना: ${weather?.forecast?.[0]?.rainProb || "15%"}\n• सलाह: ${weather?.warning?.farmerAction || "कीटनाशक छिड़काव के लिए मौसम अनुकूल है।"}`;
      } else {
        replyText = `🌾 *नमस्ते! किशनवाणी किसान सेवा में आपका स्वागत है।*\n\nआप निम्न संदेश भेज सकते हैं:\n1. *"भाव"* या *"mandi"* - ताज़ा मंडी भाव\n2. *"मौसम"* या *"weather"* - मौसम पूर्वानुमान\n3. *आवाज़ (Voice Note)* - अपनी समस्या बोलकर भेजें, हमारे कृषि वैज्ञानिक उत्तर देंगे।`;
      }
    } else if (messageType === "image") {
      replyText = `🌾 *तस्वीर प्राप्त हुई!* हमारे विशेषज्ञ फसल के रोग की जांच कर रहे हैं। शीघ्र ही आपको उपचार और दवा की सलाह भेजी जाएगी।`;
    }

    res.status(200).json({
      status: "success",
      recipient: from,
      replyText,
      replyAudioUrl,
    });
  } catch (error) {
    console.error("[WhatsAppBot] Webhook error:", error);
    res.status(500).json({ error: "Failed to process WhatsApp webhook" });
  }
});

export default router;
