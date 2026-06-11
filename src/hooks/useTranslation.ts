import { useState, useCallback } from "react";
import { translateText, TranslationResult } from "../services/translation-service";
import { TranslationState } from "../types";

export function useTranslation() {
  const [translationState, setTranslationState] = useState<TranslationState>("idle");
  const [translatedText, setTranslatedText] = useState("");
  const [detectedCode, setDetectedCode] = useState("");
  const [detectedName, setDetectedName] = useState("");
  const [confidence, setConfidence] = useState<number | null>(null);
  const [alternativePhrasings, setAlternativePhrasings] = useState<string[]>([]);
  const [pronunciation, setPronunciation] = useState("");
  const [explanation, setExplanation] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const translate = useCallback(async (text: string, sourceLang: string, targetLang: string) => {
    if (!text.trim()) {
      setErrorMessage("Please enter text of standard length.");
      setTranslationState("error");
      return null;
    }

    setTranslationState("translating");
    setErrorMessage("");
    setAlternativePhrasings([]);
    setPronunciation("");
    setExplanation("");

    try {
      const result: TranslationResult = await translateText(text, sourceLang, targetLang);
      
      setTranslatedText(result.translatedText);
      setDetectedCode(result.detectedSourceLang);
      setDetectedName(result.detectedSourceLangName);
      setConfidence(result.confidence);
      setAlternativePhrasings(result.alternatives || []);
      setPronunciation(result.pronunciation || "");
      setExplanation(result.explanation || "");
      setTranslationState("success");
      
      return result;
    } catch (err: any) {
      console.error("[useTranslation] Error translating:", err);
      const errMsg = err?.message || "Failed to parse API translation result. Please try again.";
      setErrorMessage(errMsg);
      setTranslationState("error");
      return null;
    }
  }, []);

  const resetTranslation = useCallback(() => {
    setTranslationState("idle");
    setTranslatedText("");
    setDetectedCode("");
    setDetectedName("");
    setConfidence(null);
    setAlternativePhrasings([]);
    setPronunciation("");
    setExplanation("");
    setErrorMessage("");
  }, []);

  return {
    translationState,
    translatedText,
    detectedCode,
    detectedName,
    confidence,
    alternativePhrasings,
    pronunciation,
    explanation,
    errorMessage,
    translate,
    resetTranslation,
    setTranslatedText,
    setDetectedCode,
    setDetectedName,
    setConfidence,
    setAlternativePhrasings,
    setPronunciation,
    setExplanation,
    setTranslationState,
  };
}
