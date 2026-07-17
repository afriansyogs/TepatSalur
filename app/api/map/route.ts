import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { MapPoskoItem, MapInventoryLocationItem, MapResponse } from "@/types/map";

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();
    const filter = req.nextUrl.searchParams.get("filter") ?? "all";

    const fetchPosko = async (): Promise<MapPoskoItem[]> => {
      const { data } = await supabase
        .from("posko")
        .select(`
          id, name, latitude, longitude, ai_status, ai_urgency_score,
          jumlah_pengungsi, alamat, kab_kota, provinsi,
          posko_kebutuhan (id, item_name, category_kebutuhan, qty_needed, qty_fulfilled, status),
          relawan_assignments (id, is_active, status)
        `);

      return (data ?? []).map((p) => ({
        id: p.id,
        type: "POSKO" as const,
        name: p.name,
        latitude: p.latitude,
        longitude: p.longitude,
        aiStatus: p.ai_status,
        aiUrgencyScore: p.ai_urgency_score,
        jumlahPengungsi: p.jumlah_pengungsi ?? 0,
        alamat: p.alamat,
        kabKota: p.kab_kota,
        provinsi: p.provinsi,
        totalRelawan: ((p.relawan_assignments as any[]) ?? []).filter((r) => r.is_active && r.status === "APPROVED").length,
        kebutuhan: ((p.posko_kebutuhan as any[]) ?? [])
          .filter((k) => k.status !== "FULFILLED")
          .slice(0, 3)
          .map((k) => ({
            id: k.id,
            itemName: k.item_name,
            category: k.category_kebutuhan,
            qtyNeeded: k.qty_needed,
            qtyFulfilled: k.qty_fulfilled,
            status: k.status,
          })),
      }));
    };

    const fetchInventory = async (): Promise<MapInventoryLocationItem[]> => {
      const { data } = await supabase
        .from("inventory_locations")
        .select(`
          id, name, latitude, longitude, is_active, alamat, kab_kota, provinsi,
          inventory_items (id, item_name, category, qty_available, qty_booked),
          relawan_assignments (id, is_active, status)
        `);

      return (data ?? []).map((inv) => ({
        id: inv.id,
        type: "INVENTORY" as const,
        name: inv.name,
        latitude: inv.latitude,
        longitude: inv.longitude,
        isActive: inv.is_active,
        alamat: inv.alamat,
        kabKota: inv.kab_kota,
        provinsi: inv.provinsi,
        totalRelawan: ((inv.relawan_assignments as any[]) ?? []).filter((r) => r.is_active && r.status === "APPROVED").length,
        items: ((inv.inventory_items as any[]) ?? [])
          .slice(0, 3)
          .map((i) => ({
            id: i.id,
            itemName: i.item_name,
            category: i.category,
            qtyAvailable: i.qty_available,
            qtyBooked: i.qty_booked,
          })),
      }));
    };

    let posko: MapPoskoItem[] = [];
    let inventory: MapInventoryLocationItem[] = [];

    if (filter === "posko") {
      posko = await fetchPosko();
    } else if (filter === "inventory") {
      inventory = await fetchInventory();
    } else {
      [posko, inventory] = await Promise.all([fetchPosko(), fetchInventory()]);
    }

    const response: MapResponse = { posko, inventory };
    return NextResponse.json({ success: true, data: response });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Terjadi kesalahan";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
