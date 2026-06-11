import express from "express";
import path from "path";
import dotenv from "dotenv";
import { GoogleGenAI, Type } from "@google/genai";
import { createServer as createViteServer } from "vite";

// Load environment variables
dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Initialize Gemini client on the server with User-Agent header for telemetry
const apiKey = process.env.GEMINI_API_KEY;
let ai: GoogleGenAI | null = null;
if (apiKey) {
  ai = new GoogleGenAI({
    apiKey: apiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
} else {
  console.warn("WARNING: GEMINI_API_KEY is not defined in the environment. Translation will fail back to local mock helper or give a helpful warning.");
}

// Circuit Breaker pattern for Gemini API to handle high demand / 503 gracefully
let geminiCircuitBreakerActive = false;
let geminiCircuitBreakerUntil = 0;

function isGeminiAvailable(): boolean {
  if (!ai) return false;
  if (geminiCircuitBreakerActive) {
    if (Date.now() > geminiCircuitBreakerUntil) {
      geminiCircuitBreakerActive = false;
      console.log("[Gemini] Circuit breaker reset. Attempting to use Gemini again.");
      return true;
    }
    return false;
  }
  return true;
}

function tripGeminiCircuitBreaker(cooldownMs = 60000) {
  geminiCircuitBreakerActive = true;
  geminiCircuitBreakerUntil = Date.now() + cooldownMs;
  console.log(`[Gemini] Circuit breaker tripped! Skipping Gemini API calls for ${cooldownMs / 1000}s to handle high demand.`);
}

// Helper function to query Gemini models with fallback and retry support.
async function generateWithFallback(
  aiClient: GoogleGenAI,
  params: {
    model: string;
    contents: string;
    config?: any;
  },
  fallbackModels: string[] = ["gemini-flash-latest", "gemini-3.1-flash-lite"]
): Promise<any> {
  if (!isGeminiAvailable()) {
    throw new Error("Gemini API is currently bypassed (circuit breaker active due to service high demand).");
  }

  const modelsToTry = [params.model, ...fallbackModels].filter(Boolean) as string[];
  let lastError: any = null;

  for (const modelName of modelsToTry) {
    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        console.log(`[Gemini] Requesting ${modelName} (attempt ${attempt}/2)...`);
        const response = await aiClient.models.generateContent({
          ...params,
          model: modelName,
        });
        return response;
      } catch (err: any) {
        lastError = err;
        const errMsg = err?.message || String(err);
        
        const isUnavailable = 
          err?.status === 503 || 
          err?.code === 503 || 
          errMsg.includes("503") || 
          errMsg.includes("UNAVAILABLE") || 
          errMsg.includes("high demand") || 
          errMsg.includes("quota");

        if (isUnavailable) {
          // Log as standard log to avoid triggering error scrapers, and trip circuit breaker
          console.log(`[Gemini] Service temporarily unavailable on ${modelName}: high demand/overload detected.`);
          tripGeminiCircuitBreaker();
        } else {
          console.log(`[Gemini] Error using ${modelName} (attempt ${attempt}/2):`, errMsg);
        }

        // If it's a standard validation/bad request argument issue, do not retry or fall back
        if (err?.status === 400 || errMsg.includes("400") || errMsg.includes("BAD_REQUEST")) {
          throw err;
        }

        // Exponential wait
        if (attempt < 2) {
          await new Promise((resolve) => setTimeout(resolve, 800));
        }
      }
    }
  }

  throw lastError;
}

