import { Router, Request, Response } from "express";
import TelecomIvrService from "../services/telecom-ivr.service.js";

const router = Router();

// POST /api/v1/ivr/incoming - Inbound Voice Call Entrypoint
router.post("/incoming", (req: Request, res: Response) => {
  const language = (req.body.language || req.query.language || "Hindi") as string;
  const twiml = TelecomIvrService.getRootMenuTwiML(language);
  res.type("text/xml").send(twiml);
});

// POST /api/v1/ivr/action - Handle Farmer Keypad Digits
router.post("/action", async (req: Request, res: Response) => {
  const digits = req.body.Digits || req.body.digits || "";
  const from = req.body.From || req.body.caller || "+919876543210";
  const twiml = await TelecomIvrService.processKeypadSelection(String(digits), String(from));
  res.type("text/xml").send(twiml);
});

// POST /api/v1/ivr/record-complete - Handle Voice Recording Finish
router.post("/record-complete", async (req: Request, res: Response) => {
  const recordingUrl = req.body.RecordingUrl || req.body.recording_url;
  const from = req.body.From || req.body.caller || "+919876543210";

  if (recordingUrl) {
    await TelecomIvrService.saveFarmerVoiceRecording(String(from), String(recordingUrl));
  }

  const responseXml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say language="hi-IN">आपकी आवाज़ रिकॉर्ड कर ली गई है। कृषि वैज्ञानिक जल्द ही आपको जवाब देंगे। धन्यवाद।</Say>
  <Hangup/>
</Response>`;
  res.type("text/xml").send(responseXml);
});

export default router;
