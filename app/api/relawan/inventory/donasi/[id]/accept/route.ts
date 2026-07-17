import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
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

    const { data: donasi } = await supabase
      .from("donasi")
      .select("id, status")
      .eq("id", id)
      .eq("recommended_inventory_id", assignment.inventory_location_id)
      .single();

    if (!donasi) return NextResponse.json({ success: false, error: "Donasi tidak ditemukan" }, { status: 404 });
    if (donasi.status !== "PENDING") {
      return NextResponse.json({ success: false, error: "Hanya donasi berstatus PENDING yang bisa di-accept" }, { status: 400 });
    }

    const { error } = await supabase
      .from("donasi")
      .update({ status: "DELIVERY", updated_at: new Date().toISOString() })
      .eq("id", id);

    if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 });

    return NextResponse.json({ success: true, data: { id, status: "DELIVERY" } });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Terjadi kesalahan";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