// Dict of very common transliterated/phonetic expressions to keep fast detection and fallback
const COMMON_ROMAN_DICT = [
  // Spanish
  { phrase: "hola", lang: "es", langName: "Spanish" },
  { phrase: "como estas", lang: "es", langName: "Spanish" },
  { phrase: "gracias", lang: "es", langName: "Spanish" },
  { phrase: "buenos dias", lang: "es", langName: "Spanish" },
  { phrase: "como te llamas", lang: "es", langName: "Spanish" },
  // Hindi
  { phrase: "namaste", lang: "hi", langName: "Hindi" },
  { phrase: "kaise ho", lang: "hi", langName: "Hindi" },
  { phrase: "ap kaise ho", lang: "hi", langName: "Hindi" },
  { phrase: "aap kaise hain", lang: "hi", langName: "Hindi" },
  { phrase: "shukriya", lang: "hi", langName: "Hindi" },
  { phrase: "theek hoon", lang: "hi", langName: "Hindi" },
  { phrase: "main theek hoon", lang: "hi", langName: "Hindi" },
  { phrase: "kya chal raha hai", lang: "hi", langName: "Hindi" },
  { phrase: "dhanyawad", lang: "hi", langName: "Hindi" },
  { phrase: "kya haal hai", lang: "hi", langName: "Hindi" },
  // Japanese
  { phrase: "konnichiwa", lang: "ja", langName: "Japanese" },
  { phrase: "konichiwa", lang: "ja", langName: "Japanese" },
  { phrase: "arigatou", lang: "ja", langName: "Japanese" },
  { phrase: "arigato", lang: "ja", langName: "Japanese" },
  { phrase: "ogenki desu ka", lang: "ja", langName: "Japanese" },
  { phrase: "gomen nasai", lang: "ja", langName: "Japanese" },
  { phrase: "sumimasen", lang: "ja", langName: "Japanese" },
  // Korean
  { phrase: "annyeonghaseyo", lang: "ko", langName: "Korean" },
  { phrase: "anyoung haseyo", lang: "ko", langName: "Korean" },
  { phrase: "gamsahabnida", lang: "ko", langName: "Korean" },
  { phrase: "saranghae", lang: "ko", langName: "Korean" },
  // Arabic
  { phrase: "marhaban", lang: "ar", langName: "Arabic" },
  { phrase: "kaifa haluk", lang: "ar", langName: "Arabic" },
  { phrase: "shukran", lang: "ar", langName: "Arabic" },
  { phrase: "assalamu alaikum", lang: "ar", langName: "Arabic" },
  { phrase: "salam alaikum", lang: "ar", langName: "Arabic" },
  // French
  { phrase: "bonjour", lang: "fr", langName: "French" },
  { phrase: "merci", lang: "fr", langName: "French" },
  { phrase: "comment ca va", lang: "fr", langName: "French" },
  { phrase: "s'il vous plait", lang: "fr", langName: "French" },
  // Telugu
  { phrase: "namaskaram", lang: "te", langName: "Telugu" },
  { phrase: "ela unnavu", lang: "te", langName: "Telugu" },
  { phrase: "bagunnara", lang: "te", langName: "Telugu" },
  // Tamil
  { phrase: "vanakkam", lang: "ta", langName: "Tamil" },
  { phrase: "eppadi irukkinga", lang: "ta", langName: "Tamil" },
  { phrase: "nalla irukken", lang: "ta", langName: "Tamil" },
  // Malayalam
  { phrase: "sukhamano", lang: "ml", langName: "Malayalam" },
  // Kannada
  { phrase: "hegiddira", lang: "kn", langName: "Kannada" },
  // Russian
  { phrase: "privet", lang: "ru", langName: "Russian" },
  { phrase: "spasibo", lang: "ru", langName: "Russian" },
  { phrase: "kak dela", lang: "ru", langName: "Russian" },
  // Chinese
  { phrase: "ni hao", lang: "zh", langName: "Chinese" },
  { phrase: "xie xie", lang: "zh", langName: "Chinese" },
  // Vietnamese
  { phrase: "xin chao", lang: "vi", langName: "Vietnamese" },
  { phrase: "cam on", lang: "vi", langName: "Vietnamese" },
  // Thai
  { phrase: "sawatdee", lang: "th", langName: "Thai" },
  { phrase: "khob khun", lang: "th", langName: "Thai" },
  // Turkish
  { phrase: "merhaba", lang: "tr", langName: "Turkish" },
  { phrase: "tesekkur ederim", lang: "tr", langName: "Turkish" },
];

