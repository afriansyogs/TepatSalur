import { z } from "zod";

export const createPoskoSchema = z.object({
  name: z.string().min(3, "Nama posko minimal 3 karakter"),
  latitude: z.number({ message: "Latitude wajib diisi angka" }),
  longitude: z.number({ message: "Longitude wajib diisi angka" }),
  alamat: z.string().optional(),
  provinsi: z.string().optional(),
  kab_kota: z.string().optional(),
  kecamatan: z.string().optional(),
  jumlah_pengungsi: z.number().int().optional(),
  jumlah_dewasa: z.number().int().optional(),
  jumlah_anak: z.number().int().optional(),
  jumlah_lansia: z.number().int().optional(),
  jumlah_disabilitas: z.number().int().optional(),
  jumlah_ibu_hamil: z.number().int().optional(),
  catatan_medis_darurat: z.string().optional(),
});

export const createInventorySchema = z.object({
  name: z.string().min(3, "Nama gudang minimal 3 karakter"),
  latitude: z.number({ message: "Latitude wajib diisi angka" }),
  longitude: z.number({ message: "Longitude wajib diisi angka" }),
  alamat: z.string().optional(),
  provinsi: z.string().optional(),
  kab_kota: z.string().optional(),
  kecamatan: z.string().optional(),
});
