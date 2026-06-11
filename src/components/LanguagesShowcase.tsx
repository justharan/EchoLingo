import React, { useState } from "react";
import { Search, Globe, ChevronRight } from "lucide-react";
import { SUPPORTED_LANGUAGES } from "../languages";

interface LanguagesShowcaseProps {
  onSelectLanguage: (code: string, type: "source" | "target") => void;
}

export default function LanguagesShowcase({ onSelectLanguage }: LanguagesShowcaseProps) {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredLanguages = SUPPORTED_LANGUAGES.filter(
    (lang) =>
      lang.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (lang.nativeName && lang.nativeName.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const handleSelect = (code: string) => {
    // Automatically set target language in translator and scroll up to the workspace
    onSelectLanguage(code, "target");
    const workspace = document.getElementById("translator-workspace");
    if (workspace) {
      workspace.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  };

  return (
    <section id="languages-showcase" className="py-24 bg-white dark:bg-slate-900 border-t border-b border-slate-100 dark:border-slate-800/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          {/* Header text */}
          <div className="max-w-xl">
            <div className="inline-flex items-center gap-1 text-xs font-bold text-indigo-600 dark:text-sky-400 uppercase tracking-widest mb-3">
              <Globe className="w-3.5 h-3.5" />
              <span>Universal Coverage</span>
            </div>
            <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Supported Global Languages
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 font-medium">
              We natively analyze, detect, translate, and pronounce thirty-two core world languages across five continents using neural translation weights.
            </p>
          </div>

          {/* Search bar */}
          <div className="relative w-full md:w-80 shrink-0">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              id="search-showcase-input"
              type="text"
              placeholder="Search major languages..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full text-sm pl-10 pr-4 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:focus:ring-sky-400/20 focus:border-indigo-500 dark:focus:border-sky-400 transition-all font-medium"
            />
          </div>
        </div>

        {/* Grid of badges */}
        {filteredLanguages.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {filteredLanguages.map((lang) => (
              <button
                key={lang.code}
                onClick={() => handleSelect(lang.code)}
                className="group p-3 rounded-2xl bg-slate-50/50 dark:bg-slate-800/20 hover:bg-indigo-50/50 dark:hover:bg-indigo-950/20 border border-slate-100 dark:border-slate-800 hover:border-indigo-100 dark:hover:border-indigo-900/50 text-left transition-all duration-200 cursor-pointer flex items-center justify-between"
              >
                <div className="flex items-center gap-2.5">
                  <span className="text-xl shrink-0" role="img" aria-label={lang.name}>
                    {lang.flag || "🌐"}
                  </span>
                  <div className="overflow-hidden">
                    <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 truncate group-hover:text-indigo-600 dark:group-hover:text-sky-400">
                      {lang.name}
                    </p>
                    <p className="text-[10px] text-slate-400 dark:text-slate-500 font-medium truncate">
                      {lang.nativeName || lang.name}
                    </p>
                  </div>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-slate-300 dark:text-slate-600 group-hover:text-indigo-600 dark:group-hover:text-sky-400 group-hover:translate-x-0.5 transition-all" />
              </button>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-slate-50/50 dark:bg-slate-900/50 rounded-3xl border border-dashed border-slate-200 dark:border-slate-800">
            <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">
              No languages matching "{searchQuery}" found. Try another query!
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
