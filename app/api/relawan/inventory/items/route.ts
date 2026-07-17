import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { addInventoryItemSchema } from "@/schemas/inventory";

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

    const { data: assignment } = await supabase
      .from("relawan_assignments")
      .select("inventory_location_id")
      .eq("user_id", user.id)
      .eq("assignment_type", "INVENTORY")
      .eq("status", "APPROVED")
      .eq("is_active", true)
      .single();

    if (!assignment?.inventory_location_id) {
      return NextResponse.json({ success: false, error: "Tidak ada assignment gudang aktif" }, { status: 403 });
    }

    const body = await req.json();
    const parsed = addInventoryItemSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: parsed.error.issues[0].message }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("inventory_items")
      .insert({
        inventory_location_id: assignment.inventory_location_id,
        item_name: parsed.data.itemName,
        category: parsed.data.category,
        qty_available: parsed.data.qtyAvailable,
        qty_booked: 0,
      })
      .select("id")
      .single();

    if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 });

    return NextResponse.json({ success: true, data: { id: data.id } }, { status: 201 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Terjadi kesalahan";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
