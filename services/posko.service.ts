import { PoskoSummary } from "@/types/posko";
import { createClient } from "@/lib/supabase/client";

export const poskoService = {
  async getPublicPoskoList(): Promise<PoskoSummary[]> {
    try {
      const supabase = createClient();
      
      const { data, error } = await supabase
        .from("posko")
        .select(`
          id,
          name,
          alamat,
          kecamatan,
          latitude,
          longitude,
          jumlah_pengungsi,
          ai_status,
          ai_urgency_score,
          updated_at,
          foto_url,
          posko_kebutuhan (
            item_name
          ),
          relawan_assignments (id)
        `);

      if (error || !data) {
        console.error("Error fetching poskos:", error);
        return [];
      }

      return data.map((p: any) => {
        let kebutuhanKritis: string[] = [];
        if (p.posko_kebutuhan && Array.isArray(p.posko_kebutuhan)) {
          kebutuhanKritis = p.posko_kebutuhan.slice(0, 2).map((k: any) => k.item_name);
        }

        let relawanAktif = 0;
        if (p.relawan_assignments && Array.isArray(p.relawan_assignments)) {
          relawanAktif = p.relawan_assignments.length;
        }

        return {
          id: p.id,
          namaPosko: p.name,
          alamat: p.alamat || "",
          kecamatan: p.kecamatan || "",
          triase: {
            status: p.ai_status || "AMAN",
            skor: p.ai_urgency_score || 0,
            updatedAt: p.updated_at,
          },
          totalPengungsi: p.jumlah_pengungsi || 0,
          kebutuhanKritis,
          relawanAktif,
          imageUrl: p.foto_url || "https://images.unsplash.com/photo-1582213782179-e0d53f98f2ca?w=500&auto=format&fit=crop&q=80",
          lat: p.latitude,
          lng: p.longitude,
          jenis: "bencana",
        };
      });
    } catch (err) {
      console.error("Exception fetching posko list:", err);
      return [];
    }
  },

  async getMockPoskoList(): Promise<PoskoSummary[]> {
    
    await new Promise((resolve) => setTimeout(resolve, 800));

    return [
      {
        id: "1",
        namaPosko: "Posko SD Negeri 01",
        alamat: "Jl. Merdeka No. 12",
        kecamatan: "Cibinong, Bogor",
        triase: {
          status: "KRITIS",
          skor: 87,
          updatedAt: new Date(Date.now() - 2 * 60 * 1000).toISOString(),
        },
        totalPengungsi: 150,
        kebutuhanKritis: ["Air Mineral", "Obat Diare"],
        relawanAktif: 3,
        imageUrl: "https://images.unsplash.com/photo-1582213782179-e0d53f98f2ca?w=500&auto=format&fit=crop&q=80",
        lat: -6.4807,
        lng: 106.8529,
        jenis: "bencana",
      }
    ];
  }
};
