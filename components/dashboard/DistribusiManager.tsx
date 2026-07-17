"use client";

import { useState, useEffect } from "react";
import {
  Sparkles, CheckCircle, X, Package, Loader2,
  AlertTriangle, ChevronDown, ChevronUp, Warehouse, Tent,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { aiService } from "@/services/ai.service";
import { DistribusiRecommendation } from "@/types/ai";

const STATUS_STYLE: Record<string, string> = {
  MERAH:  "bg-rose-50 border-rose-200 text-rose-700",
  KUNING: "bg-amber-50 border-amber-200 text-amber-700",
  HIJAU:  "bg-emerald-50 border-emerald-200 text-emerald-700",
};

const CATEGORY_STYLE: Record<string, string> = {
  MAKANAN:  "bg-amber-50 text-amber-700 border-amber-200",
  PAKAIAN:  "bg-blue-50 text-blue-700 border-blue-200",
  OBAT:     "bg-rose-50 text-rose-700 border-rose-200",
  LAINNYA:  "bg-slate-100 text-slate-600 border-slate-200",
};

type StokItem = { id: string; itemName: string; category: string; qtyAvailable: number; qtyBooked: number; qtyFree: number };
type KebutuhanItem = { id: string; itemName: string; category: string; qtyNeeded: number; qtyBooked: number; qtyFulfilled: number; qtyRemaining: number; status: string };
type PoskoItem = { id: string; name: string; alamat: string | null; aiStatus: string | null; aiUrgencyScore: number | null; kebutuhan: KebutuhanItem[] };
type InventoryData = { inventoryLocationId: string; gudang: { id: string; name: string; alamat: string | null }; stok: StokItem[]; posko: PoskoItem[] };

export function DistribusiManager() {
  const [data, setData] = useState<InventoryData | null>(null);
  const [loadingData, setLoadingData] = useState(true);
  const [dataError, setDataError] = useState<string | null>(null);

  const [recommendations, setRecommendations] = useState<DistribusiRecommendation[]>([]);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());
  const [accepted, setAccepted] = useState<Set<string>>(new Set());
  const [loadingAI, setLoadingAI] = useState(false);
  const [accepting, setAccepting] = useState<string | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [expandedPosko, setExpandedPosko] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetch("/api/relawan/inventory")
      .then((r) => r.json())
      .then((res) => {
        if (!res.success) { setDataError(res.error); return; }
        setData(res.data);
      })
      .catch(() => setDataError("Gagal memuat data gudang."))
      .finally(() => setLoadingData(false));
  }, []);

  const fetchRecommendations = async () => {
    setLoadingAI(true);
    setAiError(null);
    setRecommendations([]);
    setDismissed(new Set());
    setAccepted(new Set());

    const res = await aiService.getDistributionRecommendation();
    setLoadingAI(false);

    if (!res.success || !res.data) {
      setAiError(res.error ?? "Gagal mendapatkan rekomendasi.");
      return;
    }
    setRecommendations(res.data.recommendations);
    setExpanded(new Set(res.data.recommendations.map((r) => r.poskoId)));
  };

  const handleAccept = async (rec: DistribusiRecommendation) => {
    if (!data) return;
    setAccepting(rec.poskoId);
    const res = await aiService.acceptDistribusi({
      inventoryLocationId: data.inventoryLocationId,
      poskoId: rec.poskoId,
      items: rec.items.map((i) => ({
        inventoryItemId: i.inventoryItemId,
        kebutuhanId: i.kebutuhanId,
        qtyAllocated: i.qtyAllocated,
      })),
    });
    setAccepting(null);
    if (!res.success) { setAiError(`Gagal accept ${rec.poskoName}: ${res.error}`); return; }
    setAccepted((prev) => new Set([...prev, rec.poskoId]));
  };

  const toggleExpand = (id: string) => setExpanded((prev) => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const togglePosko = (id: string) => setExpandedPosko((prev) => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });

  const visible = recommendations.filter((r) => !dismissed.has(r.poskoId) && !accepted.has(r.poskoId));

  if (loadingData) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
      </div>
    );
  }

  if (dataError) {
    return (
      <div className="p-6 max-w-3xl mx-auto">
        <div className="flex items-start gap-3 bg-rose-50 border border-rose-200 rounded-xl p-4 text-sm text-rose-700">
          <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" /> {dataError}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-8">

      {}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Warehouse className="w-5 h-5 text-blue-500" />
          <h2 className="text-xl font-bold text-slate-800">{data?.gudang.name ?? "Gudang Saya"}</h2>
        </div>
        {data?.gudang.alamat && <p className="text-sm text-slate-500 ml-7">{data.gudang.alamat}</p>}
      </div>

      {}
      <section>
        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Stok Gudang</p>
        {data?.stok.length === 0 ? (
          <p className="text-sm text-slate-400">Belum ada stok.</p>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {data?.stok.map((s) => (
              <div key={s.id} className={cn("p-4 rounded-2xl border", s.qtyFree === 0 ? "bg-slate-50 border-slate-200 opacity-60" : "bg-white border-slate-200")}>
                <div className="flex items-center justify-between mb-1">
                  <span className={cn("text-[10px] font-bold px-1.5 py-0.5 rounded border uppercase tracking-wider", CATEGORY_STYLE[s.category] ?? CATEGORY_STYLE.LAINNYA)}>
                    {s.category}
                  </span>
                  {s.qtyBooked > 0 && (
                    <span className="text-[10px] text-amber-600 font-bold">{s.qtyBooked} booked</span>
                  )}
                </div>
                <p className="text-sm font-bold text-slate-700 mt-2 truncate">{s.itemName}</p>
                <p className="text-2xl font-black text-slate-800 tabular-nums leading-tight">{s.qtyFree}</p>
                <p className="text-xs text-slate-400">tersedia dari {s.qtyAvailable}</p>
              </div>
            ))}
          </div>
        )}
      </section>

      {}
      <section>
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <Tent className="w-3.5 h-3.5" /> Posko dengan Kebutuhan Aktif
          </p>
          <span className="text-xs font-bold bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full border border-slate-200">
            {data?.posko.length ?? 0} posko
          </span>
        </div>
        {data?.posko.length === 0 ? (
          <p className="text-sm text-slate-400">Tidak ada posko dengan kebutuhan aktif.</p>
        ) : (
          <div className="space-y-3">
            {data?.posko.map((p) => (
              <div key={p.id} className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
                <button
                  onClick={() => togglePosko(p.id)}
                  className="w-full flex items-center justify-between p-4 text-left hover:bg-slate-50 transition-colors"
                >
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className="font-bold text-slate-800 text-sm">{p.name}</span>
                    {p.aiStatus && (
                      <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full border uppercase tracking-wider", STATUS_STYLE[p.aiStatus])}>
                        {p.aiStatus}
                      </span>
                    )}
                    {p.aiUrgencyScore !== null && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 border border-slate-200 text-slate-500">
                        Score {p.aiUrgencyScore}
                      </span>
                    )}
                    <span className="text-[10px] text-slate-400">{p.kebutuhan.length} item dibutuhkan</span>
                  </div>
                  {expandedPosko.has(p.id) ? <ChevronUp className="w-4 h-4 text-slate-400 flex-shrink-0" /> : <ChevronDown className="w-4 h-4 text-slate-400 flex-shrink-0" />}
                </button>
                {expandedPosko.has(p.id) && (
                  <div className="px-4 pb-4 space-y-2">
                    {p.alamat && <p className="text-xs text-slate-400 mb-2">{p.alamat}</p>}
                    {p.kebutuhan.map((k) => (
                      <div key={k.id} className="flex items-center justify-between bg-slate-50 border border-slate-200 rounded-xl px-3 py-2">
                        <div className="flex items-center gap-2">
                          <span className={cn("text-[10px] font-bold px-1.5 py-0.5 rounded border uppercase", CATEGORY_STYLE[k.category] ?? CATEGORY_STYLE.LAINNYA)}>
                            {k.category}
                          </span>
                          <span className="text-sm text-slate-700 font-medium">{k.itemName}</span>
                        </div>
                        <div className="text-right">
                          <span className="text-sm font-black text-slate-800 tabular-nums">{k.qtyRemaining}</span>
                          <span className="text-xs text-slate-400"> / {k.qtyNeeded} dibutuhkan</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      {}
      <section>
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5" /> Saran Distribusi AI
          </p>
        </div>

        <button
          onClick={fetchRecommendations}
          disabled={loadingAI}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-bold px-5 py-2.5 rounded-xl transition-colors text-sm mb-4"
        >
          {loadingAI ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
          {loadingAI ? "AI sedang menganalisis..." : "Dapatkan Saran AI"}
        </button>

        {aiError && (
          <div className="flex items-start gap-3 bg-rose-50 border border-rose-200 rounded-xl p-4 text-sm text-rose-700 mb-4">
            <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" /> {aiError}
          </div>
        )}

        {accepted.size > 0 && (
          <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-sm text-emerald-700 font-medium mb-4">
            <CheckCircle className="w-4 h-4 flex-shrink-0" />
            {accepted.size} distribusi berhasil di-booking.
          </div>
        )}

        {recommendations.length > 0 && visible.length === 0 && (
          <p className="text-center text-slate-400 text-sm py-4">Semua rekomendasi telah diproses.</p>
        )}

        <div className="space-y-4">
          {visible.map((rec) => (
            <div key={rec.poskoId} className="bg-white border border-slate-200 rounded-2xl overflow-hidden hover:shadow-md transition-all">
              <div className="p-5 flex items-start justify-between gap-4">
                <div className="space-y-1.5 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-slate-800">{rec.poskoName}</span>
                    {rec.aiStatus && (
                      <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full border uppercase tracking-wider", STATUS_STYLE[rec.aiStatus])}>
                        {rec.aiStatus}
                      </span>
                    )}
                    {rec.aiUrgencyScore !== null && rec.aiUrgencyScore !== undefined && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 border border-slate-200 text-slate-600 uppercase tracking-wider">
                        Score {rec.aiUrgencyScore}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-slate-500 leading-relaxed">{rec.reasoning}</p>
                </div>
                <button onClick={() => toggleExpand(rec.poskoId)} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 transition-colors flex-shrink-0">
                  {expanded.has(rec.poskoId) ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>
              </div>

              {expanded.has(rec.poskoId) && (
                <div className="px-5 pb-4 space-y-2">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Item yang dialokasikan</p>
                  {rec.items.map((item) => (
                    <div key={item.inventoryItemId + item.kebutuhanId} className="flex items-center justify-between bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5">
                      <div className="flex items-center gap-2 text-sm">
                        <Package className="w-4 h-4 text-blue-400 flex-shrink-0" />
                        <span className="font-medium text-slate-700">{item.itemName}</span>
                        <span className={cn("text-[10px] font-bold px-1.5 py-0.5 rounded border uppercase", CATEGORY_STYLE[item.category] ?? CATEGORY_STYLE.LAINNYA)}>
                          {item.category}
                        </span>
                      </div>
                      <span className="text-sm font-black text-slate-800 tabular-nums">{item.qtyAllocated} unit</span>
                    </div>
                  ))}
                </div>
              )}

              <div className="px-5 pb-5 flex gap-2">
                <button
                  onClick={() => handleAccept(rec)}
                  disabled={accepting === rec.poskoId}
                  className="flex-1 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-bold py-2.5 rounded-xl transition-colors text-sm"
                >
                  {accepting === rec.poskoId ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                  {accepting === rec.poskoId ? "Memproses..." : "Accept & Booking"}
                </button>
                <button
                  onClick={() => setDismissed((prev) => new Set([...prev, rec.poskoId]))}
                  disabled={accepting === rec.poskoId}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-500 font-bold transition-colors text-sm flex items-center gap-1"
                >
                  <X className="w-4 h-4" /> Tolak
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
