import { useState, useEffect, useRef, useCallback } from "react";

export interface SpeakOptions {
  rate?: number;
  volume?: number;
  pitch?: number;
}

export function useSpeechSynthesis() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const synthRef = useRef<SpeechSynthesis | null>(null);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  // Initialize SpeechSynthesis and load voices
  useEffect(() => {
    if (typeof window !== "undefined" && window.speechSynthesis) {
      synthRef.current = window.speechSynthesis;
      
      const loadVoices = () => {
        if (synthRef.current) {
          setVoices(synthRef.current.getVoices());
        }
      };

      loadVoices();
      
      // Chrome/Safari load voices asynchronously
      if (window.speechSynthesis.onvoiceschanged !== undefined) {
        window.speechSynthesis.onvoiceschanged = loadVoices;
      }
    }

    return () => {
      if (synthRef.current) {
        synthRef.current.cancel();
      }
    };
  }, []);

  const stop = useCallback(() => {
    if (synthRef.current) {
      synthRef.current.cancel();
      setIsPlaying(false);
      setIsPaused(false);
    }
  }, []);

  const pause = useCallback(() => {
    if (synthRef.current && isPlaying && !isPaused) {
      synthRef.current.pause();
      setIsPaused(true);
    }
  }, [isPlaying, isPaused]);

  const resume = useCallback(() => {
    if (synthRef.current && isPaused) {
      synthRef.current.resume();
      setIsPaused(false);
    }
  }, [isPaused]);

  /**
   * Speak function that handles automatic voice selection based on target language code.
   */
  const speak = useCallback((
    text: string,
    langCode: string,
    options: SpeakOptions = {}
  ) => {
    if (!synthRef.current || !text.trim()) return;

    // Direct cancel previous playback
    synthRef.current.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utteranceRef.current = utterance;

    // Speech properties
    utterance.volume = options.volume ?? 1.0;
    utterance.rate = options.rate ?? 1.0;
    utterance.pitch = options.pitch ?? 1.0;

    // Automatic voice matched to language
    const availableVoices = synthRef.current.getVoices();
    const cleanLang = langCode.split("-")[0].toLowerCase();
    
    const matchingVoice = availableVoices.find(
      (v) => v.lang.toLowerCase() === cleanLang || v.lang.toLowerCase().startsWith(cleanLang)
    );

    if (matchingVoice) {
      utterance.voice = matchingVoice;
    }

    utterance.onstart = () => {
      setIsPlaying(true);
      setIsPaused(false);
    };

    utterance.onend = () => {
      setIsPlaying(false);
      setIsPaused(false);
    };

    utterance.onerror = (event) => {
      // Ignore boundary errors or user-cancels which are benign
      if (event.error !== "interrupted") {
        console.error("Speech Synthesis Utterance error:", event);
      }
      setIsPlaying(false);
      setIsPaused(false);
    };

    synthRef.current.speak(utterance);
  }, []);

  return {
    isPlaying,
    isPaused,
    voices,
    speak,
    pause,
    resume,
    stop,
  };
}
