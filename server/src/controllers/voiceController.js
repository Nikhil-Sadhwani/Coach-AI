import {
  coachSpeech,
  neuralVoiceAvailable,
  lastError,
} from "../services/geminiVoice.js";

export const coachSpeak = async (req, res) => {
  try {
    if (!req.session.uid) {
      return res.status(401).json({
        error: "Unauthorized",
      });
    }

    if (!neuralVoiceAvailable()) {
      return res.status(503).json({
        error: "Voice backend unavailable",
      });
    }

    const {
      question,
      is_first: isFirst = true,
    } = req.body || {};

    const cleanQuestion =
      (question || "").trim();

    if (!cleanQuestion) {
      return res.status(400).json({
        error: "Missing question",
      });
    }

    const audio = await coachSpeech(
      cleanQuestion,
      req.session.mode,
      Boolean(isFirst)
    );

    if (!audio) {
      return res.status(502).json({
        error:
          lastError() || "TTS failed",
      });
    }

    res.set({
      "Content-Type": audio.mime,
      "Content-Length": audio.data.length,
      "Cache-Control": "no-store",
    });

    return res.status(200).send(audio.data);
  } catch (error) {
    console.error(
      "Coach Speak Error:",
      error.message
    );

    return res.status(500).json({
      error: "Voice generation failed",
    });
  }
};