"use client";

import Link from "next/link";
import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import { Navbar } from "@/components/home/Navbar";
import type { PoskoSummary, TriaseStatus } from "@/types/posko";
import {
  Search,
  MapPin,
  Users,
  AlertTriangle,
  ChevronRight,
  CheckCircle,
  PhoneCall,
  Activity,
  ShieldCheck,
  ArrowRight,
  Navigation,
  Loader2
} from "lucide-react";
import { Map, MapMarker, MarkerContent, MarkerTooltip, MapControls, MapPopup, MapRoute } from "@/components/ui/map";
import { cn } from "@/lib/utils";
import { mapService } from "@/services/map.service";
import type MapLibreGL from "maplibre-gl";

/* ── Status Theme Configuration ── */
const statusTheme: Record<
  TriaseStatus,
  {
    text: string;
    badgeBg: string;
    accentLine: string;
    pinColor: string;
  }
> = {
  KRITIS: {
    text: "text-rose-600",
    badgeBg: "bg-rose-50 border-rose-200/60 text-rose-700",
    accentLine: "bg-rose-500",
    pinColor: "#f43f5e",
  },
  WASPADA: {
    text: "text-amber-600",
    badgeBg: "bg-amber-50 border-amber-200/60 text-amber-800",
    accentLine: "bg-amber-500",
    pinColor: "#f59e0b",
  },
  AMAN: {
    text: "text-emerald-600",
    badgeBg: "bg-emerald-50 border-emerald-200/60 text-emerald-800",
    accentLine: "bg-emerald-500",
    pinColor: "#10b981",
  },
};

function timeAgo(iso: string) {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (diff < 1) return "baru saja";
  if (diff < 60) return `${diff}m lalu`;
  return `${Math.floor(diff / 60)}j lalu`;
}

const FILTERS = [
  { key: "semua", label: "Semua Posko" },
  { key: "KRITIS", label: "Kritis" },
  { key: "WASPADA", label: "Waspada" },
  { key: "AMAN", label: "Aman" },
  { key: "RELAWAN", label: "Basecamp Relawan" },
] as const;

type FilterKey = (typeof FILTERS)[number]["key"];

