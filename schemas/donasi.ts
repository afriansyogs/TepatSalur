import { z } from "zod";

export const donasiSchema = z
  .object({
    poskoIds: z.array(z.string()).min(1, "Pilih minimal satu posko tujuan"),
    kategori: z.enum(["makanan", "pakaian", "medis", "logistik", "uang"], {
      message: "Kategori donasi harus dipilih",
    }),
    namaBarang: z.string().optional(),
    jumlah: z.number().min(1, "Jumlah minimal adalah 1"),
    satuan: z.string().min(1, "Satuan harus diisi"),
    metodePengiriman: z.enum(["kurir", "antar_langsung", "jemput"], {
      message: "Metode pengiriman harus dipilih",
    }),
    namaDonatur: z.string().min(2, "Nama donatur minimal 2 karakter"),
    kontak: z
      .string()
      .min(10, "Nomor WhatsApp minimal 10 digit")
      .regex(/^[0-9+\-\s]+$/, "Format nomor telepon tidak valid"),
    deskripsi: z.string().min(5, "Deskripsi minimal 5 karakter"),
  })
  .refine(
    (data) => {
      if (data.kategori !== "uang") {
        return !!data.namaBarang && data.namaBarang.trim().length > 0;
      }
      return true;
    },
    {
      message: "Nama barang harus diisi jika kategori bukan uang",
      path: ["namaBarang"],
    }
  );

export type DonasiValues = z.infer<typeof donasiSchema>;

// Production Schema (New 12-table DB model)
export const donasiItemSchema = z.object({
  itemName: z.string().min(1, "Nama barang wajib diisi"),
  category: z.enum(["MAKANAN", "PAKAIAN", "OBAT", "LAINNYA"]),
  qtyDonated: z.number().min(1, "Jumlah minimal adalah 1"),
});

export const donasiInsertSchema = z.object({
  items: z.array(donasiItemSchema).min(1, "Minimal harus mendonasikan satu barang"),
  latitude: z.number({ message: "Latitude wajib diisi" }),
  longitude: z.number({ message: "Longitude wajib diisi" }),
  alamatPickup: z.string().min(3, "Alamat penjemputan minimal 3 karakter"),
  recommendedInventoryId: z.string().uuid().optional(),
});

export type DonasiInsertValues = z.infer<typeof donasiInsertSchema>;
