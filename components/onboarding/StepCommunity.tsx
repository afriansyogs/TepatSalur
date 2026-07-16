"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { adminCommunitySchema, AdminCommunityValues } from "@/schemas/onboarding";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface StepCommunityProps {
  defaultValues?: Partial<AdminCommunityValues>;
  onNext: (values: AdminCommunityValues) => void;
  onBack: () => void;
}

export function StepCommunity({ defaultValues, onNext, onBack }: StepCommunityProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<AdminCommunityValues>({
    resolver: zodResolver(adminCommunitySchema),
    defaultValues,
  });

  return (
    <form onSubmit={handleSubmit(onNext)} className="space-y-5">
      <div className="space-y-1.5">
        <Label htmlFor="name">Nama Komunitas</Label>
        <Input id="name" placeholder="Nama komunitas relawan" {...register("name")} />
        {errors.name && <p className="text-xs text-red-500">{errors.name.message}</p>}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="description">Deskripsi</Label>
        <Textarea
          id="description"
          rows={4}
          placeholder="Ceritakan tentang komunitas Anda (opsional)"
          {...register("description")}
        />
        {errors.description && (
          <p className="text-xs text-red-500">{errors.description.message}</p>
        )}
      </div>

      <div className="flex gap-3">
        <Button type="button" variant="outline" className="flex-1" onClick={onBack}>
          Kembali
        </Button>
        <Button type="submit" className="flex-1">
          Lanjut
        </Button>
      </div>
    </form>
  );
}
