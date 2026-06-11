import React from "react";
import { History, Copy, Trash2, X, Globe, RotateCcw, Search } from "lucide-react";
import { HistoryItem } from "../types";
import { getLanguageFlag } from "../languages";

interface HistoryListProps {
  history: HistoryItem[];
  onSelect: (item: HistoryItem) => void;
  onDelete: (id: string) => void;
  onClearAll: () => void;
}

export default function HistoryList({ history, onSelect, onDelete, onClearAll }: HistoryListProps) {
  const [searchQuery, setSearchQuery] = React.useState("");

  const filteredHistory = history.filter(
    (item) =>
      item.originalText.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.translatedText.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.sourceLangName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.targetLangName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCopy = (text: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(text);
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-100 dark:border-slate-800 p-6 shadow-xl relative overflow-hidden h-full flex flex-col">
      {/* Title block */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-700/55 shrink-0">
        <div className="flex items-center gap-2">
          <History className="w-5 h-5 text-indigo-500 animate-pulse" />
          <h3 className="font-bold text-slate-900 dark:text-white text-base">Translation History</h3>
        </div>
        {history.length > 0 && (
          <button
            id="clear-all-history"
            onClick={onClearAll}
            className="text-xs font-semibold text-rose-500 hover:text-rose-600 dark:hover:text-rose-450 hover:bg-rose-50 dark:hover:bg-rose-950/20 px-2.5 py-1.5 rounded-xl transition cursor-pointer"
          >
            Clear All
          </button>
        )}
      </div>

      {/* Search Input for History */}
      {history.length > 0 && (
        <div className="relative mt-4 mb-3 shrink-0">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            id="search-history-input"
            type="text"
            placeholder="Search saved translations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full text-xs pl-9 pr-3 py-2 rounded-xl border border-slate-100 dark:border-slate-700/80 bg-slate-50/50 dark:bg-slate-900/30 text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500/50 transition"
          />
        </div>
      )}

      {/* History Items container */}
      <div className="flex-1 overflow-y-auto space-y-3 mt-2 pr-1 custom-scrollbar min-h-[220px]">
        {history.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-center h-full">
            <div className="p-4 rounded-full bg-slate-50 dark:bg-slate-900/40 text-slate-300 dark:text-slate-600 mb-3">
              <History className="w-8 h-8" />
            </div>
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">No Translations Yet</p>
            <p className="text-xs text-slate-450 dark:text-slate-500 max-w-[200px] mt-1">
              Your translated texts and speech files will be securely loaded here.
            </p>
          </div>
        ) : filteredHistory.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">No saved matching records found.</p>
          </div>
        ) : (
          filteredHistory.map((item) => (
            <div
              id={`history-item-${item.id}`}
              key={item.id}
              onClick={() => onSelect(item)}
              className="group p-3.5 rounded-2xl bg-slate-50/50 dark:bg-slate-900/20 hover:bg-slate-50 dark:hover:bg-indigo-950/20 border border-slate-100 dark:border-slate-800/80 hover:border-slate-200 dark:hover:border-slate-750 transition duration-200 cursor-pointer flex flex-col justify-between gap-2.5 relative"
            >
              {/* Language flow header */}
              <div className="flex items-center justify-between text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                <div className="flex items-center gap-1">
                  <span>{getLanguageFlag(item.sourceLang)}</span>
                  <span>{item.sourceLangName}</span>
                  <span className="text-indigo-400 dark:text-indigo-500">→</span>
                  <span>{getLanguageFlag(item.targetLang)}</span>
                  <span>{item.targetLangName}</span>
                </div>
                <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    id={`copy-history-item-${item.id}`}
                    onClick={(e) => handleCopy(item.translatedText, e)}
                    className="p-1 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-500 hover:text-indigo-500 hover:border-indigo-100 dark:hover:border-indigo-950/25 transition cursor-pointer"
                    title="Copy translated output"
                  >
                    <Copy className="w-3 h-3" />
                  </button>
                  <button
                    id={`delete-history-item-${item.id}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete(item.id);
                    }}
                    className="p-1 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-400 hover:text-rose-500 hover:border-rose-100 dark:hover:border-rose-950/25 transition cursor-pointer"
                    title="Delete item"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>

              {/* Text content blocks */}
              <div className="space-y-1">
                <p className="text-xs font-medium text-slate-800 dark:text-slate-300 line-clamp-1 truncate italic">
                  "{item.originalText}"
                </p>
                <p className="text-sm font-bold text-slate-950 dark:text-slate-50 line-clamp-2">
                  {item.translatedText}
                </p>
              </div>

              {/* Footnote timestamp */}
              <div className="flex justify-between items-center text-[9px] text-slate-400 dark:text-slate-500 font-medium">
                <span>{new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                <span className="text-indigo-500 dark:text-sky-400 font-semibold group-hover:underline flex items-center gap-0.5">
                  <RotateCcw className="w-2.5 h-2.5" /> Restore
                </span>
                <span>{new Date(item.timestamp).toLocaleDateString()}</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
