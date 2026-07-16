import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("communities")
      .select("id, name, super_admin_id, description, created_at")
      .order("name", { ascending: true });

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    const communities = (data ?? []).map((row) => ({
      id: row.id,
      name: row.name,
      superAdminId: row.super_admin_id,
      description: row.description ?? null,
      createdAt: row.created_at,
    }));

    return NextResponse.json({ success: true, data: communities });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Gagal mengambil data komunitas";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
