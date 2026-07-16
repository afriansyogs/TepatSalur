"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { relawanOnboardingSchema, RelawanOnboardingValues } from "@/schemas/onboarding";
import { onboardingService } from "@/services/onboarding.service";
import { Community } from "@/types/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Textarea } from "@/components/ui/textarea";
import { format } from "date-fns";
import { id } from "date-fns/locale/id";
import { CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export function RelawanOnboardingForm() {
  const router = useRouter();
  const [communities, setCommunities] = useState<Community[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<RelawanOnboardingValues>({
    resolver: zodResolver(relawanOnboardingSchema),
  });

  useEffect(() => {
    onboardingService.getCommunities().then(setCommunities);
  }, []);

  const onSubmit = async (values: RelawanOnboardingValues) => {
    setIsLoading(true);
    setError(null);
    const result = await onboardingService.submitRelawanOnboarding(values);
    setIsLoading(false);
    if (!result.success) {
      setError(result.error ?? "Terjadi kesalahan");
      return;
    }
    router.push("/relawan/pending-approval");
  };

  return (
    <div className="bg-white rounded-3xl shadow-sm border border-ink-100 p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-navy-800">Lengkapi Profil Relawan</h1>
        <p className="text-ink-500 mt-2 text-sm">
          Data ini diperlukan untuk verifikasi identitas Anda sebagai relawan.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <div className="space-y-1.5">
          <Label htmlFor="nik">NIK (16 digit)</Label>
          <Input
            id="nik"
            placeholder="Nomor Induk Kependudukan"
            maxLength={16}
            {...register("nik")}
          />
          {errors.nik && <p className="text-xs text-red-500">{errors.nik.message}</p>}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="tempatLahir">Tempat Lahir</Label>
          <Input id="tempatLahir" placeholder="Kota tempat lahir" {...register("tempatLahir")} />
          {errors.tempatLahir && (
            <p className="text-xs text-red-500">{errors.tempatLahir.message}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label>Tanggal Lahir</Label>
          <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
            <PopoverTrigger
                className={cn(
                  "w-full flex items-center justify-between rounded-xl border border-ink-200 bg-white px-4 py-3 text-sm text-navy-800 shadow-xs transition-all outline-none focus-visible:border-blue-500 focus-visible:ring-[3px] focus-visible:ring-blue-500/15 cursor-pointer",
                  !selectedDate && "text-ink-300"
                )}
              >
                {selectedDate
                  ? format(selectedDate, "dd MMMM yyyy", { locale: id })
                  : "Pilih tanggal lahir"}
                <CalendarIcon className="h-4 w-4 opacity-50" />
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={(date) => {
                  setSelectedDate(date);
                  setCalendarOpen(false);
                  if (date) {
                    setValue("tanggalLahir", format(date, "yyyy-MM-dd"), {
                      shouldValidate: true,
                    });
                  }
                }}
                captionLayout="dropdown"
                startMonth={new Date(1940, 0)}
                endMonth={new Date(new Date().getFullYear() - 17, 11)}
                disabled={(date) => date > new Date()}
              />
            </PopoverContent>
          </Popover>
          {errors.tanggalLahir && (
            <p className="text-xs text-red-500">{errors.tanggalLahir.message}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label>Jenis Kelamin</Label>
          <Select
            onValueChange={(val) =>
              setValue("jenisKelamin", val as "L" | "P", { shouldValidate: true })
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Pilih jenis kelamin" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="L" label="Laki-laki">Laki-laki</SelectItem>
              <SelectItem value="P" label="Perempuan">Perempuan</SelectItem>
            </SelectContent>
          </Select>
          {errors.jenisKelamin && (
            <p className="text-xs text-red-500">{errors.jenisKelamin.message}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="alamat">Alamat Lengkap</Label>
          <Textarea
            id="alamat"
            rows={3}
            placeholder="Alamat sesuai KTP"
            {...register("alamat")}
          />
          {errors.alamat && <p className="text-xs text-red-500">{errors.alamat.message}</p>}
        </div>

        <div className="space-y-1.5">
          <Label>Komunitas</Label>
          <Select
            onValueChange={(val) => setValue("communityId", val as string, { shouldValidate: true })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Pilih komunitas yang ingin diikuti" />
            </SelectTrigger>
            <SelectContent>
              {communities.length === 0 ? (
                <SelectItem value="none" disabled>
                  Belum ada komunitas tersedia
                </SelectItem>
              ) : (
                communities.map((c) => (
                  <SelectItem key={c.id} value={c.id} label={c.name}>
                    {c.name}
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
          {errors.communityId && (
            <p className="text-xs text-red-500">{errors.communityId.message}</p>
          )}
        </div>

        {error && (
          <p className="text-sm text-red-500 bg-red-50 rounded-lg px-4 py-3">{error}</p>
        )}

        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? "Menyimpan..." : "Simpan & Kirim untuk Disetujui"}
        </Button>
      </form>
    </div>
  );
}
