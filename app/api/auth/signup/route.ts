import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { signUpSchema } from "@/schemas/auth";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const validated = signUpSchema.parse(body);

    const supabase = await createClient();

    const { data, error } = await supabase.auth.signUp({
      email: validated.email,
      password: validated.password,
      options: {
        data: {
          name: validated.name,
          phone: validated.phone,
          role: validated.role,
        },
      },
    });

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    }

    if (!data.user) {
      return NextResponse.json({ success: false, error: "Gagal membuat akun" }, { status: 400 });
    }

    const { error: updateError } = await supabase
      .from("users")
      .update({
        phone: validated.phone,
        role: validated.role,
      })
      .eq("id", data.user.id);

    if (updateError) {
      return NextResponse.json({ success: false, error: updateError.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      role: validated.role,
      userId: data.user.id,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Validasi gagal";
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}
