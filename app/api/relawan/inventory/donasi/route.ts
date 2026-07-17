import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

    const { data: assignment } = await supabase
      .from("relawan_assignments")
      .select("id, inventory_location_id")
      .eq("user_id", user.id)
      .eq("assignment_type", "INVENTORY")
      .eq("status", "APPROVED")
      .eq("is_active", true)
      .single();

    if (!assignment?.inventory_location_id) {
      return NextResponse.json({ success: false, error: "Tidak ada assignment gudang aktif" }, { status: 403 });
    }

    const { data, error } = await supabase
      .from("donasi")
      .select(`
        id, item_name, category, qty_donated, latitude, longitude,
        alamat_pickup, status, created_at, updated_at,
        users (id, name, email, phone)
      `)
      .eq("recommended_inventory_id", assignment.inventory_location_id)
      .in("status", ["PENDING", "DELIVERY"])
      .order("created_at", { ascending: false });

    if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 });

    const mapped = (data ?? []).map((d) => ({
      id: d.id,
      itemName: d.item_name,
      category: d.category,
      qtyDonated: d.qty_donated,
      latitude: d.latitude,
      longitude: d.longitude,
      alamatPickup: d.alamat_pickup,
      status: d.status,
      createdAt: d.created_at,
      updatedAt: d.updated_at,
      donatur: d.users ? {
        id: (d.users as any).id,
        name: (d.users as any).name,
        email: (d.users as any).email,
        phone: (d.users as any).phone,
      } : null,
    }));

    return NextResponse.json({ success: true, data: mapped });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Terjadi kesalahan";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
