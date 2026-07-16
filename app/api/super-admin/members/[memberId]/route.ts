import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { patchMemberSchema } from "@/schemas/members";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ memberId: string }> }
) {
  try {
    const { memberId } = await params;
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { data: adminRow, error: adminError } = await supabase
      .from("users")
      .select("role, community_id")
      .eq("id", user.id)
      .single();

    if (adminError || !adminRow || adminRow.role !== "SUPER_ADMIN") {
      return NextResponse.json({ success: false, error: "Akses ditolak" }, { status: 403 });
    }

    const adminCommunityId = adminRow.community_id;
    if (!adminCommunityId) {
      return NextResponse.json(
        { success: false, error: "Super Admin tidak memiliki komunitas yang valid" },
        { status: 403 }
      );
    }

    const { data: targetRow, error: targetError } = await supabase
      .from("users")
      .select("role, community_id")
      .eq("id", memberId)
      .maybeSingle();

    if (targetError) {
      return NextResponse.json({ success: false, error: targetError.message }, { status: 500 });
    }

    if (!targetRow) {
      return NextResponse.json({ success: false, error: "Anggota tidak ditemukan" }, { status: 404 });
    }

    if (targetRow.role !== "RELAWAN" || targetRow.community_id !== adminCommunityId) {
      return NextResponse.json(
        { success: false, error: "Akses ditolak: Anggota berada di luar komunitas Anda" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const parsedBody = patchMemberSchema.safeParse(body);

    if (!parsedBody.success) {
      const errMsg = parsedBody.error.issues[0]?.message || "Validasi gagal";
      return NextResponse.json({ success: false, error: errMsg }, { status: 400 });
    }

    const { status, assignmentType, poskoId, inventoryLocationId } = parsedBody.data;

    // Buat admin client untuk membypass RLS
    const supabaseAdmin = process.env.SUPABASE_SERVICE_ROLE_KEY
      ? createAdminClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY)
      : supabase;

    if (status) {
      const { error: updateStatusError } = await supabaseAdmin
        .from("users")
        .update({ status })
        .eq("id", memberId);

      if (updateStatusError) {
        return NextResponse.json({ success: false, error: updateStatusError.message }, { status: 500 });
      }
    }

    if (assignmentType) {
      const nowString = new Date().toISOString();

      if (assignmentType === "POSKO") {
        const { data: poskoRow, error: poskoError } = await supabase
          .from("posko")
          .select("id")
          .eq("id", poskoId)
          .eq("community_id", adminCommunityId)
          .maybeSingle();

        if (poskoError) {
          return NextResponse.json({ success: false, error: poskoError.message }, { status: 500 });
        }

        if (!poskoRow) {
          return NextResponse.json(
            { success: false, error: "Posko tidak ditemukan di komunitas Anda" },
            { status: 400 }
          );
        }

        const { error: deactivateError } = await supabaseAdmin
          .from("relawan_assignments")
          .update({ is_active: false, deactivated_at: nowString })
          .eq("user_id", memberId)
          .eq("is_active", true);

        if (deactivateError) {
          return NextResponse.json({ success: false, error: deactivateError.message }, { status: 500 });
        }

        const { error: insertError } = await supabaseAdmin.from("relawan_assignments").insert({
          user_id: memberId,
          community_id: adminCommunityId,
          assignment_type: "POSKO",
          posko_id: poskoId,
          inventory_location_id: null,
          status: "APPROVED",
          is_active: true,
          assigned_at: nowString,
        });

        if (insertError) {
          return NextResponse.json({ success: false, error: insertError.message }, { status: 500 });
        }
      } else if (assignmentType === "INVENTORY") {
        const { data: inventoryRow, error: inventoryError } = await supabase
          .from("inventory_locations")
          .select("id")
          .eq("id", inventoryLocationId)
          .eq("community_id", adminCommunityId)
          .maybeSingle();

        if (inventoryError) {
          return NextResponse.json({ success: false, error: inventoryError.message }, { status: 500 });
        }

        if (!inventoryRow) {
          return NextResponse.json(
            { success: false, error: "Gudang tidak ditemukan di komunitas Anda" },
            { status: 400 }
          );
        }

        const { error: deactivateError } = await supabaseAdmin
          .from("relawan_assignments")
          .update({ is_active: false, deactivated_at: nowString })
          .eq("user_id", memberId)
          .eq("is_active", true);

        if (deactivateError) {
          return NextResponse.json({ success: false, error: deactivateError.message }, { status: 500 });
        }

        const { error: insertError } = await supabaseAdmin.from("relawan_assignments").insert({
          user_id: memberId,
          community_id: adminCommunityId,
          assignment_type: "INVENTORY",
          posko_id: null,
          inventory_location_id: inventoryLocationId,
          status: "APPROVED",
          is_active: true,
          assigned_at: nowString,
        });

        if (insertError) {
          return NextResponse.json({ success: false, error: insertError.message }, { status: 500 });
        }
      } else if (assignmentType === "UNASSIGNED") {
        const { error: deactivateError } = await supabaseAdmin
          .from("relawan_assignments")
          .update({ is_active: false, deactivated_at: nowString })
          .eq("user_id", memberId)
          .eq("is_active", true);

        if (deactivateError) {
          return NextResponse.json({ success: false, error: deactivateError.message }, { status: 500 });
        }
      }
    }

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal Server Error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
