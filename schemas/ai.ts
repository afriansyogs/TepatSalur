import { z } from "zod";

export const kebutuhanItemSchema = z.object({
  kategori: z.enum(["MAKANAN", "PAKAIAN", "OBAT", "LAINNYA"]),
  namaBarang: z.string().min(1),
  qtyNeeded: z.number().min(0),
});

export const voiceParseResultSchema = z.object({
  jumlahPengungsi: z.coerce.number().min(0).nullable().optional(),
  jumlahDewasa: z.coerce.number().min(0).nullable().optional(),
  jumlahAnak: z.coerce.number().min(0).nullable().optional(),
  jumlahBalita: z.coerce.number().min(0).nullable().optional(),
  jumlahLansia: z.coerce.number().min(0).nullable().optional(),
  jumlahDisabilitas: z.coerce.number().min(0).nullable().optional(),
  jumlahIbuHamil: z.coerce.number().min(0).nullable().optional(),
  catatanMedisDarurat: z.string().nullable().optional(),
  kebutuhan: z.array(kebutuhanItemSchema).default([]),
});

export const poskoVoiceInputSchema = z.object({
  poskoId: z.string().uuid(),
  jumlahPengungsi: z.number().min(0, "Tidak boleh negatif"),
  jumlahDewasa: z.number().min(0, "Tidak boleh negatif"),
  jumlahAnak: z.number().min(0, "Tidak boleh negatif"),
  jumlahBalita: z.number().min(0, "Tidak boleh negatif").default(0),
  jumlahLansia: z.number().min(0, "Tidak boleh negatif"),
  jumlahDisabilitas: z.number().min(0, "Tidak boleh negatif"),
  jumlahIbuHamil: z.number().min(0, "Tidak boleh negatif"),
  catatanMedisDarurat: z.string(),
  kebutuhan: z.array(kebutuhanItemSchema),
});

export const poskoUpdateBodySchema = z.object({
  jumlahPengungsi: z.coerce.number().min(0, "Tidak boleh negatif"),
  jumlahDewasa: z.coerce.number().min(0, "Tidak boleh negatif"),
  jumlahAnak: z.coerce.number().min(0, "Tidak boleh negatif"),
  jumlahBalita: z.coerce.number().min(0, "Tidak boleh negatif").default(0),
  jumlahLansia: z.coerce.number().min(0, "Tidak boleh negatif"),
  jumlahDisabilitas: z.coerce.number().min(0, "Tidak boleh negatif"),
  jumlahIbuHamil: z.coerce.number().min(0, "Tidak boleh negatif"),
  catatanMedisDarurat: z.string(),
  kebutuhan: z.array(z.object({
    kategori: z.enum(["MAKANAN", "PAKAIAN", "OBAT", "LAINNYA"]),
    namaBarang: z.string().min(1),
    qtyNeeded: z.coerce.number().min(0),
  })),
});

export const triageResultSchema = z.object({
  status: z.enum(["MERAH", "KUNING", "HIJAU"]),
  score: z.coerce.number().min(0).max(100),
  reasoning: z.string(),
});

export type KebutuhanItemValues = z.infer<typeof kebutuhanItemSchema>;
export type VoiceParseResultValues = z.infer<typeof voiceParseResultSchema>;
export type PoskoVoiceInputValues = z.infer<typeof poskoVoiceInputSchema>;
export type PoskoUpdateBodyValues = z.infer<typeof poskoUpdateBodySchema>;
export type TriageResultValues = z.infer<typeof triageResultSchema>;

export const acceptDistribusiItemSchema = z.object({
  inventoryItemId: z.string().uuid(),
  kebutuhanId: z.string().uuid(),
  qtyAllocated: z.number().int().min(1),
});

export const acceptDistribusiSchema = z.object({
  inventoryLocationId: z.string().uuid(),
  poskoId: z.string().uuid(),
  items: z.array(acceptDistribusiItemSchema).min(1),
});

export type AcceptDistribusiValues = z.infer<typeof acceptDistribusiSchema>;
