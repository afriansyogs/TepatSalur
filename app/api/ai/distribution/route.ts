import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";

const DISTRIBUTION_PROMPT = `Kamu adalah sistem alokasi logistik bencana. Tugasmu adalah membagi stok gudang ke posko secara PROPORSIONAL dan ADIL — bukan serakah ke yang paling darurat.

PRINSIP UTAMA:
Posko MERAH bukan berarti dapat semua. Posko KUNING yang diabaikan bisa menjadi MERAH dalam hitungan jam. Tujuanmu adalah mencegah eskalasi, bukan hanya memadamkan yang sudah parah.

LANGKAH WAJIB (ikuti urutan ini):

1. HITUNG BOBOT KEBUTUHAN per posko per kategori:
   - MAKANAN: bobot = (jumlahAnak * 2.0) + (jumlahIbuHamil * 1.5) + (jumlahLansia * 1.2) + (jumlahDewasa * 1.0) + (jumlahPengungsi * 0.8) + (urgencyScore * 0.5)
   - OBAT: bobot = (jumlahLansia * 2.0) + (jumlahDisabilitas * 1.8) + (jumlahIbuHamil * 1.5) + (jumlahDewasa * 0.5) + (urgencyScore * 0.8) + (ada kata "luka"/"cedera"/"sakit" di catatanMedis ? 50 : 0)
   - PAKAIAN: bobot = (jumlahPengungsi * 1.0) + (jumlahDewasa * 0.8) + (urgencyScore * 0.3)
   - LAINNYA: bobot = (jumlahPengungsi * 1.0) + (jumlahDewasa * 0.8) + (urgencyScore * 0.3)

2. ALOKASI PROPORSIONAL per kategori stok:
   - Hitung total bobot semua posko untuk kategori tersebut
   - Alokasi masing-masing posko = floor(qtyAvailable * bobotPosko / totalBobot)
   - Pastikan alokasi tidak melebihi qtyNeeded posko tersebut
   - Sisa qty (jika ada) berikan ke posko dengan bobot tertinggi yang belum terpenuhi penuh

3. VALIDASI AKHIR:
   - Total qty_allocated semua posko untuk 1 item TIDAK BOLEH melebihi qtyAvailable stok
   - qty_allocated per posko TIDAK BOLEH melebihi qtyNeeded posko tersebut
   - Posko yang dapat alokasi 0 JANGAN disertakan dalam output

4. REASONING:
   - Tulis 1-2 kalimat singkat: sebutkan persentase alokasi (contoh: "45% stok dialokasikan ke posko ini") dan alasan utamanya (kondisi demografis, catatan medis, risiko eskalasi) — JANGAN tampilkan angka bobot atau rumus perhitungan.

OUTPUT: JSON array, satu objek per posko yang mendapat alokasi > 0.`;

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

    const apiKey = process.env.GEMINI_API_KEY_DISTRIBUTION;
    if (!apiKey) return NextResponse.json({ success: false, error: "Konfigurasi AI tidak tersedia" }, { status: 500 });

    
    const { data: assignment } = await supabase
      .from("relawan_assignments")
      .select("id, inventory_location_id")
      .eq("user_id", user.id)
      .eq("assignment_type", "INVENTORY")
      .eq("status", "APPROVED")
      .eq("is_active", true)
      .single();

    if (!assignment?.inventory_location_id) {
      return NextResponse.json({ success: false, error: "Tidak ada assignment gudang aktif" }, { status: 403 });
    }

    const inventoryLocationId = assignment.inventory_location_id;

    
    const { data: stokRaw } = await supabase
      .from("inventory_items")
      .select("id, item_name, category, qty_available, qty_booked")
      .eq("inventory_location_id", inventoryLocationId)
      .gt("qty_available", 0);

    const stok = (stokRaw ?? [])
      .filter((s) => s.qty_available - s.qty_booked > 0)
      .map((s) => ({
        id: s.id,
        itemName: s.item_name,
        category: s.category,
        qtyAvailable: s.qty_available - s.qty_booked,
      }));

    if (stok.length === 0) {
      return NextResponse.json({ success: false, error: "Tidak ada stok tersedia di gudang" }, { status: 400 });
    }

    
    const { data: poskoRaw } = await supabase
      .from("posko")
      .select(`
        id, name, ai_status, ai_urgency_score,
        jumlah_pengungsi, jumlah_dewasa, jumlah_anak, jumlah_lansia,
        jumlah_disabilitas, jumlah_ibu_hamil, catatan_medis_darurat,
        posko_kebutuhan (
          id, item_name, category_kebutuhan, qty_needed, qty_booked, status
        )
      `);

    const posko = (poskoRaw ?? [])
      .map((p) => ({
        id: p.id,
        name: p.name,
        aiStatus: p.ai_status,
        aiUrgencyScore: p.ai_urgency_score ?? 0,
        jumlahPengungsi: p.jumlah_pengungsi ?? 0,
        jumlahDewasa: p.jumlah_dewasa ?? 0,
        jumlahAnak: p.jumlah_anak ?? 0,
        jumlahLansia: p.jumlah_lansia ?? 0,
        jumlahDisabilitas: p.jumlah_disabilitas ?? 0,
        jumlahIbuHamil: p.jumlah_ibu_hamil ?? 0,
        catatanMedis: p.catatan_medis_darurat ?? "",
        kebutuhan: ((p.posko_kebutuhan as any[]) ?? [])
          .filter((k) => k.status === "OPEN" || k.status === "PARTIALLY_BOOKED")
          .map((k) => ({
            id: k.id,
            itemName: k.item_name,
            category: k.category_kebutuhan,
            qtyNeeded: k.qty_needed - k.qty_booked,
          }))
          .filter((k) => k.qtyNeeded > 0),
      }))
      .filter((p) => p.kebutuhan.length > 0);

    if (posko.length === 0) {
      return NextResponse.json({ success: false, error: "Tidak ada posko dengan kebutuhan aktif" }, { status: 400 });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: "gemini-3.1-flash-lite",
      generationConfig: {
        responseMimeType: "application/json",
        temperature: 0.2,
        responseSchema: {
          type: SchemaType.ARRAY,
          items: {
            type: SchemaType.OBJECT,
            properties: {
              poskoId:        { type: SchemaType.STRING },
              poskoName:      { type: SchemaType.STRING },
              aiStatus:       { type: SchemaType.STRING, nullable: true },
              aiUrgencyScore: { type: SchemaType.INTEGER, nullable: true },
              reasoning:      { type: SchemaType.STRING },
              items: {
                type: SchemaType.ARRAY,
                items: {
                  type: SchemaType.OBJECT,
                  properties: {
                    inventoryItemId: { type: SchemaType.STRING },
                    kebutuhanId:     { type: SchemaType.STRING },
                    itemName:        { type: SchemaType.STRING },
                    category:        { type: SchemaType.STRING },
                    qtyAllocated:    { type: SchemaType.INTEGER },
                  },
                  required: ["inventoryItemId", "kebutuhanId", "itemName", "category", "qtyAllocated"],
                },
              },
            },
            required: ["poskoId", "poskoName", "reasoning", "items"],
          },
        },
      },
    });

    const result = await model.generateContent([
      DISTRIBUTION_PROMPT,
      JSON.stringify({ stok, posko }),
    ]);

    const rawText = result.response.text().trim();

    let recommendations: unknown;
    try {
      recommendations = JSON.parse(rawText);
    } catch {
      return NextResponse.json({ success: false, error: "Gagal memproses respons AI" }, { status: 500 });
    }

    await supabase.from("ai_log").insert({
      type: "DISTRIBUTION_RECOMMENDATION",
      raw_input: JSON.stringify({ stok, posko }),
      ai_response_json: recommendations,
    });

    return NextResponse.json({ success: true, data: { inventoryLocationId, recommendations } });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Terjadi kesalahan";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
