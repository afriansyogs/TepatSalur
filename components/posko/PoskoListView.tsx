"use client";

import Link from "next/link";
import { useState, useMemo } from "react";
import { Navbar } from "@/components/home/Navbar";
import type { PoskoSummary, TriaseStatus } from "@/types/posko";
import {
  Search,
  MapPin,
  Users,
  AlertTriangle,
  ChevronRight,
  CheckCircle,
  Map as MapIcon,
  List as ListIcon,
  PhoneCall,
  Activity,
  Maximize2,
  Minimize2
} from "lucide-react";
import { Map, MapMarker, MarkerContent, MarkerTooltip, MapControls, MapPopup } from "@/components/ui/map";
import { cn } from "@/lib/utils";

/* ── Status Theme Configuration ── */
const statusTheme: Record<
  TriaseStatus,
  {
    gradient: string;
    text: string;
    border: string;
    badgeBg: string;
    badgeText: string;
    lightBg: string;
    accentLine: string;
    pinColor: string;
    glowColor: string;
  }
> = {
  KRITIS: {
    gradient: "from-rose-500 to-red-600",
    text: "text-rose-600",
    border: "border-rose-100",
    badgeBg: "bg-rose-50 border-rose-200/60 text-rose-700",
    badgeText: "text-rose-600",
    lightBg: "bg-rose-50/40",
    accentLine: "bg-rose-500",
    pinColor: "#f43f5e",
    glowColor: "rgba(244,63,94,0.4)"
  },
  WASPADA: {
    gradient: "from-amber-400 to-amber-500",
    text: "text-amber-600",
    border: "border-amber-100",
    badgeBg: "bg-amber-50 border-amber-200/60 text-amber-800",
    badgeText: "text-amber-700",
    lightBg: "bg-amber-50/40",
    accentLine: "bg-amber-500",
    pinColor: "#f59e0b",
    glowColor: "rgba(245,158,11,0.4)"
  },
  AMAN: {
    gradient: "from-emerald-400 to-emerald-500",
    text: "text-emerald-600",
    border: "border-emerald-100",
    badgeBg: "bg-emerald-50 border-emerald-200/60 text-emerald-800",
    badgeText: "text-emerald-700",
    lightBg: "bg-emerald-50/30",
    accentLine: "bg-emerald-500",
    pinColor: "#10b981",
    glowColor: "rgba(16,185,129,0.3)"
  },
};

function timeAgo(iso: string) {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (diff < 1) return "baru saja";
  if (diff < 60) return `${diff}m lalu`;
  return `${Math.floor(diff / 60)}j lalu`;
}

interface Props {
  poskoList: PoskoSummary[];
}

const FILTERS = [
  { key: "semua", label: "Semua Posko" },
  { key: "KRITIS", label: "Kritis" },
  { key: "WASPADA", label: "Waspada" },
  { key: "AMAN", label: "Aman" },
] as const;

type FilterKey = (typeof FILTERS)[number]["key"];

