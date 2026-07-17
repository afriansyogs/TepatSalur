import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { StatsResponse } from "@/types/map";

export async function GET() {
  try {
    const supabase = await createClient();

    const [poskoRes, merahRes, relawanRes] = await Promise.all([
      supabase.from("posko").select("jumlah_pengungsi"),
      supabase.from("posko").select("id", { count: "exact", head: true }).eq("ai_status", "MERAH"),
      supabase.from("relawan_assignments").select("id", { count: "exact", head: true }).eq("status", "APPROVED").eq("is_active", true),
    ]);

    const totalPengungsi = (poskoRes.data ?? []).reduce((sum, p) => sum + (p.jumlah_pengungsi ?? 0), 0);

    const data: StatsResponse = {
      totalPengungsi,
      totalPoskoMerah: merahRes.count ?? 0,
      totalRelawanAktif: relawanRes.count ?? 0,
    };

    return NextResponse.json({ success: true, data });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Terjadi kesalahan";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
