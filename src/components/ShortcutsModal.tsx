import React from "react";
import { X, Keyboard, ArrowRight } from "lucide-react";

interface ShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ShortcutsModal({ isOpen, onClose }: ShortcutsModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="relative bg-white dark:bg-slate-800 rounded-3xl max-w-md w-full p-6 border border-slate-100 dark:border-slate-700/50 shadow-2xl animate-in scale-in duration-200">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-700/50">
          <div className="flex items-center gap-2">
            <Keyboard className="w-5 h-5 text-indigo-500" />
            <h3 className="text-lg font-bold text-slate-950 dark:text-white">
              Keyboard Shortcuts
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content list */}
        <div className="mt-5 space-y-4">
          <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-800/50">
            <div>
              <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">Translate Text</p>
              <p className="text-xs text-slate-400 dark:text-slate-500">Trigger translation immediately</p>
            </div>
            <div className="flex gap-1.5 shrink-0">
              <kbd className="px-2 py-1 rounded-md bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm text-[10px] font-sans font-bold text-slate-600 dark:text-slate-300">Ctrl</kbd>
              <span className="text-slate-400 text-xs self-center">+</span>
              <kbd className="px-2 py-1 rounded-md bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm text-[10px] font-sans font-bold text-slate-600 dark:text-slate-300">Enter</kbd>
            </div>
          </div>

          <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-800/50">
            <div>
              <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">Speech Translation</p>
              <p className="text-xs text-slate-400 dark:text-slate-500">Record natural speech input</p>
            </div>
            <div className="flex gap-1.5 shrink-0">
              <kbd className="px-2 py-1 rounded-md bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm text-[10px] font-sans font-bold text-slate-600 dark:text-slate-300">Ctrl</kbd>
              <span className="text-slate-400 text-xs self-center">+</span>
              <kbd className="px-2 py-1 rounded-md bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm text-[10px] font-sans font-bold text-slate-600 dark:text-slate-300">Shift</kbd>
              <span className="text-slate-400 text-xs self-center">+</span>
              <kbd className="px-2 py-1 rounded-md bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm text-[10px] font-sans font-bold text-slate-600 dark:text-slate-300">S</kbd>
            </div>
          </div>

          <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-800/50">
            <div>
              <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">Cancel / Stop Record</p>
              <p className="text-xs text-slate-400 dark:text-slate-500">Halt recording or parsing listeners</p>
            </div>
            <div className="flex gap-1.5 shrink-0">
              <kbd className="px-2 py-1 rounded-md bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm text-[10px] font-sans font-bold text-slate-600 dark:text-slate-300">Esc</kbd>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-700/50 text-center">
          <p className="text-[11px] text-slate-400 dark:text-slate-500 font-medium">
            Use these shortcuts anytime in the workspace environment for high productivity.
          </p>
        </div>
      </div>
    </div>
  );
}
