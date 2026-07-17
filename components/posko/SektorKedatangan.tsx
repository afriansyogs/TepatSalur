"use client";

import { useState } from "react";
import type { Kedatangan } from "@/types/posko";
import { Package, Inbox, Check } from "lucide-react";

interface Props {
  initialKedatangan: Kedatangan[];
}

const statusLabel: Record<Kedatangan["statusKedatangan"], { label: string; color: string; dot: string }> = {
  MENUJU_LOKASI: {
    label: "Menuju Lokasi",
    color: "bg-blue-50 text-blue-700 border-blue-200",
    dot: "bg-blue-500 animate-pulse",
  },
  TIBA: {
    label: "Sudah Tiba",
    color: "bg-amber-50 text-amber-700 border-amber-200",
    dot: "bg-amber-500",
  },
  DIKONFIRMASI: {
    label: "Diterima",
    color: "bg-emerald-50 text-emerald-700 border-emerald-200",
    dot: "bg-emerald-500",
  },
};

export function SektorKedatangan({ initialKedatangan }: Props) {
  const [list, setList] = useState(initialKedatangan);

  const confirm = (id: string) => {
    setList((prev) =>
      prev.map((k) =>
        k.id === id ? { ...k, statusKedatangan: "DIKONFIRMASI" as const } : k
      )
    );
  };

  const pending = list.filter((k) => k.statusKedatangan !== "DIKONFIRMASI");
  const confirmed = list.filter((k) => k.statusKedatangan === "DIKONFIRMASI");

  return (
    <section id="kedatangan" className="px-4 pt-6 pb-8">
      {}
      <div className="flex items-center gap-2 mb-4">
        <div className="w-1 h-6 rounded-full bg-emerald-500" />
        <div>
          <h2 className="text-[16px] font-black text-slate-900 font-heading leading-tight">
            Laporan Kedatangan
          </h2>
          <p className="text-[11px] text-slate-400">
            {pending.length} relawan dalam perjalanan · {confirmed.length} sudah dikonfirmasi
          </p>
        </div>
      </div>

      {list.length === 0 && (
        <div className="bg-white border border-dashed border-slate-200 rounded-2xl p-8 text-center flex flex-col items-center">
          <Inbox className="w-10 h-10 text-slate-300 mb-3" />
          <p className="text-[13px] text-slate-400 font-medium">Belum ada relawan dalam perjalanan.</p>
        </div>
      )}

      <div className="flex flex-col gap-3">
        {}
        {pending.map((k) => {
          const cfg = statusLabel[k.statusKedatangan];
          return (
            <div
              key={k.id}
              className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm flex flex-col gap-3 transition-all"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  {}
                  <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center text-blue-700 font-black text-[14px] flex-shrink-0">
                    {k.namaRelawan.charAt(0)}
                  </div>
                  <div>
                    <p className="text-[14px] font-bold text-slate-900 leading-tight">{k.namaRelawan}</p>
                    <p className="text-[11px] text-slate-400 font-medium">Relawan Terverifikasi</p>
                  </div>
                </div>
                <span className={`flex-shrink-0 flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-1 rounded-full border ${cfg.color}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                  {cfg.label}
                </span>
              </div>

              {}
              <div className="bg-slate-50 rounded-xl px-3 py-2.5 flex items-center gap-2">
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-white border border-slate-100"><Package className="w-4 h-4 text-slate-500" /></div>
                <div>
                  <p className="text-[13px] font-bold text-slate-800">{k.barang}</p>
                  <p className="text-[11px] text-slate-500">
                    {k.jumlah} {k.satuan}
                  </p>
                </div>
              </div>

              {}
              {k.statusKedatangan !== "DIKONFIRMASI" && (
                <button
                  onClick={() => confirm(k.id)}
                  className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white font-black text-[13px] tracking-wide transition-all shadow-[0_4px_16px_rgba(16,185,129,0.35)] flex items-center justify-center gap-1.5"
                >
                  <Check className="w-4 h-4" /> Barang Diterima
                </button>
              )}
            </div>
          );
        })}

        {}
        {confirmed.length > 0 && (
          <div className="mt-2">
            <p className="text-[11px] font-bold text-slate-300 uppercase tracking-widest mb-2 px-1">
              Sudah Dikonfirmasi
            </p>
            <div className="flex flex-col gap-2">
              {confirmed.map((k) => (
                <div
                  key={k.id}
                  className="bg-emerald-50/60 border border-emerald-100 rounded-2xl px-4 py-3 flex items-center gap-3 opacity-70"
                >
                  <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-700 font-black text-[12px] flex-shrink-0">
                    {k.namaRelawan.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-bold text-emerald-800 line-through leading-tight">
                      {k.namaRelawan}
                    </p>
                    <p className="text-[11px] text-emerald-600">
                      {k.jumlah} {k.satuan} {k.barang} — diterima
                    </p>
                  </div>
                  <Check className="text-emerald-500 w-5 h-5" />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
