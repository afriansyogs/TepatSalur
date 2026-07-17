"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { adminInventorySchema, AdminInventoryValues } from "@/schemas/onboarding";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Locate, MapPin, UploadCloud, Loader2, Image as ImageIcon } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Map, MapMarker, MarkerContent, MapControls, MarkerTooltip } from "@/components/ui/map";

interface StepInventoryProps {
  defaultValues?: Partial<AdminInventoryValues>;
  onSubmit: (values: AdminInventoryValues) => void;
  onBack: () => void;
  isLoading?: boolean;
}

export function StepInventory({ defaultValues, onSubmit, onBack, isLoading }: StepInventoryProps) {
  const [isLocating, setIsLocating] = useState(false);
  const [gpsError, setGpsError] = useState<string | null>(null);

  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<AdminInventoryValues>({
    resolver: zodResolver(adminInventorySchema),
    defaultValues,
  });

  const watchFotoUrl = watch("fotoUrl");
  const watchLatitude = watch("latitude") || -6.200000;
  const watchLongitude = watch("longitude") || 106.816666;

  const reverseGeocode = async (lat: number, lon: number) => {
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lon}`
      );
      const geoData = await res.json();
      if (geoData?.address) {
        const addr = geoData.address;
        const provinsi = addr.state || addr.region || "";
        const kabKota = addr.city || addr.regency || addr.municipality || addr.county || "";
        const kecamatan = addr.suburb || addr.district || addr.subdistrict || "";

        setValue("provinsi", provinsi);
        setValue("kabKota", kabKota);
        setValue("kecamatan", kecamatan);
      }
    } catch (e) {
      console.error("Reverse geocoding failed", e);
    }
  };

  const handleLocateMe = () => {
    if (!("geolocation" in navigator)) {
      setGpsError("Geolokasi tidak didukung oleh browser Anda.");
      return;
    }

    setIsLocating(true);
    setGpsError(null);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude;
        const lon = position.coords.longitude;
        setValue("latitude", lat);
        setValue("longitude", lon);
        await reverseGeocode(lat, lon);
        setIsLocating(false);
      },
      (error) => {
        console.error("GPS error:", error);
        setGpsError("Gagal mendeteksi lokasi otomatis. Silakan isi manual.");
        setIsLocating(false);
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setUploadError(null);

    try {
      const supabase = createClient();
      const fileExt = file.name.split(".").pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `inventory-photos/${fileName}`;

      const { data, error } = await supabase.storage.from("gudang").upload(filePath, file, {
        cacheControl: "3600",
        upsert: true,
      });

      if (error) {
        
        console.warn("Supabase upload failed, using Base64 fallback:", error.message);
        const reader = new FileReader();
        reader.onloadend = () => {
          setValue("fotoUrl", reader.result as string);
          setIsUploading(false);
        };
        reader.onerror = () => {
          setUploadError("Gagal membaca file gambar.");
          setIsUploading(false);
        };
        reader.readAsDataURL(file);
      } else {
        const { data: publicUrlData } = supabase.storage.from("gudang").getPublicUrl(filePath);
        setValue("fotoUrl", publicUrlData.publicUrl);
        setIsUploading(false);
      }
    } catch (err: unknown) {
      console.error("Upload error:", err);
      
      const reader = new FileReader();
      reader.onloadend = () => {
        setValue("fotoUrl", reader.result as string);
        setIsUploading(false);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <div className="space-y-1.5">
        <Label htmlFor="inventoryName">Nama Gudang</Label>
        <Input id="inventoryName" placeholder="Nama gudang utama" {...register("name")} />
        {errors.name && <p className="text-xs text-red-500">{errors.name.message}</p>}
      </div>

      <div className="flex items-center justify-between pt-1">
        <span className="text-xs font-bold text-slate-600 flex items-center gap-1">
          <MapPin className="w-4 h-4 text-blue-500 animate-bounce" />
          Tentukan lokasi gudang Anda
        </span>
        <button
          type="button"
          onClick={handleLocateMe}
          disabled={isLocating}
          className="inline-flex items-center gap-1.5 bg-slate-900 border border-slate-800 text-white font-bold px-3 py-1.5 rounded-xl text-xs hover:bg-slate-800 transition-colors disabled:opacity-75"
        >
          <Locate className={`w-3.5 h-3.5 ${isLocating ? "animate-spin" : ""}`} />
          {isLocating ? "Mencari GPS..." : "Gunakan GPS"}
        </button>
      </div>
      {gpsError && (
        <p className="text-xs font-semibold text-amber-600 bg-amber-50 border border-amber-100 px-3 py-2 rounded-xl flex items-center gap-1.5">
          {gpsError}
        </p>
      )}

      {}
      <div className="w-full h-[240px] rounded-2xl overflow-hidden border border-slate-200 relative bg-slate-50">
        <Map
          theme="light"
          viewport={{
            center: [watchLongitude, watchLatitude],
            zoom: 12,
          }}
        >
          <MapControls position="bottom-right" showZoom showLocate showCompass />

          {}
          <MapMarker
            longitude={watchLongitude}
            latitude={watchLatitude}
            draggable={true}
            onDragEnd={async (lngLat) => {
              setValue("latitude", lngLat.lat);
              setValue("longitude", lngLat.lng);
              await reverseGeocode(lngLat.lat, lngLat.lng);
            }}
          >
            <MarkerContent className="flex items-center justify-center rounded-xl p-2.5 shadow-md border-2 bg-rose-600 text-white border-white shadow-[0_4px_15px_rgba(239,68,68,0.3)] z-30 cursor-pointer">
              <MapPin className="w-5 h-5" />
            </MarkerContent>
            <MarkerTooltip className="bg-white/95 border border-slate-200 text-slate-700 shadow-xl p-3 rounded-xl min-w-[200px]">
              <p className="font-bold text-sm text-slate-800">Lokasi Gudang Anda</p>
              <p className="text-xs text-slate-500 mt-1">Geser pin merah untuk memposisikan secara akurat</p>
            </MarkerTooltip>
          </MapMarker>
        </Map>
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
        <Label>
          Foto Gudang <span className="text-ink-400 text-xs">(opsional)</span>
        </Label>
        <div className="flex flex-col gap-3">
          {watchFotoUrl ? (
            <div className="relative w-full h-40 border border-slate-200 rounded-2xl overflow-hidden bg-slate-50 flex items-center justify-center group">
              <img
                src={watchFotoUrl}
                alt="Preview Gudang"
                className="w-full h-full object-cover"
              />
              <button
                type="button"
                onClick={() => setValue("fotoUrl", "")}
                className="absolute top-2 right-2 bg-rose-600 hover:bg-rose-700 text-white font-bold p-2 rounded-xl text-xs transition-colors shadow-md"
              >
                Hapus
              </button>
            </div>
          ) : (
            <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-slate-200 bg-slate-50/50 hover:bg-slate-50 rounded-2xl cursor-pointer transition-colors group p-4">
              <div className="flex flex-col items-center justify-center pt-2 pb-3 text-center">
                {isUploading ? (
                  <Loader2 className="w-8 h-8 text-blue-500 animate-spin mb-2" />
                ) : (
                  <UploadCloud className="w-8 h-8 text-slate-400 group-hover:text-slate-500 mb-2 transition-colors" />
                )}
                <p className="text-xs text-slate-600 font-semibold">
                  {isUploading ? "Mengunggah gambar..." : "Klik untuk unggah foto gudang"}
                </p>
                <p className="text-[10px] text-slate-400 mt-1">PNG, JPG atau JPEG</p>
              </div>
              <input
                type="file"
                className="hidden"
                accept="image/*"
                onChange={handleImageChange}
                disabled={isUploading}
              />
            </label>
          )}
          {uploadError && <p className="text-xs text-red-500">{uploadError}</p>}
          {errors.fotoUrl && <p className="text-xs text-red-500">{errors.fotoUrl.message}</p>}
        </div>
      </div>

      <div className="flex gap-3">
        <Button type="button" variant="outline" className="flex-1" onClick={onBack} disabled={isLoading}>
          Kembali
        </Button>
        <Button type="submit" className="flex-1" disabled={isLoading || isUploading}>
          {isLoading ? "Menyimpan..." : "Selesai & Buat Komunitas"}
        </Button>
      </div>
    </form>
  );
}