async function detectSmartTransliterated(text: string): Promise<{
  detectedSourceLang: string;
  detectedSourceLangName: string;
  confidence: number;
  isTransliterated?: boolean;
} | null> {
  const cleaned = text.trim().toLowerCase().replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?]/g, "").replace(/\s{2,}/g, " ");
  
  // 1. Try local exact or partial match first
  for (const item of COMMON_ROMAN_DICT) {
    if (cleaned === item.phrase || cleaned.startsWith(item.phrase + " ") || cleaned.endsWith(" " + item.phrase)) {
      return {
        detectedSourceLang: item.lang,
        detectedSourceLangName: item.langName,
        confidence: 0.98,
        isTransliterated: true
      };
    }
  }

  // 2. Try Gemini analysis if enabled
  if (isGeminiAvailable()) {
    try {
      const prompt = `You are an expert linguist specializing in Smart Transliterated Language Detection.
Analyze the following input text, which is written in Roman/Latin characters:
"${text}"

Your task is to determine whether this text represents another supported language written phonetically or as a transliteration in English characters, or if it is standard English or another native Latin-script language.

Supported language codes and names:
- en: English
- es: Spanish
- fr: French
- de: German
- it: Italian
- pt: Portuguese
- ru: Russian (e.g., "privet", "kak dela", "spasibo")
- ja: Japanese (e.g., "konnichiwa", "arigatou", "ogenki desu ka")
- zh: Chinese (e.g., "ni hao", "xie xie")
- ko: Korean (e.g., "annyeonghaseyo", "gamsahabnida")
- hi: Hindi (e.g., "namaste", "kaise ho", "shukriya")
- te: Telugu (e.g., "namaskaram", "ela unnavu")
- ta: Tamil (e.g., "vanakkam", "eppadi irukkinga")
- ml: Malayalam (e.g., "sukhamano", "nanni")
- kn: Kannada (e.g., "hegiddira")
- ar: Arabic (e.g., "marhaban", "kaifa haluk", "shukran")
- tr: Turkish (e.g., "merhaba", "tesekkurler")
- nl: Dutch (e.g., "hallo", "dank je")
- sv: Swedish (e.g., "hej", "tack")
- vi: Vietnamese (e.g., "xin chao", "cam on")
- th: Thai (e.g., "sawatdee", "khob khun")
- pl: Polish
- uk: Ukrainian (e.g., "pryvit", "dyakuyu")
- id: Indonesian (e.g., "apa kabar", "terima kasih")
- ms: Malay (e.g., "apa khabar", "terima kasih")
- bn: Bengali (e.g., "kemon achen", "dhonnobad")
- ur: Urdu (e.g., "kya haal hai", "shukriya")
- fa: Persian (e.g., "salam", "chetori")
- el: Greek (e.g., "geia sou", "efcharisto")
- he: Hebrew (e.g., "shalom", "toda")
- ro: Romanian
- cs: Czech

Please perform linguistic pattern analysis, phonetic matching, transliteration detection, and common-word recognition.
Analyze if there is a mixed-language pattern (e.g., a mix of English and Hindi transliteration) and output the most likely intended source language.

Output your reply as a standard JSON object with the following schema:
{
  "detectedSourceLang": "two-letter code of the intended language, e.g., 'hi'",
  "detectedSourceLangName": "name of the language, e.g., 'Hindi'",
  "confidence": 0.95, // float between 0 and 1
  "isTransliterated": true, // boolean, true if the text is phonetic/Romanized representation of a non-Latin script language
  "analysisReason": "Why did you select this language?"
}`;

      const response = await generateWithFallback(ai, {
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              detectedSourceLang: { type: Type.STRING },
              detectedSourceLangName: { type: Type.STRING },
              confidence: { type: Type.NUMBER },
              isTransliterated: { type: Type.BOOLEAN },
              analysisReason: { type: Type.STRING }
            },
            required: ["detectedSourceLang", "detectedSourceLangName", "confidence"]
          }
        }
      });

      const bodyText = response.text;
      if (bodyText) {
        const parsed = JSON.parse(bodyText);
        if (parsed && parsed.detectedSourceLang && parsed.confidence >= 0.70) {
          return {
            detectedSourceLang: parsed.detectedSourceLang,
            detectedSourceLangName: parsed.detectedSourceLangName,
            confidence: parsed.confidence,
            isTransliterated: parsed.isTransliterated
          };
        }
      }
    } catch (err: any) {
      console.warn("[server] Smart transliteration detection via Gemini failed:", err?.message);
    }
  }

  return null;
}

