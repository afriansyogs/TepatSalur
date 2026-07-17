import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { data: userRow, error: userError } = await supabase
      .from("users")
      .select("role")
      .eq("id", user.id)
      .single();

    if (userError || !userRow || userRow.role !== "RELAWAN") {
      return NextResponse.json({ success: false, error: "Akses ditolak" }, { status: 403 });
    }

    
    const { data: assignment, error: assignmentError } = await supabase
      .from("relawan_assignments")
      .select(`
        posko_id,
        posko:posko_id (
          id, name, latitude, longitude, alamat, provinsi, kab_kota, kecamatan, 
          jumlah_pengungsi, jumlah_dewasa, jumlah_anak, jumlah_lansia, jumlah_disabilitas, jumlah_ibu_hamil,
          catatan_medis_darurat, ai_status, ai_urgency_score, updated_at
        )
      `)
      .eq("user_id", user.id)
      .eq("is_active", true)
      .eq("assignment_type", "POSKO")
      .single();

    if (assignmentError || !assignment || !assignment.posko) {
      return NextResponse.json({ success: false, error: "Anda tidak memiliki penugasan posko yang aktif" }, { status: 404 });
    }

    const poskoData = Array.isArray(assignment.posko) ? assignment.posko[0] : assignment.posko;

    
    const { data: needs, error: needsError } = await supabase
      .from("posko_kebutuhan")
      .select("*")
      .eq("posko_id", poskoData.id)
      .order("created_at", { ascending: false });

    if (needsError) {
      return NextResponse.json({ success: false, error: needsError.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      data: {
        id: poskoData.id,
        name: poskoData.name,
        latitude: poskoData.latitude,
        longitude: poskoData.longitude,
        alamat: poskoData.alamat,
        urgencyStatus: poskoData.ai_status || "HIJAU",
        urgencyScore: poskoData.ai_urgency_score || 0,
        
        jumlahPengungsi: poskoData.jumlah_pengungsi || 0,
        jumlahDewasa: poskoData.jumlah_dewasa || 0,
        jumlahAnak: poskoData.jumlah_anak || 0,
        jumlahBalita: 0,
        jumlahLansia: poskoData.jumlah_lansia || 0,
        jumlahDisabilitas: poskoData.jumlah_disabilitas || 0,
        jumlahIbuHamil: poskoData.jumlah_ibu_hamil || 0,
        catatanMedisDarurat: poskoData.catatan_medis_darurat || "",
        aiStatus: poskoData.ai_status || "HIJAU",
        aiUrgencyScore: poskoData.ai_urgency_score || 0,
        
        demographics: {
          pengungsi: poskoData.jumlah_pengungsi || 0,
          dewasa: poskoData.jumlah_dewasa || 0,
          anakAnak: poskoData.jumlah_anak || 0,
          lansia: poskoData.jumlah_lansia || 0,
          balita: 0,
          disabilitas: poskoData.jumlah_disabilitas || 0,
          ibuHamil: poskoData.jumlah_ibu_hamil || 0,
        },
        catatanMedis: poskoData.catatan_medis_darurat || "",
        updatedAt: poskoData.updated_at,
        needs: needs || [],
        kebutuhan: (needs || []).map((n: any) => {
          let cat = (n.category_kebutuhan || "").toUpperCase();
          if (cat === "MAKANAN" || cat === "MINUMAN") cat = "MAKANAN";
          else if (cat === "OBAT" || cat === "MEDIS") cat = "OBAT";
          else if (cat === "PAKAIAN") cat = "PAKAIAN";
          else cat = "LAINNYA";
          return {
            id: n.id,
            kategori: cat,
            namaBarang: n.item_name,
            qtyNeeded: n.qty_needed,
            qtyFulfilled: n.qty_fulfilled || 0,
            status: n.status || "OPEN"
          };
        })
      },
    });

  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal Server Error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    
    const { data: assignment, error: assignmentError } = await supabase
      .from("relawan_assignments")
      .select("posko_id")
      .eq("user_id", user.id)
      .eq("is_active", true)
      .eq("assignment_type", "POSKO")
      .single();

    if (assignmentError || !assignment || !assignment.posko_id) {
      return NextResponse.json({ success: false, error: "Penugasan posko tidak ditemukan" }, { status: 404 });
    }

    const body = await req.json();
    const { demografi, kebutuhan } = body;
    const poskoId = assignment.posko_id;

    if (demografi) {
      const { error: updateError } = await supabase
        .from("posko")
        .update({
          jumlah_pengungsi: (demografi.dewasa || 0) + (demografi.anakAnak || 0) + (demografi.lansia || 0) + (demografi.balita || 0),
          jumlah_dewasa: demografi.dewasa || 0,
          jumlah_anak: (demografi.anakAnak || 0) + (demografi.balita || 0),
          jumlah_lansia: demografi.lansia || 0,
          jumlah_disabilitas: demografi.disabilitas || 0,
          jumlah_ibu_hamil: demografi.ibuHamil || 0,
          catatan_medis_darurat: demografi.catatanMedis || "",
          updated_at: new Date().toISOString()
        })
        .eq("id", poskoId);
        
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
        if (item.id && item.id.length > 20 && !item.id.startsWith("k-")) {
          
          updateItems.push({
            id: item.id,
            posko_id: poskoId,
            item_name: item.nama || item.item_name,
            category_kebutuhan: mapCategory(item.kategori || item.category_kebutuhan),
            qty_needed: Number(item.qty ?? item.qty_needed) || 0,
            status: item.status || "OPEN"
          });
        } else {
          
          newItems.push({
            posko_id: poskoId,
            item_name: item.nama || item.item_name,
            category_kebutuhan: mapCategory(item.kategori || item.category_kebutuhan),
            qty_needed: Number(item.qty ?? item.qty_needed) || 0,
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
        .eq("posko_id", poskoId)
        .eq("status", "OPEN");
        
      if (existingOpens) {
        const toDelete = existingOpens.filter(ex => !incomingIds.includes(ex.id)).map(ex => ex.id);
        if (toDelete.length > 0) {
          await supabase.from("posko_kebutuhan").delete().in("id", toDelete);
        }
      }
    }

    return NextResponse.json({ success: true });

  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal Server Error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
