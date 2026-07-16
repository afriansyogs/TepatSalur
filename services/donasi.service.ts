import { DonasiFormInput, DonasiRecord, DonasiInsertPayload, DonasiResponse, DonationHistoryRecord } from "@/types/donasi";
import { createClient } from "@/lib/supabase/client";

export class DonasiService {
  /**
   * Submit donation details to production API
   */
  async submitProductionDonation(data: DonasiInsertPayload): Promise<DonasiResponse> {
    const response = await fetch("/api/donatur/donasi", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    const resData = await response.json();
    if (!response.ok || !resData.success) {
      throw new Error(resData.error || "Gagal memproses donasi");
    }

    return resData.data;
  }

  /**
   * Fetch active inventory locations for client-side closest warehouse calculations
   */
  async getActiveInventoryLocations() {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("inventory_locations")
      .select("id, name, alamat, latitude, longitude")
      .eq("is_active", true);

    if (error) {
      console.error("Error fetching active inventory locations:", error);
      throw error;
    }

    return data || [];
  }

  /**
   * Fetch donation history for logged-in Donatur
   */
  async getDonaturDonationHistory(): Promise<DonationHistoryRecord[]> {
    const supabase = createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return [];

    const { data, error } = await supabase
      .from("donasi")
      .select(`
        id,
        donatur_id,
        item_name,
        category,
        qty_donated,
        latitude,
        longitude,
        alamat_pickup,
        status,
        created_at,
        inventory_locations:recommended_inventory_id (
          id,
          name,
          alamat
        )
      `)
      .eq("donatur_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching donation history:", error);
      throw error;
    }

    return (data || []).map((row: any) => ({
      id: row.id,
      donaturId: row.donatur_id,
      itemName: row.item_name,
      category: row.category,
      qtyDonated: row.qty_donated,
      latitude: row.latitude,
      longitude: row.longitude,
      alamatPickup: row.alamat_pickup,
      status: row.status,
      createdAt: row.created_at,
      recommendedInventory: row.inventory_locations
        ? {
            id: row.inventory_locations.id,
            name: row.inventory_locations.name,
            alamat: row.inventory_locations.alamat,
          }
        : null,
    }));
  }

  /**
   * Submit donation details (Mocking API call with delay)
   */
  async submitDonation(data: DonasiFormInput): Promise<{ success: boolean; transactionId: string }> {
    return new Promise((resolve) => {
      setTimeout(() => {
        const randomId = Math.floor(100000 + Math.random() * 900000);
        const transactionId = `DON-${randomId}`;

        // Save to mock history in localStorage for tracking
        if (typeof window !== "undefined") {
          const rawHistory = localStorage.getItem("donasi_history");
          const history: DonasiRecord[] = rawHistory ? JSON.parse(rawHistory) : [];

          const newRecord: DonasiRecord = {
            ...data,
            id: transactionId,
            tanggal: new Date().toISOString(),
          };

          history.push(newRecord);
          localStorage.setItem("donasi_history", JSON.stringify(history));
        }

        resolve({
          success: true,
          transactionId,
        });
      }, 1000);
    });
  }

  /**
   * Get donation history for logged-in user
   */
  async getDonationHistory(contactOrName: string): Promise<DonasiRecord[]> {
    if (typeof window === "undefined") return [];

    const rawHistory = localStorage.getItem("donasi_history");
    const history: DonasiRecord[] = rawHistory ? JSON.parse(rawHistory) : [];

    // Filter history based on user
    return history.filter(
      (item) =>
        item.namaDonatur.toLowerCase() === contactOrName.toLowerCase() ||
        item.kontak === contactOrName
    );
  }
}

export const donasiService = new DonasiService();
