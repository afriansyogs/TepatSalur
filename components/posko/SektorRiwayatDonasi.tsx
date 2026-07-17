"use client";

import type { PoskoDonationHistory } from "@/types/map";
import { History, Package, ShieldCheck, Clock, CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  history: PoskoDonationHistory[];
}

export function SektorRiwayatDonasi({ history }: Props) {
  const formatFriendlyDate = (isoString: string) => {
    return new Date(isoString).toLocaleDateString("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    }) + " WIB";
  };

  const getStatusBadge = (status: string) => {
    const s = status.toUpperCase();
    if (s === "DELIVERED") {
      return "bg-emerald-50 text-emerald-700 border-emerald-200";
    }
    return "bg-blue-50 text-blue-700 border-blue-200";
  };

  const getStatusLabel = (status: string) => {
    const s = status.toUpperCase();
    if (s === "DELIVERED") return "Selesai Diterima";
    if (s === "EN_ROUTE") return "Dalam Perjalanan";
    if (s === "ACCEPTED") return "Diterima Relawan";
    return "Diproses";
  };

  return (
    <section id="riwayat-donasi" className="px-4 pt-6 pb-8">
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <div className="w-1 h-6 rounded-full bg-blue-600" />
        <div>
          <h2 className="text-[16px] font-black text-slate-900 font-heading leading-tight">
            Riwayat Donasi Masuk
          </h2>
          <p className="text-[11px] text-slate-400">
            Logistik bantuan yang telah disalurkan ke posko ini
          </p>
        </div>
      </div>

      {history.length === 0 ? (
        <div className="bg-white border border-dashed border-slate-200 rounded-2xl p-8 text-center flex flex-col items-center">
          <History className="w-10 h-10 text-slate-300 mb-3" />
          <p className="text-[13px] text-slate-400 font-medium">Belum ada donasi masuk yang tercatat.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {history.map((h) => (
            <div
              key={h.id}
              className="bg-white border border-slate-100 rounded-2xl p-5 shadow-xs flex flex-col gap-4"
            >
              {/* Header Info */}
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">
                    ID Distribusi: {h.id.substring(0, 8).toUpperCase()}
                  </span>
                  <div className="flex items-center gap-1.5 text-xs text-slate-500">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    <span>{formatFriendlyDate(h.createdAt)}</span>
                  </div>
                </div>
                <span className={cn(
                  "text-[10px] font-black px-2.5 py-1 rounded-full border uppercase tracking-wider",
                  getStatusBadge(h.status)
                )}>
                  {getStatusLabel(h.status)}
                </span>
              </div>

              {/* Items List */}
              <div className="flex flex-wrap gap-2">
                {h.items.map((item, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1.5 bg-slate-50 border border-slate-100/60 text-slate-700 px-3.5 py-2 rounded-xl text-xs font-black shadow-2xs"
                  >
                    <Package className="w-3.5 h-3.5 text-blue-500" />
                    {item.itemName}
                    <span className="text-slate-900 font-bold bg-slate-200/60 px-1.5 py-0.5 rounded-md">
                      {item.qty} Pcs
                    </span>
                    <span className="text-[10px] text-slate-400 font-medium">
                      dari {item.donaturName}
                    </span>
                  </span>
                ))}
              </div>

              {/* Delivery Relawan */}
              <div className="border-t border-slate-100/60 pt-3 flex items-center justify-between text-xs text-slate-500">
                <div className="flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-blue-500" />
                  <span>Kurir Pengantar: <strong className="text-slate-700">{h.relawanName}</strong></span>
                </div>
                {h.status.toUpperCase() === "DELIVERED" && (
                  <span className="flex items-center gap-1 text-emerald-600 font-bold">
                    <CheckCircle className="w-4 h-4" /> Diterima Posko
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
