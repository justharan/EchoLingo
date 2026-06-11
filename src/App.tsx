import React, { useState, useEffect, useRef } from "react";
import {
  ArrowLeftRight,
  Sparkles,
  Volume2,
  Copy,
  Download,
  Trash2,
  Share2,
  Mic,
  MicOff,
  Activity,
  Maximize2,
  X,
  Languages,
  Check,
  ChevronDown,
  Info,
  Clock,
  Play,
  Pause,
  AlertCircle,
  HelpCircle,
  Volume1,
  Lock,
  Search,
  BookOpen,
  ArrowLeft,
  MessageSquare,
  FileText,
} from "lucide-react";
import Navbar from "./components/Navbar";
import Hero from "./components/Hero";
import Features from "./components/Features";
import About from "./components/About";
import LanguagesShowcase from "./components/LanguagesShowcase";
import ShortcutsModal from "./components/ShortcutsModal";
import HistoryList from "./components/HistoryList";
import { SUPPORTED_LANGUAGES, getLanguageName, getLanguageFlag } from "./languages";
import { HistoryItem, TranslationState, SpeechState } from "./types";
import { translateText } from "./services/translation-service";
import { storageService } from "./services/storage-service";

export default function App() {
  // Theme state
  const [isDark, setIsDark] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("lingua-theme");
      if (saved) return saved === "dark";
      return window.matchMedia("(prefers-color-scheme: dark)").matches;
    }
    return true;
  });

  // Routing & View Tab controls
  const [activeView, setActiveView] = useState<"landing" | "workspace">("landing");
  const [workspaceActiveTab, setWorkspaceActiveTab] = useState<"text" | "speech">("text");

  // Main UI form state
  const [inputText, setInputText] = useState("");
  const [translatedText, setTranslatedText] = useState("");
  const [sourceLang, setSourceLang] = useState("auto");
  const [targetLang, setTargetLang] = useState("es");
  const [detectedLangName, setDetectedLangName] = useState("");
  const [detectedLangCode, setDetectedLangCode] = useState("");
  const [detectedConfidence, setDetectedConfidence] = useState<number | null>(null);

  // Stats block
  const [characterCount, setCharacterCount] = useState(0);
  const [wordCount, setWordCount] = useState(0);
  const [readingTime, setReadingTime] = useState(0);
  const [statTotalTranslations, setStatTotalTranslations] = useState(() => {
    return Number(localStorage.getItem("stat-total-translations") || "0");
  });
  const [statTotalSpeech, setStatTotalSpeech] = useState(() => {
    return Number(localStorage.getItem("stat-total-speech") || "0");
  });

  // Extra translated items from backend Gemini JSON payload
  const [alternativePhrasings, setAlternativePhrasings] = useState<string[]>([]);
  const [pronunciationText, setPronunciationText] = useState("");
  const [educationalExplanation, setEducationalExplanation] = useState("");

  // States & Statuses
  const [translationState, setTranslationState] = useState<TranslationState>("idle");
  const [speechState, setSpeechState] = useState<SpeechState>("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [toastMessage, setToastMessage] = useState("");
  const [speechError, setSpeechError] = useState("");

  // Recently & Pinned languages
  const [pinnedLanguages, setPinnedLanguages] = useState<string[]>(() => {
    const saved = localStorage.getItem("pinned-languages");
    return saved ? JSON.parse(saved) : ["en", "es", "fr", "de", "ja"];
  });

  // History system
  const [history, setHistory] = useState<HistoryItem[]>(() => {
    const saved = localStorage.getItem("translation-history");
    return saved ? JSON.parse(saved) : [];
  });

  // Modal displays
  const [isShortcutsOpen, setIsShortcutsOpen] = useState(false);

  // Audio / Speech Synthesis Control States
  const [ttsRate, setTtsRate] = useState(1.0); // speech speed
  const [ttsVolume, setTtsVolume] = useState(1.0); // speech volume
  const [ttsIsPlaying, setTtsIsPlaying] = useState(false);
  const synthRef = useRef<SpeechSynthesis | null>(null);
  const currentUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  // Speech Recognition Speech-To-Text items
  const recognitionRef = useRef<any>(null);
  const isListeningRef = useRef<boolean>(false);
  const [speechTranscript, setSpeechTranscript] = useState("");
  const [speechDestinationLang, setSpeechDestinationLang] = useState("en");

  // Sync total state updates
  useEffect(() => {
    const chars = inputText.length;
    const words = inputText.trim() === "" ? 0 : inputText.trim().split(/\s+/).length;
    // Standard reading speed is roughly 200 words-per-minute = ~3.3 words per second
    const estTime = Math.ceil(words / 3.3);
    
    setCharacterCount(chars);
    setWordCount(words);
    setReadingTime(estTime);
  }, [inputText]);

  // Sync Pinned & History changes to LocalStorage
  useEffect(() => {
    localStorage.setItem("pinned-languages", JSON.stringify(pinnedLanguages));
  }, [pinnedLanguages]);

  useEffect(() => {
    localStorage.setItem("translation-history", JSON.stringify(history));
  }, [history]);

  useEffect(() => {
    localStorage.setItem("stat-total-translations", statTotalTranslations.toString());
  }, [statTotalTranslations]);

  useEffect(() => {
    localStorage.setItem("stat-total-speech", statTotalSpeech.toString());
  }, [statTotalSpeech]);

  // Adjust theme on body
  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("lingua-theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("lingua-theme", "light");
    }
  }, [isDark]);

  // Setup Web Speech Recognition API if supported on startup
  useEffect(() => {
    if (typeof window !== "undefined") {
      synthRef.current = window.speechSynthesis;
      const SpeechRecognitionConstructor =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      
      if (SpeechRecognitionConstructor) {
        const rec = new SpeechRecognitionConstructor();
        rec.continuous = true;
        rec.interimResults = true;
        // Auto detect base languages when speaking
        rec.lang = "en-US";

        rec.onstart = () => {
          isListeningRef.current = true;
          setSpeechState("listening");
          setSpeechError("");
          setSpeechTranscript("");
        };

        rec.onresult = (event: any) => {
          let interimTranscript = "";
          let finalTranscript = "";

          for (let i = event.resultIndex; i < event.results.length; ++i) {
            if (event.results[i].isFinal) {
              finalTranscript += event.results[i][0].transcript;
            } else {
              interimTranscript += event.results[i][0].transcript;
            }
          }

          const transcriptStr = finalTranscript || interimTranscript;
          if (transcriptStr) {
            setSpeechTranscript(transcriptStr);
          }
        };

        rec.onerror = (event: any) => {
          console.error("Speech Recognition Error:", event.error);
          isListeningRef.current = false;
          if (event.error === "no-speech") {
            setSpeechError("No speech detected. Please check your mic or speak more clearly.");
            setSpeechState("idle");
          } else if (event.error === "aborted") {
            // Speech recognition stopped or aborted by browser/user; resolve silently
            setSpeechState("idle");
          } else if (event.error === "audio-capture") {
            setSpeechError("Microphone not found or could not be accessed.");
            setSpeechState("error");
          } else if (event.error === "not-allowed") {
            setSpeechError("Microphone permission was denied.");
            setSpeechState("error");
          } else {
            setSpeechError(`Speech recognition failed: ${event.error}`);
            setSpeechState("error");
          }
        };

        rec.onend = () => {
          isListeningRef.current = false;
          // If state is still listening, user might have stopped manually or auto-timedout
          setSpeechState((prev) => {
            if (prev === "listening") {
              return "idle";
            }
            return prev;
          });
        };

        recognitionRef.current = rec;
      }
    }

    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {}
      }
    };
  }, []);

  // Keyboard Shortcuts Listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl + Enter -> Translate
      if (e.ctrlKey && e.key === "Enter") {
        e.preventDefault();
        triggerTranslation();
      }
      // Ctrl + Shift + S -> Toggle Speech Recognition
      if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === "s") {
        e.preventDefault();
        toggleSpeechRecording();
      }
      // Esc -> Stop Recording
      if (e.key === "Escape") {
        if (recognitionRef.current && (speechState === "listening" || isListeningRef.current)) {
          isListeningRef.current = false;
          try {
            recognitionRef.current.stop();
          } catch (stopErr) {}
          setSpeechState("idle");
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [inputText, sourceLang, targetLang, speechState, speechTranscript, speechDestinationLang]);

  // Main translation function
  const triggerTranslation = async () => {
    if (!inputText.trim()) {
      showToast("Please provide source text to translate.");
      return;
    }

    setTranslationState("translating");
    setErrorMessage("");
    // Clear residual extra data
    setAlternativePhrasings([]);
    setPronunciationText("");
    setEducationalExplanation("");

    try {
      const data = await translateText(inputText, sourceLang, targetLang);

      setTranslatedText(data.translatedText);
      setDetectedLangCode(data.detectedSourceLang || "");
      setDetectedLangName(data.detectedSourceLangName || "");
      setDetectedConfidence(data.confidence || 1.0);

      if (data.alternatives && Array.isArray(data.alternatives)) {
        setAlternativePhrasings(data.alternatives);
      }
      if (data.pronunciation) {
        setPronunciationText(data.pronunciation);
      }
      if (data.explanation) {
        setEducationalExplanation(data.explanation);
      }

      setTranslationState("success");
      setStatTotalTranslations((prev) => prev + 1);

      // Save to localStorage history (maintain max 20 entries) using storageService helper
      const updatedHistory = storageService.saveHistoryItem(
        inputText,
        data.translatedText,
        sourceLang === "auto" ? data.detectedSourceLang || "en" : sourceLang,
        targetLang,
        sourceLang === "auto" ? data.detectedSourceLangName || "Detected" : getLanguageName(sourceLang),
        getLanguageName(targetLang)
      );

      setHistory(updatedHistory);

    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message || "An unexpected error occurred during translation.");
      setTranslationState("error");
    }
  };

  // Switch source and target languages
  const swapLanguages = () => {
    if (sourceLang === "auto") {
      // Cannot swap "auto" directly with high precision, default auto to another
      setSourceLang(targetLang);
      setTargetLang("en");
    } else {
      const temp = sourceLang;
      setSourceLang(targetLang);
      setTargetLang(temp);
    }
    // Swap contents as well if translated exists
    if (translatedText) {
      setInputText(translatedText);
      setTranslatedText(inputText);
    }
  };

  // Copy output text helper
  const handleCopy = (text: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    showToast("Successfully copied translation result to clipboard.");
  };

  // Pin / Pinned languages helper
  const togglePinLanguage = (code: string) => {
    if (pinnedLanguages.includes(code)) {
      if (pinnedLanguages.length <= 1) {
        showToast("You need at least one pinned lang.");
        return;
      }
      setPinnedLanguages(pinnedLanguages.filter((c) => c !== code));
    } else {
      setPinnedLanguages([...pinnedLanguages, code]);
    }
  };

  // Download TXT file helper
  const handleDownload = () => {
    if (!inputText || !translatedText) {
      showToast("Requires source input and successful translation output before writing files.");
      return;
    }

    const todayStr = new Date().toISOString().split("T")[0];
    const fileName = `translation-${todayStr}.txt`;
    const srcName = sourceLang === "auto" ? `${detectedLangName} (detected)` : getLanguageName(sourceLang);
    const trgName = getLanguageName(targetLang);

    const content = `============================
LINGUAAI TRANSLATOR EXPORT
============================
Date/Time: ${new Date().toLocaleString()}
Language Combination: ${srcName} → ${trgName}

--- ORIGINAL TEXT ---
${inputText}

--- TRANSLATED TEXT ---
${translatedText}

${pronunciationText ? `\n--- PRONUNCIATION / TRANSLITERATION ---\n${pronunciationText}` : ""}
${educationalExplanation ? `\n--- ENRICHED NOTES ---\n${educationalExplanation}` : ""}

============================
Generated instantly by Echo Lingo.
`;

    const blob = new Blob([content], { type: "text/plain;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", fileName);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast(`Saved text transcript block in ${fileName}`);
  };

  // Share link helper
  const handleShare = () => {
    if (!translatedText) return;
    const shareText = `Check out this translation generated with Echo Lingo:\n\nOriginal: "${inputText}"\n\nTranslated: "${translatedText}"`;
    if (navigator.share) {
      navigator.share({
        title: "Echo Lingo Translation Output",
        text: shareText,
        url: window.location.href,
      }).catch(console.error);
    } else {
      navigator.clipboard.writeText(shareText);
      showToast("Share text bundle copied to clipboard successfully!");
    }
  };

  // Text-To-Speech Playback
  const handleSpeakText = (text: string, langCode: string) => {
    if (!synthRef.current || !text) return;

    // If currently talking, pause or stop
    if (ttsIsPlaying) {
      synthRef.current.cancel();
      setTtsIsPlaying(false);
      return;
    }

    const utterance = new SpeechSynthesisUtterance(text);
    
    // Choose appropriate voice for target code (e.g. es, fr, etc)
    const voices = synthRef.current.getVoices();
    // Match language code
    const matchingVoice = voices.find((v) => v.lang.startsWith(langCode));
    if (matchingVoice) {
      utterance.voice = matchingVoice;
    }

    utterance.volume = ttsVolume;
    utterance.rate = ttsRate;

    utterance.onstart = () => {
      setTtsIsPlaying(true);
    };

    utterance.onend = () => {
      setTtsIsPlaying(false);
    };

    utterance.onerror = (e) => {
      console.error(e);
      setTtsIsPlaying(false);
    };

    currentUtteranceRef.current = utterance;
    synthRef.current.speak(utterance);
  };

  // Toast System
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage("");
    }, 4500);
  };

  // Speech Recording toggle
  const toggleSpeechRecording = () => {
    if (!recognitionRef.current) {
      setSpeechError("Speech recognition API is unsupported on this mobile or browser build. Please load in Google Chrome.");
      return;
    }

    if (speechState === "listening" || isListeningRef.current) {
      isListeningRef.current = false;
      try {
        recognitionRef.current.stop();
      } catch (e) {
        console.warn("Speech API stop warning:", e);
      }
      setSpeechState("processing");
      processSpeechInput();
    } else {
      // Reset variables
      setSpeechTranscript("");
      setSpeechError("");
      isListeningRef.current = true;
      try {
        recognitionRef.current.start();
      } catch (err: any) {
        if (err && err.message && err.message.includes("already started")) {
          console.warn("Speech recognition already start-active, ignoring duplicate call.");
        } else {
          isListeningRef.current = false;
          console.error("Failed to start listener:", err);
        }
      }
    }
  };

  // Process Speech Input and Auto Translate in speech translation block
  const processSpeechInput = async () => {
    if (!speechTranscript.trim()) {
      setSpeechState("idle");
      return;
    }

    setSpeechState("processing");
    try {
      // 1) Translate spoken sentence to user's specified speech target language
      const result = await translateText(speechTranscript, "auto", speechDestinationLang);

      // Trigger automatic TTS feedback for fully integrated Speech-to-Speech loop
      handleSpeakText(result.translatedText, speechDestinationLang);

      // Append result into general input workspace to let user play with it
      setInputText(speechTranscript);
      setTranslatedText(result.translatedText);
      setSourceLang(result.detectedSourceLang || "en");
      setTargetLang(speechDestinationLang);
      setDetectedLangName(result.detectedSourceLangName || "");
      setDetectedConfidence(result.confidence || 1.0);

      setSpeechState("success");
      setStatTotalSpeech((prev) => prev + 1);

      // Add to general translation history using storageService helper
      const updatedHistory = storageService.saveHistoryItem(
        speechTranscript,
        result.translatedText,
        result.detectedSourceLang || "en",
        speechDestinationLang,
        result.detectedSourceLangName || "Speech Detect",
        getLanguageName(speechDestinationLang)
      );

      setHistory(updatedHistory);

      showToast("Speech translation complete! Spoken audio response generated.");

    } catch (err: any) {
      console.error(err);
      setSpeechError(err.message || "Failed to process neural speech translation model.");
      setSpeechState("error");
    }
  };

  // Handle select from historical search list
  const handleSelectHistoryItem = (item: HistoryItem) => {
    setInputText(item.originalText);
    setTranslatedText(item.translatedText);
    setSourceLang(item.sourceLang);
    setTargetLang(item.targetLang);
    
    // Smooth scroll back to translator layout
    const workspaceElement = document.getElementById("translator-workspace");
    if (workspaceElement) {
      workspaceElement.scrollIntoView({ behavior: "smooth", block: "center" });
    }
    showToast("Restored translation record from history storage.");
  };  const handleViewChange = (view: "landing" | "workspace", options?: { focusSpeech?: boolean }) => {
    setActiveView(view);
    if (view === "workspace") {
      setWorkspaceActiveTab(options?.focusSpeech ? "speech" : "text");
      // Scroll to workspace header
      setTimeout(() => {
        const workspaceHeader = document.getElementById("workspace-header");
        if (workspaceHeader) {
          workspaceHeader.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      }, 50);
    }
  };

  return (
    <div className={`min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 font-sans transition-colors duration-300 relative`}>
      {/* Toast Notification Box */}
      {toastMessage && (
        <div id="toast-notif" className="fixed bottom-6 right-6 z-50 px-5 py-3.5 rounded-2xl bg-slate-900 text-white dark:bg-white dark:text-slate-950 font-semibold text-xs sm:text-sm shadow-2xl flex items-center gap-2 border border-slate-800 dark:border-slate-200 animate-bounce">
          <Sparkles className="w-4 h-4 text-amber-400" />
          <span>{toastMessage}</span>
          <button onClick={() => setToastMessage("")} className="ml-2 font-bold p-1 hover:opacity-75">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Background radial glows for premium feeling */}
      <div className="absolute top-0 right-0 w-[50%] h-[500px] bg-gradient-to-l from-indigo-500/5 to-transparent rounded-full blur-[100px] pointer-events-none -z-10" />
      <div className="absolute top-[1000px] left-0 w-[40%] h-[600px] bg-gradient-to-r from-sky-400/5 to-transparent rounded-full blur-[120px] pointer-events-none -z-10" />

      {/* Navbar Section */}
      <Navbar
        isDark={isDark}
        onToggleTheme={() => setIsDark(!isDark)}
        onOpenShortcuts={() => setIsShortcutsOpen(true)}
        activeView={activeView}
        onViewChange={handleViewChange}
      />

      {activeView === "landing" ? (
        <div className="pt-16">
          {/* Hero Section */}
          <Hero
            onStartTranslate={() => handleViewChange("workspace", { focusSpeech: false })}
            onStartSpeech={() => handleViewChange("workspace", { focusSpeech: true })}
          />

          {/* Product Features Showroom */}
          <Features />

          {/* About Section */}
          <About onGoToTranslate={() => handleViewChange("workspace", { focusSpeech: false })} />

          {/* Supported Languages Showcase Grid Section */}
          <LanguagesShowcase
            onSelectLanguage={(code, type) => {
              if (type === "source") setSourceLang(code);
              else setTargetLang(code);
              handleViewChange("workspace", { focusSpeech: false });
            }}
          />
        </div>
      ) : (
        /* Main Workspace Frame */
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-6 relative z-10" id="translator-workspace">
          
          {/* Workspace Controls Header */}
          <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200/60 dark:border-slate-800/60 pb-6 animate-pulse-subtle" id="workspace-header">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setActiveView("landing")}
                className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-850 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition shadow-sm cursor-pointer flex items-center gap-1.5 text-xs font-bold"
              >
                <ArrowLeft className="w-4 h-4 text-indigo-500" />
                <span>Exit Workspace</span>
              </button>
              <div>
                <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                  Echo Lingo Translation Workspace
                </h1>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold">
                  Secure local translation pipeline with instant neural insights.
                </p>
              </div>
            </div>

            {/* TAB SELECTORS */}
            <div className="flex bg-slate-100/80 dark:bg-slate-900 p-1.5 rounded-2xl border border-slate-200/50 dark:border-slate-805 w-fit shrink-0">
              <button
                onClick={() => setWorkspaceActiveTab("text")}
                className={`px-4 py-2 rounded-xl text-xs font-black transition-all duration-200 flex items-center gap-2 cursor-pointer ${
                  workspaceActiveTab === "text"
                    ? "bg-white dark:bg-slate-800 text-indigo-600 dark:text-sky-300 shadow-md"
                    : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                }`}
              >
                <FileText className="w-3.5 h-3.5 text-indigo-500 dark:text-sky-400" />
                <span>Text Workspace</span>
              </button>
              <button
                onClick={() => setWorkspaceActiveTab("speech")}
                className={`px-4 py-2 rounded-xl text-xs font-black transition-all duration-200 flex items-center gap-2 cursor-pointer ${
                  workspaceActiveTab === "speech"
                    ? "bg-white dark:bg-slate-800 text-indigo-600 dark:text-sky-300 shadow-md"
                    : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                }`}
              >
                <MessageSquare className="w-3.5 h-3.5 text-indigo-500 dark:text-sky-400" />
                <span>Continuous Voice</span>
              </button>
            </div>
          </div>

          {/* Translation Card Container with standard Grid Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
            
            {/* Form Side (2 Columns broad on large displays) */}
            <div className="lg:col-span-2 space-y-6">
              
              {workspaceActiveTab === "text" ? (
                /* The interactive glassmorphism card container */
                <div className="bg-white dark:bg-slate-900/60 backdrop-blur-md rounded-3xl border border-slate-100 dark:border-slate-800 shadow-xl overflow-hidden shadow-indigo-950/5 dark:shadow-none">
                  
                  {/* Card top bar selector */}
                  <div className="flex items-center justify-between px-6 py-4 bg-slate-50/50 dark:bg-slate-900/40 border-b border-slate-100 dark:border-slate-800/80">
                    
                    {/* SOURCE LANGUAGE DROPDOWN */}
                    <div className="flex items-center gap-1 sm:gap-2">
                      <div className="relative">
                        <select
                          id="source-language-selector"
                          value={sourceLang}
                          onChange={(e) => setSourceLang(e.target.value)}
                          className="appearance-none font-semibold text-xs sm:text-sm text-slate-800 dark:text-slate-100 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700/80 hover:border-slate-300 dark:hover:border-slate-600 px-3.5 py-2 pr-9 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/10 cursor-pointer"
                        >
                          <option value="auto">🌐 Auto Detect Language</option>
                          {SUPPORTED_LANGUAGES.map((lang) => (
                            <option key={lang.code} value={lang.code}>
                              {lang.flag} {lang.name} ({lang.nativeName})
                            </option>
                          ))}
                        </select>
                        <ChevronDown className="w-4 h-4 text-slate-500 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                      </div>
                    </div>

                    {/* SWAP BUTTON */}
                    <button
                      id="swap-languages-btn"
                      onClick={swapLanguages}
                      className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 hover:scale-105 active:scale-95 text-indigo-600 dark:text-sky-400 font-semibold transition"
                      title="Swap languages"
                    >
                      <ArrowLeftRight className="w-4 h-4" />
                    </button>

                    {/* TARGET LANGUAGE DROPDOWN */}
                    <div className="flex items-center gap-1 sm:gap-2">
                      <div className="relative">
                        <select
                          id="target-language-selector"
                          value={targetLang}
                          onChange={(e) => setTargetLang(e.target.value)}
                          className="appearance-none font-semibold text-xs sm:text-sm text-slate-800 dark:text-slate-100 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700/80 hover:border-slate-300 dark:hover:border-slate-600 px-3.5 py-2 pr-9 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/10 cursor-pointer"
                        >
                          {SUPPORTED_LANGUAGES.map((lang) => (
                            <option key={lang.code} value={lang.code}>
                              {lang.flag} {lang.name}
                            </option>
                          ))}
                        </select>
                        <ChevronDown className="w-4 h-4 text-slate-500 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                      </div>
                    </div>
                  </div>

                  {/* Quick accessible suggestions / Favorites */}
                  <div className="px-6 py-2.5 bg-slate-50/20 dark:bg-slate-900/10 border-b border-indigo-500/5 flex flex-wrap items-center gap-1.5 text-xs">
                    <span className="text-slate-400 font-semibold dark:text-slate-500 mr-1.5">Quick select target:</span>
                    {pinnedLanguages.map((code) => (
                      <button
                        key={code}
                        onClick={() => setTargetLang(code)}
                        className={`px-2.5 py-1 rounded-lg font-bold border transition flex items-center gap-1 cursor-pointer ${
                          targetLang === code
                            ? "bg-indigo-50 border-indigo-200 text-indigo-700 dark:bg-indigo-950/40 dark:border-indigo-800 dark:text-sky-300"
                            : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50 dark:bg-slate-800 dark:border-slate-750 dark:text-slate-300"
                        }`}
                      >
                        <span>{getLanguageFlag(code)}</span>
                        <span>{getLanguageName(code)}</span>
                      </button>
                    ))}
                    
                    {/* Quick select source language pin controls */}
                    <span className="text-slate-300 dark:text-slate-700 mx-2">|</span>
                    <span className="text-slate-400 font-semibold dark:text-slate-500 mr-1.5">Quick source:</span>
                    {["en", "es", "fr", "ja"].map((code) => (
                      <button
                        key={code}
                        onClick={() => setSourceLang(code)}
                        className={`px-2 py-0.5 rounded-lg border transition ${
                          sourceLang === code
                            ? "bg-indigo-50 border-indigo-200 text-indigo-700 dark:bg-indigo-950/40 dark:border-indigo-800 dark:text-sky-300"
                            : "bg-transparent border-transparent text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                        }`}
                      >
                        {getLanguageName(code)}
                      </button>
                    ))}
                  </div>

                  {/* Text Writing Workspace Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-slate-100 dark:divide-slate-800">
                    
                    {/* SOURCE AREA */}
                    <div className="p-6 relative flex flex-col justify-between min-h-[280px]">
                      <textarea
                        id="translation-input-textarea"
                        placeholder="Type or paste text to translate... (Ctrl + Enter)"
                        value={inputText}
                        onChange={(e) => setInputText(e.target.value)}
                        maxLength={5000}
                        className="w-full h-48 bg-transparent text-slate-900 dark:text-white font-normal text-sm sm:text-base focus:outline-none resize-none placeholder:text-slate-400 dark:placeholder:text-slate-500"
                      />
                      
                      {/* Action row counter */}
                      <div className="flex items-center justify-between text-xs text-slate-400 dark:text-slate-500 pt-4 font-semibold">
                        <div className="flex items-center gap-3">
                          <span>{characterCount}/5000 characters</span>
                          <span>{wordCount} words</span>
                        </div>
                        {inputText && (
                          <button
                            id="clear-input-workspace"
                            onClick={() => {
                              setInputText("");
                              setTranslatedText("");
                              setAlternativePhrasings([]);
                              setPronunciationText("");
                              setEducationalExplanation("");
                            }}
                            className="text-slate-400 hover:text-rose-500 transition font-bold"
                          >
                            Clear Text
                          </button>
                        )}
                      </div>
                    </div>

                    {/* TARGET OUTPUT AREA */}
                    <div className="p-6 relative bg-slate-50/30 dark:bg-slate-900/30 min-h-[280px] flex flex-col justify-between">
                      <div>
                        {translationState === "translating" ? (
                          <div className="flex flex-col items-center justify-center h-40 space-y-3">
                            <Activity className="w-8 h-8 text-indigo-500 animate-spin" />
                            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                              Neural network thinking and parsing translation...
                            </p>
                          </div>
                        ) : translatedText ? (
                          <div>
                            {/* Pronunciation guide shown above if available */}
                            {pronunciationText && (
                              <div className="mb-2 p-1.5 rounded-lg bg-indigo-500/5 text-indigo-600 dark:text-sky-300 text-xs font-semibold tracking-wide italic">
                                Phonetics: [{pronunciationText}]
                              </div>
                            )}
                            
                            <p className="text-slate-900 dark:text-white font-bold text-sm sm:text-base whitespace-pre-wrap">
                              {translatedText}
                            </p>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center justify-center h-40 text-slate-350 dark:text-slate-600">
                            <p className="text-sm font-medium">Translation result will render instantly.</p>
                            <p className="text-xs mt-1 text-slate-400 dark:text-slate-500">
                              Configure languages and click Translate.
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Detected source language badge if auto selected */}
                      {sourceLang === "auto" && detectedLangName && (
                        <div className="mt-4 px-3 py-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-100/50 dark:border-indigo-900/30 text-xs text-indigo-800 dark:text-sky-300 font-bold w-fit">
                          Detected: {detectedLangName} ({Math.round(detectedConfidence ? detectedConfidence * 100 : 98)}% confidence)
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Main Action Bar for translator */}
                  <div className="px-6 py-4 bg-slate-50/50 dark:bg-slate-900/40 border-t border-slate-100 dark:border-slate-800/80 flex flex-col sm:flex-row gap-3 sm:items-center justify-between">
                    
                    {/* Action buttons (copy, voice, download, share) */}
                    <div className="flex items-center gap-2">
                      <button
                        id="speak-translated-btn"
                        onClick={() => handleSpeakText(translatedText, targetLang)}
                        disabled={!translatedText}
                        className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-700/80 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-sky-450 hover:bg-slate-50 disabled:opacity-40 transition-all cursor-pointer flex items-center gap-1.5 text-xs font-bold"
                        title="Speak output text"
                      >
                        {ttsIsPlaying ? (
                          <>
                            <Pause className="w-4 h-4 text-rose-500" />
                            <span>Speaking...</span>
                          </>
                        ) : (
                          <>
                            <Volume2 className="w-4 h-4 text-indigo-500" />
                            <span>Listen</span>
                          </>
                        )}
                      </button>

                      <button
                        id="copy-translated-btn"
                        onClick={() => handleCopy(translatedText)}
                        disabled={!translatedText}
                        className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-700/80 bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-sky-450 hover:bg-slate-50 disabled:opacity-40 transition"
                        title="Copy full translation"
                      >
                        <Copy className="w-4 h-4" />
                      </button>

                      <button
                        id="download-transcript-btn"
                        onClick={handleDownload}
                        disabled={!translatedText}
                        className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-700/80 bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-sky-450 hover:bg-slate-50 disabled:opacity-40 transition"
                        title="Download transcript text document (.txt)"
                      >
                        <Download className="w-4 h-4" />
                      </button>

                      <button
                        id="share-translated-btn"
                        onClick={handleShare}
                        disabled={!translatedText}
                        className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-700/80 bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-sky-450 hover:bg-slate-50 disabled:opacity-40 transition"
                        title="Share translation package"
                      >
                        <Share2 className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Primary Translate Trigger button */}
                    <button
                      id="trigger-translation-btn"
                      onClick={triggerTranslation}
                      disabled={translationState === "translating"}
                      className="bg-indigo-600 hover:bg-indigo-500 hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 text-white font-bold text-xs sm:text-sm px-6 py-3 rounded-xl shadow-lg shadow-indigo-600/10 hover:shadow-indigo-600/20 transition-all cursor-pointer flex items-center justify-center gap-2 shrink-0 font-sans"
                    >
                      <Sparkles className="w-4 h-4 text-amber-300" />
                      <span>Translate Text</span>
                    </button>
                  </div>
                </div>
              ) : (
                /* Dedicated SPEECH-TO-TEXT AND SPEECH-TO-SPEECH translation module */
                <div id="speech-translation" className="p-6 sm:p-8 rounded-3xl bg-gradient-to-tr from-indigo-950 via-slate-900 to-indigo-900 text-white border border-indigo-800/20 shadow-2xl relative overflow-hidden animate-pulse-subtle">
                  {/* Backglow decor */}
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-indigo-500/10 rounded-full blur-[80px]" />

                  <div className="relative z-10 flex flex-col md:flex-row justify-between gap-6 md:items-center">
                    <div className="max-w-md">
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-indigo-500/25 border border-indigo-500/20 text-[10px] font-bold text-sky-300 uppercase tracking-widest mb-3 mb-2">
                        <span className="w-1.5 h-1.5 bg-sky-400 rounded-full animate-ping" />
                        <span>Instant Speech Translation Unit</span>
                      </div>
                      <h3 className="text-lg sm:text-xl font-bold tracking-tight">Speak Naturally, Translate Instantly</h3>
                      <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                        Voice translation converts speech immediately into translated output text & plays spoken response files automatically using neural target matching.
                      </p>
                    </div>

                    {/* Speech Target selector */}
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-xs text-slate-300 font-medium">Translate to:</span>
                      <div className="relative">
                        <select
                          id="speech-destination-lang-selector"
                          value={speechDestinationLang}
                          onChange={(e) => setSpeechDestinationLang(e.target.value)}
                          className="appearance-none font-semibold text-xs bg-slate-800 text-white border border-slate-700 px-3 py-2 pr-8 rounded-xl focus:outline-none focus:ring-1 focus:ring-sky-400 cursor-pointer"
                        >
                          {SUPPORTED_LANGUAGES.map((lang) => (
                            <option key={lang.code} value={lang.code}>
                              {lang.flag} {lang.name}
                            </option>
                          ))}
                        </select>
                        <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                      </div>
                    </div>
                  </div>

                  {/* Speech action area */}
                  <div className="mt-8 relative z-10 grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t border-indigo-500/20 items-center">
                    
                    {/* Voice button and signal visualizer */}
                    <div className="flex flex-col items-center justify-center bg-slate-900/40 backdrop-blur-sm px-6 py-8 rounded-2xl border border-indigo-500/10 relative min-h-[200px]">
                      
                      {/* Waveform graphic when listening */}
                      {speechState === "listening" && (
                        <div className="flex items-center gap-1 mb-6 h-8">
                          <div className="w-1 bg-sky-400 h-6 animate-pulse" />
                          <div className="w-1 bg-sky-300 h-4 animate-bounce" />
                          <div className="w-1 bg-indigo-400 h-8 animate-pulse" />
                          <div className="w-1 bg-indigo-300 h-5 animate-bounce" />
                          <div className="w-1 bg-sky-400 h-7 animate-pulse" />
                        </div>
                      )}

                      {/* Speech Switch Trigger */}
                      <button
                        id="toggle-speech-recording-btn"
                        onClick={toggleSpeechRecording}
                        className={`p-6 rounded-full relative z-10 transition-all duration-300 ${
                          speechState === "listening"
                            ? "bg-rose-500 shadow-xl shadow-rose-500/30 scale-105"
                            : "bg-indigo-600 hover:bg-indigo-500 shadow-lg shadow-indigo-600/20"
                        } hover:scale-110 active:scale-95 cursor-pointer`}
                      >
                        {speechState === "listening" ? (
                          <MicOff className="w-8 h-8 text-white" />
                        ) : (
                          <Mic className="w-8 h-8 text-white" />
                        )}
                      </button>

                      <span className="text-center font-bold text-xs mt-4">
                        {speechState === "listening" ? (
                          <span className="text-rose-400 animate-pulse">Recording... Press to STOP and PROCESS</span>
                        ) : speechState === "processing" ? (
                          <span className="text-amber-400">Processing audio with Echo Lingo...</span>
                        ) : (
                          <span className="text-slate-300">Click to record translation (Ctrl+Shift+S)</span>
                        )}
                      </span>

                      {speechError && (
                        <p className="text-[11px] text-rose-400 font-semibold mt-2 text-center">{speechError}</p>
                      )}
                    </div>

                    {/* Subtitle / Live transcription transcript rendering */}
                    <div className="p-5 rounded-2xl bg-black/30 border border-slate-800 text-sm h-full flex flex-col justify-between min-h-[200px]">
                      <div>
                        <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Live Transcript Speech Output:</h4>
                        {speechTranscript ? (
                          <p className="text-slate-100 font-semibold line-clamp-4 leading-relaxed">
                            "{speechTranscript}"
                          </p>
                        ) : (
                          <p className="text-slate-500 text-xs italic">
                            Spoken transcript will render here in real-time as you express speech. Try saying "Hello my friend, how are you today?"
                          </p>
                        )}
                      </div>

                      {speechState === "success" && (
                        <div className="mt-4 pt-4 border-t border-slate-800 text-xs text-sky-400 flex items-center gap-1.5 font-bold">
                          <Check className="w-3.5 h-3.5" />
                          <span>Audio conversion paired & played back!</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* TTS Controls (Advanced Pitch Adjustment options) */}
                  <div className="mt-6 p-4 rounded-2xl bg-indigo-950/40 border border-indigo-900/40 text-xs relative z-10 flex flex-wrap items-center justify-between gap-4">
                    
                    <div className="flex items-center gap-1.5 font-semibold text-slate-300">
                      <Volume1 className="w-4 h-4 text-sky-400" />
                      <span>Synthesizer Playback Options:</span>
                    </div>

                    <div className="flex items-center gap-4">
                      {/* Speed Rate control */}
                      <div className="flex items-center gap-2">
                        <span className="text-slate-400">Speech speed:</span>
                        <select
                          id="tts-rate-selector"
                          value={ttsRate}
                          onChange={(e) => setTtsRate(Number(e.target.value))}
                          className="bg-slate-800 text-white rounded px-2 py-0.5"
                        >
                          <option value="0.75">0.75x (slow)</option>
                          <option value="1.0">1.0x (normal)</option>
                          <option value="1.25">1.25x</option>
                          <option value="1.5">1.5x (fast)</option>
                        </select>
                      </div>

                      {/* Volume rate */}
                      <div className="flex items-center gap-2">
                        <span className="text-slate-400">Speech volume:</span>
                        <input
                          id="tts-volume-slider"
                          type="range"
                          min="0.2"
                          max="1.0"
                          step="0.2"
                          value={ttsVolume}
                          onChange={(e) => setTtsVolume(Number(e.target.value))}
                          className="w-16 accent-indigo-500"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Error alerts pane if present */}
              {errorMessage && (
                <div id="error-alert-box" className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/50 text-rose-800 dark:text-rose-300 flex gap-3 text-sm font-semibold">
                  <AlertCircle className="w-5 h-5 shrink-0 text-rose-500" />
                  <div>
                    <p className="font-bold">Translation Failure</p>
                    <p className="text-xs text-rose-600/90 dark:text-rose-400 mt-1">{errorMessage}</p>
                  </div>
                </div>
              )}

              {/* AI Generated Alternative Suggestion + Grammatical Breakdown (SaaS Extra Feature) */}
              {translatedText && (alternativePhrasings.length > 0 || educationalExplanation) && (
                <div className="p-6 rounded-3xl bg-slate-100/50 dark:bg-slate-900/40 border border-slate-200/50 dark:border-slate-800/80 space-y-4">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-700 dark:text-sky-400 uppercase tracking-wider">
                    <BookOpen className="w-4 h-4" />
                    <span>Linguistic Analysis & Alternative Phrasings</span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Alternatives */}
                    {alternativePhrasings.length > 0 && (
                      <div className="space-y-2">
                        <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400">Alternative phrasings style:</h4>
                        <div className="space-y-1.5">
                          {alternativePhrasings.map((alt, i) => (
                            <div key={i} className="flex gap-2 p-2.5 rounded-xl bg-white dark:bg-slate-900 text-xs text-slate-800 dark:text-slate-200 border border-slate-100 dark:border-slate-800/50 font-medium">
                              <span className="text-indigo-500 font-bold">#{i + 1}</span>
                              <span>"{alt}"</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Explanations */}
                    {educationalExplanation && (
                      <div className="space-y-2">
                        <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400">Grammar & context insights:</h4>
                        <div className="p-3 rounded-xl bg-white dark:bg-slate-900 text-xs text-slate-600 dark:text-slate-300 border border-slate-100 dark:border-slate-800/50 leading-relaxed">
                          {educationalExplanation}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Statistics Dashboard card */}
              <div className="p-6 rounded-3xl bg-white dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800/80">
                <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-700 dark:text-sky-400 uppercase tracking-wider mb-4">
                  <Info className="w-4 h-4" />
                  <span>Productivity & Language Metrics Analysis</span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
                  <div className="p-3 rounded-2xl bg-slate-50/50 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-800/50">
                    <p className="text-xl font-extrabold text-slate-950 dark:text-white">{inputText.length}</p>
                    <p className="text-[11px] text-slate-450 dark:text-slate-400 mt-1 font-semibold">Characters written</p>
                  </div>
                  <div className="p-3 rounded-2xl bg-slate-50/50 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-800/50">
                    <p className="text-xl font-extrabold text-slate-950 dark:text-white">{readingTime}s</p>
                    <p className="text-[11px] text-slate-450 dark:text-slate-400 mt-1 font-semibold">Est. reading time</p>
                  </div>
                  <div className="p-3 rounded-2xl bg-slate-50/50 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-800/50">
                    <p className="text-xl font-extrabold text-indigo-600 dark:text-sky-400">{statTotalTranslations}</p>
                    <p className="text-[11px] text-slate-450 dark:text-slate-400 mt-1 font-semibold">Total translations</p>
                  </div>
                  <div className="p-3 rounded-2xl bg-slate-50/50 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-800/50">
                    <p className="text-xl font-extrabold text-indigo-600 dark:text-sky-400">{statTotalSpeech}</p>
                    <p className="text-[11px] text-slate-450 dark:text-slate-400 mt-1 font-semibold">Speech sessions</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Side Column (Translation History / Pins) */}
            <div className="space-y-6">
              
              {/* History panel */}
              <div className="lg:sticky lg:top-32">
                <HistoryList
                  history={history}
                  onSelect={handleSelectHistoryItem}
                  onDelete={(id) => setHistory(storageService.deleteHistoryItem(id))}
                  onClearAll={() => {
                    storageService.clearHistory();
                    setHistory([]);
                    showToast("Cleared localized translation history completely.");
                  }}
                />

                {/* Pin setup guide */}
                <div className="mt-4 p-5 rounded-3xl bg-slate-100/50 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-800/80 text-xs space-y-3">
                  <div className="flex items-center gap-1.5 font-bold text-slate-800 dark:text-slate-200">
                    <Clock className="w-4 h-4 text-indigo-500 animate-bounce" />
                    <span>Pin favorite workspace languages</span>
                  </div>
                  <p className="text-slate-500 dark:text-slate-400 leading-normal">
                    Toggle target pin favorites to keep them pinned below for quick tab access on text fields.
                  </p>

                  <div className="flex flex-wrap gap-1.5">
                    {SUPPORTED_LANGUAGES.slice(0, 16).map((lang) => {
                      const isPinned = pinnedLanguages.includes(lang.code);
                      return (
                        <button
                          key={lang.code}
                          onClick={() => togglePinLanguage(lang.code)}
                          className={`px-2 py-1 rounded-lg border text-[10px] font-bold transition flex items-center gap-1 cursor-pointer ${
                            isPinned
                              ? "bg-indigo-600 border-indigo-600 text-white shadow-sm"
                              : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300"
                          }`}
                        >
                          <span>{lang.flag}</span>
                          <span>{lang.code.toUpperCase()}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      )}

      {/* Footer */}
      <footer className="py-6 bg-slate-50 dark:bg-slate-950 border-t border-slate-100 dark:border-slate-800/80 text-slate-500 text-xs font-semibold">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="p-1.5 rounded-lg bg-indigo-600 text-white">
                <Languages className="w-3.5 h-3.5" />
              </div>
              <span className="font-sans font-bold text-slate-900 dark:text-white">Echo Lingo Translator</span>
            </div>
            <p className="text-[11px] text-slate-400 dark:text-slate-500 leading-relaxed font-normal">
              Break language barriers with state of the art sound recognition, custom local history tracking, and Gemini translation engines.
            </p>
          </div>

          <div>
            <h4 className="font-bold text-slate-900 dark:text-white uppercase tracking-wider text-[11px] mb-3">Capabilities</h4>
            <ul className="space-y-1.5 text-slate-400 dark:text-slate-500 font-normal">
              <li>Text Translation</li>
              <li>Continuous Speech Recognition</li>
              <li>TTS Playback</li>
              <li>Confidence Score Indicators</li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-slate-900 dark:text-white uppercase tracking-wider text-[11px] mb-3">Enterprise Sandbox</h4>
            <ul className="space-y-1.5 text-slate-400 dark:text-slate-500 font-normal">
              <li>Active UTC Clock</li>
              <li>Automatic Local Backup</li>
              <li>Full-Stack CORS isolation</li>
              <li>Rate Limits Guard</li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-slate-900 dark:text-white uppercase tracking-wider text-[11px] mb-3">About</h4>
            <p className="text-[11px] leading-relaxed text-slate-400 dark:text-slate-500 font-normal">
              Designed as an internship portfolio product demonstrating modern React hooks, speech recognition APIs, Express backends, and Tailwind CSS.
            </p>
            <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-800 text-[10px] text-slate-400 font-normal">
              © 2026 Echo Lingo. MIT License.
            </div>
          </div>
        </div>
      </footer>

      {/* Keyboard Shortcuts Modal */}
      <ShortcutsModal isOpen={isShortcutsOpen} onClose={() => setIsShortcutsOpen(false)} />
    </div>
  );
}
