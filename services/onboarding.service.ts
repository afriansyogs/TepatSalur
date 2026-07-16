import { Community } from "@/types/auth";
import { RelawanOnboardingValues, AdminOnboardingValues } from "@/schemas/onboarding";

export const onboardingService = {
  async submitRelawanOnboarding(
    values: RelawanOnboardingValues
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const res = await fetch("/api/onboarding/relawan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const data: { success: boolean; error?: string } = await res.json();
      return data;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Onboarding gagal";
      return { success: false, error: message };
    }
  },

  async submitAdminOnboarding(
    values: AdminOnboardingValues
  ): Promise<{ success: boolean; communityId?: string; error?: string }> {
    try {
      const res = await fetch("/api/onboarding/admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const data: { success: boolean; communityId?: string; error?: string } = await res.json();
      return data;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Onboarding gagal";
      return { success: false, error: message };
    }
  },

  async getCommunities(): Promise<Community[]> {
    try {
      const res = await fetch("/api/communities");
      const data: { success: boolean; data?: Community[]; error?: string } = await res.json();
      if (!data.success || !data.data) return [];
      return data.data;
    } catch {
      return [];
    }
  },
};
