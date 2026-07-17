import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

    
    const { data: assignment } = await supabase
      .from("relawan_assignments")
      .select("id, inventory_location_id, inventory_locations(id, name, alamat)")
      .eq("user_id", user.id)
      .eq("assignment_type", "INVENTORY")
      .eq("status", "APPROVED")
      .eq("is_active", true)
      .single();

    if (!assignment?.inventory_location_id) {
      return NextResponse.json({ success: false, error: "Tidak ada assignment gudang aktif" }, { status: 403 });
    }

    const inventoryLocationId = assignment.inventory_location_id;
    const location = assignment.inventory_locations as any;

    
    const { data: stokRaw } = await supabase
      .from("inventory_items")
      .select("id, item_name, category, qty_available, qty_booked")
      .eq("inventory_location_id", inventoryLocationId)
      .order("item_name");

    const stok = (stokRaw ?? []).map((s) => ({
      id: s.id,
      itemName: s.item_name,
      category: s.category,
      qtyAvailable: s.qty_available,
      qtyBooked: s.qty_booked,
      qtyFree: s.qty_available - s.qty_booked,
    }));

    
    const { data: poskoRaw } = await supabase
      .from("posko")
      .select(`
        id, name, alamat, ai_status, ai_urgency_score,
        posko_kebutuhan (
          id, item_name, category_kebutuhan, qty_needed, qty_booked, qty_fulfilled, status
        )
      `)
      .order("ai_urgency_score", { ascending: false });

    const posko = (poskoRaw ?? [])
      .map((p) => ({
        id: p.id,
        name: p.name,
        alamat: p.alamat,
        aiStatus: p.ai_status,
        aiUrgencyScore: p.ai_urgency_score,
        kebutuhan: ((p.posko_kebutuhan as any[]) ?? [])
          .filter((k) => k.status !== "FULFILLED")
          .map((k) => ({
            id: k.id,
            itemName: k.item_name,
            category: k.category_kebutuhan,
            qtyNeeded: k.qty_needed,
            qtyBooked: k.qty_booked,
            qtyFulfilled: k.qty_fulfilled,
            qtyRemaining: k.qty_needed - k.qty_booked,
            status: k.status,
          })),
      }))
      .filter((p) => p.kebutuhan.length > 0);

    return NextResponse.json({
      success: true,
      data: {
        inventoryLocationId,
        gudang: { id: inventoryLocationId, name: location?.name, alamat: location?.alamat },
        stok,
        posko,
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Terjadi kesalahan";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
