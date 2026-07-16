import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";
import { voiceParseResultSchema } from "@/schemas/ai";

const TRIAGE_PROMPT = `Kamu adalah asisten pendataan bencana. Dengarkan audio berikut dan ekstrak semua informasi ke dalam format JSON.
Aturan:
- Kembalikan HANYA JSON valid tanpa markdown, kode blok, atau teks tambahan.
- Jika suatu metrik demografi (jumlahPengungsi, jumlahDewasa, jumlahAnak, jumlahLansia, jumlahDisabilitas, jumlahIbuHamil) atau catatanMedisDarurat TIDAK disebutkan dalam audio, set nilainya ke null atau hilangkan dari JSON. Jangan gunakan default 0 atau string kosong jika tidak disebutkan.
- Untuk kategori kebutuhan, pilih yang paling sesuai: MAKANAN (makanan/minuman), PAKAIAN (pakaian/selimut), OBAT (obat/medis), LAINNYA (lainnya).
- Jika tidak ada kebutuhan disebutkan, gunakan array kosong [].`;

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const apiKey = process.env.GEMINI_API_KEY_STT;
    if (!apiKey) {
      return NextResponse.json({ success: false, error: "Konfigurasi AI tidak tersedia" }, { status: 500 });
    }

    const formData = await req.formData();
    const audioFile = formData.get("audio") as File | null;

    if (!audioFile) {
      return NextResponse.json({ success: false, error: "Audio wajib diisi" }, { status: 400 });
    }

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
      return NextResponse.json({ success: false, error: "Gagal memproses respons AI" }, { status: 500 });
    }

    const validated = voiceParseResultSchema.parse(parsedJson);

    return NextResponse.json({ success: true, data: validated });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Terjadi kesalahan";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
