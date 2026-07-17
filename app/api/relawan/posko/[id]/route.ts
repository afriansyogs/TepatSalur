import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
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

    const resolvedParams = await params;
    const poskoId = resolvedParams.id;

    // Optional: verify this relawan is assigned to this posko
    const { data: assignment, error: assignmentError } = await supabase
      .from("relawan_assignments")
      .select("id")
      .eq("user_id", user.id)
      .eq("posko_id", poskoId)
      .eq("is_active", true)
      .eq("assignment_type", "POSKO")
      .single();

    if (assignmentError || !assignment) {
       return NextResponse.json({ success: false, error: "Anda tidak ditugaskan di posko ini" }, { status: 403 });
    }

    const body = await req.json();
    const {
      jumlahPengungsi,
      jumlahDewasa,
      jumlahAnak,
      jumlahBalita,
      jumlahLansia,
      jumlahDisabilitas,
      jumlahIbuHamil,
      catatanMedisDarurat,
      kebutuhan
    } = body;

    // AI Urgency Score calculation (Mock for now, could be integrated with LLM)
    // Basic rules based on requirements
    let aiUrgencyScore = 0;
    let aiStatus = "HIJAU";

    if ((jumlahLansia || 0) + (jumlahAnak || 0) + (jumlahBalita || 0) + (jumlahIbuHamil || 0) + (jumlahDisabilitas || 0) > 0) {
       aiUrgencyScore += 30;
       aiStatus = "KUNING";
    }

    if (catatanMedisDarurat && catatanMedisDarurat.length > 5) {
       aiUrgencyScore += 40;
       aiStatus = "MERAH";
    }

    const { error: updateError } = await supabase
      .from("posko")
      .update({
        jumlah_pengungsi: jumlahPengungsi || 0,
        jumlah_dewasa: jumlahDewasa || 0,
        jumlah_anak: (jumlahAnak || 0) + (jumlahBalita || 0),
        jumlah_lansia: jumlahLansia || 0,
        jumlah_disabilitas: jumlahDisabilitas || 0,
        jumlah_ibu_hamil: jumlahIbuHamil || 0,
        catatan_medis_darurat: catatanMedisDarurat || "",
        ai_status: aiStatus,
        ai_urgency_score: aiUrgencyScore,
        updated_at: new Date().toISOString()
      })
      .eq("id", poskoId);
      
    if (updateError) {
      return NextResponse.json({ success: false, error: updateError.message }, { status: 500 });
    }

    if (kebutuhan && Array.isArray(kebutuhan)) {
      const mapCategory = (cat: string) => {
        const c = (cat || "").toLowerCase();
        if (c === "makanan" || c === "minuman") return "MAKANAN";
        if (c === "medis" || c === "obat") return "OBAT";
        if (c === "pakaian") return "PAKAIAN";
        return "LAINNYA";
      };

      const newItems = [];
      for (const item of kebutuhan) {
        newItems.push({
          posko_id: poskoId,
          item_name: item.namaBarang,
          category_kebutuhan: mapCategory(item.kategori),
          qty_needed: item.qtyNeeded,
          status: "OPEN"
        });
      }

      if (newItems.length > 0) {
        // AI Voice input might just append needs or we should probably just insert them.
        // Usually voice input is additive.
        const { error: insertError } = await supabase
          .from("posko_kebutuhan")
          .insert(newItems);
        if (insertError) {
           return NextResponse.json({ success: false, error: insertError.message }, { status: 500 });
        }
      }
    }

    return NextResponse.json({ 
      success: true,
      aiStatus,
      aiUrgencyScore
    });

  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal Server Error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
