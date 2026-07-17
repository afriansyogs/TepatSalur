"use client";

import { useState, useEffect } from "react";
import { Package, MapPin, Loader2, ArrowRight, Calendar, Warehouse, CheckCircle, Clock, Heart, ClipboardList, XCircle, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import { donasiService } from "@/services/donasi.service";
import { DonationHistoryRecord } from "@/types/donasi";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

type DonationHistoryItem = {
  id: string;
  rawId: string;
  items: { nama: string; qty: number; satuan: string }[];
  gudangTujuan: string;
  alamatGudang: string | null;
  alamatPickup: string;
  tanggalDonasi: string;
  status: "PENDING" | "DELIVERY" | "ACCEPTED" | "REJECTED" | "UNKNOWN";
  rawDate: string;
};


const mapCategoryToFriendlyName = (category: string): string => {
  const mapping: Record<string, string> = {
    MAKANAN: "Makanan",
    PAKAIAN: "Pakaian",
    OBAT: "Obat-obatan",
    LAINNYA: "Logistik",
  };
  return mapping[category.toUpperCase()] || category;
};


const groupDonations = (records: DonationHistoryRecord[]): DonationHistoryItem[] => {
  const groups: Record<string, DonationHistoryItem> = {};

  records.forEach((record) => {
    
    const timeKey = new Date(record.createdAt).toISOString().substring(0, 16);

    
    const displayAlamat = record.alamatPickup.replace(/^\[(MANDIRI|JEMPUT|KURIR)\]\s*/, "");

    const key = `${timeKey}_${record.recommendedInventory?.id || "unknown"}_${displayAlamat}`;

    if (!groups[key]) {
      const dateObj = new Date(record.createdAt);
      const formattedDate = dateObj.toLocaleDateString("id-ID", {
        day: "numeric",
        month: "long",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit"
      }) + " WIB";

      let statusType: DonationHistoryItem["status"] = "UNKNOWN";
      const statusStr = record.status.toUpperCase();
      if (statusStr === "PENDING") statusType = "PENDING";
      else if (statusStr === "DELIVERY") statusType = "DELIVERY";
      else if (statusStr === "ACCEPTED") statusType = "ACCEPTED";
      else if (statusStr === "REJECTED") statusType = "REJECTED";

      groups[key] = {
        id: `DON-${record.id.substring(0, 8).toUpperCase()}`,
        rawId: record.id,
        items: [],
        gudangTujuan: record.recommendedInventory?.name || "Gudang Logistik Pusat",
        alamatGudang: record.recommendedInventory?.alamat || null,
        alamatPickup: displayAlamat,
        tanggalDonasi: formattedDate,
        status: statusType,
        rawDate: record.createdAt
      };
    }

    groups[key].items.push({
      nama: record.itemName,
      qty: record.qtyDonated,
      satuan: mapCategoryToFriendlyName(record.category),
    });
  });

  return Object.values(groups);
};

export function DonorTracker() {
  const [donations, setDonations] = useState<DonationHistoryItem[]>([]);
  const [filteredDonations, setFilteredDonations] = useState<DonationHistoryItem[]>([]);
  const [activeFilter, setActiveFilter] = useState<"ALL" | "PENDING" | "DELIVERY" | "ACCEPTED" | "REJECTED">("ALL");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  
  const totalBundles = donations.length;
  const totalItemsCount = donations.reduce((sum, d) => sum + d.items.reduce((iSum, item) => iSum + item.qty, 0), 0);
  const uniqueGudangs = new Set(donations.map(d => d.gudangTujuan)).size;

  const loadHistory = async (silent = false) => {
    if (!silent) setLoading(true);
    else setRefreshing(true);
    try {
      const records = await donasiService.getDonaturDonationHistory();
      const grouped = groupDonations(records);
      setDonations(grouped);
      setFilteredDonations(grouped);
    } catch (err) {
      console.error("Gagal memuat riwayat donasi:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadHistory();

    const supabase = createClient();
    const channel = supabase
      .channel("donasi-tracker-updates")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "donasi" },
        () => {
          loadHistory(true);
        }
      )
      .subscribe();

    
    const interval = setInterval(() => {
      loadHistory(true);
    }, 3000);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(interval);
    };
  }, []);

  
  useEffect(() => {
    if (activeFilter === "ALL") {
      setFilteredDonations(donations);
    } else {
      setFilteredDonations(donations.filter(d => d.status === activeFilter));
    }
  }, [activeFilter, donations]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
        <p className="text-sm text-slate-500 mt-2 font-medium">Memuat riwayat bantuan Anda...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-800">Riwayat Donasi Bantuan</h2>
          <p className="text-sm text-slate-500 mt-1">Daftar lengkap kontribusi logistik dan status penerimaan bantuan Anda.</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => loadHistory(true)}
            disabled={refreshing}
            className="flex items-center justify-center p-2.5 border border-slate-200 hover:bg-slate-50 rounded-xl transition-all disabled:opacity-50"
            title="Refresh Status"
          >
            <RefreshCw className={cn("w-4 h-4 text-slate-600", refreshing && "animate-spin")} />
          </button>
          <Link
            href="/dashboard/donatur/buat-donasi"
            className="inline-flex items-center justify-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold px-4 py-2.5 rounded-xl text-sm transition-all shadow-md shadow-blue-500/10"
          >
            <span>Donasi Baru</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>

      {donations.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-slate-200 bg-white p-12 text-center min-h-[300px] shadow-sm">
          <div className="rounded-full bg-blue-50 p-4 text-blue-500 mb-4">
            <Package className="w-8 h-8" />
          </div>
          <h3 className="font-bold text-slate-800 text-base mb-1">Belum Ada Riwayat Donasi</h3>
          <p className="text-sm text-slate-500 max-w-[280px] mb-6">
            Anda belum pernah mengirimkan donasi bantuan logistik. Kirim donasi pertama Anda sekarang!
          </p>
          <Link
            href="/dashboard/donatur/buat-donasi"
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-5 py-2.5 rounded-xl text-sm transition-all shadow-md"
          >
            Mulai Donasi
          </Link>
        </div>
      ) : (
        <>
          {}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white border border-slate-200 rounded-2xl p-5 flex items-center gap-4 hover:shadow-sm transition-all">
              <div className="rounded-xl bg-blue-50 p-3 text-blue-600">
                <ClipboardList className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Pengiriman</p>
                <p className="text-2xl font-black text-slate-800 mt-0.5">{totalBundles} Kali</p>
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl p-5 flex items-center gap-4 hover:shadow-sm transition-all">
              <div className="rounded-xl bg-emerald-50 p-3 text-emerald-600">
                <Package className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Barang Disalurkan</p>
                <p className="text-2xl font-black text-slate-800 mt-0.5">{totalItemsCount} Unit</p>
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl p-5 flex items-center gap-4 hover:shadow-sm transition-all">
              <div className="rounded-xl bg-purple-50 p-3 text-purple-600">
                <Warehouse className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Hub Terbantu</p>
                <p className="text-2xl font-black text-slate-800 mt-0.5">{uniqueGudangs} Basecamp</p>
              </div>
            </div>
          </div>

          {}
          <div className="flex gap-2 border-b border-slate-200 pb-3 overflow-x-auto">
            {[
              { id: "ALL", label: "Semua Donasi" },
              { id: "PENDING", label: "Menunggu Konfirmasi" },
              { id: "DELIVERY", label: "Dalam Perjalanan" },
              { id: "ACCEPTED", label: "Diterima Gudang" },
              { id: "REJECTED", label: "Ditolak" }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveFilter(tab.id as any)}
                className={cn(
                  "px-4 py-2 text-xs font-bold rounded-full transition-all shrink-0 border",
                  activeFilter === tab.id
                    ? "bg-slate-900 border-slate-900 text-white shadow-sm"
                    : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {}
          <div className="space-y-4">
            {filteredDonations.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-8 text-center bg-white border border-slate-100 rounded-2xl">
                <p className="text-sm font-semibold text-slate-500">Tidak ditemukan donasi pada kategori ini.</p>
              </div>
            ) : (
              filteredDonations.map((donation) => (
                <div
                  key={donation.id}
                  className="bg-white border border-slate-200 rounded-3xl p-6 hover:shadow-md transition-all relative overflow-hidden flex flex-col md:flex-row gap-6 justify-between items-start md:items-stretch"
                >
                  {}
                  <div
                    className={cn(
                      "absolute top-0 bottom-0 left-0 w-1.5",
                      donation.status === "PENDING"
                        ? "bg-amber-500"
                        : donation.status === "DELIVERY"
                        ? "bg-blue-400"
                        : donation.status === "ACCEPTED"
                        ? "bg-emerald-500"
                        : donation.status === "REJECTED"
                        ? "bg-rose-500"
                        : "bg-slate-300"
                    )}
                  />

                  {}
                  <div className="space-y-4 flex-1">
                    <div className="flex flex-wrap items-center gap-3">
                      <span className="text-xs font-black text-slate-400 uppercase tracking-widest pl-2">
                        {donation.id}
                      </span>
                      <span
                        className={cn(
                          "text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider border",
                          donation.status === "PENDING"
                            ? "bg-amber-50 text-amber-600 border-amber-200"
                            : donation.status === "DELIVERY"
                            ? "bg-blue-50 text-blue-600 border-blue-200"
                            : donation.status === "ACCEPTED"
                            ? "bg-emerald-50 text-emerald-600 border-emerald-200"
                            : donation.status === "REJECTED"
                            ? "bg-rose-50 text-rose-600 border-rose-200"
                            : "bg-slate-50 text-slate-500 border-slate-200"
                        )}
                      >
                        {donation.status === "PENDING"
                          ? "Menunggu Konfirmasi"
                          : donation.status === "DELIVERY"
                          ? "Dalam Perjalanan"
                          : donation.status === "ACCEPTED"
                          ? "Diterima Gudang"
                          : donation.status === "REJECTED"
                          ? "Ditolak"
                          : "Tidak Diketahui"}
                      </span>
                    </div>

                    {}
                    <div className="flex flex-wrap gap-2">
                      {donation.items.map((item, idx) => (
                        <span
                          key={idx}
                          className="inline-flex items-center gap-1.5 bg-slate-50 border border-slate-100 text-slate-700 px-3.5 py-2 rounded-xl text-xs font-black shadow-2xs"
                        >
                          <Package className="w-3.5 h-3.5 text-blue-500" />
                          {item.nama}{" "}
                          <span className="text-slate-900 font-bold bg-slate-200/60 px-1.5 py-0.5 rounded-md">
                            {item.qty} • {item.satuan}
                          </span>
                        </span>
                      ))}
                    </div>

                    {}
                    <div className="space-y-1.5 text-xs text-slate-500 bg-slate-50/70 p-3 rounded-2xl border border-slate-100 pl-4">
                      <div className="flex items-center gap-2">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="font-bold text-slate-700 truncate max-w-[400px]" title={donation.alamatPickup}>
                          Alamat Donatur: {donation.alamatPickup}
                        </span>
                      </div>
                    </div>
                  </div>

                  {}
                  <div className="flex flex-col justify-between items-stretch md:items-end w-full md:w-auto md:min-w-[280px] border-t md:border-t-0 md:border-l border-slate-100 pt-4 md:pt-0 md:pl-6">
                    <div className="space-y-3">
                      <div className="flex items-start gap-2 text-xs">
                        <Calendar className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                        <div>
                          <span className="text-slate-400 font-medium">Dikirim Pada</span>
                          <p className="font-bold text-slate-700 mt-0.5">{donation.tanggalDonasi}</p>
                        </div>
                      </div>

                      <div className="flex items-start gap-2 text-xs">
                        <Warehouse className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                        <div>
                          <span className="text-slate-400 font-medium">Hub Target Penerima</span>
                          <p className="font-bold text-slate-700 mt-0.5">{donation.gudangTujuan}</p>
                          {donation.alamatGudang && (
                            <p className="text-[10px] text-slate-400 mt-0.5 leading-relaxed truncate max-w-[200px]" title={donation.alamatGudang}>
                              {donation.alamatGudang}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>

                    {}
                    <div className="mt-4 pt-3 border-t border-slate-100/60 flex items-center justify-between text-[11px]">
                      <span className="text-slate-400 font-medium">Langkah Logistik:</span>
                      <div className="flex items-center gap-2 font-bold">
                        {donation.status === "REJECTED" ? (
                          <>
                            <span className="flex items-center gap-0.5 text-emerald-600">
                              <CheckCircle className="w-3.5 h-3.5" /> Diajukan
                            </span>
                            <span className="flex items-center gap-0.5 text-rose-500">
                              <XCircle className="w-3.5 h-3.5" /> Ditolak
                            </span>
                          </>
                        ) : (
                          <>
                            <span className="flex items-center gap-0.5 text-emerald-600">
                              <CheckCircle className="w-3.5 h-3.5" /> Diajukan
                            </span>
                            {donation.status === "DELIVERY" || donation.status === "ACCEPTED" ? (
                              <span className="flex items-center gap-0.5 text-emerald-600">
                                <CheckCircle className="w-3.5 h-3.5" /> Dalam Perjalanan
                              </span>
                            ) : (
                              <span className="flex items-center gap-0.5 text-slate-300">
                                <Clock className="w-3.5 h-3.5" /> Dalam Perjalanan
                              </span>
                            )}
                            {donation.status === "ACCEPTED" ? (
                              <span className="flex items-center gap-0.5 text-emerald-600">
                                <CheckCircle className="w-3.5 h-3.5" /> Diterima Gudang
                              </span>
                            ) : (
                              <span className="flex items-center gap-0.5 text-slate-300">
                                <Clock className="w-3.5 h-3.5" /> Diterima Gudang
                              </span>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </>
      )}
    </div>
  );
}
