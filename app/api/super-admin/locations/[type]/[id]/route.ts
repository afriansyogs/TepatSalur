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

    if (type !== "inventory" && type !== "posko") {
      return NextResponse.json({ success: false, error: "Tipe lokasi tidak valid" }, { status: 400 });
    }

    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { data: userRow, error: userError } = await supabase
      .from("users")
      .select("role, community_id")
      .eq("id", user.id)
      .single();

    if (userError || !userRow) {
      return NextResponse.json({ success: false, error: "Akses ditolak" }, { status: 403 });
    }

    const userCommunityId = userRow.community_id;

    if (type === "posko") {
      // Authorization check for Posko
      let isAuthorized = false;
      if (userRow.role === "SUPER_ADMIN") {
        if (!userCommunityId) {
          return NextResponse.json({ success: false, error: "Super Admin tidak memiliki komunitas" }, { status: 403 });
        }
        const { data: poskoCheck } = await supabase
          .from("posko")
          .select("id")
          .eq("id", id)
          .eq("community_id", userCommunityId)
          .single();
        if (poskoCheck) isAuthorized = true;
      } else if (userRow.role === "RELAWAN") {
        const { data: assignmentCheck } = await supabase
          .from("relawan_assignments")
          .select("id")
          .eq("user_id", user.id)
          .eq("posko_id", id)
          .eq("is_active", true)
          .eq("assignment_type", "POSKO")
          .single();
        if (assignmentCheck) isAuthorized = true;
      }

      if (!isAuthorized) {
        return NextResponse.json({ success: false, error: "Akses ditolak atau posko tidak ditemukan" }, { status: 403 });
      }

      const body = await req.json();
      const { demografi, kebutuhan } = body;

      if (demografi) {
        let aiUrgencyScore = 0;
        let aiStatus = "HIJAU";

        const lansia = demografi.lansia || 0;
        const anak = demografi.anakAnak || demografi.anak || 0;
        const balita = demografi.balita || 0;
        const ibuHamil = demografi.ibuHamil || 0;
        const disabilitas = demografi.disabilitas || 0;

        if (lansia + anak + balita + ibuHamil + disabilitas > 0) {
          aiUrgencyScore += 30;
          aiStatus = "KUNING";
        }

        const catatan = demografi.catatanMedis || demografi.catatanMedisDarurat || "";
        if (catatan.length > 5) {
          aiUrgencyScore += 40;
          aiStatus = "MERAH";
        }

        const { error: updateError } = await supabase
          .from("posko")
          .update({
            jumlah_pengungsi: (demografi.dewasa || 0) + (demografi.anakAnak || 0) + (demografi.lansia || 0) + (demografi.balita || 0),
            jumlah_dewasa: demografi.dewasa || 0,
            jumlah_anak: (demografi.anakAnak || 0) + (demografi.balita || 0),
            jumlah_lansia: demografi.lansia || 0,
            jumlah_disabilitas: demografi.disabilitas || 0,
            jumlah_ibu_hamil: demografi.ibuHamil || 0,
            catatan_medis_darurat: catatan,
            ai_status: aiStatus,
            ai_urgency_score: aiUrgencyScore,
            updated_at: new Date().toISOString()
          })
          .eq("id", id);

        if (updateError) {
          return NextResponse.json({ success: false, error: updateError.message }, { status: 500 });
        }
      }

      if (kebutuhan && Array.isArray(kebutuhan)) {
        const newItems = [];
        const updateItems = [];

        const mapCategory = (cat: string) => {
          const c = (cat || "").toLowerCase();
          if (c === "makanan" || c === "minuman") return "MAKANAN";
          if (c === "medis" || c === "obat") return "OBAT";
          if (c === "pakaian") return "PAKAIAN";
          return "LAINNYA";
        };

        for (const item of kebutuhan) {
          const itemName = item.nama || item.itemName || item.item_name;
          const category = mapCategory(item.kategori || item.category || item.category_kebutuhan);
          const qty = Number(item.qty ?? item.qtyNeeded ?? item.qty_needed) || 0;

          if (item.id && item.id.length > 20 && !item.id.startsWith("k-")) {
            updateItems.push({
              id: item.id,
              posko_id: id,
              item_name: itemName,
              category_kebutuhan: category,
              qty_needed: qty,
              status: item.status || "OPEN"
            });
          } else {
            newItems.push({
              posko_id: id,
              item_name: itemName,
              category_kebutuhan: category,
              qty_needed: qty,
              status: "OPEN"
            });
          }
        }

        if (updateItems.length > 0) {
          const { error: upsertError } = await supabase
            .from("posko_kebutuhan")
            .upsert(updateItems, { onConflict: "id" });
          if (upsertError) {
            return NextResponse.json({ success: false, error: upsertError.message }, { status: 500 });
          }
        }

        if (newItems.length > 0) {
          const { error: insertError } = await supabase
            .from("posko_kebutuhan")
            .insert(newItems);
          if (insertError) {
            return NextResponse.json({ success: false, error: insertError.message }, { status: 500 });
          }
        }

        const incomingIds = updateItems.map(u => u.id);

        const { data: existingOpens } = await supabase
          .from("posko_kebutuhan")
          .select("id")
          .eq("posko_id", id)
          .eq("status", "OPEN");

        if (existingOpens) {
          const toDelete = existingOpens.filter(ex => !incomingIds.includes(ex.id)).map(ex => ex.id);
          if (toDelete.length > 0) {
            await supabase.from("posko_kebutuhan").delete().in("id", toDelete);
          }
        }
      }

      return NextResponse.json({ success: true });
    }

    // Inventory Type Update
    if (userRow.role !== "SUPER_ADMIN" || !userCommunityId) {
      return NextResponse.json({ success: false, error: "Akses ditolak" }, { status: 403 });
    }

    // Pastikan gudang tersebut milik komunitas admin
    const { data: inventoryData, error: inventoryError } = await supabase
      .from("inventory_locations")
      .select("id")
      .eq("id", id)
      .eq("community_id", userCommunityId)
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

