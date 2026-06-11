export interface Language {
  code: string;
  name: string;
  nativeName?: string;
  flag?: string;
}

export interface TranslationRecord {
  id: string;
  originalText: string;
  translatedText: string;
  sourceLang: string;
  sourceLangName: string;
  targetLang: string;
  targetLangName: string;
  timestamp: number;
}

export interface TranslationStats {
  characterCount: number;
  wordCount: number;
  readingTime: number; // in seconds
  totalTranslations: number;
  totalSpeechTranslations: number;
}

export interface HistoryItem {
  id: string;
  originalText: string;
  translatedText: string;
  sourceLang: string;
  targetLang: string;
  sourceLangName: string;
  targetLangName: string;
  timestamp: number;
}

export type TranslationState = "idle" | "loading" | "translating" | "success" | "error";
export type SpeechState = "idle" | "listening" | "processing" | "success" | "error";
