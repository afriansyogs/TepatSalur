"use client";

import React, { useState, useEffect } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { z } from "zod";
import {
  Plus,
  Trash2,
  MapPin,
  Warehouse,
  ChevronRight,
  ChevronLeft,
  CheckCircle2,
  Package,
  Heart,
  Info,
  ArrowRight,
  Locate,
  HelpCircle,
  Clock
} from "lucide-react";
import { donasiService } from "@/services/donasi.service";
import { authService } from "@/services/auth.service";
import { Map, MapMarker, MarkerContent, MapControls, MarkerTooltip, MapRoute } from "@/components/ui/map";
import { cn } from "@/lib/utils";


const localDonasiFormSchema = z.object({
  items: z.array(
    z.object({
      itemName: z.string().min(1, "Nama barang wajib diisi"),
      category: z.enum(["MAKANAN", "PAKAIAN", "OBAT", "LAINNYA"]),
      qtyDonated: z.number().min(1, "Jumlah minimal adalah 1"),
      unit: z.enum(["kg", "pcs", "dus"]),
    })
  ).min(1, "Minimal harus mendonasikan satu barang"),
  latitude: z.number({ message: "Latitude wajib diisi" }),
  longitude: z.number({ message: "Longitude wajib diisi" }),
  alamatPickup: z.string().min(3, "Alamat asal minimal 3 karakter"),
  recommendedInventoryId: z.string().optional(),
});

type LocalFormValues = z.infer<typeof localDonasiFormSchema>;


function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; 
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

interface SuccessScreenProps {
  data: {
    donationIds: string[];
    recommendedInventory: {
      name: string;
      alamat: string | null;
      distanceKm: number;
      durationMin: number;
    };
    alamatPickup: string;
    donaturName: string;
    items: { itemName: string; qtyDonated: number; category: string; unit: string }[];
  };
  onReset: () => void;
  router: any;
}

