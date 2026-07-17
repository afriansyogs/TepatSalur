"use client";

import { useState, useEffect } from "react";
import { PoskoHeader } from "./PoskoHeader";
import { SektorDemografi } from "./SektorDemografi";
import { SektorLogistik } from "./SektorLogistik";
import { SektorKedatangan } from "./SektorKedatangan";
import { SektorRiwayatDonasi } from "./SektorRiwayatDonasi";
import { TabNav } from "./TabNav";
import { authService } from "@/services/auth.service";
import Link from "next/link";
import type { AiTriase, Demografi, LogistikItem, Kedatangan } from "@/types/posko";
import type { PoskoDetailResponse } from "@/types/map";
import { Loader2, Heart, AlertTriangle } from "lucide-react";

interface Props {
  poskoId: string;
}

export function PoskoDashboard({ poskoId }: Props) {
  const [poskoData, setPoskoData] = useState<PoskoDetailResponse | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchPosko = async () => {
    try {
      const res = await fetch(`/api/map/posko/${poskoId}`);
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || "Gagal memuat data posko");
      setPoskoData(json.data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosko();

    // Check User Role
    authService.getCurrentUser().then((user) => {
      if (user) {
        setUserRole(user.role);
      }
    }).catch(err => console.error("Error getting user profile:", err));
  }, [poskoId]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
          <p className="text-sm font-semibold text-slate-500">Memuat Detail Posko...</p>
        </div>
      </div>
    );
  }

  if (error || !poskoData) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50 p-4">
        <div className="bg-red-50 border border-red-200 text-red-700 p-6 rounded-3xl max-w-sm text-center space-y-4">
          <AlertTriangle className="w-10 h-10 mx-auto text-red-500" />
          <h3 className="text-lg font-black font-heading">Error Memuat Posko</h3>
          <p className="text-sm">{error || "Posko tidak ditemukan"}</p>
        </div>
      </div>
    );
  }

  // Construct types for sub-components
  let mappedStatus: "KRITIS" | "WASPADA" | "AMAN" = "AMAN";
  if (poskoData.aiStatus === "MERAH") mappedStatus = "KRITIS";
  else if (poskoData.aiStatus === "KUNING") mappedStatus = "WASPADA";
  else if (poskoData.aiStatus === "HIJAU") mappedStatus = "AMAN";

  const triase: AiTriase = {
    status: mappedStatus,
    skor: poskoData.aiUrgencyScore || 0,
    updatedAt: new Date().toISOString()
  };

  const demografi: Demografi = {
    totalPengungsi: poskoData.jumlahPengungsi,
    dewasa: poskoData.jumlahDewasa,
    anakAnak: poskoData.jumlahAnak,
    lansia: poskoData.jumlahLansia,
    balita: 0,
    ibuHamil: poskoData.jumlahIbuHamil,
    disabilitas: poskoData.jumlahDisabilitas,
    catatanMedis: poskoData.catatanMedisDarurat || ""
  };

  const logistik: LogistikItem[] = poskoData.kebutuhan.map((k) => ({
    id: k.id,
    nama: k.itemName,
    satuan: "Pcs",
    target: k.qtyNeeded,
    booked: k.qtyBooked,
    fulfilled: k.qtyFulfilled,
    status: k.status as any
  }));

  // Map relawan assignments
  const kedatangan: Kedatangan[] = poskoData.relawan.map((r, index) => ({
    id: String(index),
    namaRelawan: r.name,
    barang: "Petugas Lapangan",
    jumlah: 1,
    satuan: "Orang",
    statusKedatangan: "DIKONFIRMASI"
  }));

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <PoskoHeader
        namaPosko={poskoData.name}
        alamat={poskoData.alamat || ""}
        triase={triase}
      />

      {/* Role Action Bar */}
      {userRole === "DONATUR" && (
        <div className="max-w-3xl w-full mx-auto px-4 pt-6 flex justify-end z-10 animate-in fade-in duration-200">
          <Link
            href="/dashboard/donatur/buat-donasi"
            className="bg-rose-600 hover:bg-rose-700 text-white font-black text-xs px-6 py-3.5 rounded-2xl flex items-center gap-2 transition-all shadow-md shadow-rose-600/10 cursor-pointer animate-bounce-short"
          >
            <Heart className="w-4 h-4 fill-white" />
            Kirim Donasi
          </Link>
        </div>
      )}

      <TabNav />
      <main className="max-w-3xl mx-auto divide-y divide-slate-100/80 w-full mb-16">
        <SektorDemografi initialDemografi={demografi} />
        <SektorLogistik initialLogistik={logistik} />
        <SektorKedatangan initialKedatangan={kedatangan} />
        <SektorRiwayatDonasi history={poskoData.history || []} />
      </main>

      {/* Bottom safe area for mobile */}
      <div className="h-8" />
    </div>
  );
}
