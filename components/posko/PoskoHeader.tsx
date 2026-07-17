"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Navbar } from "@/components/home/Navbar";
import type { AiTriase, TriaseStatus } from "@/types/posko";
import { ArrowLeft, MapPin, Activity, AlertTriangle, ShieldCheck, Clock } from "lucide-react";

const statusConfig: Record<
  TriaseStatus,
  {
    label: string;
    gradient: string;
    text: string;
    border: string;
    glow: string;
    dot: string;
    desc: string;
    icon: React.ComponentType<any>;
  }
> = {
  KRITIS: {
    label: "KONDISI KRITIS",
    gradient: "from-rose-500/20 via-red-500/10 to-transparent",
    text: "text-rose-500",
    border: "border-rose-500/30",
    glow: "shadow-[0_0_30px_rgba(244,63,94,0.2)]",
    dot: "bg-rose-500",
    desc: "Membutuhkan intervensi logistik dan relawan medis darurat segera.",
    icon: AlertTriangle
  },
  WASPADA: {
    label: "SIAGA / WASPADA",
    gradient: "from-amber-500/20 via-amber-500/10 to-transparent",
    text: "text-amber-500",
    border: "border-amber-500/30",
    glow: "shadow-[0_0_30px_rgba(245,158,11,0.2)]",
    dot: "bg-amber-500",
    desc: "Kondisi relatif stabil, namun stok beberapa logistik menipis.",
    icon: Activity
  },
  AMAN: {
    label: "KONDISI AMAN",
    gradient: "from-emerald-500/20 via-emerald-500/10 to-transparent",
    text: "text-emerald-500",
    border: "border-emerald-500/30",
    glow: "shadow-[0_0_30px_rgba(16,185,129,0.15)]",
    dot: "bg-emerald-500",
    desc: "Persediaan logistik mencukupi kebutuhan harian seluruh pengungsi.",
    icon: ShieldCheck
  },
};

interface Props {
  namaPosko: string;
  alamat: string;
  triase: AiTriase;
}

function timeAgo(isoString: string): string {
  const diff = Math.floor((Date.now() - new Date(isoString).getTime()) / 1000);
  if (diff < 60) return `${diff} detik yang lalu`;
  if (diff < 3600) return `${Math.floor(diff / 60)} menit yang lalu`;
  return `${Math.floor(diff / 3600)} jam yang lalu`;
}

export function PoskoHeader({ namaPosko, alamat, triase }: Props) {
  const cfg = statusConfig[triase.status];
  const [tick, setTick] = useState(0);
  const prevStatus = useRef(triase.status);

  
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 30_000);
    return () => clearInterval(id);
  }, []);

  const flash = prevStatus.current !== triase.status;
  prevStatus.current = triase.status;

  const StatusIcon = cfg.icon;

  return (
    <>
      <Navbar />
      <section className="relative overflow-hidden bg-slate-950 text-white pt-28 pb-10 border-b border-slate-900 shadow-xl">
        {}
        <div className={`absolute inset-0 bg-gradient-to-r ${cfg.gradient} opacity-50 z-0 pointer-events-none`} />
        <div className="absolute top-0 right-0 w-[500px] h-[300px] bg-blue-500/5 rounded-full blur-[120px] pointer-events-none" />

        <div className="max-w-4xl mx-auto px-4 relative z-10">

        {}
        <div className="flex items-center gap-3 mb-6">
          <Link
            href="/posko"
            className="flex-shrink-0 w-10 h-10 rounded-2xl bg-white/5 hover:bg-white/10 flex items-center justify-center transition-all text-slate-300 hover:text-white border border-white/10 group shadow-md"
            aria-label="Kembali"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
          </Link>
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-400">
            <Link href="/posko" className="hover:text-blue-400 transition-colors">Semua Posko</Link>
            <span className="text-slate-700">/</span>
            <span className="text-slate-300 font-bold truncate">Dasbor Posko</span>
          </div>
        </div>

        {}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">

          {}
          <div className="md:col-span-8 space-y-3">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-xs font-bold text-blue-400">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
              Sektor Posko Aktif
            </span>
            <h1 className="text-2xl md:text-3xl font-extrabold font-heading tracking-tight leading-tight text-white">
              {namaPosko}
            </h1>
            <p className="text-xs md:text-sm text-slate-400 flex items-start gap-1.5 leading-relaxed">
              <MapPin className="w-4 h-4 text-slate-500 flex-shrink-0 mt-0.5" />
              {alamat}
            </p>
          </div>

          {}
          <div className="md:col-span-4 w-full">
            <div
              className={`
                relative bg-slate-900/80 backdrop-blur-md border rounded-3xl p-5 flex flex-col justify-between gap-3
                ${cfg.border} ${cfg.glow}
                transition-all duration-700
                ${flash ? "scale-102" : "scale-100"}
              `}
            >
              {}
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  Evaluasi Triase AI
                </span>
                <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[9px] font-black border uppercase tracking-wider ${cfg.text} ${cfg.border} bg-white/5`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot} animate-pulse`} />
                  {triase.status}
                </span>
              </div>

              {}
              <div className="flex items-baseline gap-2">
                <span className={`text-4xl font-black font-heading tracking-tight ${cfg.text}`}>
                  {triase.skor}
                </span>
                <span className="text-xs text-slate-400 font-bold uppercase">/ 100 Skor Urgensi</span>
              </div>

              {}
              <p className="text-[10px] text-slate-400 leading-normal flex items-start gap-1.5">
                <StatusIcon className="w-3.5 h-3.5 flex-shrink-0 mt-0.5 text-slate-500" />
                {cfg.desc}
              </p>

              {}
              <div className="border-t border-slate-800 pt-2 flex items-center gap-1 text-[9px] text-slate-500">
                <Clock className="w-3 h-3 text-slate-600" />
                <span>Diperbarui {timeAgo(triase.updatedAt)}</span>
              </div>
            </div>
          </div>

        </div>

      </div>
    </section>
  </>
  );
}
