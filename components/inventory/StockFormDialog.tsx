"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, Package } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import type { InventoryStockItem } from "@/types/inventory";

const CATEGORIES = ["MAKANAN", "PAKAIAN", "OBAT", "LAINNYA"] as const;

const stockFormSchema = z.object({
  itemName: z.string().min(1, "Nama barang wajib diisi"),
  category: z.enum(CATEGORIES),
  qtyAvailable: z.number({ invalid_type_error: "Jumlah harus diisi" }).int("Jumlah harus bilangan bulat").min(1, "Minimal 1"),
});

type StockFormValues = z.infer<typeof stockFormSchema>;

interface StockFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: StockFormValues) => Promise<void>;
  editItem?: InventoryStockItem | null;
}

export function StockFormDialog({ open, onOpenChange, onSubmit, editItem }: StockFormDialogProps) {
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<StockFormValues>({
    resolver: zodResolver(stockFormSchema),
    defaultValues: { itemName: "", category: undefined, qtyAvailable: undefined },
  });

  const selectedCategory = watch("category");

  useEffect(() => {
    if (editItem) {
      setValue("itemName", editItem.itemName);
      setValue("category", editItem.category as StockFormValues["category"]);
      setValue("qtyAvailable", editItem.qtyAvailable);
    } else {
      reset({ itemName: "", category: undefined, qtyAvailable: undefined });
    }
  }, [editItem, setValue, reset, open]);

  const doSubmit = async (data: StockFormValues) => {
    setLoading(true);
    try {
      await onSubmit(data);
      onOpenChange(false);
      reset();
    } catch {
      // error handled by parent
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="w-5 h-5 text-blue-600" />
            {editItem ? "Edit Stok" : "Tambah Stok Manual"}
          </DialogTitle>
          <DialogDescription>
            {editItem ? "Ubah data stok barang di gudang." : "Masukkan data barang baru untuk ditambahkan ke gudang."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(doSubmit)} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="itemName">Nama Barang</Label>
            <Input
              id="itemName"
              placeholder="Contoh: Beras 5kg"
              {...register("itemName")}
              aria-invalid={errors.itemName ? true : undefined}
            />
            {errors.itemName && (
              <p className="text-xs text-red-500 font-medium">{errors.itemName.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Kategori</Label>
            <Select
              value={selectedCategory}
              onValueChange={(val) => setValue("category", val as StockFormValues["category"], { shouldValidate: true })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Pilih kategori" />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {cat === "MAKANAN" ? "Makanan" : cat === "PAKAIAN" ? "Pakaian" : cat === "OBAT" ? "Obat" : "Lainnya"}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.category && (
              <p className="text-xs text-red-500 font-medium">{errors.category.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="qtyAvailable">Jumlah Stok</Label>
            <Input
              id="qtyAvailable"
              type="number"
              min={1}
              placeholder="0"
              {...register("qtyAvailable", { valueAsNumber: true })}
              aria-invalid={errors.qtyAvailable ? true : undefined}
            />
            {errors.qtyAvailable && (
              <p className="text-xs text-red-500 font-medium">{errors.qtyAvailable.message}</p>
            )}
          </div>

          <div className="flex gap-3 justify-end pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
              Batal
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              {editItem ? "Simpan Perubahan" : "Tambah Stok"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
