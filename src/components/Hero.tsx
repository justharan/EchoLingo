import React from "react";
import { Sparkles, MessageSquare, ArrowRight, Activity, Cpu, ShieldCheck } from "lucide-react";

interface HeroProps {
  onStartTranslate: () => void;
  onStartSpeech: () => void;
}

export default function Hero({ onStartTranslate, onStartSpeech }: HeroProps) {
  return (
    <section id="hero" className="relative pt-32 pb-20 overflow-hidden">
      {/* Decorative Gradient Background Elements */}
      <div className="absolute top-10 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-gradient-to-tr from-indigo-500/20 to-sky-400/20 rounded-full blur-[120px] pointer-events-none -z-10 dark:from-indigo-900/20 dark:to-sky-800/10" />
      <div className="absolute -top-40 right-10 w-[300px] h-[300px] bg-sky-300/10 rounded-full blur-[80px] pointer-events-none -z-10 dark:bg-sky-900/10" />
      <div className="absolute top-60 left-10 w-[250px] h-[250px] bg-indigo-300/10 rounded-full blur-[80px] pointer-events-none -z-10 dark:bg-indigo-900/10" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
        {/* Sparkle Tag */}
        <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200/50 dark:border-slate-700/50 text-xs text-indigo-700 dark:text-sky-400 font-semibold mb-6 animate-pulse">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Translate the World Instantly with AI</span>
        </div>

        {/* Title */}
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-slate-900 dark:text-white max-w-4xl mx-auto leading-[1.12]">
          Translate Any Language{" "}
          <span className="bg-gradient-to-r from-indigo-600 to-sky-500 bg-clip-text text-transparent">
            Instantly with AI
          </span>
        </h1>

        {/* Subtitle */}
        <p className="mt-6 text-base sm:text-lg md:text-xl text-slate-600 dark:text-slate-400 max-w-2xl mx-auto font-medium">
          AI-powered multilingual communication designed for students, professionals, travelers, and global teams. Break language barriers with high fidelity and speech synthesis.
        </p>

        {/* Action Buttons */}
        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
          <button
            id="hero-start-btn"
            onClick={onStartTranslate}
            className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold shadow-xl shadow-indigo-600/10 hover:shadow-indigo-600/20 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 inline-flex items-center justify-center gap-2 group cursor-pointer"
          >
            Start Translating
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>
          <button
            id="hero-speech-btn"
            onClick={onStartSpeech}
            className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/80 text-slate-800 dark:text-slate-200 font-semibold shadow-sm hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 inline-flex items-center justify-center gap-2 cursor-pointer"
          >
            <MessageSquare className="w-4 h-4 text-sky-500" />
            Try Speech Translation
          </button>
        </div>

        {/* Highlights List */}
        <div className="mt-16 pt-8 border-t border-slate-100 dark:border-slate-800/80 max-w-5xl mx-auto grid grid-cols-2 lg:grid-cols-4 gap-6 text-left">
          <div className="flex gap-3">
            <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 shrink-0">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-900 dark:text-slate-100 text-sm">Gemini AI Model</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">High accuracy translation & logic</p>
            </div>
          </div>
          <div className="flex gap-3">
            <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 shrink-0">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-900 dark:text-slate-100 text-sm">Voice Synthesis</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Pronounce like a native speaker</p>
            </div>
          </div>
          <div className="flex gap-3">
            <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 shrink-0">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-900 dark:text-slate-100 text-sm">Voice Recognition</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Continuous talk and detect</p>
            </div>
          </div>
          <div className="flex gap-3">
            <div className="p-2 rounded-xl bg-sky-50 dark:bg-sky-950/50 text-sky-600 dark:text-sky-400 shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-900 dark:text-slate-100 text-sm">Completely Safe</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Full stack secure key isolation</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
