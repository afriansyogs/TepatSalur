import { VoiceParseResult, TriageResult, DistribusiRecommendationResponse } from "@/types/ai";
import { PoskoVoiceInputValues, AcceptDistribusiValues } from "@/schemas/ai";

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

  async getDistributionRecommendation(): Promise<{ success: boolean; data?: DistribusiRecommendationResponse; error?: string }> {
    try {
      const res = await fetch("/api/ai/distribution", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      const data: { success: boolean; data?: DistribusiRecommendationResponse; error?: string } = await res.json();
      return data;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Gagal mendapatkan rekomendasi distribusi";
      return { success: false, error: message };
    }
  },

  async acceptDistribusi(
    values: AcceptDistribusiValues
  ): Promise<{ success: boolean; data?: { distribusiId: string }; error?: string }> {
    try {
      const res = await fetch("/api/distribusi/accept", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });

      const data: { success: boolean; data?: { distribusiId: string }; error?: string } = await res.json();
      return data;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Gagal menerima distribusi";
      return { success: false, error: message };
    }
  },
};
