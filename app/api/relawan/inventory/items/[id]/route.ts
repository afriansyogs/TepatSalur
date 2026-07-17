import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { editInventoryItemSchema } from "@/schemas/inventory";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
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

    const { data: item } = await supabase
      .from("inventory_items")
      .select("id, qty_booked")
      .eq("id", id)
      .eq("inventory_location_id", assignment.inventory_location_id)
      .single();

    if (!item) return NextResponse.json({ success: false, error: "Item tidak ditemukan" }, { status: 404 });

    const body = await req.json();
    const parsed = editInventoryItemSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: parsed.error.issues[0].message }, { status: 400 });
    }

    if (parsed.data.qtyAvailable !== undefined && parsed.data.qtyAvailable < item.qty_booked) {
      return NextResponse.json({ success: false, error: `qty_available tidak boleh kurang dari qty_booked (${item.qty_booked})` }, { status: 400 });
    }

    const updatePayload: Record<string, unknown> = {};
    if (parsed.data.itemName !== undefined) updatePayload.item_name = parsed.data.itemName;
    if (parsed.data.category !== undefined) updatePayload.category = parsed.data.category;
    if (parsed.data.qtyAvailable !== undefined) updatePayload.qty_available = parsed.data.qtyAvailable;

    const { error } = await supabase.from("inventory_items").update(updatePayload).eq("id", id);
    if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 });

    return NextResponse.json({ success: true, data: { id } });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Terjadi kesalahan";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
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

    const { data: item } = await supabase
      .from("inventory_items")
      .select("id, qty_booked")
      .eq("id", id)
      .eq("inventory_location_id", assignment.inventory_location_id)
      .single();

    if (!item) return NextResponse.json({ success: false, error: "Item tidak ditemukan" }, { status: 404 });
    if (item.qty_booked > 0) {
      return NextResponse.json({ success: false, error: "Item tidak bisa dihapus karena sedang dalam proses distribusi" }, { status: 400 });
    }

    const { error } = await supabase.from("inventory_items").delete().eq("id", id);
    if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 });

    return NextResponse.json({ success: true, data: { id } });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Terjadi kesalahan";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
