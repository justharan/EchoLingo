import { HistoryItem } from "../types";

const HISTORY_KEY = "translation-history";

export const storageService = {
  /**
   * Retrieves translation history items.
   */
  getHistory(): HistoryItem[] {
    if (typeof window === "undefined") return [];
    try {
      const data = localStorage.getItem(HISTORY_KEY);
      return data ? JSON.parse(data) : [];
    } catch (err) {
      console.error("Error reading translation history:", err);
      return [];
    }
  },

  /**
   * Saves or updates a translation history item (max 20 entries, newer first).
   */
  saveHistoryItem(
    originalText: string,
    translatedText: string,
    sourceLang: string,
    targetLang: string,
    sourceLangName: string,
    targetLangName: string
  ): HistoryItem[] {
    const history = this.getHistory();
    
    // Create new element
    const newItem: HistoryItem = {
      id: Date.now().toString(),
      originalText: originalText.trim(),
      translatedText: translatedText.trim(),
      sourceLang,
      targetLang,
      sourceLangName,
      targetLangName,
      timestamp: Date.now(),
    };

    // Filter duplicates of same originalText (case-insensitive)
    const filteredHistory = history.filter(
      (item) => item.originalText.toLowerCase() !== originalText.trim().toLowerCase()
    );

    // Keep up to 20 entries
    const updatedHistory = [newItem, ...filteredHistory].slice(0, 20);

    try {
      localStorage.setItem(HISTORY_KEY, JSON.stringify(updatedHistory));
    } catch (err) {
      console.error("Error saving history storage:", err);
    }

    return updatedHistory;
  },

  /**
   * Deletes a record by ID.
   */
  deleteHistoryItem(id: string): HistoryItem[] {
    const history = this.getHistory();
    const updated = history.filter((item) => item.id !== id);
    try {
      localStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
    } catch (err) {
      console.error("Error deleting history item:", err);
    }
    return updated;
  },

  /**
   * Clears the entire translation history.
   */
  clearHistory(): void {
    try {
      localStorage.removeItem(HISTORY_KEY);
    } catch (err) {
      console.error("Error clearing history storage:", err);
    }
  },

  /**
   * Searches the history list by query string.
   */
  searchHistory(query: string): HistoryItem[] {
    const history = this.getHistory();
    if (!query.trim()) return history;
    const lowerQuery = query.toLowerCase();
    return history.filter(
      (item) =>
        item.originalText.toLowerCase().includes(lowerQuery) ||
        item.translatedText.toLowerCase().includes(lowerQuery) ||
        item.sourceLangName.toLowerCase().includes(lowerQuery) ||
        item.targetLangName.toLowerCase().includes(lowerQuery)
    );
  }
};
