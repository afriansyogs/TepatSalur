import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";
import { voiceParseResultSchema } from "@/schemas/ai";
import { VoiceParseResult } from "@/types/ai";

const TRIAGE_PROMPT = `Kamu adalah asisten pendataan bencana. Dengarkan audio berikut dan ekstrak semua informasi ke dalam format JSON.
Aturan:
- Kembalikan HANYA JSON valid tanpa markdown, kode blok, atau teks tambahan.
- Jika suatu metrik demografi (jumlahPengungsi, jumlahDewasa, jumlahAnak, jumlahLansia, jumlahDisabilitas, jumlahIbuHamil) atau catatanMedisDarurat TIDAK disebutkan dalam audio, set nilainya ke null atau hilangkan dari JSON. Jangan gunakan default 0 atau string kosong jika tidak disebutkan.
- Untuk kategori kebutuhan, pilih yang paling sesuai: MAKANAN (makanan/minuman), PAKAIAN (pakaian/selimut), OBAT (obat/medis), LAINNYA (lainnya).
- Jika tidak ada kebutuhan disebutkan, gunakan array kosong [].`;

export async function POST(req: Request) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const apiKey = process.env.GEMINI_API_KEY_STT;
    if (!apiKey) {
      return NextResponse.json(
        { success: false, error: "Konfigurasi AI tidak tersedia" },
        { status: 500 }
      );
    }

    const formData = await req.formData();
    const audioFile = formData.get("audio") as File | null;
    const poskoId = formData.get("poskoId") as string | null;

    if (!audioFile || !poskoId) {
      return NextResponse.json(
        { success: false, error: "Audio dan poskoId wajib diisi" },
        { status: 400 }
      );
    }

    const { data: assignment } = await supabase
      .from("relawan_assignments")
      .select(`
        id,
        posko (
          jumlah_pengungsi,
          jumlah_dewasa,
          jumlah_anak,
          jumlah_lansia,
          jumlah_disabilitas,
          jumlah_ibu_hamil,
          catatan_medis_darurat
        )
      `)
      .eq("user_id", user.id)
      .eq("posko_id", poskoId)
      .eq("assignment_type", "POSKO")
      .eq("status", "APPROVED")
      .single();

    if (!assignment) {
      return NextResponse.json({ success: false, error: "Akses ditolak" }, { status: 403 });
    }

    const currentPosko = assignment.posko as unknown as Record<string, any> | null;

    const audioBuffer = await audioFile.arrayBuffer();
    const audioBase64 = Buffer.from(audioBuffer).toString("base64");
    const mimeType = (audioFile.type || "audio/webm") as string;

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: "gemini-3.1-flash-lite",
      generationConfig: {
        responseMimeType: "application/json",
        temperature: 0.1,
        responseSchema: {
          type: SchemaType.OBJECT,
          properties: {
            jumlahPengungsi: { type: SchemaType.INTEGER, nullable: true },
            jumlahDewasa: { type: SchemaType.INTEGER, nullable: true },
            jumlahAnak: { type: SchemaType.INTEGER, nullable: true },
            jumlahLansia: { type: SchemaType.INTEGER, nullable: true },
            jumlahDisabilitas: { type: SchemaType.INTEGER, nullable: true },
            jumlahIbuHamil: { type: SchemaType.INTEGER, nullable: true },
            catatanMedisDarurat: { type: SchemaType.STRING, nullable: true },
            kebutuhan: {
              type: SchemaType.ARRAY,
              items: {
                type: SchemaType.OBJECT,
                properties: {
                  kategori: { type: SchemaType.STRING, format: "enum", enum: ["MAKANAN", "PAKAIAN", "OBAT", "LAINNYA"] },
                  namaBarang: { type: SchemaType.STRING },
                  qtyNeeded: { type: SchemaType.INTEGER }
                },
                required: ["kategori", "namaBarang", "qtyNeeded"]
              }
            }
          },
          required: ["kebutuhan"]
        }
      }
    });

    const result = await model.generateContent([
      TRIAGE_PROMPT,
      {
        inlineData: {
          mimeType,
          data: audioBase64,
        },
      },
    ]);

    const rawText = result.response.text().trim();

    let parsedJson: unknown;
    try {
      parsedJson = JSON.parse(rawText);
    } catch {
      return NextResponse.json(
        { success: false, error: "Gagal memproses respons AI" },
        { status: 500 }
      );
    }

    const validated = voiceParseResultSchema.parse(parsedJson);

    const updateData: Record<string, any> = {
      updated_at: new Date().toISOString(),
    };

    if (validated.jumlahPengungsi !== null && validated.jumlahPengungsi !== undefined) {
      updateData.jumlah_pengungsi = validated.jumlahPengungsi;
    }
    if (validated.jumlahDewasa !== null && validated.jumlahDewasa !== undefined) {
      updateData.jumlah_dewasa = validated.jumlahDewasa;
    }
    if (validated.jumlahAnak !== null && validated.jumlahAnak !== undefined) {
      updateData.jumlah_anak = validated.jumlahAnak;
    }
    if (validated.jumlahLansia !== null && validated.jumlahLansia !== undefined) {
      updateData.jumlah_lansia = validated.jumlahLansia;
    }
    if (validated.jumlahDisabilitas !== null && validated.jumlahDisabilitas !== undefined) {
      updateData.jumlah_disabilitas = validated.jumlahDisabilitas;
    }
    if (validated.jumlahIbuHamil !== null && validated.jumlahIbuHamil !== undefined) {
      updateData.jumlah_ibu_hamil = validated.jumlahIbuHamil;
    }
    if (validated.catatanMedisDarurat !== null && validated.catatanMedisDarurat !== undefined) {
      updateData.catatan_medis_darurat = validated.catatanMedisDarurat;
    }

    const { error: poskoError } = await supabase
      .from("posko")
      .update(updateData)
      .eq("id", poskoId);

    if (poskoError) {
      return NextResponse.json({ success: false, error: poskoError.message }, { status: 500 });
    }

    if (validated.kebutuhan.length > 0) {
      await supabase
        .from("posko_kebutuhan")
        .delete()
        .eq("posko_id", poskoId)
        .eq("status", "OPEN");

      const kebutuhanRows = validated.kebutuhan.map((item) => ({
        posko_id: poskoId,
        category_kebutuhan: item.kategori,
        item_name: item.namaBarang,
        qty_needed: item.qtyNeeded,
        qty_booked: 0,
        qty_fulfilled: 0,
        status: "OPEN",
      }));

      const { error: kebutuhanError } = await supabase
        .from("posko_kebutuhan")
        .insert(kebutuhanRows);

      if (kebutuhanError) {
        return NextResponse.json({ success: false, error: kebutuhanError.message }, { status: 500 });
      }
    }

    await supabase.from("ai_log").insert({
      type: "VOICE_PARSE",
      posko_id: poskoId,
      raw_input: rawText,
      ai_response_json: validated,
    });

    const responseData: VoiceParseResult = {
      jumlahPengungsi: updateData.jumlah_pengungsi !== undefined ? updateData.jumlah_pengungsi : (currentPosko?.jumlah_pengungsi ?? 0),
      jumlahDewasa: updateData.jumlah_dewasa !== undefined ? updateData.jumlah_dewasa : (currentPosko?.jumlah_dewasa ?? 0),
      jumlahAnak: updateData.jumlah_anak !== undefined ? updateData.jumlah_anak : (currentPosko?.jumlah_anak ?? 0),
      jumlahLansia: updateData.jumlah_lansia !== undefined ? updateData.jumlah_lansia : (currentPosko?.jumlah_lansia ?? 0),
      jumlahDisabilitas: updateData.jumlah_disabilitas !== undefined ? updateData.jumlah_disabilitas : (currentPosko?.jumlah_disabilitas ?? 0),
      jumlahIbuHamil: updateData.jumlah_ibu_hamil !== undefined ? updateData.jumlah_ibu_hamil : (currentPosko?.jumlah_ibu_hamil ?? 0),
      catatanMedisDarurat: updateData.catatan_medis_darurat !== undefined ? updateData.catatan_medis_darurat : (currentPosko?.catatan_medis_darurat ?? ""),
      kebutuhan: validated.kebutuhan,
    };

    return NextResponse.json({ success: true, data: responseData });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Terjadi kesalahan";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
