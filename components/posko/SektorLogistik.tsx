"use client";

import type { LogistikItem, LogistikStatus } from "@/types/posko";
import { AlertTriangle, Hourglass, CheckCircle2, Truck } from "lucide-react";

const statusBadge: Record<LogistikStatus, { icon: React.ReactNode; label: string; badge: string }> = {
  KURANG: { icon: <AlertTriangle className="w-3.5 h-3.5" />, label: "Kurang", badge: "bg-red-100 text-red-700 border-red-200" },
  MENUNGGU: { icon: <Hourglass className="w-3.5 h-3.5" />, label: "Menunggu", badge: "bg-amber-100 text-amber-700 border-amber-200" },
  TERPENUHI: { icon: <CheckCircle2 className="w-3.5 h-3.5" />, label: "Terpenuhi", badge: "bg-emerald-100 text-emerald-700 border-emerald-200" },
};

const rowBg: Record<LogistikStatus, string> = {
  KURANG: "bg-red-50/60",
  MENUNGGU: "bg-white",
  TERPENUHI: "bg-emerald-50/40",
};

function deriveStatus(item: LogistikItem): LogistikStatus {
  if (item.fulfilled >= item.target) return "TERPENUHI";
  if (item.booked > 0) return "MENUNGGU";
  return "KURANG";
}

interface Props {
  initialLogistik: LogistikItem[];
}

export function SektorLogistik({ initialLogistik }: Props) {
  return (
    <section id="logistik" className="px-4 pt-6 pb-2">
      {}
      <div className="flex items-center gap-2 mb-4">
        <div className="w-1 h-6 rounded-full bg-amber-500" />
        <div>
          <h2 className="text-[16px] font-black text-slate-900 font-heading leading-tight">
            Status Logistik Terkini
          </h2>
          <p className="text-[11px] text-slate-400">Data inventaris dan kebutuhan posko</p>
        </div>
      </div>

      {}
      <div className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden">
        {}
        <div className="divide-y divide-slate-100 sm:hidden">
          {initialLogistik.map((item) => {
            const s = deriveStatus(item);
            const cfg = statusBadge[s];
            return (
              <div key={item.id} className={`p-4 ${rowBg[s]}`}>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <p className="text-[13px] font-bold text-slate-800 leading-tight">{item.nama}</p>
                  <span className={`flex-shrink-0 flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border ${cfg.badge}`}>
                    {cfg.icon} {cfg.label}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-1 text-center">
                  <div>
                    <p className="text-[18px] font-black text-slate-900 font-heading tabular-nums">{item.target}</p>
                    <p className="text-[10px] text-slate-400 font-semibold">Target</p>
                  </div>
                  <div>
                    <p className={`text-[18px] font-black font-heading tabular-nums ${item.booked > 0 ? "text-orange-500" : "text-slate-300"}`}>
                      {item.booked}
                    </p>
                    <p className={`text-[10px] font-semibold ${item.booked > 0 ? "text-orange-400" : "text-slate-300"}`}>Dikunci</p>
                  </div>
                  <div>
                    <p className={`text-[18px] font-black font-heading tabular-nums ${item.fulfilled > 0 ? "text-emerald-600" : "text-slate-300"}`}>
                      {item.fulfilled}
                    </p>
                    <p className={`text-[10px] font-semibold ${item.fulfilled > 0 ? "text-emerald-500" : "text-slate-300"}`}>Tiba</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {}
        <div className="hidden sm:block overflow-x-auto">
          <table className="w-full text-[13px]">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="text-left px-4 py-2.5 text-[11px] font-bold text-slate-400 uppercase tracking-wider">Kebutuhan</th>
                <th className="text-center px-3 py-2.5 text-[11px] font-bold text-slate-400 uppercase tracking-wider">Target</th>
                <th className="text-center px-3 py-2.5 text-[11px] font-bold text-orange-400 uppercase tracking-wider">Dikunci Relawan</th>
                <th className="text-center px-3 py-2.5 text-[11px] font-bold text-emerald-500 uppercase tracking-wider">Sudah Sampai</th>
                <th className="text-center px-3 py-2.5 text-[11px] font-bold text-slate-400 uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {initialLogistik.map((item) => {
                const s = deriveStatus(item);
                const cfg = statusBadge[s];
                return (
                  <tr key={item.id} className={`${rowBg[s]} transition-colors`}>
                    <td className="px-4 py-3 font-semibold text-slate-800">
                      {item.nama}
                      <span className="ml-1 text-[11px] text-slate-400 font-normal">({item.satuan})</span>
                    </td>
                    <td className="px-3 py-3 text-center font-black text-slate-900 tabular-nums">
                      {item.target} {item.satuan}
                    </td>
                    <td className="px-3 py-3 text-center">
                      {item.booked > 0 ? (
                        <span className="inline-flex items-center gap-1 bg-orange-100 text-orange-700 font-bold px-2 py-0.5 rounded-lg text-[12px]">
                          <Truck className="w-3.5 h-3.5" /> {item.booked} {item.satuan}
                        </span>
                      ) : (
                        <span className="text-slate-300 font-semibold">—</span>
                      )}
                    </td>
                    <td className="px-3 py-3 text-center">
                      {item.fulfilled > 0 ? (
                        <span className="text-emerald-700 font-black tabular-nums">{item.fulfilled} {item.satuan}</span>
                      ) : (
                        <span className="text-slate-300 font-semibold">—</span>
                      )}
                    </td>
                    <td className="px-3 py-3 text-center">
                      <span className={`inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full border ${cfg.badge}`}>
                        {cfg.icon} {cfg.label}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {}
      <div className="flex items-center gap-4 mt-3 px-1 flex-wrap">
        <span className="flex items-center gap-1.5 text-[11px] text-slate-400">
          <span className="w-2.5 h-2.5 rounded-full bg-orange-400 inline-block" />
          Dikunci = Sudah diamankan relawan, sedang dalam perjalanan
        </span>
      </div>
    </section>
  );
}
