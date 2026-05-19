import { appendTranscriptLine, getSpeechRecognitionCtor } from "@/lib/consult/transcript";
import { preferTranscriptDraft, writeTranscriptDraft } from "@/lib/consult/transcriptDraft";
import { sanitizeUserFacingMessage } from "@/lib/userMessages";
import { useCallback, useEffect, useRef, useState } from "react";

export type ConsultationTranscriptionState = {
  transcript: string;
  setTranscript: (value: string | ((prev: string) => string)) => void;
  interimLine: string;
  isListening: boolean;
  isSupported: boolean;
  error: string | null;
  stop: () => void;
};

export function useConsultationTranscription(options: {
  active: boolean;
  appointmentId: string;
  initialText?: string;
}): ConsultationTranscriptionState {
  const { active, appointmentId, initialText = "" } = options;
  const isSupported = getSpeechRecognitionCtor() !== null;

  const [transcript, setTranscript] = useState(() => preferTranscriptDraft(appointmentId, initialText));
  const [interimLine, setInterimLine] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const activeRef = useRef(active);
  const transcriptRef = useRef(transcript);
  const seededForAppointment = useRef<string | null>(null);

  useEffect(() => {
    activeRef.current = active;
  }, [active]);

  useEffect(() => {
    transcriptRef.current = transcript;
  }, [transcript]);

  useEffect(() => {
    if (seededForAppointment.current === appointmentId) return;
    seededForAppointment.current = appointmentId;
    setTranscript(preferTranscriptDraft(appointmentId, initialText));
    setInterimLine("");
    setError(null);
  }, [appointmentId, initialText]);

  useEffect(() => {
    writeTranscriptDraft(appointmentId, transcript);
  }, [appointmentId, transcript]);

  const stopRecognition = useCallback(() => {
    const rec = recognitionRef.current;
    recognitionRef.current = null;
    if (rec) {
      try {
        rec.onresult = null;
        rec.onerror = null;
        rec.onend = null;
        rec.abort();
      } catch {
        /* ignore */
      }
    }
    setIsListening(false);
    setInterimLine("");
  }, []);

  const startRecognition = useCallback(() => {
    const Ctor = getSpeechRecognitionCtor();
    if (!Ctor || !activeRef.current) return;

    stopRecognition();

    const rec = new Ctor();
    rec.continuous = true;
    rec.interimResults = true;
    rec.lang = "en-US";
    rec.maxAlternatives = 1;

    rec.onresult = (event: SpeechRecognitionEvent) => {
      let interim = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        const text = result[0]?.transcript ?? "";
        if (!text.trim()) continue;
        if (result.isFinal) {
          setTranscript((prev) => appendTranscriptLine(prev, text));
          interim = "";
        } else {
          interim += text;
        }
      }
      setInterimLine(interim.trim());
    };

    rec.onerror = (event: SpeechRecognitionErrorEvent) => {
      if (event.error === "aborted" || event.error === "no-speech") return;
      setError(
        event.error === "not-allowed"
          ? "Microphone access is required for transcription."
          : sanitizeUserFacingMessage(event.message, "Speech recognition stopped. Try again."),
      );
    };

    rec.onend = () => {
      setIsListening(false);
      setInterimLine("");
      if (activeRef.current && recognitionRef.current === rec) {
        window.setTimeout(() => {
          if (activeRef.current && recognitionRef.current === rec) {
            try {
              rec.start();
              setIsListening(true);
            } catch {
              startRecognition();
            }
          }
        }, 300);
      }
    };

    recognitionRef.current = rec;
    try {
      rec.start();
      setIsListening(true);
      setError(null);
    } catch {
      setError("Could not start speech recognition. Try Chrome or Edge.");
    }
  }, [stopRecognition]);

  useEffect(() => {
    if (!active || !isSupported) {
      stopRecognition();
      return;
    }
    startRecognition();
    return () => stopRecognition();
  }, [active, isSupported, startRecognition, stopRecognition]);

  return {
    transcript,
    setTranscript,
    interimLine,
    isListening,
    isSupported,
    error,
    stop: stopRecognition,
  };
}
