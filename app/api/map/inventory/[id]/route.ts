import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { InventoryDetailResponse } from "@/types/map";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("inventory_locations")
      .select(`
        id, name, latitude, longitude, alamat, kab_kota, provinsi, kecamatan, is_active,
        inventory_items (id, item_name, category, qty_available, qty_booked),
        relawan_assignments (
          status, is_active,
          users (name)
        )
      `)
      .eq("id", id)
      .single();

    if (error || !data) {
      return NextResponse.json({ success: false, error: "Inventory tidak ditemukan" }, { status: 404 });
    }

    const response: InventoryDetailResponse = {
      id: data.id,
      name: data.name,
      latitude: data.latitude,
      longitude: data.longitude,
      alamat: data.alamat,
      kabKota: data.kab_kota,
      provinsi: data.provinsi,
      kecamatan: data.kecamatan,
      isActive: data.is_active,
      items: ((data.inventory_items as any[]) ?? []).map((i) => ({
        id: i.id,
        itemName: i.item_name,
        category: i.category,
        qtyAvailable: i.qty_available,
        qtyBooked: i.qty_booked,
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
