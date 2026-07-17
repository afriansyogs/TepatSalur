import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";

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
    if (donasi.status === "ACCEPTED") {
      return NextResponse.json({ success: false, error: "Donasi yang sudah ACCEPTED tidak bisa ditolak" }, { status: 400 });
    }

    const supabaseAdmin = process.env.SUPABASE_SERVICE_ROLE_KEY
      ? createAdminClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY)
      : supabase;

    const { error } = await supabaseAdmin
      .from("donasi")
      .update({ status: "REJECTED", updated_at: new Date().toISOString() })
      .eq("id", id);

    if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 });

    return NextResponse.json({ success: true, data: { id, status: "REJECTED" } });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Terjadi kesalahan";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
