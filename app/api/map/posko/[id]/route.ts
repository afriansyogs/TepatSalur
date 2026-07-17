import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { PoskoDetailResponse } from "@/types/map";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("posko")
      .select(`
        id, name, latitude, longitude, alamat, kab_kota, provinsi, kecamatan,
        ai_status, ai_urgency_score,
        jumlah_pengungsi, jumlah_dewasa, jumlah_anak, jumlah_lansia,
        jumlah_disabilitas, jumlah_ibu_hamil, catatan_medis_darurat,
        posko_kebutuhan (id, item_name, category_kebutuhan, qty_needed, qty_booked, qty_fulfilled, status),
        relawan_assignments (
          status, is_active,
          users (name)
        )
      `)
      .eq("id", id)
      .single();

    if (error || !data) {
      return NextResponse.json({ success: false, error: "Posko tidak ditemukan" }, { status: 404 });
    }

    const response: PoskoDetailResponse = {
      id: data.id,
      name: data.name,
      latitude: data.latitude,
      longitude: data.longitude,
      alamat: data.alamat,
      kabKota: data.kab_kota,
      provinsi: data.provinsi,
      kecamatan: data.kecamatan,
      aiStatus: data.ai_status,
      aiUrgencyScore: data.ai_urgency_score,
      jumlahPengungsi: data.jumlah_pengungsi ?? 0,
      jumlahDewasa: data.jumlah_dewasa ?? 0,
      jumlahAnak: data.jumlah_anak ?? 0,
      jumlahLansia: data.jumlah_lansia ?? 0,
      jumlahDisabilitas: data.jumlah_disabilitas ?? 0,
      jumlahIbuHamil: data.jumlah_ibu_hamil ?? 0,
      catatanMedisDarurat: data.catatan_medis_darurat,
      kebutuhan: ((data.posko_kebutuhan as any[]) ?? []).map((k) => ({
        id: k.id,
        itemName: k.item_name,
        category: k.category_kebutuhan,
        qtyNeeded: k.qty_needed,
        qtyBooked: k.qty_booked,
        qtyFulfilled: k.qty_fulfilled,
        status: k.status,
      })),
      relawan: ((data.relawan_assignments as any[]) ?? [])
        .filter((r) => r.is_active && r.status === "APPROVED")
        .map((r) => ({ name: r.users?.name ?? "Unknown" })),
    };

    return NextResponse.json({ success: true, data: response });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Terjadi kesalahan";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
