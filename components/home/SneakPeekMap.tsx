"use client";

import Link from "next/link";
import { Map, MapMarker, MarkerContent } from "@/components/ui/map";
import { ShieldCheck } from "lucide-react";

const dummyPins = [
  { id: 1, type: "relawan", urgency: "",       loc: [107.6191, -6.9175] as [number, number] },
  { id: 2, type: "bencana", urgency: "kritis", loc: [107.138, -6.816] as [number, number] },
  { id: 3, type: "bencana", urgency: "siaga",  loc: [107.95, -7.2] as [number, number] },
  { id: 4, type: "bencana", urgency: "aman",   loc: [107.63, -6.95] as [number, number] },
  { id: 5, type: "bencana", urgency: "kritis", loc: [106.9237, -6.9277] as [number, number] },
];

function UrgencyPin({ urgency, type }: { urgency: string; type: string }) {
  if (type === "relawan") {
    return (
      <div className="w-9 h-9 rounded-xl bg-blue-600 border-2 border-white shadow-lg flex items-center justify-center">
        <ShieldCheck className="w-4 h-4 text-white" />
      </div>
    );
  }

  const color =
    urgency === "kritis" ? "#ef4444"
    : urgency === "siaga" ? "#f59e0b"
    : "#3b82f6";

  const isKritis = urgency === "kritis";

  return (
    <div className="relative flex items-center justify-center">
      {}
      {isKritis && (
        <>
          <span
            className="absolute rounded-full animate-ping opacity-50"
            style={{ width: 32, height: 32, backgroundColor: color, animationDuration: "1.1s" }}
          />
          <span
            className="absolute rounded-full animate-ping opacity-25"
            style={{ width: 48, height: 48, backgroundColor: color, animationDuration: "1.5s", animationDelay: "0.25s" }}
          />
          <span
            className="absolute rounded-full animate-ping opacity-15"
            style={{ width: 64, height: 64, backgroundColor: color, animationDuration: "2s", animationDelay: "0.5s" }}
          />
        </>
      )}
      {!isKritis && urgency === "siaga" && (
        <span
          className="absolute rounded-full animate-ping opacity-40"
          style={{ width: 28, height: 28, backgroundColor: color, animationDuration: "2s" }}
        />
      )}
      {}  
      <span
        className="relative rounded-full border-2 border-white shadow-md"
        style={{
          width: 16,
          height: 16,
          backgroundColor: color,
          boxShadow: `0 0 10px ${color}80`,
        }}
      />
    </div>
  );
}

export function SneakPeekMap() {
  return (
    <section id="map" className="py-24 bg-white relative">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent" />

      <div data-aos="fade-up" className="max-w-[1200px] mx-auto px-6 lg:px-10">
        <div className="relative rounded-[32px] overflow-hidden border border-slate-200 bg-slate-50 shadow-[0_4px_32px_-8px_rgba(15,23,42,0.08)]">

          {}
          <div className="relative z-10 px-10 md:px-16 pt-14 pb-10 text-center">
            <h2 className="text-ink-900 text-[34px] font-extrabold mb-4 font-heading tracking-tight">
              Ayo pantau keadaan posko{" "}
              <span className="text-blue-600">sekarang.</span>
            </h2>
            <p className="text-ink-500 text-[15px] max-w-[520px] mx-auto leading-[1.65]">
              Titik merah di peta bukan sekadar warna — setiap titik adalah posko yang sedang menunggu bantuan. Lihat mana yang paling kritis dan ambil tindakan.
            </p>
          </div>

          {}
          <div
            className="relative mx-6 md:mx-10 mb-6 rounded-[20px] overflow-hidden border border-slate-200 bg-slate-100 shadow-sm"
            style={{ height: 380 }}
          >
            {}
            <div className="absolute inset-0 z-0">
              <Map
                theme="light"
                viewport={{ center: [107.4, -6.9], zoom: 7.5 }}
                scrollZoom={false}
                dragPan={false}
                dragRotate={false}
                touchZoomRotate={false}
                doubleClickZoom={false}
                keyboard={false}
              >
                {dummyPins.map((pin) => (
                  <MapMarker key={pin.id} longitude={pin.loc[0]} latitude={pin.loc[1]}>
                    <MarkerContent>
                      <UrgencyPin urgency={pin.urgency} type={pin.type} />
                    </MarkerContent>
                  </MapMarker>
                ))}
              </Map>
            </div>

            {}
            <div className="absolute top-4 left-4 bg-white/95 backdrop-blur-sm border border-slate-200 rounded-[16px] px-4 py-3.5 z-20 shadow-sm pointer-events-none">
              <div className="text-ink-900 text-[12px] font-bold mb-3">Status area</div>
              {[
                { color: "bg-red-500",   label: "5 Kritis",    pulse: true },
                { color: "bg-amber-500", label: "12 Siaga",    pulse: false },
                { color: "bg-blue-500",  label: "24 Terpenuhi",pulse: false },
              ].map((s) => (
                <div key={s.label} className="flex items-center gap-2.5 text-[12px] text-ink-700 mb-2 last:mb-0">
                  <span className={`relative flex-shrink-0 w-2.5 h-2.5 rounded-full ${s.color}`}>
                    {s.pulse && (
                      <span className={`absolute inset-0 rounded-full ${s.color} animate-ping opacity-60`} />
                    )}
                  </span>
                  {s.label}
                </div>
              ))}
            </div>

            {}
            <div className="absolute inset-0 flex items-center justify-center z-20 bg-white/10 backdrop-blur-[1.5px]">
              <Link
                href="/maps"
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-[14.5px] py-3.5 px-8 rounded-xl transition-all shadow-[0_8px_24px_rgba(37,99,235,0.45)] hover:shadow-[0_8px_32px_rgba(37,99,235,0.55)] hover:-translate-y-0.5 flex items-center gap-2"
              >
                <svg viewBox="0 0 20 20" className="w-5 h-5 fill-white opacity-90">
                  <path d="M10 2a6 6 0 100 12A6 6 0 0010 2zm0 10.5A4.5 4.5 0 1110 3.5a4.5 4.5 0 010 9zm0-7a2.5 2.5 0 100 5 2.5 2.5 0 000-5z"/>
                </svg>
                Buka Peta Interaktif
              </Link>
            </div>
          </div>

          {}
          <div className="flex items-center justify-between px-10 pb-8">
            <div className="flex items-center gap-1.5 text-ink-500 text-[12.5px]">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
              Data diperbarui real-time
            </div>
            <div className="text-ink-400 text-[12px]">41 posko aktif dipantau</div>
          </div>
        </div>
      </div>
    </section>
  );
}
