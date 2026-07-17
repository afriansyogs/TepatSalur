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

    const { data: distData } = await supabase
      .from("distribusi")
      .select(`
        id,
        status,
        created_at,
        users!relawan_id ( name ),
        distribusi_items (
          qty_allocated,
          inventory_items!inventory_item_id (
            item_name,
            category,
            donasi!source_donasi_id (
              users!donatur_id ( name )
            )
          )
        )
      `)
      .eq("posko_id", id)
      .order("created_at", { ascending: false });

    const history = (distData ?? []).map((d: any) => {
      const relawanName = (Array.isArray(d.users) ? d.users[0]?.name : d.users?.name) ?? "Relawan";
      const items = (d.distribusi_items ?? []).map((di: any) => {
        const item = Array.isArray(di.inventory_items) ? di.inventory_items[0] : di.inventory_items;
        const donasi = Array.isArray(item?.donasi) ? item?.donasi[0] : item?.donasi;
        const user = Array.isArray(donasi?.users) ? donasi?.users[0] : donasi?.users;
        const donaturName = user?.name ?? "Donatur Umum";
        return {
          itemName: item?.item_name ?? "Barang Bantuan",
          category: item?.category ?? "LAINNYA",
          qty: di.qty_allocated ?? 0,
          donaturName,
        };
      });

      return {
        id: d.id,
        status: d.status,
        createdAt: d.created_at,
        relawanName,
        items,
      };
    });

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
        .map((r) => ({ name: (Array.isArray(r.users) ? r.users[0]?.name : r.users?.name) ?? "Unknown" })),
      history,
    };

    return NextResponse.json({ success: true, data: response });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Terjadi kesalahan";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