function DonasiSukses({ data, onReset, router }: SuccessScreenProps) {
  
  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://cdn.jsdelivr.net/npm/canvas-confetti@1.9.3/dist/confetti.browser.min.js";
    script.async = true;
    script.onload = () => {
      const confettiLib = (window as any).confetti;
      if (confettiLib) {
        
        confettiLib({
          particleCount: 120,
          spread: 80,
          origin: { y: 0.55 }
        });

        
        setTimeout(() => {
          confettiLib({
            particleCount: 60,
            angle: 60,
            spread: 60,
            origin: { x: 0, y: 0.6 }
          });
        }, 200);
        setTimeout(() => {
          confettiLib({
            particleCount: 60,
            angle: 120,
            spread: 60,
            origin: { x: 1, y: 0.6 }
          });
        }, 350);
      }
    };
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  const todayStr = new Date().toLocaleDateString("id-ID", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const timeStr = new Date().toLocaleTimeString("id-ID", {
    hour: "2-digit",
    minute: "2-digit"
  }) + " WIB";

  const transactionCode = `TRX-${data.donationIds[0]?.substring(0, 8).toUpperCase() || "SUCCESS"}`;
  const totalItems = data.items.reduce((sum, item) => sum + item.qtyDonated, 0);

  return (
    <div className="max-w-xl mx-auto py-6 relative">
      {}
      <div className="bg-[#fcfbf4] border border-[#dcd6b8] rounded-3xl shadow-xl overflow-hidden relative font-mono text-slate-700 animate-in fade-in zoom-in-95 duration-200">

        {}
        <div className="h-2.5 bg-[#fcfbf4] w-full flex justify-between overflow-hidden opacity-90 select-none">
          {Array.from({ length: 30 }).map((_, i) => (
            <div key={i} className="w-4 h-4 bg-slate-100 rounded-full -mt-2.5 shrink-0 border border-slate-200" />
          ))}
        </div>

        <div className="p-8 space-y-6">
          {}
          <div className="text-center space-y-2">
            <div className="mx-auto rounded-full bg-emerald-100 text-emerald-600 w-14 h-14 flex items-center justify-center">
              <CheckCircle2 className="h-9 w-9" />
            </div>
            <div>
              <h2 className="text-base font-black tracking-widest uppercase text-slate-900 leading-tight">
                TEPAT SALUR LOGISTIK
              </h2>
              <p className="text-[10px] text-slate-500 uppercase tracking-widest">
                * STRUK TRANSAKSI DONASI *
              </p>
              <p className="text-[9px] text-slate-400">TANGGAP DARURAT BENCANA NASIONAL</p>
            </div>
          </div>

          {}
          <div className="border-y border-dashed border-[#dcd6b8] py-3 text-center space-y-1">
            <p className="text-xs font-bold tracking-widest text-slate-900">{transactionCode}</p>
            <p className="text-[9px] text-slate-500 uppercase">
              {todayStr} - {timeStr}
            </p>
          </div>

          {}
          <div className="space-y-4 text-[11px] leading-relaxed">
            <div className="flex justify-between items-start">
              <span className="text-slate-400 shrink-0 uppercase tracking-wider">DONATUR:</span>
              <span className="font-bold text-slate-900 text-right uppercase">{data.donaturName}</span>
            </div>

            <div className="flex justify-between items-start">
              <span className="text-slate-400 shrink-0 uppercase tracking-wider">ALAMAT PENGIRIM:</span>
              <span className="font-bold text-slate-800 text-right max-w-[240px] truncate" title={data.alamatPickup}>
                {data.alamatPickup}
              </span>
            </div>

            {}
            <div className="text-slate-300 select-none tracking-widest border-t border-dashed border-[#e3dec8]" />

            <div className="space-y-2">
              <span className="text-slate-400 uppercase tracking-wider block font-black border-b border-[#e3dec8] pb-1">
                RINCIAN ITEM DONASI:
              </span>
              <div className="space-y-1">
                {data.items.map((item, idx) => (
                  <div key={idx} className="flex justify-between items-center text-slate-800">
                    <span className="font-bold">
                      {idx + 1}. {item.itemName} ({item.category})
                    </span>
                    <span className="font-black text-slate-950 shrink-0">
                      {item.qtyDonated} {item.unit}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {}
            <div className="text-slate-300 select-none tracking-widest border-t border-dashed border-[#e3dec8]" />

            <div className="flex justify-between items-center font-bold text-slate-900">
              <span className="uppercase">TOTAL BARANG:</span>
              <span>{totalItems} UNIT</span>
            </div>

            {}
            <div className="text-slate-300 select-none tracking-widest border-t border-dashed border-[#e3dec8]" />

            <div className="space-y-2">
              <div>
                <span className="text-slate-400 uppercase tracking-wider block mb-1">HUB LOGISTIK TUJUAN:</span>
                <p className="font-black text-slate-950 text-[11px]">{data.recommendedInventory.name}</p>
                <p className="text-[10px] text-slate-500 leading-normal mt-0.5">{data.recommendedInventory.alamat || "Detail alamat tidak dicantumkan"}</p>
              </div>

              <div className="flex justify-between pt-1 text-[9px] font-bold text-slate-500 bg-[#f4f2e5] p-2.5 rounded-lg border border-[#e3dec8]/50">
                <span>RUTE PETA / JARAK:</span>
                <span className="text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded font-black shrink-0">
                  {data.recommendedInventory.distanceKm} KM (~{data.recommendedInventory.durationMin} MIN)
                </span>
              </div>
            </div>
          </div>

          {}
          <div className="flex justify-center items-center py-4 select-none">
            <div className="border-4 border-emerald-600/40 rounded-xl px-6 py-1.5 text-emerald-600/60 font-black text-sm uppercase tracking-widest rotate-[-5deg] scale-105 shadow-2xs bg-emerald-50/10">
              DONASI DIAJUKAN
            </div>
          </div>

          <div className="text-center text-[9px] text-slate-400 pt-3 border-t border-dashed border-[#dcd6b8] space-y-1">
            <p className="tracking-widest font-black uppercase text-slate-500">* SIAP KAPTEN - TEPAT SALUR *</p>
            <p>VERIFIKATOR: SISTEM AUTO-MATCH HUB</p>
            <p className="mt-2 text-slate-400">Harap serahkan barang donasi sesuai struk ini.</p>
          </div>
        </div>

        {}
        <div className="h-3 bg-[#fcfbf4] w-full flex justify-between overflow-hidden opacity-90 select-none">
          {Array.from({ length: 30 }).map((_, i) => (
            <div key={i} className="w-4 h-4 bg-slate-100 rounded-full mt-1 shrink-0 border border-slate-200" />
          ))}
        </div>
      </div>

      {}
      <div className="mt-6 flex flex-col sm:flex-row gap-3">
        <button
          onClick={() => router.push("/dashboard/donatur/tracking-bantuan")}
          className="flex-1 bg-slate-900 hover:bg-slate-800 text-white font-bold py-3.5 rounded-2xl transition-all shadow-md flex items-center justify-center gap-2 text-sm"
        >
          <span>Ke Riwayat Bantuan</span>
          <ArrowRight className="w-4 h-4" />
        </button>
        <button
          onClick={onReset}
          className="flex-1 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-bold py-3.5 rounded-2xl transition-all text-sm"
        >
          Kirim Donasi Lagi
        </button>
      </div>
    </div>
  );
}

export default function BuatDonasiPage() {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [warehouses, setWarehouses] = useState<any[]>([]);

  
  const [warehouseSelectionMode, setWarehouseSelectionMode] = useState<"auto" | "manual">("auto");
  const [selectedManualWarehouseId, setSelectedManualWarehouseId] = useState<string>("");

  const [closestWarehouse, setClosestWarehouse] = useState<any | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [gpsError, setGpsError] = useState<string | null>(null);

  
  const [routeCoords, setRouteCoords] = useState<[number, number][]>([]);
  const [routeInfo, setRouteInfo] = useState<{ distanceKm: number; durationMin: number } | null>(null);

  
  const [successData, setSuccessData] = useState<{
    donationIds: string[];
    recommendedInventory: {
      name: string;
      alamat: string | null;
      distanceKm: number;
      durationMin: number;
    };
    alamatPickup: string;
    donaturName: string;
    items: { itemName: string; qtyDonated: number; category: string; unit: string }[];
  } | null>(null);

  
  const {
    register,
    control,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
    trigger,
  } = useForm<LocalFormValues>({
    resolver: zodResolver(localDonasiFormSchema),
    mode: "onChange",
    defaultValues: {
      items: [{ itemName: "", category: "MAKANAN" as const, qtyDonated: 1, unit: "pcs" as const }],
      latitude: -6.9175, 
      longitude: 107.6191,
      alamatPickup: "",
      recommendedInventoryId: "",
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "items",
  });

  const watchItems = watch("items");
  const watchLatitude = watch("latitude");
  const watchLongitude = watch("longitude");
  const watchAlamatPickup = watch("alamatPickup");

  
  useEffect(() => {
    async function verifyDonaturRole() {
      try {
        const u = await authService.getCurrentUser();
        if (!u || u.role !== "DONATUR") {
          router.push("/dashboard");
        }
      } catch (err) {
        console.error("Gagal verifikasi role:", err);
        router.push("/dashboard");
      }
    }
    verifyDonaturRole();
  }, [router]);

  
  useEffect(() => {
    async function fetchWarehouses() {
      try {
        const whList = await donasiService.getActiveInventoryLocations();
        setWarehouses(whList);
        if (whList.length > 0) {
          setSelectedManualWarehouseId(whList[0].id);
        }
      } catch (err) {
        console.error("Gagal mengambil data gudang:", err);
      }
    }
    fetchWarehouses();
  }, []);

  
  useEffect(() => {
    if (warehouses.length === 0 || !watchLatitude || !watchLongitude) return;

    if (warehouseSelectionMode === "manual" && selectedManualWarehouseId) {
      const selected = warehouses.find(wh => wh.id === selectedManualWarehouseId);
      if (selected) {
        const distance = calculateDistance(watchLatitude, watchLongitude, selected.latitude, selected.longitude);
        setClosestWarehouse({ ...selected, distanceKm: Number(distance.toFixed(2)) });
        setValue("recommendedInventoryId", selected.id);
        return;
      }
    }

    
    let closest: any = null;
    let minDistance = Infinity;

    for (const wh of warehouses) {
      if (typeof wh.latitude === "number" && typeof wh.longitude === "number" && !isNaN(wh.latitude) && !isNaN(wh.longitude)) {
        const distance = calculateDistance(watchLatitude, watchLongitude, wh.latitude, wh.longitude);
        if (distance < minDistance) {
          minDistance = distance;
          closest = { ...wh, distanceKm: Number(distance.toFixed(2)) };
        }
      }
    }

    if (closest) {
      setClosestWarehouse(closest);
      setValue("recommendedInventoryId", closest.id);
    }
  }, [watchLatitude, watchLongitude, warehouses, warehouseSelectionMode, selectedManualWarehouseId, setValue]);

  
  useEffect(() => {
    if (!closestWarehouse || !watchLatitude || !watchLongitude) return;

    async function fetchRealRoute() {
      try {
        const response = await fetch(
          `https://router.project-osrm.org/route/v1/driving/${watchLongitude},${watchLatitude};${closestWarehouse.longitude},${closestWarehouse.latitude}?overview=full&geometries=geojson`
        );
        const resData = await response.json();
        if (resData.code === "Ok" && resData.routes?.[0]) {
          const route = resData.routes[0];
          setRouteCoords(route.geometry.coordinates);
          setRouteInfo({
            distanceKm: Number((route.distance / 1000).toFixed(2)),
            durationMin: Math.max(1, Math.round(route.duration / 60))
          });
        } else {
          
          setRouteCoords([
            [watchLongitude, watchLatitude],
            [closestWarehouse.longitude, closestWarehouse.latitude]
          ]);
          const fallbackDistance = Number(calculateDistance(watchLatitude, watchLongitude, closestWarehouse.latitude, closestWarehouse.longitude).toFixed(2));
          setRouteInfo({
            distanceKm: fallbackDistance,
            durationMin: Math.max(1, Math.round(fallbackDistance * 2)) 
          });
        }
      } catch (e) {
        console.error("OSRM Route API failed, using fallback:", e);
        setRouteCoords([
          [watchLongitude, watchLatitude],
          [closestWarehouse.longitude, closestWarehouse.latitude]
        ]);
        const fallbackDistance = Number(calculateDistance(watchLatitude, watchLongitude, closestWarehouse.latitude, closestWarehouse.longitude).toFixed(2));
        setRouteInfo({
          distanceKm: fallbackDistance,
          durationMin: Math.max(1, Math.round(fallbackDistance * 2))
        });
      }
    }

    fetchRealRoute();
  }, [watchLatitude, watchLongitude, closestWarehouse]);

  
  const handleLocateMe = () => {
    if (!("geolocation" in navigator)) {
      setGpsError("Geolokasi tidak didukung oleh browser Anda.");
      return;
    }

    setIsLocating(true);
    setGpsError(null);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setValue("latitude", position.coords.latitude);
        setValue("longitude", position.coords.longitude);
        setIsLocating(false);
      },
      (error) => {
        console.error("Error geolocating:", error);
        setGpsError("GPS diblokir browser/ekstensi. Silakan geser pin merah di peta.");
        setValue("latitude", -6.9175);
        setValue("longitude", 107.6191);
        setIsLocating(false);
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  const handleManualWarehouseChange = (id: string) => {
    setSelectedManualWarehouseId(id);
    setWarehouseSelectionMode("manual");
  };

  
  const handleNextToStep2 = async () => {
    const isStep1Valid = await trigger("items");
    if (!isStep1Valid) {
      setErrorMsg("Nama barang wajib diisi untuk semua baris sebelum melanjutkan.");
      return;
    }
    setErrorMsg("");
    setStep(2);
  };

  const onSubmit = async (data: LocalFormValues) => {
    setLoading(true);
    setErrorMsg("");

    
    const mappedItems = data.items.map((item) => ({
      itemName: `${item.itemName} (${item.unit})`,
      category: item.category,
      qtyDonated: item.qtyDonated,
    }));

    const finalPayload = {
      items: mappedItems,
      latitude: data.latitude,
      longitude: data.longitude,
      alamatPickup: `[MANDIRI] ${data.alamatPickup}`,
      recommendedInventoryId: data.recommendedInventoryId || closestWarehouse?.id
    };

    try {
      const u = await authService.getCurrentUser();
      const res = await donasiService.submitProductionDonation(finalPayload);
      setSuccessData({
        donationIds: res.donationIds,
        recommendedInventory: {
          name: res.recommendedInventory.name,
          alamat: res.recommendedInventory.alamat,
          distanceKm: routeInfo?.distanceKm || res.recommendedInventory.distanceKm,
          durationMin: routeInfo?.durationMin || Math.max(1, Math.round(res.recommendedInventory.distanceKm * 2)),
        },
        alamatPickup: data.alamatPickup,
        donaturName: u?.name || "Donatur Sahabat",
        items: data.items,
      });
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : "Terjadi kesalahan sistem.");
    } finally {
      setLoading(false);
    }
  };

  if (successData) {
    return <DonasiSukses data={successData} onReset={() => setSuccessData(null)} router={router} />;
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-black text-slate-800 flex items-center gap-2">
          Portal Donasi
        </h2>
        <p className="text-sm text-slate-500 mt-1">
          Salurkan logistik bantuan Anda langsung menuju Hub Logistik dengan mengantar secara mandiri.
        </p>
      </div>

      {}
      <div className="flex items-center gap-4 bg-white border border-slate-200 rounded-2xl p-4">
        {[
          { label: "Barang Donasi", nr: 1 },
          { label: "Rute & Lokasi", nr: 2 },
          { label: "Konfirmasi & Kirim", nr: 3 },
        ].map((s) => (
          <div key={s.nr} className="flex items-center flex-1 last:flex-initial">
            <div className="flex items-center gap-2">
              <div
                className={cn(
                  "w-7 h-7 rounded-full flex items-center justify-center text-xs font-black border transition-all",
                  step === s.nr
                    ? "bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-200"
                    : step > s.nr
                    ? "bg-emerald-500 border-emerald-500 text-white"
                    : "bg-slate-50 border-slate-200 text-slate-400"
                )}
              >
                {step > s.nr ? <CheckCircle2 className="w-4 h-4" /> : s.nr}
              </div>
              <span
                className={cn(
                  "text-xs font-bold hidden md:inline",
                  step === s.nr ? "text-blue-600" : step > s.nr ? "text-emerald-600" : "text-slate-400"
                )}
              >
                {s.label}
              </span>
            </div>
            {s.nr < 3 && <div className="h-0.5 bg-slate-100 flex-1 mx-4 hidden md:block" />}
          </div>
        ))}
      </div>

      {}
      <form onSubmit={handleSubmit(onSubmit)} className="bg-white border border-slate-200 rounded-3xl p-6 md:p-8 shadow-sm space-y-6">

        {}
        {step === 1 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <h3 className="font-bold text-slate-800 text-base">Masukkan Item Donasi</h3>
              <button
                type="button"
                onClick={() => append({ itemName: "", category: "MAKANAN", qtyDonated: 1, unit: "pcs" })}
                className="inline-flex items-center gap-1 bg-blue-50 border border-blue-100 text-blue-600 font-bold px-3 py-1.5 rounded-xl text-xs hover:bg-blue-100 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" /> Tambah Barang
              </button>
            </div>

            <div className="space-y-3">
              {fields.map((field, idx) => (
                <div
                  key={field.id}
                  className="grid grid-cols-1 md:grid-cols-12 gap-3 p-4 bg-slate-50 border border-slate-100 rounded-2xl relative items-end"
                >
                  <div className="md:col-span-5 space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Nama Barang</label>
                    <input
                      type="text"
                      placeholder="Contoh: Beras, Selimut, Obat Maag"
                      {...register(`items.${idx}.itemName` as const)}
                      className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-sm placeholder:text-slate-400 text-slate-800 focus:border-blue-500 focus:ring-[3px] focus:ring-blue-500/10 transition-all outline-none"
                    />
                  </div>

                  <div className="md:col-span-3 space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Kategori</label>
                    <select
                      {...register(`items.${idx}.category` as const)}
                      className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-sm text-slate-800 focus:border-blue-500 focus:ring-[3px] focus:ring-blue-500/10 transition-all outline-none"
                    >
                      <option value="MAKANAN">MAKANAN</option>
                      <option value="PAKAIAN">PAKAIAN</option>
                      <option value="OBAT">OBAT</option>
                      <option value="LAINNYA">LAINNYA</option>
                    </select>
                  </div>

                  <div className="md:col-span-2 space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Jumlah</label>
                    <input
                      type="number"
                      min="1"
                      {...register(`items.${idx}.qtyDonated` as const, { valueAsNumber: true })}
                      className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-sm text-slate-800 focus:border-blue-500 focus:ring-[3px] focus:ring-blue-500/10 transition-all outline-none"
                    />
                  </div>

                  <div className="md:col-span-1.5 space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Satuan</label>
                    <select
                      {...register(`items.${idx}.unit` as const)}
                      className="w-full bg-white border border-slate-200 rounded-xl px-2 py-2 text-sm text-slate-800 focus:border-blue-500 outline-none"
                    >
                      <option value="kg">kg</option>
                      <option value="pcs">pcs</option>
                      <option value="dus">dus</option>
                    </select>
                  </div>

                  <div className="md:col-span-0.5 flex justify-end">
                    <button
                      type="button"
                      onClick={() => remove(idx)}
                      disabled={fields.length === 1}
                      className="text-red-500 hover:text-red-600 disabled:opacity-30 disabled:cursor-not-allowed p-2 rounded-xl hover:bg-red-50 transition-colors"
                      title="Hapus barang"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {errorMsg && (
              <p className="text-sm font-semibold text-red-500 mt-2">{errorMsg}</p>
            )}

            <div className="flex justify-end pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={handleNextToStep2}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-6 py-3 rounded-xl transition-all shadow-md flex items-center gap-1.5 text-sm"
              >
                <span>Lanjut ke Lokasi</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {}
        {step === 2 && (
          <div className="space-y-6">
            <h3 className="font-bold text-slate-800 text-base border-b border-slate-100 pb-3">Rute Pengantaran & Lokasi</h3>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {}
              <div className="lg:col-span-7 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-600 flex items-center gap-1.5">
                    <MapPin className="w-4 h-4 text-blue-500 animate-bounce" />
                    Tentukan titik lokasi Anda untuk melihat rute jalan ke Hub target
                  </span>
                  <button
                    type="button"
                    onClick={handleLocateMe}
                    disabled={isLocating}
                    className="inline-flex items-center gap-1.5 bg-slate-900 border border-slate-800 text-white font-bold px-3 py-1.5 rounded-xl text-xs hover:bg-slate-800 transition-colors disabled:opacity-75"
                  >
                    <Locate className={cn("w-3.5 h-3.5", isLocating && "animate-spin")} />
                    {isLocating ? "Mencari GPS..." : "GPS Saya"}
                  </button>
                </div>
                {gpsError && (
                  <p className="text-xs font-semibold text-amber-600 bg-amber-50 border border-amber-100 px-3 py-2 rounded-xl flex items-center gap-1.5">
                    <Info className="w-3.5 h-3.5 shrink-0" />
                    {gpsError}
                  </p>
                )}

                {}
                <div className="w-full h-[320px] rounded-2xl overflow-hidden border border-slate-200 relative bg-slate-50">
                  <Map
                    theme="light"
                    viewport={{
                      center: [watchLongitude, watchLatitude],
                      zoom: 10,
                    }}
                  >
                    <MapControls position="bottom-right" showZoom showLocate showCompass />

                    {}
                    {routeCoords.length >= 2 && (
                      <MapRoute
                        coordinates={routeCoords}
                        color="#2563eb"
                        width={4.5}
                      />
                    )}

                    {}
                    <MapMarker
                      longitude={watchLongitude}
                      latitude={watchLatitude}
                      draggable={true}
                      onDragEnd={(lngLat) => {
                        setValue("latitude", lngLat.lat);
                        setValue("longitude", lngLat.lng);
                      }}
                    >
                      <MarkerContent className="flex items-center justify-center rounded-xl p-2.5 shadow-md border-2 bg-critical text-white border-white shadow-[0_4px_15px_rgba(239,68,68,0.3)] z-30">
                        <MapPin className="w-5 h-5" />
                      </MarkerContent>
                      <MarkerTooltip className="bg-white/95 border border-slate-200 text-slate-700 shadow-xl p-3 rounded-xl min-w-[200px]">
                        <p className="font-bold text-sm text-slate-800">Lokasi Anda (Pengirim)</p>
                        <p className="text-xs text-slate-500 mt-1">Geser pin merah untuk mengubah rute jalan</p>
                      </MarkerTooltip>
                    </MapMarker>

                    {}
                    {warehouses
                      .filter(
                        (wh) =>
                          typeof wh.latitude === "number" &&
                          typeof wh.longitude === "number" &&
                          !isNaN(wh.latitude) &&
                          !isNaN(wh.longitude) &&
                          wh.latitude >= -90 &&
                          wh.latitude <= 90 &&
                          wh.longitude >= -180 &&
                          wh.longitude <= 180
                      )
                      .map((wh) => {
                        const isSelected = closestWarehouse?.id === wh.id;
                        return (
                          <MapMarker
                            key={wh.id}
                            longitude={wh.longitude}
                            latitude={wh.latitude}
                            onClick={() => handleManualWarehouseChange(wh.id)}
                          >
                            <MarkerContent className={cn(
                              "flex items-center justify-center rounded-xl p-2.5 shadow-md border-2 transition-transform hover:scale-110 cursor-pointer",
                              isSelected
                                ? "bg-brand text-white border-white shadow-[0_4px_15px_rgba(2,132,199,0.3)] z-20 scale-115"
                                : "bg-slate-500 text-white border-white shadow-md z-10"
                            )}>
                              <Warehouse className="w-5 h-5" />
                            </MarkerContent>
                            <MarkerTooltip className="bg-white/95 border border-slate-200 text-slate-700 shadow-xl p-3 rounded-xl min-w-[200px]">
                              <p className="font-bold text-sm text-slate-800">{wh.name}</p>
                              <p className="text-xs text-slate-500 mt-1">{wh.alamat}</p>
                              <p className="text-[10px] text-blue-500 font-bold mt-1">Klik marker untuk memilih Hub ini</p>
                            </MarkerTooltip>
                          </MapMarker>
                        );
                      })}
                  </Map>
                </div>

                {}
                <div className="grid grid-cols-2 gap-3 bg-slate-50 border border-slate-100 p-4 rounded-2xl">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Latitude</label>
                    <input
                      type="number"
                      step="any"
                      value={watchLatitude}
                      onChange={(e) => setValue("latitude", parseFloat(e.target.value) || 0)}
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 outline-none focus:border-blue-500 transition-all"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Longitude</label>
                    <input
                      type="number"
                      step="any"
                      value={watchLongitude}
                      onChange={(e) => setValue("longitude", parseFloat(e.target.value) || 0)}
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 outline-none focus:border-blue-500 transition-all"
                    />
                  </div>
                </div>
              </div>

              {}
              <div className="lg:col-span-5 space-y-4">
                {}
                <div className="bg-slate-50 border border-slate-200 p-4 rounded-2xl space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-700">Hub Penerima Logistik</span>
                    <div className="flex bg-slate-200 p-0.5 rounded-lg">
                      <button
                        type="button"
                        onClick={() => setWarehouseSelectionMode("auto")}
                        className={cn("px-2.5 py-1 text-[10px] font-black uppercase rounded-md transition-all", warehouseSelectionMode === "auto" ? "bg-white text-slate-800 shadow-xs" : "text-slate-500")}
                      >
                        Auto (Terdekat)
                      </button>
                      <button
                        type="button"
                        onClick={() => setWarehouseSelectionMode("manual")}
                        className={cn("px-2.5 py-1 text-[10px] font-black uppercase rounded-md transition-all", warehouseSelectionMode === "manual" ? "bg-white text-slate-800 shadow-xs" : "text-slate-500")}
                      >
                        Pilih Manual
                      </button>
                    </div>
                  </div>

                  {warehouseSelectionMode === "manual" && (
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Daftar Hub Logistik Aktif</label>
                      <select
                        value={selectedManualWarehouseId}
                        onChange={(e) => handleManualWarehouseChange(e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:border-blue-500 outline-none"
                      >
                        {warehouses.map((wh) => (
                          <option key={wh.id} value={wh.id}>
                            {wh.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Alamat Asal Donatur
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Tuliskan alamat asal Anda sebagai pengirim..."
                    {...register("alamatPickup")}
                    className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm placeholder:text-slate-400 focus:border-blue-500 focus:ring-[3px] focus:ring-blue-500/10 transition-all outline-none resize-none text-slate-800"
                  />
                  {errors.alamatPickup && (
                    <p className="text-xs text-red-500 font-bold">{errors.alamatPickup.message}</p>
                  )}
                </div>

                {}
                {closestWarehouse ? (
                  <div className="bg-blue-50/70 border border-blue-100 rounded-2xl p-5 space-y-3">
                    <div className="flex items-center gap-2 text-blue-900 font-black text-sm">
                      <Warehouse className="w-5 h-5 text-blue-600" />
                      <span>{warehouseSelectionMode === "manual" ? "Hub Pilihan Anda" : "Rekomendasi Hub Terdekat"}</span>
                    </div>
                    <div className="bg-white/80 p-3.5 rounded-xl border border-blue-100/60 space-y-1">
                      <h4 className="font-black text-slate-800 text-xs">{closestWarehouse.name}</h4>
                      <p className="text-[11px] text-slate-500 leading-relaxed truncate" title={closestWarehouse.alamat}>
                        {closestWarehouse.alamat || "Detail alamat tidak dicantumkan"}
                      </p>

                      {routeInfo && (
                        <div className="flex flex-col gap-1.5 pt-2 border-t border-slate-100 mt-2 text-[10px] font-black uppercase text-slate-400 tracking-wider">
                          <div className="flex justify-between items-center">
                            <span>Jarak Rute:</span>
                            <span className="text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md font-bold">
                              ~{routeInfo.distanceKm} Km
                            </span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span>Waktu Tempuh:</span>
                            <span className="text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md font-bold flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              ~{routeInfo.durationMin} Menit
                            </span>
                          </div>
                        </div>
                      )}
                    </div>

                    {}
                    <div className="bg-white/90 border border-blue-100 rounded-xl p-3 flex gap-2 text-[11px] text-blue-800">
                      <HelpCircle className="w-4 h-4 shrink-0 text-blue-500 mt-0.5" />
                      <p>Silakan antarkan langsung barang donasi Anda secara mandiri menuju alamat Hub Logistik di atas.</p>
                    </div>
                  </div>
                ) : (
                  <div className="bg-amber-50/50 border border-amber-100 rounded-2xl p-5 flex gap-2.5 text-xs text-amber-800">
                    <Info className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                    <p>
                      Silakan tentukan titik koordinat lokasi Anda untuk menghitung rute jalan ke Hub terdekat.
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-between pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-bold px-5 py-3 rounded-xl transition-all flex items-center gap-1 text-sm"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Kembali</span>
              </button>
              <button
                type="button"
                onClick={() => setStep(3)}
                disabled={!watchAlamatPickup || watchAlamatPickup.trim().length < 3}
                className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold px-5 py-3 rounded-xl transition-all shadow-md flex items-center gap-1 text-sm"
              >
                <span>Ringkasan</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {}
        {step === 3 && (
          <div className="space-y-6">
            <h3 className="font-bold text-slate-800 text-base border-b border-slate-100 pb-3">Ringkasan Pengajuan Donasi</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
              <div className="bg-slate-50 border border-slate-100 rounded-2xl p-5 space-y-4">
                <h4 className="font-bold text-slate-800 flex items-center gap-2 border-b border-slate-200 pb-2">
                  <Package className="w-4 h-4 text-blue-500" /> Barang Yang Didonasikan
                </h4>
                <div className="max-h-[220px] overflow-y-auto pr-1 gap-2 flex flex-col">
                  {watchItems.map((item, idx) => (
                    <div key={idx} className="flex justify-between items-center bg-white border border-slate-200/60 p-3 rounded-xl text-xs">
                      <span className="font-bold text-slate-700">{item.itemName || "Tanpa Nama"}</span>
                      <span className="bg-blue-50 text-blue-700 font-black px-2.5 py-0.5 rounded-md uppercase tracking-wider text-[10px]">
                        {item.qtyDonated} {item.unit} • {item.category}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-slate-50 border border-slate-100 rounded-2xl p-5 space-y-4">
                <h4 className="font-bold text-slate-800 flex items-center gap-2 border-b border-slate-200 pb-2">
                  <MapPin className="w-4 h-4 text-blue-500" /> Detail Pengiriman & Rute
                </h4>
                <div className="space-y-3.5">
                  <div>
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Metode Pengiriman:</span>
                    <p className="font-bold text-emerald-600 mt-1 text-xs">
                      Antar Mandiri ke Hub
                    </p>
                  </div>

                  <div>
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Alamat Asal Donatur:</span>
                    <p className="font-bold text-slate-700 mt-1 break-words leading-relaxed text-xs">{watchAlamatPickup}</p>
                  </div>

                  <div>
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Koordinat GPS Anda:</span>
                    <p className="font-mono text-slate-700 mt-1 text-[11px] font-bold">
                      {watchLatitude.toFixed(6)}, {watchLongitude.toFixed(6)}
                    </p>
                  </div>

                  {closestWarehouse && (
                    <div className="bg-blue-50 border border-blue-100/60 p-3.5 rounded-xl">
                      <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest block">Hub Logistik Target:</span>
                      <p className="font-black text-blue-950 mt-1 text-xs">{closestWarehouse.name}</p>
                      <p className="text-[10px] text-blue-700 mt-1">{closestWarehouse.alamat}</p>
                      {routeInfo && (
                        <div className="flex flex-col gap-1 mt-2 pt-2 border-t border-blue-100 text-[10px] font-black uppercase text-slate-400">
                          <p className="flex justify-between">
                            <span>Jarak Rute:</span>
                            <span className="text-blue-800 font-bold">~{routeInfo.distanceKm} Km</span>
                          </p>
                          <p className="flex justify-between mt-1">
                            <span>Waktu Tempuh:</span>
                            <span className="text-indigo-800 font-bold">~{routeInfo.durationMin} Menit</span>
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {errorMsg && (
              <p className="text-sm font-semibold text-red-500 text-center">{errorMsg}</p>
            )}

            <div className="flex justify-between pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-bold px-5 py-3 rounded-xl transition-all flex items-center gap-1 text-sm"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Kembali</span>
              </button>
              <button
                type="submit"
                disabled={loading}
                className="bg-blue-600 hover:bg-blue-700 disabled:opacity-75 disabled:cursor-not-allowed text-white font-bold px-6 py-3 rounded-xl transition-all shadow-md flex items-center justify-center gap-2 text-sm"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    <span>Mengirim...</span>
                  </>
                ) : (
                  <>
                    <span>Kirim Donasi</span>
                    <Heart className="w-4 h-4 fill-white" />
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </form>
    </div>
  );
}
