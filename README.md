# Echo Lingo Translator 🌐🎙️

Echo Lingo is a sophisticated, full-stack, AI-driven language translation application that integrates advanced speech recognition, real-time machine translation, contextual linguistic analytics, and instant Text-to-Speech (TTS) response. The application operates securely inside a developer workspace, hiding sensitive API keys in the backend server while offering premium, low-latency, responsive frontend functionality.

---

## 🎨 Creative Architecture & Tech Stack

This section outlines the entire technology structure of **Echo Lingo**.

```
┌────────────────────────────────────────────────────────┐
│                      FRONTEND                          │
│  React 19 (TypeScript) + Tailwind CSS (v4) + motion    │
└───────────────────────────┬────────────────────────────┘
                            │ (Secure JSON API Calls)
                            ▼
┌────────────────────────────────────────────────────────┐
│                      BACKEND                           │
│  Express Server + Vite Native Middleware Integration   │
└───────────────────────────┬────────────────────────────┘
                            │ (Secure Server-to-Server)
                            ▼
┌────────────────────────────────────────────────────────┐
│                    INTELLIGENCE                        │
│                 Gemini AI Engine                       │
└────────────────────────────────────────────────────────┘
```

### 1. Frontend Architecture
The client interface focuses on high-density performance, comfortable negative space, motion design principles, and absolute accessibility.
*   **Framework**: **React 19** utilizing TypeScript for bulletproof typing.
*   **Aesthetic Styling**: **Tailwind CSS v4** featuring natural layout variables. Includes deep obsidian and slate themes for prolonged user visual safety.
*   **Micro-Animations**: Framer-powered animations via `motion/react` implementing subtle scale transformations, list entry staggers, and pulse states.
*   **Icons**: Clean, modern stroke vectors parsed dynamically from `lucide-react`.
*   **Voice Integration**: Native Web Speech API implementing continuous listening hooks and localized Text-to-Speech playback interfaces.

### 2. Backend & API Services
Echo Lingo implements a full-stack, CORS-isolated proxy architecture to prevent Client-Side API credential leakage.
*   **Development / Production Server**: **Express.js** custom server binding securely to `0.0.0.0:3000`.
*   **Middleware Compilation**: Integrated **Vite Middleware** matching dynamic compilation routes on-the-fly (`createViteServer` modes) in development.
*   **Compilation Pipe**: Bundled elegantly during production builds into a standalone **CommonJS (`.cjs`) single bundle** using `esbuild` for maximum startup performance.
*   **Persistence**: Secure React state hooks combined container-side with localized synchronization (`localStorage`) keeping real-time metrics, translation caches, and user search history histories persisted.

### 3. Translation & Language Intelligence
Deep conceptual linguistic analysis powers standard and alternative translations.
*   **Core Engine**: **Gemini AI Systems** via the `@google/genai` TypeScript SDK. Handles natural grammar syntax, pronoun registration, formal/informal alternatives, and contextual slang detection.
*   **Transliteration guides**: Dynamic generation of audible pronunciation guides (`phonetic keys`) allowing users to read translations with authentic accents.

---

## 🚀 Getting Started

### Prerequisites
*   **Node.js**: v18 or newer
*   **npm**: v9 or newer
*   An active Google Gemini API credentials file (`.env` or system env parameters)

### Installation & Environment Configuration
1.  Verify the keys are configured in your `.env` or system context:
    ```env
    GEMINI_API_KEY=your_gemini_api_key_here
    ```

2.  Install required system and applet packages:
    ```bash
    npm install
    ```

3.  Launch the development proxy server:
    ```bash
    npm run dev
    ```

4.  Compile and optimize the software for high-scale production deployment:
    ```bash
    npm run build
    npm start
    ```

---

## 📂 Code Directory Structure

```
.
├── server.ts                  # Hybrid development server and API routes
├── vite.config.ts             # React optimization engine rules
├── package.json               # System modules & execution commands
├── src/
│   ├── main.tsx               # Primary react entrypoint
│   ├── App.tsx                # Main translation core workspace and state hub
│   ├── index.css              # Custom Tailwind base layer variables
│   ├── components/            # Reusable modular UI components
│   │   ├── About.tsx          # Educational overlay on backend mechanics
│   │   ├── Features.tsx       # Highlights capabilities
│   │   ├── Hero.tsx           # Dashboard landing presentation card
│   │   ├── HistoryList.tsx    # Scrollable translation archives 
│   │   ├── Navbar.tsx         # Responsive dark mode/light mode navigation bar
│   │   └── ShortcutsModal.tsx # Workspace accessibility guide modal
│   ├── hooks/                 # Custom reactive utility hooks
│   │   ├── useSpeechSynthesis.ts
│   │   └── useSpeechTranslation.ts
│   └── services/              # Clean standalone logic services
│       ├── speech-service.ts
│       ├── storage-service.ts
│       └── translation-service.ts
```

---

## 📜 License
Distributable under the **MIT License**. Created as a professional portfolio workspace.