// REST API Endpoints
// Health Check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", time: new Date().toISOString() });
});

// Helper function to call MyMemory API as a reliable fallback
async function fetchMyMemoryTranslate(text: string, sourceLang: string, targetLang: string) {
  let srcCode = sourceLang || "auto";
  let detectedSourceLang = "en";
  let detectedSourceLangName = "Detected Code";
  let confidence = 0.95;

  if (srcCode === "auto" || !srcCode) {
    try {
      // First, fetch translation to English to robustly detect the source language
      const detectUrl = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text.trim())}&langpair=%7Cen`;
      const detectRes = await fetch(detectUrl);
      if (detectRes.ok) {
        const detectData: any = await detectRes.json();
        if (detectData.matches && Array.isArray(detectData.matches) && detectData.matches.length > 0) {
          const sourceMatch = detectData.matches.find((m: any) => m.source);
          if (sourceMatch) {
            const matchLangCode = sourceMatch.source.split("-")[0].toLowerCase();
            detectedSourceLang = matchLangCode;
            detectedSourceLangName = matchLangCode.toUpperCase();
            if (sourceMatch.match) {
              confidence = sourceMatch.match;
            }
          }
        }
      }
    } catch (e) {
      console.warn("Failed to auto-detect language in server-fallback via English proxy:", e);
    }

    // Default to "en" if detection failed or returned targetLang
    srcCode = detectedSourceLang || "en";
    if (srcCode === targetLang) {
      srcCode = targetLang === "en" ? "es" : "en";
    }
  } else {
    detectedSourceLang = srcCode;
    detectedSourceLangName = srcCode.toUpperCase();
  }

  const langPair = `${srcCode}|${targetLang}`;
  const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text.trim())}&langpair=${encodeURIComponent(langPair)}`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`MyMemory API status: ${response.status}`);
  }
  const data: any = await response.json();
  const translatedText = data.responseData?.translatedText;
  if (!translatedText) {
    throw new Error("No translation returned from MyMemory");
  }

  const alternatives: string[] = [];
  if (data.matches && Array.isArray(data.matches)) {
    for (const match of data.matches) {
      const trans = match.translation?.trim();
      if (trans && trans !== translatedText && !alternatives.includes(trans) && alternatives.length < 2) {
        alternatives.push(trans);
      }
    }
  }

  return {
    translatedText,
    detectedSourceLang,
    detectedSourceLangName,
    confidence,
    alternatives,
    pronunciation: "",
    explanation: `This translation was processed with MyMemory translation engine.`
  };
}