export function PoskoListView({ poskoList }: Props) {
  const [filter, setFilter] = useState<FilterKey>("semua");
  const [search, setSearch] = useState("");
  const [selectedPoskoId, setSelectedPoskoId] = useState<string | null>(null);
  const [mobileView, setMobileView] = useState<"list" | "map">("list");
  const [isMapMaximized, setIsMapMaximized] = useState(false);

  // Filtering & sorting logic
  const filtered = useMemo(() => {
    return poskoList
      .filter(
        (p) =>
          (filter === "semua" || p.triase.status === filter) &&
          (search === "" ||
            p.namaPosko.toLowerCase().includes(search.toLowerCase()) ||
            p.kecamatan.toLowerCase().includes(search.toLowerCase()) ||
            p.alamat.toLowerCase().includes(search.toLowerCase()))
      )
      .sort((a, b) => b.triase.skor - a.triase.skor);
  }, [poskoList, filter, search]);

  const stats = useMemo(() => {
    const totalPengungsi = poskoList.reduce((s, p) => s + p.totalPengungsi, 0);
    const kritis = poskoList.filter((p) => p.triase.status === "KRITIS").length;
    const waspada = poskoList.filter((p) => p.triase.status === "WASPADA").length;
    const totalRelawan = poskoList.reduce((s, p) => s + p.relawanAktif, 0);
    return { totalPengungsi, kritis, waspada, totalRelawan };
  }, [poskoList]);

  const selectedPosko = useMemo(() => {
    return poskoList.find((p) => p.id === selectedPoskoId) || null;
  }, [poskoList, selectedPoskoId]);

  return (
    <div className="min-h-screen bg-[#fafbff] text-slate-900 flex flex-col antialiased">
      {/* Global Navbar */}
      <Navbar />

      {/* Main Panel */}
      <div className="flex-1 max-w-[1340px] w-full mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-12 flex flex-col gap-8">

        {/* Open, Spacious and Fluid Header Section */}
        <div className="relative py-4 md:py-6 z-10 flex flex-col lg:flex-row lg:items-end justify-between gap-8 border-b border-slate-200/60 pb-8">
          <div className="space-y-3.5 max-w-2xl">
            <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-600 px-3.5 py-1.5 rounded-full border border-blue-100 text-xs font-bold w-fit">
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
              </span>
              Monitoring Logistik Bencana
            </div>
            <h1 className="text-3xl md:text-5xl font-black tracking-tight font-heading leading-[1.1] text-slate-900">
              Pantau Kedaruratan & <br />
              <span className="text-blue-600">Peta Posko Aktif</span>
            </h1>
            <p className="text-sm text-slate-500 font-medium leading-relaxed">
              Pemetaan kondisi logistik dan prioritas posko yang dihitung otomatis secara real-time oleh AI triase TepatSalur.
            </p>
          </div>

          {/* Minimalist Floating Stats */}
          <div className="flex flex-wrap gap-6 items-center flex-shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 shadow-sm">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block leading-none">Pengungsi</span>
                <span className="text-lg font-black text-slate-800 font-heading leading-tight mt-1 inline-block">
                  {stats.totalPengungsi.toLocaleString("id-ID")}{" "}
                  <span className="text-[10px] font-bold text-slate-400 ml-0.5">Jiwa</span>
                </span>
              </div>
            </div>

            <div className="w-px h-8 bg-slate-200 hidden sm:block" />

            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600 shadow-sm">
                <Activity className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block leading-none">Kondisi Kritis</span>
                <span className="text-lg font-black text-rose-600 font-heading leading-tight mt-1 inline-block">
                  {stats.kritis}{" "}
                  <span className="text-[10px] font-bold text-slate-400 ml-0.5">Posko</span>
                </span>
              </div>
            </div>

            <div className="w-px h-8 bg-slate-200 hidden sm:block" />

            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 shadow-sm">
                <PhoneCall className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block leading-none">Relawan Aktif</span>
                <span className="text-lg font-black text-emerald-600 font-heading leading-tight mt-1 inline-block">
                  {stats.totalRelawan}{" "}
                  <span className="text-[10px] font-bold text-slate-400 ml-0.5">Org</span>
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile Toggle Switch */}
        <div className="flex lg:hidden bg-slate-200/60 p-1.5 rounded-2xl self-center border border-slate-300/30 shadow-inner">
          <button
            onClick={() => setMobileView("list")}
            className={`flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-xs font-bold transition-all ${
              mobileView === "list"
                ? "bg-white text-slate-900 shadow-md"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            <ListIcon className="w-4 h-4" />
            Daftar Posko ({filtered.length})
          </button>
          <button
            onClick={() => setMobileView("map")}
            className={`flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-xs font-bold transition-all ${
              mobileView === "map"
                ? "bg-white text-slate-900 shadow-md"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            <MapIcon className="w-4 h-4" />
            Peta Interaktif
          </button>
        </div>

        {/* Primary Page Layout Grid - Dynamic based on maximized map */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">

          {/* LEFT SECTION: Search, Filters, and List cards */}
          <div
            className={`flex flex-col gap-6 transition-all duration-500 ${
              isMapMaximized ? "lg:col-span-3" : "lg:col-span-6"
            } ${mobileView === "list" ? "flex" : "hidden lg:flex"}`}
          >

            {/* Search & Badges Filter block */}
            <div className="bg-white p-5 rounded-[2rem] border border-slate-100/80 shadow-[0_10px_30px_rgba(15,23,42,0.015)] flex flex-col gap-4">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder={isMapMaximized ? "Cari posko..." : "Cari nama posko, kelurahan, kecamatan atau kebutuhan..."}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200/80 rounded-2xl pl-11 pr-4 py-3.5 text-xs text-slate-800 placeholder:text-slate-400 outline-none focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100 transition-all font-medium"
                />
              </div>

              {/* Advanced Filter Badges */}
              <div className={`flex gap-2 overflow-x-auto pb-1 scrollbar-none ${isMapMaximized ? "flex-wrap" : ""}`}>
                {FILTERS.map((f) => {
                  const count = f.key === "semua"
                    ? poskoList.length
                    : poskoList.filter((p) => p.triase.status === f.key).length;
                  const active = filter === f.key;

                  return (
                    <button
                      key={f.key}
                      onClick={() => setFilter(f.key)}
                      className={`
                        flex-shrink-0 text-xs font-bold px-3.5 py-2.5 rounded-xl transition-all border flex items-center gap-1.5
                        ${
                          active
                            ? "bg-slate-900 border-slate-900 text-white shadow-lg shadow-slate-900/10"
                            : "bg-slate-50 hover:bg-slate-100 border-slate-200/50 text-slate-500 hover:text-slate-800"
                        }
                      `}
                    >
                      {f.key === "KRITIS" && <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />}
                      {f.key === "WASPADA" && <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />}
                      {f.key === "AMAN" && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />}
                      <span>{f.label}</span>
                      <span className={`text-[9px] ml-0.5 px-1.5 py-0.2 rounded-full font-medium ${
                        active ? "bg-white/20 text-white" : "bg-slate-200 text-slate-500"
                      }`}>
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Cards Container */}
            <div className={`space-y-4 overflow-y-auto pr-1 scrollbar-thin ${
              isMapMaximized ? "max-h-[500px]" : "max-h-[700px]"
            }`}>
              {filtered.length === 0 ? (
                <div className="bg-white border border-dashed border-slate-200 rounded-[2rem] p-12 text-center flex flex-col items-center">
                  <Search className="w-10 h-10 text-slate-300 mb-3" />
                  <p className="text-sm font-bold text-slate-600">Tidak ada posko</p>
                </div>
              ) : (
                filtered.map((posko) => {
                  const theme = statusTheme[posko.triase.status];
                  const isSelected = selectedPoskoId === posko.id;

                  return (
                    <div
                      key={posko.id}
                      onClick={() => {
                        setSelectedPoskoId(posko.id === selectedPoskoId ? null : posko.id);
                      }}
                      className={`
                        group relative bg-white border rounded-[1.75rem] overflow-hidden cursor-pointer transition-all duration-300 flex flex-col
                        ${isMapMaximized ? "" : "sm:flex-row"} items-stretch
                        ${isSelected
                          ? "border-blue-500 ring-4 ring-blue-100 shadow-[0_12px_36px_rgba(37,99,235,0.08)] -translate-y-0.5"
                          : "border-slate-100 shadow-[0_4px_20px_rgba(15,23,42,0.015)] hover:shadow-[0_12px_24px_rgba(15,23,42,0.04)] hover:border-slate-200 hover:-translate-y-px"
                        }
                      `}
                    >
                      {/* Image Preview Block */}
                      <div className={`relative w-full ${
                        isMapMaximized ? "h-[100px] w-full" : "sm:w-[150px] md:w-[170px]"
                      } min-h-[100px] bg-slate-100 flex-shrink-0 overflow-hidden`}>
                        {posko.imageUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={posko.imageUrl}
                            alt={posko.namaPosko}
                            className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                        ) : (
                          <div className="absolute inset-0 flex items-center justify-center bg-slate-100 text-slate-300">
                            <MapPin className="w-8 h-8" />
                          </div>
                        )}
                        {/* Status Label absolute overlay */}
                        <div className="absolute top-3 left-3 z-10">
                          <span className={`inline-flex items-center gap-1 text-[9px] font-black px-2 py-0.5 rounded-full border shadow-sm backdrop-blur-md bg-white/95 uppercase tracking-wider ${theme.badgeBg} ${theme.border}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${theme.accentLine} ${
                              posko.triase.status === "KRITIS" ? "animate-pulse" : ""
                            }`} />
                            {posko.triase.status}
                          </span>
                        </div>
                      </div>

                      {/* Main card information block */}
                      <div className="flex-1 p-4 md:p-5 flex flex-col justify-between gap-3 min-w-0">
                        <div>
                          {/* Top Row: Name and Score */}
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <span className="text-[9px] font-black text-blue-600 tracking-wider uppercase truncate block">{posko.kecamatan}</span>
                              <h3 className="text-sm md:text-base font-extrabold text-slate-900 font-heading leading-tight group-hover:text-blue-600 transition-colors mt-0.5 truncate">
                                {posko.namaPosko}
                              </h3>
                              <p className="text-[11px] text-slate-400 mt-1 line-clamp-1">
                                {posko.alamat}
                              </p>
                            </div>

                            <div className="text-right flex-shrink-0">
                              <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest block leading-none">Skor</span>
                              <span className={`text-lg font-black font-heading leading-none ${theme.text}`}>
                                {posko.triase.skor}
                              </span>
                            </div>
                          </div>

                          {/* Stat Grid with Asymmetric Border */}
                          <div className="grid grid-cols-3 gap-1.5 mt-3.5 py-1.5 px-2 bg-slate-50 border border-slate-100 rounded-xl text-center">
                            <div>
                              <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest block">Jiwa</span>
                              <span className="text-[10px] font-black text-slate-800 leading-none inline-block">
                                {posko.totalPengungsi}
                              </span>
                            </div>
                            <div className="border-x border-slate-200/60">
                              <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest block">Relawan</span>
                              <span className="text-[10px] font-black text-slate-800 leading-none inline-block">
                                {posko.relawanAktif}
                              </span>
                            </div>
                            <div>
                              <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest block">Updated</span>
                              <span className="text-[9px] font-bold text-slate-500 leading-none inline-block">
                                {timeAgo(posko.triase.updatedAt)}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Critical Needs list & Action */}
                        {!isMapMaximized && (
                          <div className="flex items-center justify-between gap-3 border-t border-slate-100 pt-3 flex-wrap">
                            {posko.kebutuhanKritis.length > 0 ? (
                              <div className="flex items-center gap-1 flex-wrap">
                                {posko.kebutuhanKritis.slice(0, 2).map((need) => (
                                  <span
                                    key={need}
                                    className="inline-flex items-center gap-0.5 bg-rose-50/50 border border-rose-100 text-rose-600 text-[9px] font-extrabold px-2 py-0.5 rounded-full"
                                  >
                                    <AlertTriangle className="w-2.5 h-2.5 text-rose-500 flex-shrink-0" />
                                    {need}
                                  </span>
                                ))}
                              </div>
                            ) : (
                              <div className="flex items-center gap-1 text-emerald-600 text-[9px] font-bold">
                                <CheckCircle className="w-3 h-3 text-emerald-500 flex-shrink-0" />
                                Terpenuhi
                              </div>
                            )}

                            <Link
                              href={`/posko/${posko.id}`}
                              className="text-[11px] font-bold text-blue-600 hover:text-blue-700 flex items-center gap-0.5 group-hover:translate-x-1 transition-transform ml-auto"
                              onClick={(e) => e.stopPropagation()}
                            >
                              Dasbor
                              <ChevronRight className="w-3 h-3 stroke-[2.5]" />
                            </Link>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* RIGHT SECTION: Real Interactive MapLibre Map Component (Expandable) */}
          <div
            className={cn(
              "flex flex-col h-[520px] lg:h-[760px] transition-all duration-500 relative",
              isMapMaximized ? "lg:col-span-9" : "lg:col-span-6",
              mobileView === "map" ? "flex" : "hidden lg:flex"
            )}
          >
            <div className="bg-slate-100 border border-slate-200/80 rounded-[2.5rem] overflow-hidden shadow-2xl shadow-slate-900/5 h-full flex flex-col relative">

              {/* Map Titlebar Layer (Floating Absolute at Top) */}
              <div className="absolute top-4 left-4 right-4 z-20 bg-white/90 backdrop-blur-md border border-slate-200/80 px-4 py-3 rounded-2xl flex items-center justify-between shadow-lg">
                <div className="flex items-center gap-2">
                  <div className="bg-blue-50 text-blue-600 p-2 rounded-xl border border-blue-100">
                    <MapIcon className="w-4 h-4" />
                  </div>
                  <div>
                    <h2 className="text-xs font-bold text-slate-800 leading-tight">Visualisasi Geografis</h2>
                    <p className="text-[9px] font-semibold text-slate-500 leading-none mt-0.5">Peta interaktif sebaran posko aktif</p>
                  </div>
                </div>

                {/* Header Controls */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setIsMapMaximized(!isMapMaximized)}
                    className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-xs font-bold text-slate-700 border border-slate-200 transition-all cursor-pointer"
                    title={isMapMaximized ? "Kecilkan ukuran" : "Perbesar peta"}
                  >
                    {isMapMaximized ? (
                      <>
                        <Minimize2 className="w-3.5 h-3.5 text-slate-600" />
                        <span>Kecilkan</span>
                      </>
                    ) : (
                      <>
                        <Maximize2 className="w-3.5 h-3.5 text-slate-600" />
                        <span>Perbesar Peta</span>
                      </>
                    )}
                  </button>

                  <div className="flex items-center gap-1 text-[9px] text-slate-600 font-bold bg-slate-50 px-2.5 py-1 rounded-full border border-slate-200">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    Live GPS
                  </div>
                </div>
              </div>

              {/* Real Map Component Canvas */}
              <div className="flex-1 w-full h-full relative overflow-hidden bg-slate-50">
                <Map
                  theme="light"
                  viewport={{
                    center: [107.138, -6.65], // Center di antara Jabodetabek & Bandung Barat (Bogor, Tangerang, Cimahi, Depok)
                    zoom: 8.5,
                  }}
                >
                  <MapControls position="bottom-right" showZoom showLocate showCompass />

                  {/* Marker mapping for each posko */}
                  {filtered.map((posko) => {
                    const theme = statusTheme[posko.triase.status];
                    const poskoLat = posko.lat || -6.4807;
                    const poskoLng = posko.lng || 106.8529;
                    const isSelected = selectedPoskoId === posko.id;

                    return (
                      <MapMarker
                        key={posko.id}
                        longitude={poskoLng}
                        latitude={poskoLat}
                        onClick={() => setSelectedPoskoId(posko.id === selectedPoskoId ? null : posko.id)}
                      >
                        {/* Custom Map Pin Content */}
                        <MarkerContent>
                          <div className="relative group/pin cursor-pointer flex items-center justify-center">
                            {/* Pulse animation for kritis or active pin */}
                            {(posko.triase.status === "KRITIS" || isSelected) && (
                              <div
                                className="absolute rounded-full animate-map-ping opacity-60"
                                style={{
                                  backgroundColor: theme.pinColor,
                                  width: isSelected ? 36 : 24,
                                  height: isSelected ? 36 : 24,
                                }}
                              />
                            )}

                            {/* Main Pin Circle */}
                            <div
                              className={cn(
                                "rounded-full flex items-center justify-center border-2 border-white transition-all duration-300",
                                isSelected ? "w-8 h-8 scale-110 shadow-lg" : "w-6 h-6 shadow-md hover:scale-105"
                              )}
                              style={{
                                backgroundColor: theme.pinColor,
                                boxShadow: isSelected ? `0 0 16px ${theme.pinColor}a0` : "none"
                              }}
                            >
                              {isSelected ? (
                                <div className="w-2.5 h-2.5 bg-white rounded-full" />
                              ) : (
                                <span className="text-[9px] text-white font-extrabold">{posko.triase.skor}</span>
                              )}
                            </div>
                          </div>
                        </MarkerContent>

                        {/* Hover Tooltip label */}
                        <MarkerTooltip className="bg-slate-900 border border-slate-800 text-white text-[10px] font-bold px-2 py-1 rounded-md shadow-md pointer-events-none">
                          {posko.namaPosko} ({posko.triase.skor})
                        </MarkerTooltip>
                      </MapMarker>
                    );
                  })}

                  {/* Render popup directly beside/on top of the selected marker coordinates */}
                  {selectedPosko && (
                    <MapPopup
                      longitude={selectedPosko.lng || 106.8529}
                      latitude={selectedPosko.lat || -6.4807}
                      onClose={() => setSelectedPoskoId(null)}
                      closeButton={true}
                      className="bg-white border border-slate-100 shadow-[0_15px_40px_rgba(15,23,42,0.18)] p-0 w-[270px] text-slate-900 cursor-default rounded-3xl"
                    >
                      {/* Popover Card Content */}
                      <div className="p-4" onClick={(e) => e.stopPropagation()}>
                        <div className="flex justify-between items-start gap-2 mb-2">
                          <div>
                            <span className="text-[9px] font-black text-blue-600 tracking-wider uppercase">{selectedPosko.kecamatan}</span>
                            <h4 className="text-xs font-black text-slate-950 font-heading leading-tight mt-0.5">
                              {selectedPosko.namaPosko}
                            </h4>
                          </div>
                        </div>

                        {/* Image inside popup */}
                        {selectedPosko.imageUrl && (
                          <div className="w-full h-[90px] bg-slate-50 rounded-xl overflow-hidden mb-2.5 relative">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={selectedPosko.imageUrl}
                              alt={selectedPosko.namaPosko}
                              className="w-full h-full object-cover"
                            />
                            {/* Status Overlay */}
                            <span className="absolute top-2 left-2 inline-flex items-center text-[8px] font-black bg-white/95 px-2 py-0.5 rounded-full border shadow-sm tracking-wide">
                              Skor AI: {selectedPosko.triase.skor}
                            </span>
                          </div>
                        )}

                        <p className="text-[10px] text-slate-500 leading-normal mb-3 flex items-start gap-1">
                          <MapPin className="w-3.5 h-3.5 text-slate-400 flex-shrink-0 mt-0.5" />
                          <span className="line-clamp-2">{selectedPosko.alamat}</span>
                        </p>

                        <div className="grid grid-cols-2 gap-2 border-y border-slate-100 py-2.5 mb-3">
                          <div>
                            <span className="text-[8px] font-bold text-slate-400 uppercase tracking-wider block">Pengungsi</span>
                            <span className="text-xs font-black text-slate-800 leading-none mt-1 inline-block">
                              {selectedPosko.totalPengungsi} <span className="text-[9px] font-medium text-slate-500">Jiwa</span>
                            </span>
                          </div>
                          <div>
                            <span className="text-[8px] font-bold text-slate-400 uppercase tracking-wider block">Kebutuhan Utama</span>
                            <span className="text-[10px] font-black text-rose-600 leading-none mt-1 inline-block truncate max-w-full">
                              {selectedPosko.kebutuhanKritis.length > 0
                                ? selectedPosko.kebutuhanKritis[0]
                                : "Terpenuhi"}
                            </span>
                          </div>
                        </div>

                        <div className="flex gap-2">
                          <Link
                            href={`/posko/${selectedPosko.id}`}
                            className="flex-1 text-center bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-[10px] py-2.5 rounded-xl transition-all shadow-md hover:shadow-lg"
                          >
                            Detail Dasbor
                          </Link>
                        </div>
                      </div>
                    </MapPopup>
                  )}
                </Map>

                {/* Floating Map Legend (Bottom-Left overlay on top of map canvas) */}
                <div className="absolute bottom-6 left-6 bg-white/90 backdrop-blur-md border border-slate-200/80 rounded-2xl p-4 z-10 shadow-lg max-w-[190px]">
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block mb-2.5">
                    KLASIFIKASI TRIASE AI
                  </span>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-[10px] text-slate-700 font-bold">
                      <span className="w-2.5 h-2.5 rounded-full bg-rose-500 flex-shrink-0" />
                      Kritis (Skor &gt; 70)
                    </div>
                    <div className="flex items-center gap-2 text-[10px] text-slate-700 font-bold">
                      <span className="w-2.5 h-2.5 rounded-full bg-amber-500 flex-shrink-0" />
                      Waspada (Skor 40 - 69)
                    </div>
                    <div className="flex items-center gap-2 text-[10px] text-slate-700 font-bold">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 flex-shrink-0" />
                      Aman (Skor &lt; 40)
                    </div>
                  </div>
                </div>

              </div>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
