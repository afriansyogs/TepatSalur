import { VoiceParseResult, TriageResult } from "@/types/ai";
import { PoskoVoiceInputValues } from "@/schemas/ai";

export const aiService = {
  async parseVoiceInput(
    blob: Blob,
    poskoId: string
  ): Promise<{ success: boolean; data?: VoiceParseResult; error?: string }> {
    try {
      const formData = new FormData();
      formData.append("audio", blob, "recording.webm");
      formData.append("poskoId", poskoId);

      const res = await fetch("/api/ai/voice-parse", {
        method: "POST",
        body: formData,
      });

      const data: { success: boolean; data?: VoiceParseResult; error?: string } =
        await res.json();
      return data;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Gagal memproses audio";
      return { success: false, error: message };
    }
  },

  async extractVoiceInput(
    blob: Blob
  ): Promise<{ success: boolean; data?: VoiceParseResult; error?: string }> {
    try {
      const formData = new FormData();
      formData.append("audio", blob, "recording.webm");

      const res = await fetch("/api/ai/voice-extract", {
        method: "POST",
        body: formData,
      });

      const data: { success: boolean; data?: VoiceParseResult; error?: string } =
        await res.json();
      return data;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Gagal memproses audio";
      return { success: false, error: message };
    }
  },

  async predictUrgency(
    values: PoskoVoiceInputValues
  ): Promise<{ success: boolean; data?: TriageResult; error?: string }> {
    try {
      const res = await fetch("/api/ai/triage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });

      const data: { success: boolean; data?: TriageResult; error?: string } = await res.json();
      return data;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Gagal memprediksi urgensi";
      return { success: false, error: message };
    }
  },
};
