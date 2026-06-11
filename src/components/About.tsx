import React from "react";
import { Cpu, ShieldCheck, HelpCircle, ArrowLeftRight, Check } from "lucide-react";

interface AboutProps {
  onGoToTranslate: () => void;
}

export default function About({ onGoToTranslate }: AboutProps) {
  return (
    <section id="about" className="py-24 bg-white dark:bg-slate-950 relative overflow-hidden">
      {/* Decorative ambient elements */}
      <div className="absolute bottom-0 right-1/4 w-[350px] h-[350px] bg-indigo-500/5 rounded-full blur-[90px] pointer-events-none" />
      <div className="absolute top-1/4 left-1/4 w-[300px] h-[300px] bg-sky-500/5 rounded-full blur-[80px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          
          {/* Left: Creative graphic or textual cards */}
          <div className="space-y-6">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200/50 dark:border-slate-700/50 text-[11px] text-slate-600 dark:text-slate-300 font-bold uppercase tracking-wider">
              <ShieldCheck className="w-3.5 h-3.5 text-indigo-500" />
              <span>Core System Architecture</span>
            </div>
            
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-tight">
              A High-Fidelity Linguistic Platform Engineered with Privacy First
            </h2>
            
            <p className="text-slate-600 dark:text-slate-400 text-base leading-relaxed">
              Unlike generic client-side wrappers that leak developer API tokens or rely on superficial mock data responses, Echo Lingo incorporates a robust cloud microservice. All calculations, translation logic, and API calls are handled safely server-side to guarantee reliable and fast responses.
            </p>

            <div className="space-y-4 pt-4">
              <div className="flex gap-4">
                <div className="p-2.5 h-fit rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950/40 dark:text-sky-300">
                  <Check className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 dark:text-slate-100 text-sm sm:text-base">
                    Strict Key Isolation
                  </h4>
                  <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
                    Your credentials and the Gemini API key remain hidden inside the server backend, avoiding client-side leaks or unauthorized browser inspection.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="p-2.5 h-fit rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950/40 dark:text-sky-300">
                  <Check className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 dark:text-slate-100 text-sm sm:text-base">
                    Adaptive Deep Learning
                  </h4>
                  <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
                    Harnessing the power of Gemini 3.5, the app analyzes idioms, phrasing formality, pronunciation guidelines, and cultural contexts rather than basic dictionary matching.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="p-2.5 h-fit rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950/40 dark:text-sky-300">
                  <Check className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 dark:text-slate-100 text-sm sm:text-base">
                    Accessible Web speech interfaces
                  </h4>
                  <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
                    Seamlessly incorporates continuous Web Speech-To-Text capturing and TTS generation to assist with auditory learners or physical barrier support.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Right: Technical Stats/Explanations card layout */}
          <div className="bg-slate-50 dark:bg-slate-900/40 rounded-3xl p-8 border border-slate-100 dark:border-slate-800/80 relative space-y-6">
            <h3 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Cpu className="w-5 h-5 text-indigo-500" />
              <span>How does it work?</span>
            </h3>

            <div className="space-y-4 text-xs sm:text-sm text-slate-600 dark:text-slate-300">
              <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-850 space-y-2">
                <span className="font-bold text-indigo-600 dark:text-sky-400">Step 1: Text inputs & settings selection</span>
                <p className="text-slate-500 dark:text-slate-400 text-xs">
                  The user writes text or speaks into the microphone in the workspace dashboard, configuring the target translation.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-850 space-y-2">
                <span className="font-bold text-indigo-600 dark:text-sky-400">Step 2: Express routing</span>
                <p className="text-slate-500 dark:text-slate-400 text-xs">
                  An isolated JSON request is dispatched back to our Express route handler configuration on port 3000.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-850 space-y-2">
                <span className="font-bold text-indigo-600 dark:text-sky-400">Step 3: Intelligence processing & return</span>
                <p className="text-slate-500 dark:text-slate-400 text-xs">
                  Gemini formats alternative options, lists grammatic notes, creates voice guides, and returns the finished data smoothly.
                </p>
              </div>
            </div>

            <div className="pt-4 flex flex-col sm:flex-row gap-4">
              <button
                onClick={onGoToTranslate}
                className="bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-3 rounded-2xl text-xs sm:text-sm font-semibold shadow-md hover:shadow-indigo-500/20 active:scale-95 transition cursor-pointer flex items-center justify-center gap-2"
              >
                <span>Enter Workspace Now</span>
                <ArrowLeftRight className="w-4 h-4" />
              </button>
              <a
                href="#features"
                className="bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 px-5 py-3 rounded-2xl text-xs sm:text-sm font-semibold hover:bg-slate-50 dark:hover:bg-slate-750 transition text-center"
              >
                Read Features
              </a>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
