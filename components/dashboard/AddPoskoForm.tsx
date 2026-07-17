"use client";

import { useState } from "react";
import { Loader2, MapPin, Locate, UploadCloud, Warehouse, MapPinPlus, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { Map, MapMarker, MarkerContent, MapControls, MarkerTooltip } from "@/components/ui/map";
import { ToastContainer, useToast } from "@/components/ui/toast";

export function AddPoskoForm() {
  const [activeTab, setActiveTab] = useState<"posko" | "basecamp">("posko");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toasts, show, dismiss } = useToast();

  
  const [locationData, setLocationData] = useState({
    name: "",
    latitude: -6.200000,
    longitude: 106.816666,
    alamat: "",
    provinsi: "",
    kabKota: "",
    kecamatan: "",
    fotoUrl: ""
  });

  const [isLocating, setIsLocating] = useState(false);
  const [gpsError, setGpsError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const reverseGeocode = async (lat: number, lon: number) => {
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lon}`
      );
      const geoData = await res.json();
      if (geoData?.address) {
        const addr = geoData.address;
        setLocationData(prev => ({
          ...prev,
          provinsi: addr.state || addr.region || "",
          kabKota: addr.city || addr.regency || addr.municipality || addr.county || "",
          kecamatan: addr.suburb || addr.district || addr.subdistrict || ""
        }));
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
        setLocationData(prev => ({ ...prev, latitude: lat, longitude: lon }));
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
      const filePath = `locations/${fileName}`;

      const { data, error } = await supabase.storage.from("gudang").upload(filePath, file, {
        cacheControl: "3600",
        upsert: true,
      });

      if (error) {
        const reader = new FileReader();
        reader.onloadend = () => {
          setLocationData(prev => ({ ...prev, fotoUrl: reader.result as string }));
          setIsUploading(false);
        };
        reader.onerror = () => {
          setUploadError("Gagal membaca file gambar.");
          setIsUploading(false);
        };
        reader.readAsDataURL(file);
      } else {
        const { data: publicUrlData } = supabase.storage.from("gudang").getPublicUrl(filePath);
        setLocationData(prev => ({ ...prev, fotoUrl: publicUrlData.publicUrl }));
        setIsUploading(false);
      }
    } catch (err) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setLocationData(prev => ({ ...prev, fotoUrl: reader.result as string }));
        setIsUploading(false);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!locationData.name.trim()) {
      alert(`Nama ${activeTab === "posko" ? "Posko" : "Basecamp"} harus diisi`);
      return;
    }

    setIsSubmitting(true);
    try {
      const { superAdminService } = await import("@/services/super-admin.service");
      
      const payload: any = {
        name: locationData.name,
        latitude: locationData.latitude,
        longitude: locationData.longitude,
        alamat: locationData.alamat,
        provinsi: locationData.provinsi,
        kab_kota: locationData.kabKota,
        kecamatan: locationData.kecamatan,
        foto_url: locationData.fotoUrl
      };

      await superAdminService.createLocation(activeTab === "posko" ? "POSKO" : "INVENTORY", payload);
      
      show(
        "success",
        "Berhasil!",
        `${activeTab === "posko" ? "Posko pengungsian" : "Basecamp"} baru telah ditambahkan ke sistem.`
      );
      
      
      setLocationData({
        name: "", latitude: -6.200000, longitude: 106.816666,
        alamat: "", provinsi: "", kabKota: "", kecamatan: "", fotoUrl: ""
      });
    } catch (err: any) {
      alert(`Gagal menambahkan ${activeTab === "posko" ? "Posko" : "Basecamp"}: ` + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderLocationInputs = () => (
    <div className="space-y-6">
      <div className="space-y-1.5">
        <label className="text-xs font-bold text-slate-700 uppercase tracking-wide">
          Nama {activeTab === "posko" ? "Posko / Lokasi" : "Gudang / Basecamp"}
        </label>
        <input
          type="text"
          value={locationData.name}
          onChange={(e) => setLocationData({ ...locationData, name: e.target.value })}
          className="w-full bg-slate-50 border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 rounded-xl px-4 py-2.5 text-sm font-medium text-slate-900 transition-all outline-none"
          placeholder={`Contoh: ${activeTab === "posko" ? "Posko Balai Desa Suka Maju" : "Gudang Logistik Pusat"}`}
        />
      </div>

      <div className="flex items-center justify-between pt-1">
        <span className="text-xs font-bold text-slate-600 flex items-center gap-1">
          <MapPin className="w-4 h-4 text-blue-500 animate-bounce" />
          Tentukan lokasi di Peta
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
      <div className="w-full h-[240px] rounded-2xl overflow-hidden border border-slate-200 relative bg-slate-50 z-0">
        <Map
          theme="light"
          viewport={{
            center: [locationData.longitude, locationData.latitude],
            zoom: 12,
          }}
        >
          <MapControls position="bottom-right" showZoom showLocate showCompass />
          <MapMarker
            longitude={locationData.longitude}
            latitude={locationData.latitude}
            draggable={true}
            onDragEnd={async (lngLat) => {
              setLocationData(prev => ({ ...prev, latitude: lngLat.lat, longitude: lngLat.lng }));
              await reverseGeocode(lngLat.lat, lngLat.lng);
            }}
          >
            <MarkerContent className="flex items-center justify-center rounded-xl p-2.5 shadow-md border-2 bg-rose-600 text-white border-white shadow-[0_4px_15px_rgba(239,68,68,0.3)] z-30 cursor-pointer">
              <MapPin className="w-5 h-5" />
            </MarkerContent>
            <MarkerTooltip className="bg-white/95 border border-slate-200 text-slate-700 shadow-xl p-3 rounded-xl min-w-[200px]">
              <p className="font-bold text-sm text-slate-800">Lokasi {activeTab === "posko" ? "Posko" : "Basecamp"}</p>
              <p className="text-xs text-slate-500 mt-1">Geser pin merah untuk memposisikan secara akurat</p>
            </MarkerTooltip>
          </MapMarker>
        </Map>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-700 uppercase tracking-wide">Latitude</label>
          <input
            type="number"
            step="any"
            value={locationData.latitude}
            onChange={(e) => setLocationData({ ...locationData, latitude: parseFloat(e.target.value) })}
            className="w-full bg-slate-50 border border-slate-200 focus:border-blue-500 rounded-xl px-4 py-2.5 text-sm font-medium text-slate-900 outline-none"
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-700 uppercase tracking-wide">Longitude</label>
          <input
            type="number"
            step="any"
            value={locationData.longitude}
            onChange={(e) => setLocationData({ ...locationData, longitude: parseFloat(e.target.value) })}
            className="w-full bg-slate-50 border border-slate-200 focus:border-blue-500 rounded-xl px-4 py-2.5 text-sm font-medium text-slate-900 outline-none"
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <label className="text-xs font-bold text-slate-700 uppercase tracking-wide">Alamat Lengkap</label>
        <input
          type="text"
          value={locationData.alamat}
          onChange={(e) => setLocationData({ ...locationData, alamat: e.target.value })}
          className="w-full bg-slate-50 border border-slate-200 focus:border-blue-500 rounded-xl px-4 py-2.5 text-sm font-medium text-slate-900 outline-none"
          placeholder="Nama jalan, nomor bangunan, dsb."
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-700 uppercase tracking-wide">Provinsi</label>
          <input
            type="text"
            value={locationData.provinsi}
            onChange={(e) => setLocationData({ ...locationData, provinsi: e.target.value })}
            className="w-full bg-slate-50 border border-slate-200 focus:border-blue-500 rounded-xl px-4 py-2.5 text-sm font-medium text-slate-900 outline-none"
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-700 uppercase tracking-wide">Kab/Kota</label>
          <input
            type="text"
            value={locationData.kabKota}
            onChange={(e) => setLocationData({ ...locationData, kabKota: e.target.value })}
            className="w-full bg-slate-50 border border-slate-200 focus:border-blue-500 rounded-xl px-4 py-2.5 text-sm font-medium text-slate-900 outline-none"
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-700 uppercase tracking-wide">Kecamatan</label>
          <input
            type="text"
            value={locationData.kecamatan}
            onChange={(e) => setLocationData({ ...locationData, kecamatan: e.target.value })}
            className="w-full bg-slate-50 border border-slate-200 focus:border-blue-500 rounded-xl px-4 py-2.5 text-sm font-medium text-slate-900 outline-none"
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <label className="text-xs font-bold text-slate-700 uppercase tracking-wide">
          Foto Lokasi <span className="text-slate-400 text-[10px] ml-1">(Opsional)</span>
        </label>
        <div className="flex flex-col gap-3">
          {locationData.fotoUrl ? (
            <div className="relative w-full h-40 border border-slate-200 rounded-2xl overflow-hidden bg-slate-50 flex items-center justify-center group">
              <img
                src={locationData.fotoUrl}
                alt="Preview"
                className="w-full h-full object-cover"
              />
              <button
                type="button"
                onClick={() => setLocationData({ ...locationData, fotoUrl: "" })}
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
                  {isUploading ? "Mengunggah gambar..." : "Klik untuk unggah foto lokasi"}
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
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col lg:flex-row h-full w-full justify-center">
      <ToastContainer toasts={toasts} onDismiss={dismiss} />
      {}
      <div className={cn("w-full max-w-4xl p-6 lg:p-8 bg-white overflow-auto mx-auto")}>
        
        {}
        <div className="flex gap-2 bg-slate-50 rounded-2xl border border-slate-200 p-1.5 shadow-sm w-fit mb-8">
          <button
            type="button"
            onClick={() => setActiveTab("posko")}
            className={cn(
              "px-5 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-2",
              activeTab === "posko" ? "bg-slate-900 text-white shadow-sm" : "text-slate-500 hover:text-slate-800 hover:bg-slate-100"
            )}
          >
            <MapPinPlus className="w-4 h-4" /> Posko
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("basecamp")}
            className={cn(
              "px-5 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-2",
              activeTab === "basecamp" ? "bg-slate-900 text-white shadow-sm" : "text-slate-500 hover:text-slate-800 hover:bg-slate-100"
            )}
          >
            <Warehouse className="w-4 h-4" /> Basecamp
          </button>
        </div>

        <h3 className="text-xl font-bold text-slate-800 mb-6">
          Detail {activeTab === "posko" ? "Posko Pengungsian" : "Basecamp / Gudang"}
        </h3>

        <form className="space-y-6" onSubmit={handleSubmit}>
          
          {renderLocationInputs()}

          <div className="pt-4 flex justify-end">
            <button
              type="submit"
              disabled={isSubmitting}
              className="bg-slate-900 hover:bg-slate-800 disabled:opacity-70 text-white font-bold text-sm px-8 py-3 rounded-xl transition-all shadow-md flex items-center gap-2"
            >
              {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
              Daftarkan {activeTab === "posko" ? "Posko" : "Basecamp"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
