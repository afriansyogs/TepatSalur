import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { updateInventoryStockSchema } from "@/schemas/inventory";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ type: string; id: string }> }
) {
  try {
    const { type, id } = await params;
    
    if (type !== "posko" && type !== "inventory") {
      return NextResponse.json({ success: false, error: "Tipe lokasi tidak valid" }, { status: 400 });
    }

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

    if (type === "posko") {
      const { data: poskoData, error: poskoError } = await supabase
        .from("posko")
        .select(`
          *,
          posko_kebutuhan (*),
          relawan_assignments (
            is_active,
            users (
              name
            )
          )
        `)
        .eq("id", id)
        .eq("community_id", adminCommunityId)
        .single();

      if (poskoError) {
        return NextResponse.json({ success: false, error: poskoError.message }, { status: 500 });
      }
      if (!poskoData) {
        return NextResponse.json({ success: false, error: "Posko tidak ditemukan" }, { status: 404 });
      }

      const activeAssignments = poskoData.relawan_assignments
        ? (Array.isArray(poskoData.relawan_assignments)
            ? poskoData.relawan_assignments
            : [poskoData.relawan_assignments]
          ).filter((a: { is_active: boolean }) => a.is_active === true)
        : [];

      const assignedVolunteers = activeAssignments.map((a: { users: { name?: string } | { name?: string }[] }) => {
        const u = Array.isArray(a.users) ? a.users[0] : a.users;
        return {
          name: u?.name,
        };
      });

      return NextResponse.json({
        success: true,
        data: {
          id: poskoData.id,
          type: "POSKO",
          name: poskoData.name,
          latitude: poskoData.latitude,
          longitude: poskoData.longitude,
          alamat: poskoData.alamat,
          urgencyStatus: poskoData.ai_status,
          urgencyScore: poskoData.ai_urgency_score,
          demographics: {
            pengungsi: poskoData.jumlah_pengungsi,
            dewasa: poskoData.jumlah_dewasa,
            anak: poskoData.jumlah_anak,
            lansia: poskoData.jumlah_lansia,
            disabilitas: poskoData.jumlah_disabilitas,
            ibuHamil: poskoData.jumlah_ibu_hamil,
          },
          catatanMedis: poskoData.catatan_medis_darurat,
          createdAt: poskoData.created_at,
          updatedAt: poskoData.updated_at,
          needs: Array.isArray(poskoData.posko_kebutuhan) ? poskoData.posko_kebutuhan : [poskoData.posko_kebutuhan].filter(Boolean),
          assignedVolunteers,
        },
      });

    } else {
      const { data: inventoryData, error: inventoryError } = await supabase
        .from("inventory_locations")
        .select(`
          *,
          inventory_items (*),
          relawan_assignments (
            is_active,
            users (
              name
            )
          )
        `)
        .eq("id", id)
        .eq("community_id", adminCommunityId)
        .single();

      if (inventoryError) {
        return NextResponse.json({ success: false, error: inventoryError.message }, { status: 500 });
      }
      if (!inventoryData) {
        return NextResponse.json({ success: false, error: "Gudang tidak ditemukan" }, { status: 404 });
      }

      const activeAssignments = inventoryData.relawan_assignments
        ? (Array.isArray(inventoryData.relawan_assignments)
            ? inventoryData.relawan_assignments
            : [inventoryData.relawan_assignments]
          ).filter((a: { is_active: boolean }) => a.is_active === true)
        : [];

      const assignedVolunteers = activeAssignments.map((a: { id: string; assigned_at: string; users: { id?: string; name?: string; email?: string; phone?: string } | { id?: string; name?: string; email?: string; phone?: string }[] }) => {
        const u = Array.isArray(a.users) ? a.users[0] : a.users;
        return {
          assignmentId: a.id,
          assignedAt: a.assigned_at,
          userId: u?.id,
          name: u?.name,
          email: u?.email,
          phone: u?.phone,
        };
      });

      return NextResponse.json({
        success: true,
        data: {
          id: inventoryData.id,
          type: "INVENTORY",
          name: inventoryData.name,
          latitude: inventoryData.latitude,
          longitude: inventoryData.longitude,
          alamat: inventoryData.alamat,
          isActive: inventoryData.is_active,
          createdAt: inventoryData.created_at,
          needs: Array.isArray(inventoryData.inventory_items) ? inventoryData.inventory_items : [inventoryData.inventory_items].filter(Boolean),
          assignedVolunteers,
        },
      });
    }

  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal Server Error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ type: string; id: string }> }
) {
  try {
    const { type, id } = await params;
    
    if (type !== "inventory") {
      return NextResponse.json({ success: false, error: "Tipe lokasi belum didukung untuk update ini" }, { status: 400 });
    }

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

    const { data: inventoryData, error: inventoryError } = await supabase
      .from("inventory_locations")
      .select("id")
      .eq("id", id)
      .eq("community_id", adminCommunityId)
      .single();

    if (inventoryError || !inventoryData) {
      return NextResponse.json({ success: false, error: "Gudang tidak ditemukan atau akses ditolak" }, { status: 404 });
    }

    const body = await req.json();
    const parsed = updateInventoryStockSchema.safeParse(body);
    if (!parsed.success) {
      const errMsg = parsed.error.issues[0]?.message || "Validasi gagal";
      return NextResponse.json({ success: false, error: errMsg }, { status: 400 });
    }

    const { needs } = parsed.data;

    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return NextResponse.json(
        { success: false, error: "Konfigurasi server tidak lengkap (SUPABASE_SERVICE_ROLE_KEY)" },
        { status: 500 }
      );
    }

    const supabaseAdmin = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    const { data: existingItems, error: fetchError } = await supabaseAdmin
      .from("inventory_items")
      .select("id, item_name, category, qty_available, qty_booked")
      .eq("inventory_location_id", id);

    if (fetchError) {
      return NextResponse.json({ success: false, error: fetchError.message }, { status: 500 });
    }

    const existingMap = new Map((existingItems ?? []).map((item) => [item.id, item]));
    const keptIds = new Set<string>();

    for (const item of needs) {
      if (item.id && existingMap.has(item.id)) {
        const existing = existingMap.get(item.id)!;
        if (item.qty_available < existing.qty_booked) {
          return NextResponse.json(
            {
              success: false,
              error: `Stok "${item.item_name}" tidak boleh kurang dari jumlah yang sedang dibooking (${existing.qty_booked})`,
            },
            { status: 400 }
          );
        }

        const { error: updateError } = await supabaseAdmin
          .from("inventory_items")
          .update({
            item_name: item.item_name,
            category: item.category,
            qty_available: item.qty_available,
          })
          .eq("id", item.id)
          .eq("inventory_location_id", id);

        if (updateError) {
          return NextResponse.json({ success: false, error: updateError.message }, { status: 500 });
        }

        keptIds.add(item.id);
      } else {
        const { error: insertError } = await supabaseAdmin
          .from("inventory_items")
          .insert({
            inventory_location_id: id,
            item_name: item.item_name,
            category: item.category,
            qty_available: item.qty_available,
            qty_booked: 0,
          });

        if (insertError) {
          return NextResponse.json({ success: false, error: insertError.message }, { status: 500 });
        }
      }
    }

    for (const existing of existingItems ?? []) {
      if (keptIds.has(existing.id)) continue;

      if (existing.qty_booked > 0) {
        return NextResponse.json(
          {
            success: false,
            error: `Item "${existing.item_name}" tidak bisa dihapus karena sedang dalam proses distribusi`,
          },
          { status: 400 }
        );
      }

      const { error: deleteError } = await supabaseAdmin
        .from("inventory_items")
        .delete()
        .eq("id", existing.id)
        .eq("inventory_location_id", id);

      if (deleteError) {
        return NextResponse.json({ success: false, error: deleteError.message }, { status: 500 });
      }
    }

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal Server Error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
