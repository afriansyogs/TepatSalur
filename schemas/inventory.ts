import { z } from "zod";

export const addInventoryItemSchema = z.object({
  itemName: z.string().min(1, "Nama barang wajib diisi"),
  category: z.enum(["MAKANAN", "PAKAIAN", "OBAT", "LAINNYA"]),
  qtyAvailable: z.number().int().min(1, "Jumlah minimal 1"),
});

export const editInventoryItemSchema = z.object({
  itemName: z.string().min(1).optional(),
  category: z.enum(["MAKANAN", "PAKAIAN", "OBAT", "LAINNYA"]).optional(),
  qtyAvailable: z.number().int().min(0).optional(),
}).refine((d) => Object.keys(d).length > 0, { message: "Minimal satu field harus diisi" });

export type AddInventoryItemValues = z.infer<typeof addInventoryItemSchema>;
export type EditInventoryItemValues = z.infer<typeof editInventoryItemSchema>;
