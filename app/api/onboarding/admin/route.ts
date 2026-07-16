import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { adminOnboardingSchema } from "@/schemas/onboarding";

export async function POST(req: Request) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const validated = adminOnboardingSchema.parse(body);

    const { data: existingUser } = await supabase
      .from("users")
      .select("name")
      .eq("id", user.id)
      .single();

    const { error: profileError } = await supabase.from("user_profiles").upsert({
      user_id: user.id,
      nama_lengkap: existingUser?.name ?? "",
      alamat: validated.alamat,
      nik: validated.nik,
      tempat_lahir: validated.tempatLahir,
      tanggal_lahir: validated.tanggalLahir,
      jenis_kelamin: validated.jenisKelamin,
      is_completed: true,
    });

    if (profileError) {
      return NextResponse.json({ success: false, error: profileError.message }, { status: 500 });
    }

    const { data: community, error: communityError } = await supabase
      .from("communities")
      .insert({
        name: validated.name,
        description: validated.description ?? null,
        super_admin_id: user.id,
      })
      .select("id")
      .single();

    if (communityError || !community) {
      return NextResponse.json(
        { success: false, error: communityError?.message ?? "Gagal membuat komunitas" },
        { status: 500 }
      );
    }

    const { error: inventoryError } = await supabase.from("inventory_locations").insert({
      community_id: community.id,
      name: validated.name,
      latitude: validated.latitude,
      longitude: validated.longitude,
      alamat: validated.alamat,
      provinsi: validated.provinsi ?? null,
      kab_kota: validated.kabKota ?? null,
      kecamatan: validated.kecamatan ?? null,
      foto_url: validated.fotoUrl || null,
      is_active: true,
    });

    if (inventoryError) {
      return NextResponse.json({ success: false, error: inventoryError.message }, { status: 500 });
    }

    const { error: userError } = await supabase
      .from("users")
      .update({
        community_id: community.id,
        status: "ACTIVE",
      })
      .eq("id", user.id);

    if (userError) {
      return NextResponse.json({ success: false, error: userError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, communityId: community.id });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Validasi gagal";
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}