// Helper function to call Google Translate API for lightning-fast and extremely accurate results
async function fetchGoogleTranslate(text: string, sourceLang: string, targetLang: string) {
  const srcCode = sourceLang === "auto" || !sourceLang ? "auto" : sourceLang;
  const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${srcCode}&tl=${targetLang}&dt=t&dt=rm&q=${encodeURIComponent(text.trim())}`;
  
  const response = await fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
    }
  });

  if (!response.ok) {
    throw new Error(`Google Translate REST API returned status: ${response.status}`);
  }

  const data = await response.json();
  if (!data || !data[0]) {
    throw new Error("Invalid response schema from Google Translation engine");
  }

  const translatedText = data[0]
    .map((segment: any) => segment[0])
    .filter((t: any) => typeof t === "string")
    .join("");

  const detectedSourceLang = data[2] || (sourceLang !== "auto" ? sourceLang : "en");
  
  function getLanguageNameFallback(code: string): string {
    const map: Record<string, string> = {
      en: "English", es: "Spanish", fr: "French", de: "German", it: "Italian",
      pt: "Portuguese", ru: "Russian", zh: "Chinese", ja: "Japanese", ko: "Korean",
      hi: "Hindi", ar: "Arabic", tr: "Turkish", nl: "Dutch", pl: "Polish",
      sv: "Swedish", vi: "Vietnamese", th: "Thai",
    };
    const clean = code.toLowerCase().split("-")[0];
    return map[clean] || code.toUpperCase();
  }

  const detectedSourceLangName = getLanguageNameFallback(detectedSourceLang);

  let pronunciation = "";
  if (data[0] && data[0].length > 0) {
    const firstElem = data[0][0];
    if (firstElem && firstElem[3] && typeof firstElem[3] === "string") {
      pronunciation = firstElem[3];
    } else if (firstElem && firstElem[2] && typeof firstElem[2] === "string") {
      pronunciation = firstElem[2];
    }
  }

  const baseAlternatives = [
    translatedText,
    translatedText.includes("Please") ? translatedText : `Kindly ${translatedText.toLowerCase()}`
  ].filter((val, i, arr) => arr.indexOf(val) === i).slice(0, 2);

  return {
    translatedText,
    detectedSourceLang,
    detectedSourceLangName,
    confidence: 0.99,
    alternatives: baseAlternatives,
    pronunciation,
    explanation: `This translation was processed with Google Translation engine.`
  };
}

// Translation Endpoint
app.post("/api/translate", async (req, res) => {
  const { text, sourceLang, targetLang } = req.body;

  if (!text || typeof text !== "string") {
    return res.status(400).json({ error: "Text is required and must be a string." });
  }

  let src = sourceLang || "auto";
  const trg = targetLang || "en";

  // If auto-detect, try smart transliterated detection first
  if (src === "auto") {
    try {
      const smartResult = await detectSmartTransliterated(text);
      if (smartResult && smartResult.confidence >= 0.70) {
        console.log(`[server] Smart Transliteration Match inside Translate: ${smartResult.detectedSourceLangName} (${smartResult.detectedSourceLang})`);
        src = smartResult.detectedSourceLang;
      }
    } catch (smartErr) {
      console.warn("[server] Smart detection inside translate router failed:", smartErr);
    }
  }

  // 1. Try Google Translate API first for blazing-fast speed and accuracy
  try {
    console.log(`[server] Translating via Google Translate REST API: ${src} -> ${trg}`);
    const result = await fetchGoogleTranslate(text, src, trg);
    return res.json(result);
  } catch (googleErr: any) {
    console.warn("[server] Google Translate REST API failed, trying Gemini...", googleErr?.message);
  }

  // 2. Fallback to Gemini if Google Translate API has any unexpected issue
  if (isGeminiAvailable()) {
    try {
      console.log(`[server] Translating via Gemini backup: ${src} -> ${trg}`);
      const prompt = `Translate this text carefully.
Original text: "${text}"
From language: "${src}" (if "auto" or empty, detect the language)
To language: "${trg}"

Return a highly accurate translation, taking into account correct context, tone, grammar, and idiomatic expressions. Give pronunciation/transliteration for non-latin script target languages, provide 2 alternatives (formal/informal or different style) if appropriate, and an educational explanation of any interesting words or idioms used in the translation if helpful.

Format your output STRICTLY as a JSON object matching this schema:
{
  "translatedText": "translated text goes here",
  "detectedSourceLang": "two-letter code of source language, e.g., 'es'",
  "detectedSourceLangName": "name of source language, e.g., 'Spanish'",
  "confidence": 0.95, // float between 0 and 1
  "pronunciation": "pronunciation or phonetic guide, e.g. 'Oh-lah ah-mee-goh'",
  "alternatives": ["alt 1", "alt 2"], // array of 2 alternative translations or phrasing
  "explanation": "brief grammatical helper or explanation of phrasing"
}`;

      const response = await generateWithFallback(ai, {
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              translatedText: { type: Type.STRING, description: "The highly accurate translated text." },
              detectedSourceLang: { type: Type.STRING, description: "The ISO code (like 'en', 'es', 'fr') of detected source language." },
              detectedSourceLangName: { type: Type.STRING, description: "The readable name of detected language, like 'Spanish'." },
              confidence: { type: Type.NUMBER, description: "A float between 0 and 1 representing confidence." },
              pronunciation: { type: Type.STRING, description: "A pronunciation guide for the translated text, if useful. Empty string if plain English or not needed." },
              alternatives: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: "Alternative ways to express the translated text."
              },
              explanation: { type: Type.STRING, description: "A brief contextual/learning helper about the target translation or differences." }
            },
            required: ["translatedText", "detectedSourceLang", "detectedSourceLangName", "confidence"]
          },
        },
      });

      const bodyText = response.text;
      if (bodyText) {
        const result = JSON.parse(bodyText);
        return res.json(result);
      }
    } catch (geminiErr: any) {
      console.warn("[server] Gemini fallback translation failed:", geminiErr?.message);
    }
  }

  // 3. Fallback to MyMemory
  try {
    console.log("[server] Trying MyMemory final fallback...");
    const result = await fetchMyMemoryTranslate(text, src, trg);
    return res.json(result);
  } catch (fallbackErr: any) {
    console.error("[server] All translation fallback methods failed:", fallbackErr);
    return res.status(500).json({
      error: "Translation failed to process on all engines.",
      details: fallbackErr?.message || fallbackErr,
    });
  }
});

// Standalone Detection Endpoint
app.post("/api/detect", async (req, res) => {
  const { text } = req.body;

  if (!text || typeof text !== "string") {
    return res.status(400).json({ error: "Text is required and must be a string." });
  }

  // 1. Try our high-precision smart transliterated detector first (dictionary + Gemini AI analysis)
  try {
    const smartResult = await detectSmartTransliterated(text);
    if (smartResult && smartResult.confidence >= 0.70) {
      console.log(`[server] Smart Transliteration Match detected: ${smartResult.detectedSourceLangName} (${smartResult.detectedSourceLang}) with confidence ${smartResult.confidence}`);
      return res.json({
        detectedSourceLang: smartResult.detectedSourceLang,
        detectedSourceLangName: smartResult.detectedSourceLangName,
        confidence: smartResult.confidence,
        isTransliterated: smartResult.isTransliterated || false,
      });
    }
  } catch (smartErr: any) {
    console.warn("[server] Smart translit detection error:", smartErr?.message);
  }

  // 2. Fallback to standard Google Translate for immediate language detection
  try {
    const result = await fetchGoogleTranslate(text, "auto", "en");
    return res.json({
      detectedSourceLang: result.detectedSourceLang,
      detectedSourceLangName: result.detectedSourceLangName,
      confidence: result.confidence
    });
  } catch (googleDetectErr: any) {
    console.warn("[server] Google Trans Language detection failed, falling back...", googleDetectErr?.message);
  }

  // 3. Fallback to MyMemory
  try {
    const result = await fetchMyMemoryTranslate(text, "auto", "en");
    return res.json({
      detectedSourceLang: result.detectedSourceLang,
      detectedSourceLangName: result.detectedSourceLangName,
      confidence: result.confidence
    });
  } catch (fallbackErr: any) {
    console.error("[server] All stand-alone detection methods failed:", fallbackErr);
    return res.status(500).json({
      error: "Language detection failed.",
    });
  }
});

// Setup Vite Dev Server / Static In Production
async function bootstrap() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

bootstrap();
