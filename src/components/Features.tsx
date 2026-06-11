import React from "react";
import {
  Sparkles,
  Mic,
  Volume2,
  History,
  Download,
  CheckCircle,
  SunMoon,
  Zap,
} from "lucide-react";

interface FeatureItem {
  icon: React.ElementType;
  title: string;
  description: string;
  color: string;
}

const features: FeatureItem[] = [
  {
    icon: Sparkles,
    title: "AI-Powered Text Translation",
    description: "Powered by Gemini 3.5. Translates with supreme syntax adherence, context-awareness, and natural local flow.",
    color: "from-indigo-500 to-purple-600",
  },
  {
    icon: Mic,
    title: "Continuous Speech Translation",
    description: "Speak into your microphone. Watch speech convert to text, translate instantly, and optionally voice back in seconds.",
    color: "from-rose-500 to-pink-600",
  },
  {
    icon: SunMoon,
    title: "Advanced Auto-Detection",
    description: "Do not know the source text language? Let the translation engine figure it out with confidence scoring.",
    color: "from-amber-500 to-orange-600",
  },
  {
    icon: Volume2,
    title: "True Native Text-to-Speech",
    description: "Automatically matches the target language gender-optimal native voice, with adjustable volume and speed rates.",
    color: "from-emerald-500 to-teal-600",
  },
  {
    icon: History,
    title: "Offline Translation History",
    description: "Keep a localized history of your past translations saved in localStorage. Quick copy, clear, and recall with ease.",
    color: "from-sky-500 to-blue-600",
  },
  {
    icon: Download,
    title: "Download Results",
    description: "Export full transcripts including original prompts, translation text pairs, timestamp metadata, and languages into clean .txt files.",
    color: "from-violet-500 to-fuchsia-600",
  },
  {
    icon: Zap,
    title: "Ultra-Fast Server Responses",
    description: "Full-stack Node.js server pipelines combined with esbuild caching deliver translations within fractions of a second.",
    color: "from-cyan-500 to-sky-600",
  },
  {
    icon: CheckCircle,
    title: "Accessible & Optimized Layout",
    description: "Engineered around keyboard hotkeys, high-contrast dark frames, and fully fluid design constraints across all screens.",
    color: "from-emerald-400 to-indigo-500",
  },
];

export default function Features() {
  return (
    <section id="features" className="py-24 bg-slate-50/50 dark:bg-slate-900/40 relative">
      <div className="absolute inset-0 bg-grid-slate-100 dark:bg-grid-slate-900 [mask-image:linear-gradient(bottom,white,transparent)] pointer-events-none -z-10" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Headings */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <p className="text-xs font-bold text-indigo-600 dark:text-sky-400 uppercase tracking-widest">
            Sophisticated Neural Capabilities
          </p>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white mt-3 tracking-tight">
            Designed for Global Communication Excellence
          </h2>
          <p className="text-slate-600 dark:text-slate-400 mt-4 text-base font-medium">
            Forget literal machine translation slop. Interact with a multi-layered linguistic application built with
            state-of-the-art server components.
          </p>
        </div>

        {/* Feature Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, idx) => {
            const Icon = feature.icon;
            return (
              <div
                key={idx}
                className="group relative bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between"
              >
                <div>
                  {/* Icon Bag */}
                  <div className={`p-3 rounded-2xl w-fit bg-gradient-to-tr ${feature.color} text-white shadow-md shadow-slate-200 dark:shadow-none mb-5 group-hover:scale-110 transition-transform`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <h3 className="font-bold text-slate-950 dark:text-slate-50 text-base">
                    {feature.title}
                  </h3>
                  <p className="text-slate-600 dark:text-slate-400 text-sm mt-2.5 leading-relaxed font-normal">
                    {feature.description}
                  </p>
                </div>

                {/* Decorative border glow */}
                <div className="absolute inset-0 border-2 border-transparent group-hover:border-indigo-500/10 dark:group-hover:border-sky-400/10 rounded-3xl pointer-events-none transition-colors duration-300" />
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
