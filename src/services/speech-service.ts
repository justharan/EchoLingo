export type SpeechRecognitionState = "idle" | "listening" | "processing" | "completed" | "error";

export interface SpeechRecognitionCallbacks {
  onStart?: () => void;
  onResult?: (transcript: string, isFinal: boolean) => void;
  onError?: (errorCode: string, errorMessage: string) => void;
  onEnd?: () => void;
  onStateChange?: (state: SpeechRecognitionState) => void;
}

export class BrowserSpeechService {
  private recognition: any = null;
  private isListeningActive = false;
  private state: SpeechRecognitionState = "idle";
  private finalTranscript = "";

  constructor() {
    if (typeof window !== "undefined") {
      const SpeechRecognitionConstructor =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

      if (SpeechRecognitionConstructor) {
        this.recognition = new SpeechRecognitionConstructor();
        this.recognition.continuous = true;
        this.recognition.interimResults = true;
      }
    }
  }

  public isSupported(): boolean {
    return this.recognition !== null;
  }

  private updateState(newState: SpeechRecognitionState, callbacks: SpeechRecognitionCallbacks) {
    this.state = newState;
    if (callbacks.onStateChange) {
      callbacks.onStateChange(newState);
    }
  }

  public start(langCode: string = "en-US", callbacks: SpeechRecognitionCallbacks) {
    if (!this.isSupported()) {
      if (callbacks.onError) {
        callbacks.onError("not-supported", "Speech recognition is not supported in this browser.");
      }
      return;
    }

    if (this.isListeningActive) {
      return;
    }

    this.finalTranscript = "";
    this.isListeningActive = true;
    this.recognition.lang = langCode;

    this.recognition.onstart = () => {
      this.updateState("listening", callbacks);
      if (callbacks.onStart) {
        callbacks.onStart();
      }
    };

    this.recognition.onresult = (event: any) => {
      let interimTranscript = "";
      let tempFinal = "";

      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          tempFinal += event.results[i][0].transcript;
        } else {
          interimTranscript += event.results[i][0].transcript;
        }
      }

      if (tempFinal) {
        this.finalTranscript += tempFinal;
      }

      const currentLive = this.finalTranscript || interimTranscript;
      if (callbacks.onResult) {
        callbacks.onResult(currentLive, tempFinal !== "");
      }
    };

    this.recognition.onerror = (event: any) => {
      console.error("Speech Recognition Error Event:", event);
      this.isListeningActive = false;
      const isNoSpeech = event.error === "no-speech";
      const isAborted = event.error === "aborted";
      this.updateState((isNoSpeech || isAborted) ? "idle" : "error", callbacks);
      if (callbacks.onError) {
        let msg = `Voice recognition error: ${event.error || "failed"}`;
        if (event.error === "no-speech") {
          msg = "No speech detected. Please check your mic or speak more clearly.";
        } else if (event.error === "aborted") {
          msg = "Recording stopped.";
        } else if (event.error === "audio-capture") {
          msg = "Microphone not found or could not be accessed.";
        } else if (event.error === "not-allowed") {
          msg = "Microphone permission was denied.";
        }
        callbacks.onError(event.error || "unknown-error", msg);
      }
    };

    this.recognition.onend = () => {
      this.isListeningActive = false;
      if (this.state === "listening") {
        this.updateState("completed", callbacks);
      }
      if (callbacks.onEnd) {
        callbacks.onEnd();
      }
    };

    try {
      this.recognition.start();
    } catch (err: any) {
      console.error("Failed to start speech recognition:", err);
      this.isListeningActive = false;
      this.updateState("error", callbacks);
      if (callbacks.onError) {
        callbacks.onError("failed-to-start", err.message || "Could not begin listening session.");
      }
    }
  }

  public stop(callbacks: SpeechRecognitionCallbacks) {
    if (!this.recognition || !this.isListeningActive) {
      return;
    }

    this.updateState("processing", callbacks);
    try {
      this.recognition.stop();
    } catch (err) {
      console.error("Failed to stop recognition instance:", err);
    }
    this.isListeningActive = false;
  }
}

export const speechServiceInstance = new BrowserSpeechService();
