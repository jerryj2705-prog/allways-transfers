/**
 * Voice Transcription Helper (Stub)
 * 
 * This module is a placeholder. The application does not currently use voice transcription.
 * If you need speech-to-text in the future, integrate with OpenAI Whisper API or similar.
 */

export type TranscribeOptions = {
  audioUrl: string;
  language?: string;
  prompt?: string;
};

export type TranscriptionResponse = {
  task: "transcribe";
  language: string;
  duration: number;
  text: string;
  segments: Array<{
    id: number;
    seek: number;
    start: number;
    end: number;
    text: string;
  }>;
};

export type TranscriptionError = {
  error: string;
  code: "FILE_TOO_LARGE" | "INVALID_FORMAT" | "TRANSCRIPTION_FAILED" | "UPLOAD_FAILED" | "SERVICE_ERROR";
  details?: string;
};

export async function transcribeAudio(
  _options: TranscribeOptions
): Promise<TranscriptionResponse | TranscriptionError> {
  return {
    error: "Voice transcription is not configured.",
    code: "SERVICE_ERROR",
    details: "Implement with OpenAI Whisper API or similar service.",
  };
}
