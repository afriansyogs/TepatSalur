"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { adminInventorySchema, AdminInventoryValues } from "@/schemas/onboarding";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface StepInventoryProps {
  defaultValues?: Partial<AdminInventoryValues>;
  onSubmit: (values: AdminInventoryValues) => void;
  onBack: () => void;
  isLoading?: boolean;
}

export function StepInventory({ defaultValues, onSubmit, onBack, isLoading }: StepInventoryProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<AdminInventoryValues>({
    resolver: zodResolver(adminInventorySchema),
    defaultValues,
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <div className="space-y-1.5">
        <Label htmlFor="inventoryName">Nama Gudang</Label>
        <Input id="inventoryName" placeholder="Nama gudang utama" {...register("name")} />
        {errors.name && <p className="text-xs text-red-500">{errors.name.message}</p>}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="latitude">Latitude</Label>
          <Input
            id="latitude"
            type="number"
            step="any"
            placeholder="-6.200000"
            {...register("latitude", { valueAsNumber: true })}
          />
          {errors.latitude && <p className="text-xs text-red-500">{errors.latitude.message}</p>}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="longitude">Longitude</Label>
          <Input
            id="longitude"
            type="number"
            step="any"
            placeholder="106.816666"
            {...register("longitude", { valueAsNumber: true })}
          />
          {errors.longitude && (
            <p className="text-xs text-red-500">{errors.longitude.message}</p>
          )}
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="provinsi">
          Provinsi <span className="text-ink-400 text-xs">(opsional)</span>
        </Label>
        <Input id="provinsi" placeholder="Contoh: Jawa Barat" {...register("provinsi")} />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="kabKota">
            Kab/Kota <span className="text-ink-400 text-xs">(opsional)</span>
          </Label>
          <Input id="kabKota" placeholder="Kota/Kabupaten" {...register("kabKota")} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="kecamatan">
            Kecamatan <span className="text-ink-400 text-xs">(opsional)</span>
          </Label>
          <Input id="kecamatan" placeholder="Kecamatan" {...register("kecamatan")} />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="fotoUrl">
          URL Foto Gudang <span className="text-ink-400 text-xs">(opsional)</span>
        </Label>
        <Input id="fotoUrl" type="url" placeholder="https://..." {...register("fotoUrl")} />
        {errors.fotoUrl && <p className="text-xs text-red-500">{errors.fotoUrl.message}</p>}
      </div>

      <div className="flex gap-3">
        <Button type="button" variant="outline" className="flex-1" onClick={onBack} disabled={isLoading}>
          Kembali
        </Button>
        <Button type="submit" className="flex-1" disabled={isLoading}>
          {isLoading ? "Menyimpan..." : "Selesai & Buat Komunitas"}
        </Button>
      </div>
    </form>
  );
}
