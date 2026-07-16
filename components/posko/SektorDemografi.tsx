"use client";

import type { Demografi } from "@/types/posko";
import { Users, UserCheck, Baby, Clipboard } from "lucide-react";

interface StatCardProps {
  label: string;
  sublabel: string;
  value: number;
  icon: React.ReactNode;
}

function StatCard({ label, sublabel, value, icon }: StatCardProps) {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-slate-50 border border-slate-100">{icon}</div>
        <div>
          <p className="text-[13px] font-bold text-slate-800 leading-tight">{label}</p>
          <p className="text-[11px] text-slate-400 leading-none">{sublabel}</p>
        </div>
      </div>
      <div className="mt-1">
        <span className="text-[32px] font-black text-slate-900 font-heading leading-none tabular-nums">
          {value.toLocaleString("id-ID")}
        </span>
        <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider ml-1">
          Jiwa
        </span>
      </div>
    </div>
  );
}

interface Props {
  initialDemografi: Demografi;
}

export function SektorDemografi({ initialDemografi }: Props) {
  return (
    <section id="demografi" className="px-4 pt-6 pb-4">
      {/* Section header */}
      <div className="flex items-center gap-2 mb-4">
        <div className="w-1 h-6 rounded-full bg-blue-600" />
        <div>
          <h2 className="text-[16px] font-black text-slate-900 font-heading leading-tight">
            Situasi Pengungsi Terkini
          </h2>
          <p className="text-[11px] text-slate-400">Pembaruan data diverifikasi relawan</p>
        </div>
      </div>

      {/* 2x2 stat grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        <StatCard
          label="Total"
          sublabel="Pengungsi"
          value={initialDemografi.totalPengungsi}
          icon={<Users className="w-4 h-4 text-blue-500" />}
        />
        {initialDemografi.dewasa !== undefined && (
          <StatCard
            label="Dewasa"
            sublabel="(18-59)"
            value={initialDemografi.dewasa}
            icon={<Users className="w-4 h-4 text-slate-500" />}
          />
        )}
        {initialDemografi.anakAnak !== undefined && (
          <StatCard
            label="Anak-anak"
            sublabel="(6-17)"
            value={initialDemografi.anakAnak}
            icon={<Baby className="w-4 h-4 text-slate-500" />}
          />
        )}
        <StatCard
          label="Lansia"
          sublabel="(60+)"
          value={initialDemografi.lansia}
          icon={<UserCheck className="w-4 h-4 text-emerald-500" />}
        />
        <StatCard
          label="Balita"
          sublabel="(0-5)"
          value={initialDemografi.balita}
          icon={<Baby className="w-4 h-4 text-rose-500" />}
        />
        {initialDemografi.ibuHamil !== undefined && (
          <StatCard
            label="Ibu Hamil"
            sublabel="Rentan"
            value={initialDemografi.ibuHamil}
            icon={<UserCheck className="w-4 h-4 text-purple-500" />}
          />
        )}
        {initialDemografi.disabilitas !== undefined && (
          <StatCard
            label="Disabilitas"
            sublabel="Rentan"
            value={initialDemografi.disabilitas}
            icon={<UserCheck className="w-4 h-4 text-orange-500" />}
          />
        )}
      </div>

      {/* Stat summary card */}
      <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 flex flex-col justify-between mb-4">
        <p className="text-[11px] font-bold text-blue-400 uppercase tracking-wider">Rasio Kelompok Rentan (Lansia, Balita, dsb.)</p>
        <div>
          <span className="text-[36px] font-black text-blue-700 font-heading leading-none">
            {initialDemografi.totalPengungsi > 0
              ? Math.round(((initialDemografi.lansia + initialDemografi.balita + (initialDemografi.ibuHamil || 0) + (initialDemografi.disabilitas || 0)) / initialDemografi.totalPengungsi) * 100)
              : 0}
            %
          </span>
          <p className="text-[11px] text-blue-500 mt-0.5">
            {initialDemografi.lansia + initialDemografi.balita + (initialDemografi.ibuHamil || 0) + (initialDemografi.disabilitas || 0)} jiwa rentan terdeteksi
          </p>
        </div>
      </div>

      {/* Catatan medis */}
      <div className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm mb-4">
        <label className="flex items-center gap-1.5 text-[12px] font-bold text-slate-600 uppercase tracking-wider mb-2">
          <Clipboard className="w-4 h-4 text-slate-400" />
          Catatan Medis
        </label>
        <p className="text-[13px] text-slate-700 leading-relaxed min-h-[40px]">
          {initialDemografi.catatanMedis || "Tidak ada catatan medis mendesak yang dilaporkan."}
        </p>
      </div>
    </section>
  );
}
