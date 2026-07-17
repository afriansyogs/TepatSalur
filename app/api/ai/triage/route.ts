import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { triageResultSchema, poskoVoiceInputSchema } from "@/schemas/ai";
import { TriageResult } from "@/types/ai";

function buildTriagePrompt(data: {
  jumlahPengungsi: number;
  jumlahAnak: number;
  jumlahLansia: number;
  jumlahDisabilitas: number;
  jumlahIbuHamil: number;
  catatanMedisDarurat: string;
  kebutuhan: { kategori: string; namaBarang: string; qtyNeeded: number }[];
}): string {
  const kebutuhanList =
    data.kebutuhan.length > 0
      ? data.kebutuhan.map((k) => `${k.namaBarang} (${k.kategori}, qty: ${k.qtyNeeded})`).join(", ")
      : "tidak ada";

  return `Kamu adalah sistem triase bencana. Berdasarkan data posko berikut, tentukan tingkat urgensi dan berikan skor 0-100.

Data Posko:
- Jumlah pengungsi: ${data.jumlahPengungsi}
- Anak-anak: ${data.jumlahAnak}
- Lansia: ${data.jumlahLansia}
- Disabilitas: ${data.jumlahDisabilitas}
- Ibu hamil: ${data.jumlahIbuHamil}
- Catatan medis darurat: "${data.catatanMedisDarurat || "tidak ada"}"
- Kebutuhan mendesak: ${kebutuhanList}

Kembalikan JSON valid tanpa markdown atau kode blok:
{
  "status": "MERAH" | "KUNING" | "HIJAU",
  "score": number (0-100),
  "reasoning": "string (1-2 kalimat alasan dalam bahasa Indonesia)"
}

Panduan klasifikasi:
- MERAH (skor 70-100): kondisi kritis, banyak kelompok rentan, ada kebutuhan medis darurat
- KUNING (skor 40-69): kondisi sedang, perlu perhatian segera
- HIJAU (skor 0-39): kondisi relatif stabil, kebutuhan dasar terpenuhi`;
}

export async function POST(req: Request) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const apiKey = process.env.GEMINI_API_KEY_URGENT;
    if (!apiKey) {
      return NextResponse.json(
        { success: false, error: "Konfigurasi AI tidak tersedia" },
        { status: 500 }
      );
    }

    const body = await req.json();
    const validated = poskoVoiceInputSchema.parse(body);

    const { data: assignment } = await supabase
      .from("relawan_assignments")
      .select("id")
      .eq("user_id", user.id)
      .eq("posko_id", validated.poskoId)
      .eq("assignment_type", "POSKO")
      .eq("status", "APPROVED")
      .single();

    if (!assignment) {
      return NextResponse.json({ success: false, error: "Akses ditolak" }, { status: 403 });
    }

    const prompt = buildTriagePrompt(validated);

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-3.1-flash-lite" });

    const result = await model.generateContent(prompt);
    const rawText = result.response.text().trim();

    let parsedJson: unknown;
    try {
      const jsonMatch = rawText.match(/\{[\s\S]*\}/);
      parsedJson = JSON.parse(jsonMatch ? jsonMatch[0] : rawText);
    } catch {
      return NextResponse.json(
        { success: false, error: "Gagal memproses respons AI" },
        { status: 500 }
      );
    }

    const triageResult = triageResultSchema.parse(parsedJson);

    const { error: updateError } = await supabase
      .from("posko")
      .update({
        ai_status: triageResult.status,
        ai_urgency_score: triageResult.score,
        last_ai_update: new Date().toISOString(),
      })
      .eq("id", validated.poskoId);

    if (updateError) {
      return NextResponse.json({ success: false, error: updateError.message }, { status: 500 });
    }

    await supabase.from("ai_log").insert({
      type: "TRIAGE",
      posko_id: validated.poskoId,
      raw_input: JSON.stringify(validated),
      ai_response_json: triageResult,
    });

    const responseData: TriageResult = triageResult;

    return NextResponse.json({ success: true, data: responseData });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Terjadi kesalahan";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
