import React, { useState, useEffect } from "react";
import { Languages, Sun, Moon, Keyboard } from "lucide-react";

interface NavbarProps {
  isDark: boolean;
  onToggleTheme: () => void;
  onOpenShortcuts: () => void;
  activeView: "landing" | "workspace";
  onViewChange: (view: "landing" | "workspace", options?: { focusSpeech?: boolean }) => void;
}

export default function Navbar({
  isDark,
  onToggleTheme,
  onOpenShortcuts,
  activeView,
  onViewChange,
}: NavbarProps) {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleNavClick = (sectionId: string) => {
    if (activeView !== "landing") {
      onViewChange("landing");
      // Delay slightly to allow view to render so element exists
      setTimeout(() => {
        scrollToSection(sectionId);
      }, 100);
    } else {
      scrollToSection(sectionId);
    }
  };

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      const offset = 80;
      const bodyRect = document.body.getBoundingClientRect().top;
      const elementRect = element.getBoundingClientRect().top;
      const elementPosition = elementRect - bodyRect;
      const offsetPosition = elementPosition - offset;

      window.scrollTo({
        top: offsetPosition,
        behavior: "smooth",
      });
    }
  };

  return (
    <nav
      id="main-nav"
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 border-b ${
        isScrolled || activeView === "workspace"
          ? "bg-white/80 dark:bg-slate-900/80 backdrop-blur-md shadow-sm border-slate-100 dark:border-slate-800/80"
          : "bg-transparent border-transparent"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div
            className="flex items-center gap-2 cursor-pointer group"
            onClick={() => {
              onViewChange("landing");
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
          >
            <div className="p-2 rounded-xl bg-gradient-to-tr from-sky-500 to-indigo-600 text-white shadow-md shadow-indigo-500/25 group-hover:scale-105 transition-transform duration-300">
              <Languages className="w-5 h-5" id="nav-logo-icon" />
            </div>
            <div>
              <span className="font-sans font-bold text-lg bg-gradient-to-r from-slate-900 via-indigo-950 to-indigo-700 dark:from-white dark:via-sky-100 dark:to-indigo-300 bg-clip-text text-transparent">
                Echo Lingo
              </span>
              <span className="font-sans text-xs block text-slate-500 dark:text-slate-400 font-medium leading-none">
                Translator
              </span>
            </div>
          </div>

          {/* Navigation Items */}
          <div className="hidden md:flex items-center gap-6 text-sm font-medium">
            <button
              onClick={() => {
                onViewChange("landing");
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
              className={`transition-colors duration-200 cursor-pointer ${
                activeView === "landing"
                  ? "text-indigo-600 dark:text-sky-400 font-bold"
                  : "text-slate-600 hover:text-indigo-600 dark:text-slate-300 dark:hover:text-sky-450"
              }`}
            >
              Home
            </button>
            <button
              onClick={() => handleNavClick("features")}
              className="text-slate-600 hover:text-indigo-600 dark:text-slate-300 dark:hover:text-sky-450 transition-colors duration-200 cursor-pointer"
            >
              Features
            </button>
            <button
              onClick={() => handleNavClick("about")}
              className="text-slate-600 hover:text-indigo-600 dark:text-slate-300 dark:hover:text-sky-450 transition-colors duration-200 cursor-pointer"
            >
              About
            </button>
            <button
              onClick={() => handleNavClick("languages-showcase")}
              className="text-slate-600 hover:text-indigo-600 dark:text-slate-300 dark:hover:text-sky-450 transition-colors duration-205 cursor-pointer"
            >
              Languages
            </button>
            <span className="text-slate-300 dark:text-slate-800">|</span>
            <button
              onClick={() => onViewChange("workspace")}
              className={`transition-colors duration-200 cursor-pointer ${
                activeView === "workspace"
                  ? "text-indigo-600 dark:text-sky-400 font-bold"
                  : "text-slate-600 hover:text-indigo-600 dark:text-slate-300 dark:hover:text-sky-450"
              }`}
            >
              Text Translate
            </button>
            <button
              onClick={() => onViewChange("workspace", { focusSpeech: true })}
              className="text-slate-600 hover:text-indigo-600 dark:text-slate-300 dark:hover:text-sky-450 transition-colors duration-200 cursor-pointer text-xs uppercase px-2.5 py-1 bg-indigo-50/50 dark:bg-indigo-950/40 rounded-lg font-bold border border-indigo-100/50 dark:border-indigo-900/30 text-indigo-700 dark:text-sky-300"
            >
              Voice Translate
            </button>
          </div>

          {/* Right Action Items */}
          <div className="flex items-center gap-3">
            {/* Keyboard Shortcuts trigger */}
            <button
              id="shortcuts-btn"
              onClick={onOpenShortcuts}
              title="Keyboard Shortcuts"
              className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 transition-colors duration-200"
            >
              <Keyboard className="w-5 h-5" />
            </button>

            {/* Theme Toggle */}
            <button
              id="theme-toggle-btn"
              onClick={onToggleTheme}
              className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 transition-colors duration-200"
              title={isDark ? "Activate Light Mode" : "Activate Dark Mode"}
            >
              {isDark ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5 text-indigo-900" />}
            </button>

            {/* CTA Button */}
            <button
              id="get-started-nav-btn"
              onClick={() => onViewChange("workspace")}
              className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold shadow-sm hover:shadow-indigo-500/10 hover:shadow-lg transition-all duration-300 cursor-pointer"
            >
              Get Started
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}
