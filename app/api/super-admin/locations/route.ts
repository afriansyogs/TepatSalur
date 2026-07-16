import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createPoskoSchema, createInventorySchema } from "@/schemas/locations";

export async function GET(req: NextRequest) {
  try {
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
      return NextResponse.json({
        success: true,
        data: { poskos: [], inventories: [] },
      });
    }

    // Ambil data Posko
    const { data: rawPoskos, error: poskoError } = await supabase
      .from("posko")
      .select(`
        id,
        name,
        alamat,
        latitude,
        longitude,
        ai_status,
        ai_urgency_score,
        relawan_assignments (id, is_active),
        posko_kebutuhan (
          id,
          item_name,
          qty_needed,
          qty_fulfilled,
          status
        )
      `)
      .eq("community_id", adminCommunityId);

    const { data: rawInventories, error: inventoryError } = await supabase
      .from("inventory_locations")
      .select(`
        id,
        name,
        alamat,
        latitude,
        longitude,
        is_active,
        relawan_assignments (id, is_active),
        inventory_items (
          id,
          item_name,
          category,
          qty_available
        )
      `)
      .eq("community_id", adminCommunityId);

    if (poskoError || inventoryError) {
      return NextResponse.json(
        { success: false, error: "Gagal mengambil data lokasi" },
        { status: 500 }
      );
    }

    const poskos = (rawPoskos || []).map((p: any) => {
      const activeAssignments = p.relawan_assignments
        ? (Array.isArray(p.relawan_assignments) ? p.relawan_assignments : [p.relawan_assignments]).filter(
            (a: any) => a.is_active === true
          )
        : [];

      let kebutuhan = [];
      if (p.posko_kebutuhan) {
        const arr = Array.isArray(p.posko_kebutuhan) ? p.posko_kebutuhan : [p.posko_kebutuhan];
        kebutuhan = arr.slice(0, 3);
      }

      return {
        id: p.id,
        type: "POSKO",
        name: p.name,
        alamat: p.alamat,
        latitude: p.latitude,
        longitude: p.longitude,
        urgencyStatus: p.ai_status,
        urgencyScore: p.ai_urgency_score,
        totalVolunteers: activeAssignments.length,
        needs: kebutuhan,
      };
    });

    const inventories = (rawInventories || []).map((i: any) => {
      const activeAssignments = i.relawan_assignments
        ? (Array.isArray(i.relawan_assignments) ? i.relawan_assignments : [i.relawan_assignments]).filter(
            (a: any) => a.is_active === true
          )
        : [];

      let items = [];
      if (i.inventory_items) {
        const arr = Array.isArray(i.inventory_items) ? i.inventory_items : [i.inventory_items];
        items = arr.slice(0, 3);
      }

      return {
        id: i.id,
        type: "INVENTORY",
        name: i.name,
        alamat: i.alamat,
        latitude: i.latitude,
        longitude: i.longitude,
        isActive: i.is_active,
        totalVolunteers: activeAssignments.length,
        needs: items,
      };
    });

    return NextResponse.json({
      success: true,
      data: {
        poskos,
        inventories,
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal Server Error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
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

    const body = await req.json();
    const type = body.type;

    if (type === "POSKO") {
      const { needs, ...poskoData } = body.payload;
      const parsed = createPoskoSchema.safeParse(poskoData);
      if (!parsed.success) {
        const errMsg = parsed.error.issues[0]?.message || "Validasi gagal";
        return NextResponse.json({ success: false, error: errMsg }, { status: 400 });
      }

      const { data, error } = await supabase
        .from("posko")
        .insert({
          community_id: adminCommunityId,
          ...parsed.data,
        })
        .select("id")
        .single();

      if (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
      }

      if (needs && Array.isArray(needs) && needs.length > 0) {
        const needsData = needs.map((n: any) => ({
          posko_id: data.id,
          item_name: n.item_name,
          qty_needed: n.qty_needed,
          status: "OPEN",
          qty_fulfilled: 0
        }));

        const { error: needsError } = await supabase.from("posko_kebutuhan").insert(needsData);
        if (needsError) {
          console.error("Gagal menyimpan kebutuhan posko:", needsError);
        }
      }

      return NextResponse.json({ success: true, data });
    } else if (type === "INVENTORY") {
      const parsed = createInventorySchema.safeParse(body.payload);
      if (!parsed.success) {
        const errMsg = parsed.error.issues[0]?.message || "Validasi gagal";
        return NextResponse.json({ success: false, error: errMsg }, { status: 400 });
      }

      const { data, error } = await supabase
        .from("inventory_locations")
        .insert({
          community_id: adminCommunityId,
          ...parsed.data,
          is_active: true,
        })
        .select("id")
        .single();

      if (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
      }

      return NextResponse.json({ success: true, data });
    } else {
      return NextResponse.json({ success: false, error: "Tipe lokasi tidak valid" }, { status: 400 });
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal Server Error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
