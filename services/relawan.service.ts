import { AssignedPosko } from "@/types/ai";
import { PoskoUpdateBodyValues } from "@/schemas/ai";

export const relawanService = {
  async getAssignedPosko(): Promise<AssignedPosko | null> {
    try {
      const res = await fetch("/api/relawan/posko");
      const data: { success: boolean; data?: AssignedPosko | null; error?: string } =
        await res.json();
      if (!data.success) return null;
      return data.data ?? null;
    } catch {
      return null;
    }
  },

  async updatePoskoData(
    poskoId: string,
    values: Omit<PoskoUpdateBodyValues, "poskoId">
  ): Promise<{ success: boolean; aiStatus?: "MERAH" | "KUNING" | "HIJAU"; aiUrgencyScore?: number; error?: string }> {
    try {
      const res = await fetch(`/api/relawan/posko/${poskoId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const data: { success: boolean; aiStatus?: "MERAH" | "KUNING" | "HIJAU"; aiUrgencyScore?: number; error?: string } = await res.json();
      return data;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Gagal menyimpan data";
      return { success: false, error: message };
    }
  },
};
