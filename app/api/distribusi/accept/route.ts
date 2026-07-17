import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { acceptDistribusiSchema } from "@/schemas/ai";

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const parsed = acceptDistribusiSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: parsed.error.issues[0].message }, { status: 400 });
    }

    const { inventoryLocationId, poskoId, items } = parsed.data;

    // Verify relawan has active INVENTORY assignment for this location
    const { data: assignment } = await supabase
      .from("relawan_assignments")
      .select("id")
      .eq("user_id", user.id)
      .eq("inventory_location_id", inventoryLocationId)
      .eq("assignment_type", "INVENTORY")
      .eq("status", "APPROVED")
      .eq("is_active", true)
      .single();

    if (!assignment) return NextResponse.json({ success: false, error: "Akses ditolak" }, { status: 403 });

    // Atomic: INSERT distribusi + distribusi_items + UPDATE qty_booked via RPC
    const { data, error } = await supabase.rpc("accept_distribusi", {
      p_inventory_location_id: inventoryLocationId,
      p_posko_id: poskoId,
      p_relawan_id: user.id,
      p_items: items,
    });

    if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 });

    return NextResponse.json({ success: true, data: { distribusiId: data } });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Terjadi kesalahan";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
