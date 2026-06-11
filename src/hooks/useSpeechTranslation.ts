import { useState, useCallback, useRef } from "react";
import { speechServiceInstance, SpeechRecognitionState } from "../services/speech-service";
import { translateText } from "../services/translation-service";
import { SpeechState } from "../types";

export interface SpeechTranslationResult {
  originalText: string;
  translatedText: string;
  sourceLang: string;
  targetLang: string;
  sourceLangName: string;
  targetLangName: string;
}

export function useSpeechTranslation() {
  const [speechState, setSpeechState] = useState<SpeechState>("idle");
  const [speechTranscript, setSpeechTranscript] = useState("");
  const [speechError, setSpeechError] = useState("");
  const liveTranscriptRef = useRef("");

  const startListening = useCallback((langCode: string = "en-US") => {
    if (!speechServiceInstance.isSupported()) {
      setSpeechError("Speech recognition is not supported in this browser. Please use Google Chrome or Microsoft Edge.");
      setSpeechState("error");
      return;
    }

    setSpeechTranscript("");
    setSpeechError("");
    setSpeechState("listening");
    liveTranscriptRef.current = "";

    speechServiceInstance.start(langCode, {
      onStart: () => {
        setSpeechState("listening");
      },
      onResult: (transcript) => {
        setSpeechTranscript(transcript);
        liveTranscriptRef.current = transcript;
      },
      onError: (code, message) => {
        if (code === "aborted") {
          setSpeechState("idle");
          setSpeechError("");
        } else if (code === "no-speech") {
          setSpeechError(message);
          setSpeechState("idle");
        } else {
          setSpeechError(message);
          setSpeechState("error");
        }
      },
      onEnd: () => {
        // If state was listening, update appropriately
        setSpeechState((prev) => (prev === "listening" ? "idle" : prev));
      },
      onStateChange: (state: SpeechRecognitionState) => {
        if (state === "processing") {
          setSpeechState("processing");
        } else if (state === "error") {
          // If because of no-speech, state will be set to idle by onError
        }
      },
    });
  }, []);

  const stopListeningAndProcess = useCallback(async (
    targetLang: string,
    onSuccess?: (result: SpeechTranslationResult) => void
  ) => {
    if (speechState !== "listening") return;

    setSpeechState("processing");
    speechServiceInstance.stop({
      onStateChange: (state) => {
        if (state === "processing") setSpeechState("processing");
      }
    });

    const finalTranscriptText = liveTranscriptRef.current.trim();
    if (!finalTranscriptText) {
      setSpeechState("idle");
      return;
    }

    try {
      // 1) Submit transcript under "auto" detect source language
      const translateResult = await translateText(finalTranscriptText, "auto", targetLang);

      setSpeechState("success");

      if (onSuccess) {
         onSuccess({
           originalText: finalTranscriptText,
           translatedText: translateResult.translatedText,
           sourceLang: translateResult.detectedSourceLang,
           targetLang: targetLang,
           sourceLangName: translateResult.detectedSourceLangName,
           targetLangName: translateResult.detectedSourceLangName, // Use actual mapped name
         });
      }
    } catch (err: any) {
      console.error("[useSpeechTranslation] Processing failed:", err);
      setSpeechError(err?.message || "Failed to process audio translation model.");
      setSpeechState("error");
    }
  }, [speechState]);

  return {
    speechState,
    speechTranscript,
    speechError,
    startListening,
    stopListeningAndProcess,
    setSpeechState,
    setSpeechTranscript,
    setSpeechError,
  };
}
