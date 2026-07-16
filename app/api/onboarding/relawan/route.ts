import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { relawanOnboardingSchema } from "@/schemas/onboarding";

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
    const validated = relawanOnboardingSchema.parse(body);

    const { data: existingUser } = await supabase
      .from("users")
      .select("name, email")
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

    const { error: userError } = await supabase
      .from("users")
      .update({
        status: "PENDING",
        community_id: validated.communityId,
      })
      .eq("id", user.id);

    if (userError) {
      return NextResponse.json({ success: false, error: userError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Validasi gagal";
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}
