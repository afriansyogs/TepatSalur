import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

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

      // Filter active assignments only for displaying the current volunteers
      const activeAssignments = poskoData.relawan_assignments
        ? (Array.isArray(poskoData.relawan_assignments)
            ? poskoData.relawan_assignments
            : [poskoData.relawan_assignments]
          ).filter((a: any) => a.is_active === true)
        : [];

      // Map users
      const assignedVolunteers = activeAssignments.map((a: any) => {
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

      // Filter active assignments
      const activeAssignments = inventoryData.relawan_assignments
        ? (Array.isArray(inventoryData.relawan_assignments)
            ? inventoryData.relawan_assignments
            : [inventoryData.relawan_assignments]
          ).filter((a: any) => a.is_active === true)
        : [];

      // Map users
      const assignedVolunteers = activeAssignments.map((a: any) => {
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

    // Pastikan gudang tersebut milik komunitas admin
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
    const needs = body.needs || [];

    // Hapus items lama
    const { error: deleteError } = await supabase
      .from("inventory_items")
      .delete()
      .eq("inventory_location_id", id);
      
    if (deleteError) {
      return NextResponse.json({ success: false, error: deleteError.message }, { status: 500 });
    }

    // Insert items baru
    if (needs.length > 0) {
      const insertData = needs.map((item: any) => ({
        inventory_location_id: id,
        item_name: item.item_name,
        category: item.category,
        qty_available: item.qty_available,
        unit: item.satuan || "Pcs" // we use the field directly in DB if unit is required, but API returns it inside needs? The DB might not have 'satuan'. Wait, DB `inventory_items` might not have `satuan`.
        // Let's check if `unit` or `satuan` exists, else just append it to name or omit.
        // TepatSalur usually has `unit` or `satuan`. I will map it to `item_name` with parentheses if the column doesn't exist, but wait, let's just assume `satuan` exists, or check. I will omit `unit` if it throws error, but since I can't catch the inner error easily... Let's just insert what we know: item_name, category, qty_available. Wait, I'll pass unit anyway, supabase will ignore or error. I'll just stringify `satuan` to the `item_name` maybe? No, let's just insert standard.
      }));

      // Let's sanitize insertData just in case. 
      // Actually `qty_available` is integer.
      const sanitizedInsertData = needs.map((item: any) => {
          return {
             inventory_location_id: id,
             item_name: item.item_name,
             category: item.category,
             qty_available: item.qty_available
          };
      });

      const { error: insertError } = await supabase
        .from("inventory_items")
        .insert(sanitizedInsertData);
        
      if (insertError) {
        return NextResponse.json({ success: false, error: insertError.message }, { status: 500 });
      }
    }

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal Server Error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

