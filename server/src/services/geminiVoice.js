import { GoogleGenAI } from "@google/genai";
import { EdgeTTS } from "edge-tts-universal";

let LAST_ERROR = "";

// --------------------------------------------------
// Settings
// --------------------------------------------------

const getSettings = () => {
  return {
    apiKey: process.env.GEMINI_API_KEY?.trim() || "",

    // Keep the existing project's model value.
    ttsModel:
      process.env.GEMINI_TTS_MODEL?.trim() ||
      "gemini-2.5-flash-preview-tts",

    geminiVoice:
      process.env.GEMINI_VOICE?.trim() || "Kore",

    edgeVoice:
      process.env.EDGE_TTS_VOICE?.trim() ||
      "en-US-JennyNeural",
  };
};

// --------------------------------------------------
// Error
// --------------------------------------------------

export const lastError = () => {
  return LAST_ERROR;
};

// --------------------------------------------------
// Gemini configured?
// --------------------------------------------------

export const geminiConfigured = () => {
  return Boolean(getSettings().apiKey);
};

// --------------------------------------------------
// Neural voice available
// --------------------------------------------------

export const neuralVoiceAvailable = () => {
  return true;
};

// --------------------------------------------------
// Build coach script
// --------------------------------------------------
// Same logic as Python _coach_script()
// --------------------------------------------------

const coachScript = (
  questionText,
  role = null,
  isFirst = true
) => {
  if (isFirst) {
    const roleBit = role
      ? ` for a ${role} interview`
      : "";

    return (
      `Hello! I'm your interview coach${roleBit}. ` +
      `Here's your question: ${questionText}`
    );
  }

  return `So your next question is: ${questionText}`;
};

// --------------------------------------------------
// PCM → WAV
// --------------------------------------------------
// Gemini returns raw PCM audio.
// This creates the WAV header exactly for:
// channels = 1
// sample rate = 24000
// sample width = 2 bytes
// --------------------------------------------------

const pcmToWav = (
  pcmBuffer,
  channels = 1,
  sampleRate = 24000,
  bitsPerSample = 16
) => {
  const bytesPerSample = bitsPerSample / 8;
  const blockAlign = channels * bytesPerSample;
  const byteRate = sampleRate * blockAlign;

  const header = Buffer.alloc(44);

  // RIFF
  header.write("RIFF", 0);

  // File size - 8
  header.writeUInt32LE(
    36 + pcmBuffer.length,
    4
  );

  // WAVE
  header.write("WAVE", 8);

  // fmt
  header.write("fmt ", 12);

  // PCM format
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20);

  // Channels
  header.writeUInt16LE(channels, 22);

  // Sample rate
  header.writeUInt32LE(sampleRate, 24);

  // Byte rate
  header.writeUInt32LE(byteRate, 28);

  // Block align
  header.writeUInt16LE(blockAlign, 32);

  // Bits per sample
  header.writeUInt16LE(bitsPerSample, 34);

  // data
  header.write("data", 36);

  // Audio size
  header.writeUInt32LE(
    pcmBuffer.length,
    40
  );

  return Buffer.concat([
    header,
    pcmBuffer,
  ]);
};

// --------------------------------------------------
// Gemini TTS
// --------------------------------------------------

const tryGeminiTTS = async (text) => {
  const config = getSettings();

  if (!config.apiKey) {
    return null;
  }

  try {
    const ai = new GoogleGenAI({
      apiKey: config.apiKey,
    });

    const response =
      await ai.models.generateContent({
        model: config.ttsModel,

        contents: [
          {
            role: "user",
            parts: [
              {
                text: `Say in a warm, natural, professional tone: ${text}`,
              },
            ],
          },
        ],

        config: {
          responseModalities: ["AUDIO"],

          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: {
                voiceName: config.geminiVoice,
              },
            },
          },
        },
      });

    const base64Audio =
      response?.candidates?.[0]?.content?.parts?.[0]
        ?.inlineData?.data;

    if (!base64Audio) {
      throw new Error(
        "Gemini TTS returned no audio data"
      );
    }

    const pcmBuffer = Buffer.from(
      base64Audio,
      "base64"
    );

    return {
      data: pcmToWav(pcmBuffer),
      mime: "audio/wav",
    };
  } catch (error) {
    LAST_ERROR = `Gemini TTS: ${error.message}`;

    return null;
  }
};

// --------------------------------------------------
// Edge TTS
// --------------------------------------------------

const edgeTTS = async (text) => {
  const config = getSettings();

  try {
    const tts = new EdgeTTS(
      text,
      config.edgeVoice
    );

    const result = await tts.synthesize();

    const audioBuffer = Buffer.from(
      await result.audio.arrayBuffer()
    );

    if (!audioBuffer || audioBuffer.length === 0) {
      LAST_ERROR = "Edge TTS produced no audio";
      return null;
    }

    return {
      data: audioBuffer,
      mime: "audio/mpeg",
    };
  } catch (error) {
    LAST_ERROR = `Edge TTS: ${error.message}`;
    return null;
  }
};

// --------------------------------------------------
// Main coach speech function
// --------------------------------------------------

export const coachSpeech = async (
  questionText,
  role = null,
  isFirst = true
) => {
  LAST_ERROR = "";

  const text = coachScript(
    questionText,
    role,
    isFirst
  );

  // 1. Gemini first
  const geminiAudio =
    await tryGeminiTTS(text);

  if (geminiAudio) {
    return geminiAudio;
  }

  // 2. Edge TTS fallback
  const edgeAudio =
    await edgeTTS(text);

  if (edgeAudio) {
    return edgeAudio;
  }

  // 3. Nothing worked
  if (!LAST_ERROR) {
    LAST_ERROR =
      "No neural voice backend available";
  }

  return null;
};

export default {
  coachSpeech,
  geminiConfigured,
  neuralVoiceAvailable,
  lastError,
};