export function CombinedMapView() {
  const [poskoList, setPoskoList] = useState<PoskoSummary[]>([]);
  const [statsData, setStatsData] = useState<{ totalPengungsi: number; totalPoskoMerah: number; totalRelawanAktif: number }>({
    totalPengungsi: 0,
    totalPoskoMerah: 0,
    totalRelawanAktif: 0,
  });
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterKey>("semua");
  const [search, setSearch] = useState("");
  const [selectedPoskoId, setSelectedPoskoId] = useState<string | null>(null);

  // GPS User Location State
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [routeInfo, setRouteInfo] = useState<{ distance: string; duration: string; coordinates: [number, number][] } | null>(null);
  const [locating, setLocating] = useState(false);
  const mapRef = useRef<MapLibreGL.Map | null>(null);

  // Detect User GPS on mount
  useEffect(() => {
    if (typeof window !== "undefined" && "geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation([position.coords.longitude, position.coords.latitude]);
        },
        () => {
          // Default location Bogor/Cibinong if denied
          setUserLocation([106.8529, -6.4807]);
        }
      );
    }
  }, []);

  const centerOnUserLocation = useCallback(() => {
    setLocating(true);
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const lng = pos.coords.longitude;
          const lat = pos.coords.latitude;
          setUserLocation([lng, lat]);
          mapRef.current?.flyTo({ center: [lng, lat], zoom: 14, duration: 1500 });
          setLocating(false);
        },
        () => {
          // Fallback: pan to existing userLocation if available
          if (userLocation) {
            mapRef.current?.flyTo({ center: userLocation, zoom: 14, duration: 1500 });
          }
          setLocating(false);
        }
      );
    }
  }, [userLocation]);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [statsRes, mapRes] = await Promise.all([
          mapService.getStats(),
          mapService.getMapData("all")
        ]);

        setStatsData(statsRes);

        const poskos: PoskoSummary[] = (mapRes.posko || []).map((p) => {
          let mappedStatus: TriaseStatus = "AMAN";
          if (p.aiStatus === "MERAH") mappedStatus = "KRITIS";
          else if (p.aiStatus === "KUNING") mappedStatus = "WASPADA";
          else if (p.aiStatus === "HIJAU") mappedStatus = "AMAN";

          return {
            id: p.id,
            namaPosko: p.name,
            alamat: p.alamat || "",
            kecamatan: p.kabKota || "",
            triase: {
              status: mappedStatus,
              skor: p.aiUrgencyScore || 0,
              updatedAt: new Date().toISOString()
            },
            totalPengungsi: p.jumlahPengungsi,
            kebutuhanKritis: p.kebutuhan.map((k) => k.itemName),
            relawanAktif: p.totalRelawan,
            lat: p.latitude,
            lng: p.longitude,
            jenis: "bencana"
          };
        });

        const inventories: PoskoSummary[] = (mapRes.inventory || []).map((i) => ({
          id: i.id,
          namaPosko: i.name,
          alamat: i.alamat || "",
          kecamatan: i.kabKota || "",
          triase: {
            status: "AMAN",
            skor: 0,
            updatedAt: new Date().toISOString()
          },
          totalPengungsi: 0,
          kebutuhanKritis: [],
          relawanAktif: i.totalRelawan,
          lat: i.latitude,
          lng: i.longitude,
          jenis: "relawan"
        }));

        setPoskoList([...poskos, ...inventories]);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // Filtering & sorting logic
  const filtered = useMemo(() => {
    return poskoList
      .filter((p) => {
        const matchesFilter =
          filter === "semua" ||
          (filter === "RELAWAN" && p.jenis === "relawan") ||
          (filter !== "RELAWAN" && p.jenis !== "relawan" && p.triase.status === filter);

        const matchesSearch =
          search === "" ||
          p.namaPosko.toLowerCase().includes(search.toLowerCase()) ||
          p.kecamatan.toLowerCase().includes(search.toLowerCase()) ||
          p.alamat.toLowerCase().includes(search.toLowerCase());

        return matchesFilter && matchesSearch;
      })
      .sort((a, b) => b.triase.skor - a.triase.skor);
  }, [poskoList, filter, search]);

  const stats = useMemo(() => {
    return {
      totalPengungsi: statsData.totalPengungsi,
      kritis: statsData.totalPoskoMerah,
      totalRelawan: statsData.totalRelawanAktif,
    };
  }, [statsData]);

  const selectedPosko = useMemo(() => {
    return poskoList.find((p) => p.id === selectedPoskoId) || null;
  }, [poskoList, selectedPoskoId]);

  // Calculate route via OSRM when selectedPosko or userLocation changes
  useEffect(() => {
    if (!userLocation || !selectedPosko) {
      setRouteInfo(null);
      return;
    }

    const posLng = selectedPosko.lng || 106.8529;
    const posLat = selectedPosko.lat || -6.4807;

    mapService.getRoute(userLocation, [posLng, posLat]).then((route) => {
      if (route) {
        setRouteInfo(route);
      } else {
        // Fallback to haversine if OSRM fails
        const R = 6371;
        const dLat = ((posLat - userLocation[1]) * Math.PI) / 180;
        const dLon = ((posLng - userLocation[0]) * Math.PI) / 180;
        const a =
          Math.sin(dLat / 2) * Math.sin(dLat / 2) +
          Math.cos((userLocation[1] * Math.PI) / 180) *
            Math.cos((posLat * Math.PI) / 180) *
            Math.sin(dLon / 2) *
            Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        const distanceKm = R * c;
        const timeHours = distanceKm / 40;
        const timeMinutes = Math.max(1, Math.round(timeHours * 60));

        setRouteInfo({
          distance: `${distanceKm.toFixed(1)} km`,
          duration:
            timeMinutes >= 60
              ? `${Math.floor(timeMinutes / 60)} jam ${timeMinutes % 60} menit`
              : `${timeMinutes} menit`,
          coordinates: [userLocation, [posLng, posLat]],
        });
      }
    });
  }, [userLocation, selectedPosko]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col antialiased">
      <Navbar />

      <main className="flex-1 w-full max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-12 flex flex-col gap-6">
        
        {/* Header & Stats Container */}
        <div className="flex flex-col xl:flex-row justify-between items-start xl:items-end gap-6 bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm">
          <div className="space-y-3 max-w-2xl">
            <h1 className="text-3xl md:text-4xl font-black tracking-tight font-heading leading-tight text-slate-900">
              Peta Distribusi & Urgensi
            </h1>
            <p className="text-sm text-slate-500 font-medium leading-relaxed">
              Pantau sebaran Posko Relawan dan tingkat urgensi Posko Bencana secara real-time. Klik area di peta atau gunakan daftar di bawah.
            </p>
          </div>

          {/* Minimalist Floating Stats */}
          <div className="flex flex-wrap gap-4 items-center flex-shrink-0">
            <div className="flex items-center gap-3 bg-slate-50 border border-slate-100 px-4 py-3 rounded-2xl">
              <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center text-blue-600">
                <Users className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block leading-none">Total Pengungsi</span>
                <span className="text-base font-black text-slate-800 font-heading leading-tight mt-1 block">
                  {stats.totalPengungsi.toLocaleString("id-ID")} <span className="text-[10px] font-bold text-slate-400">Jiwa</span>
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3 bg-slate-50 border border-slate-100 px-4 py-3 rounded-2xl">
              <div className="w-10 h-10 rounded-xl bg-rose-100 flex items-center justify-center text-rose-600">
                <Activity className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block leading-none">Posko Kritis</span>
                <span className="text-base font-black text-rose-600 font-heading leading-tight mt-1 block">
                  {stats.kritis} <span className="text-[10px] font-bold text-slate-400">Titik</span>
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3 bg-slate-50 border border-slate-100 px-4 py-3 rounded-2xl">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-600">
                <PhoneCall className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block leading-none">Relawan Aktif</span>
                <span className="text-base font-black text-emerald-600 font-heading leading-tight mt-1 block">
                  {stats.totalRelawan} <span className="text-[10px] font-bold text-slate-400">Orang</span>
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* TOP SECTION: Full Width Map */}
        <div className="w-full h-[500px] md:h-[600px] rounded-[2rem] overflow-hidden border border-slate-200 shadow-md relative bg-slate-100">
          <Map
            theme="light"
            viewport={{
              center: [107.138, -6.65],
              zoom: 8.5,
            }}
            loading={loading}
            ref={mapRef}
          >
            <MapControls position="bottom-right" showZoom showCompass />

            {/* GPS User Marker */}
            {userLocation && (
              <MapMarker
                longitude={userLocation[0]}
                latitude={userLocation[1]}
              >
                <MarkerContent>
                  <div className="relative flex items-center justify-center">
                    <div className="absolute rounded-full animate-ping bg-blue-400 opacity-75 w-6 h-6" />
                    <div className="rounded-full bg-blue-600 border-2 border-white w-4 h-4 shadow-md flex items-center justify-center">
                      <div className="bg-white rounded-full w-1.5 h-1.5" />
                    </div>
                  </div>
                </MarkerContent>
              </MapMarker>
            )}

            {/* Real Route via OSRM */}
            {routeInfo?.coordinates && routeInfo.coordinates.length >= 2 && (
              <MapRoute
                coordinates={routeInfo.coordinates}
                color="#2563eb"
                width={5}
                opacity={0.85}
              />
            )}

            {/* GPS Saya Button - floating over map */}
            <div className="absolute top-4 right-4 z-20 flex flex-col gap-2">
              <button
                onClick={centerOnUserLocation}
                disabled={locating}
                className={cn(
                  "flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold shadow-lg transition-all",
                  "bg-white hover:bg-blue-50 border border-slate-200 text-slate-700 hover:text-blue-600",
                  "focus:outline-none focus:ring-2 focus:ring-blue-400"
                )}
                title="Pusatkan ke lokasi saya"
              >
                {locating ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Navigation className="w-4 h-4" />
                )}
                GPS Saya
              </button>
            </div>

            {poskoList.map((posko) => {
              const isRelawan = posko.jenis === "relawan";
              const theme = statusTheme[posko.triase.status] || statusTheme.AMAN;
              const isSelected = selectedPoskoId === posko.id;
              const poskoLat = posko.lat || -6.4807;
              const poskoLng = posko.lng || 106.8529;

              return (
                <MapMarker
                  key={posko.id}
                  longitude={poskoLng}
                  latitude={poskoLat}
                  onClick={() => setSelectedPoskoId(posko.id)}
                >
                  <MarkerContent className="group relative cursor-pointer flex items-center justify-center">
                    <div onClick={(e) => { e.stopPropagation(); setSelectedPoskoId(posko.id); }} className="relative flex items-center justify-center">
                      {(posko.triase.status === "KRITIS" || isSelected) && !isRelawan && (
                      <div
                        className="absolute rounded-full animate-map-ping opacity-60"
                        style={{ backgroundColor: theme.pinColor, width: isSelected ? 40 : 28, height: isSelected ? 40 : 28 }}
                      />
                    )}
                    <div
                      className={cn(
                        "rounded-full flex items-center justify-center border-2 border-white transition-all shadow-md",
                        isSelected ? "scale-125 z-20 shadow-lg" : "hover:scale-110 z-10",
                        isRelawan ? "bg-blue-500" : ""
                      )}
                      style={{
                        backgroundColor: isRelawan ? "#3b82f6" : theme.pinColor,
                        width: isSelected ? 32 : 28,
                        height: isSelected ? 32 : 28,
                      }}
                    >
                      {isRelawan ? (
                        <ShieldCheck className="w-4 h-4 text-white" />
                      ) : (
                        <span className="text-[10px] text-white font-extrabold">{posko.triase.skor}</span>
                      )}
                    </div>
                    </div>
                  </MarkerContent>

                  {/* MarkerTooltip removed based on user request. Only MapPopup will be used. */}
                </MapMarker>
              );
            })}

            {/* Popup Info Box (Triggered on click) */}
            {selectedPosko && (
              <MapPopup
                longitude={selectedPosko.lng || 106.8529}
                latitude={selectedPosko.lat || -6.4807}
                onClose={() => setSelectedPoskoId(null)}
                closeButton={true}
                className="bg-white/95 backdrop-blur-md border border-slate-200 text-slate-800 shadow-xl p-0 min-w-[240px] rounded-2xl overflow-hidden"
              >
                <div className="p-4 pt-5">
                  <div className="font-bold text-slate-900 text-sm mb-1">
                    {selectedPosko.namaPosko} {selectedPosko.jenis === "relawan" && "(Hub)"}
                  </div>
                  
                  {selectedPosko.jenis === "relawan" ? (
                    <div className="mb-4">
                      <span className="inline-block px-2 py-0.5 bg-blue-100 text-blue-700 text-[10px] font-bold uppercase tracking-wider rounded mb-1.5">Basecamp Relawan</span>
                      <p className="text-[11px] text-slate-500 line-clamp-2">{selectedPosko.alamat}</p>
                    </div>
                  ) : (
                    <div className="space-y-2 mt-3 mb-4">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-slate-500 font-medium">Status AI</span>
                        <span className={cn(
                          "font-bold text-[9px] px-1.5 py-0.5 rounded uppercase tracking-wider",
                          selectedPosko.triase.status === "KRITIS" ? "bg-rose-100 text-rose-700 border-rose-200" :
                          selectedPosko.triase.status === "WASPADA" ? "bg-amber-100 text-amber-700 border-amber-200" :
                          "bg-emerald-100 text-emerald-700 border-emerald-200"
                        )}>
                          {selectedPosko.triase.status} ({selectedPosko.triase.skor})
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-slate-500 font-medium">Pengungsi</span>
                        <span className="font-bold text-slate-800">{selectedPosko.totalPengungsi} Jiwa</span>
                      </div>
                      {selectedPosko.kebutuhanKritis.length > 0 && (
                        <div className="text-[11px] border-t border-slate-100 pt-2 mt-2">
                          <span className="text-slate-500 block mb-1 font-medium">Kebutuhan Mendesak:</span>
                          <span className="text-rose-600 font-semibold">{selectedPosko.kebutuhanKritis.join(", ")}</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Route & Jarak Info */}
                  {routeInfo && (
                    <div className="mt-2 mb-4 p-2.5 bg-slate-50 rounded-xl border border-slate-200/80 text-[11px] space-y-1 animate-in fade-in duration-200">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500 font-medium">Jarak Tempuh:</span>
                        <span className="font-bold text-slate-800">{routeInfo.distance}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500 font-medium">Estimasi Waktu:</span>
                        <span className="font-bold text-blue-600">{routeInfo.duration}</span>
                      </div>
                    </div>
                  )}

                  {selectedPosko.jenis !== "relawan" && (
                    <Link
                      href={`/posko/${selectedPosko.id}`}
                      className="block w-full text-center bg-blue-600 hover:bg-blue-700 text-white font-bold text-[11px] py-2.5 rounded-xl transition-all shadow-md"
                    >
                      Buka Detail Posko
                    </Link>
                  )}
                </div>
              </MapPopup>
            )}
          </Map>

          {/* Floating Map Legend */}
          <div className="absolute bottom-6 left-6 bg-white/95 backdrop-blur-md border border-slate-200 rounded-2xl p-4 z-10 shadow-lg pointer-events-none">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-3">Legenda Peta</span>
            <div className="space-y-2.5">
              <div className="flex items-center gap-2.5 text-[11px] text-slate-700 font-bold">
                <span className="w-3 h-3 rounded-full bg-blue-500 flex-shrink-0" />
                Basecamp Relawan
              </div>
              <div className="flex items-center gap-2.5 text-[11px] text-slate-700 font-bold">
                <span className="w-3 h-3 rounded-full bg-rose-500 flex-shrink-0 shadow-[0_0_8px_rgba(244,63,94,0.5)]" />
                Posko Kritis (Skor &gt; 70)
              </div>
              <div className="flex items-center gap-2.5 text-[11px] text-slate-700 font-bold">
                <span className="w-3 h-3 rounded-full bg-amber-500 flex-shrink-0" />
                Posko Siaga (Skor 40-69)
              </div>
              <div className="flex items-center gap-2.5 text-[11px] text-slate-700 font-bold">
                <span className="w-3 h-3 rounded-full bg-emerald-500 flex-shrink-0" />
                Posko Aman (Skor &lt; 40)
              </div>
            </div>
          </div>
        </div>

        {/* BOTTOM SECTION: Search, Filters & List */}
        <div className="flex flex-col gap-6 mt-4">
          
          {/* Controls Bar */}
          <div className="bg-white p-4 md:p-5 rounded-[2rem] border border-slate-100 shadow-sm flex flex-col md:flex-row items-center gap-4">
            <div className="relative w-full md:w-96 flex-shrink-0">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Cari lokasi, nama posko, dll..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-11 pr-4 py-3 text-sm text-slate-800 placeholder:text-slate-400 outline-none focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100 transition-all font-medium"
              />
            </div>

            <div className="flex gap-2 overflow-x-auto w-full pb-1 scrollbar-none">
              {FILTERS.map((f) => {
                const count = f.key === "semua"
                  ? poskoList.length
                  : f.key === "RELAWAN"
                  ? poskoList.filter((p) => p.jenis === "relawan").length
                  : poskoList.filter((p) => p.triase.status === f.key && p.jenis !== "relawan").length;
                const active = filter === f.key;

                return (
                  <button
                    key={f.key}
                    onClick={() => setFilter(f.key)}
                    className={cn(
                      "flex-shrink-0 text-[11px] font-bold px-4 py-3 rounded-xl transition-all border flex items-center gap-2",
                      active
                        ? "bg-slate-900 border-slate-900 text-white shadow-md"
                        : "bg-slate-50 hover:bg-slate-100 border-slate-200/50 text-slate-600"
                    )}
                  >
                    {f.key === "KRITIS" && <span className="w-2 h-2 rounded-full bg-rose-500" />}
                    {f.key === "WASPADA" && <span className="w-2 h-2 rounded-full bg-amber-500" />}
                    {f.key === "AMAN" && <span className="w-2 h-2 rounded-full bg-emerald-500" />}
                    {f.key === "RELAWAN" && <span className="w-2 h-2 rounded-full bg-blue-500" />}
                    <span>{f.label}</span>
                    <span className={cn(
                      "text-[9px] px-1.5 py-0.5 rounded-full font-black",
                      active ? "bg-white/20 text-white" : "bg-slate-200 text-slate-500"
                    )}>
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Grid of Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {filtered.length === 0 ? (
              <div className="col-span-full bg-white border border-dashed border-slate-200 rounded-[2rem] p-16 text-center flex flex-col items-center">
                <Search className="w-12 h-12 text-slate-300 mb-4" />
                <p className="text-base font-bold text-slate-600">Pencarian tidak ditemukan</p>
                <p className="text-sm text-slate-400 mt-1">Coba sesuaikan filter atau kata kunci Anda.</p>
              </div>
            ) : (
              filtered.map((posko) => {
                const isRelawan = posko.jenis === "relawan";
                const theme = statusTheme[posko.triase.status] || statusTheme.AMAN;
                const isSelected = selectedPoskoId === posko.id;

                return (
                  <div
                    key={posko.id}
                    className={cn(
                      "group bg-white border rounded-2xl transition-all duration-300 relative overflow-hidden flex flex-col",
                      isSelected
                        ? "border-blue-500 shadow-[0_0_0_2px_rgba(59,130,246,0.2)] shadow-xl z-10"
                        : "border-slate-200 hover:border-blue-300 hover:shadow-lg"
                    )}
                  >
                    <div className="relative w-full h-[140px] bg-slate-100 overflow-hidden">
                      {/* Mini Map Preview relative to posko coordinate */}
                      <div className="absolute inset-0 pointer-events-none">
                        <Map
                          theme="light"
                          viewport={{
                            center: [posko.lng || 106.8529, posko.lat || -6.4807],
                            zoom: 12.5,
                          }}
                          attributionControl={false}
                        >
                          <MapMarker
                            longitude={posko.lng || 106.8529}
                            latitude={posko.lat || -6.4807}
                          >
                            <MarkerContent>
                              <div
                                className="rounded-full border-2 border-white shadow-md"
                                style={{
                                  backgroundColor: isRelawan ? "#3b82f6" : theme.pinColor,
                                  width: 14,
                                  height: 14,
                                }}
                              />
                            </MarkerContent>
                          </MapMarker>
                        </Map>
                      </div>

                      {/* Badge overlay */}
                      <div className="absolute top-4 left-4 z-10">
                        {isRelawan ? (
                          <span className="inline-flex items-center gap-1.5 text-[10px] font-black px-2.5 py-1 rounded-full border shadow-sm backdrop-blur-md bg-white/95 text-blue-700 border-blue-200/60 uppercase tracking-wider">
                            <ShieldCheck className="w-3 h-3 text-blue-500" /> Basecamp
                          </span>
                        ) : (
                          <span className={cn(
                            "inline-flex items-center gap-1.5 text-[10px] font-black px-2.5 py-1 rounded-full border shadow-sm backdrop-blur-md bg-white/95 uppercase tracking-wider",
                            theme.badgeBg
                          )}>
                            <span className={cn("w-1.5 h-1.5 rounded-full", theme.accentLine, posko.triase.status === "KRITIS" && "animate-pulse")} />
                            {posko.triase.status}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex-1 p-5 md:p-6 flex flex-col justify-between">
                      <div>
                        <div className="flex items-start justify-between gap-3 mb-1">
                          <div>
                            <span className="text-[10px] font-black text-blue-600 tracking-wider uppercase block">{posko.kecamatan}</span>
                            <h3 className="text-lg font-extrabold text-slate-900 font-heading leading-tight group-hover:text-blue-600 transition-colors mt-1">
                              {posko.namaPosko}
                            </h3>
                          </div>
                          {!isRelawan && (
                            <div className="text-right">
                              <span className={cn("text-2xl font-black font-heading leading-none block", theme.text)}>
                                {posko.triase.skor}
                              </span>
                              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-none mt-1 block">Skor</span>
                            </div>
                          )}
                        </div>

                        <p className="text-xs text-slate-500 line-clamp-2 mt-2 leading-relaxed">
                          {posko.alamat}
                        </p>

                        <div className="grid grid-cols-2 gap-2 mt-4 bg-slate-50 border border-slate-100 rounded-xl p-3">
                          <div>
                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Pengungsi</span>
                            <span className="text-sm font-black text-slate-800 mt-1 block">{posko.totalPengungsi}</span>
                          </div>
                          <div>
                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Relawan Aktif</span>
                            <span className="text-sm font-black text-emerald-600 mt-1 block">{posko.relawanAktif}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between gap-3 border-t border-slate-100 pt-4 mt-4">
                        {!isRelawan ? (
                          posko.kebutuhanKritis.length > 0 ? (
                            <div className="flex items-center gap-1.5 flex-wrap">
                              {posko.kebutuhanKritis.slice(0, 2).map((need) => (
                                <span key={need} className={cn("inline-flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-full border",
                                  posko.triase.status === "KRITIS" ? "bg-rose-50 border-rose-100 text-rose-600" :
                                  posko.triase.status === "WASPADA" ? "bg-amber-50 border-amber-100 text-amber-600" :
                                  "bg-emerald-50 border-emerald-100 text-emerald-600"
                                )}>
                                  <AlertTriangle className={cn("w-3 h-3",
                                    posko.triase.status === "KRITIS" ? "text-rose-500" :
                                    posko.triase.status === "WASPADA" ? "text-amber-500" :
                                    "text-emerald-500"
                                  )} /> {need}
                                </span>
                              ))}
                            </div>
                          ) : (
                            <div className="flex items-center gap-1.5 text-emerald-600 text-[11px] font-bold">
                              <CheckCircle className="w-3.5 h-3.5" /> Terpenuhi
                            </div>
                          )
                        ) : (
                          <div className="text-[11px] font-bold text-blue-600 flex items-center gap-1.5">
                            <ShieldCheck className="w-4 h-4" /> Hub Logistik Siap
                          </div>
                        )}

                        {!isRelawan && (
                          <Link
                            href={`/posko/${posko.id}`}
                            className="relative z-10 text-[12px] font-bold text-white flex items-center gap-1 transition-all ml-auto bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-xl shadow-md"
                          >
                            Buka Detail <ArrowRight className="w-3.5 h-3.5" />
                          </Link>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

      </main>
    </div>
  );
}
