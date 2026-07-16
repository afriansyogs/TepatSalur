import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const redirectTo = `${url.origin}/api/auth/callback`;

    const supabase = await createClient();

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo,
      },
    });

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    }

    if (!data.url) {
      return NextResponse.json({ success: false, error: "Gagal mendapatkan URL redirect" }, { status: 400 });
    }

    return NextResponse.redirect(data.url);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Gagal memulai Google OAuth";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
