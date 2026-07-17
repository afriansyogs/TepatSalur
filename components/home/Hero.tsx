"use client";

import { useEffect, useRef } from "react";
import { Map, MapMarker, MarkerContent } from "@/components/ui/map";
import { cn } from "@/lib/utils";

const heropins = [
  { id: 1, urgency: "kritis", loc: [107.138, -6.816] as [number, number] },
  { id: 2, urgency: "kritis", loc: [106.9237, -6.9277] as [number, number] },
  { id: 3, urgency: "siaga",  loc: [107.95, -7.2] as [number, number] },
  { id: 4, urgency: "siaga",  loc: [107.4, -7.05] as [number, number] },
  { id: 5, urgency: "aman",   loc: [107.63, -6.95] as [number, number] },
  { id: 6, urgency: "kritis", loc: [108.2, -6.9] as [number, number] },
  { id: 7, urgency: "aman",   loc: [106.65, -7.3] as [number, number] },
  { id: 8, urgency: "siaga",  loc: [107.0, -7.5] as [number, number] },
];

function PulsingPin({ urgency }: { urgency: string }) {
  const color =
    urgency === "kritis" ? "#ef4444"
    : urgency === "siaga" ? "#f59e0b"
    : "#3b82f6";

  return (
    <div className="relative flex items-center justify-center">
      <span
        className="absolute inline-flex rounded-full opacity-60 animate-ping"
        style={{
          width: 28,
          height: 28,
          backgroundColor: color,
          animationDuration: urgency === "kritis" ? "1.2s" : "2s",
        }}
      />
      <span
        className="absolute inline-flex rounded-full opacity-30 animate-ping"
        style={{
          width: 40,
          height: 40,
          backgroundColor: color,
          animationDuration: urgency === "kritis" ? "1.6s" : "2.8s",
          animationDelay: "0.3s",
        }}
      />
      <span
        className="relative inline-flex rounded-full border-2 border-white shadow-lg"
        style={{
          width: 14,
          height: 14,
          backgroundColor: color,
          boxShadow: `0 0 8px ${color}`,
        }}
      />
    </div>
  );
}

export function Hero() {
  const heroRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = heroRef.current;
    if (!el) return;
    const handleMove = (e: MouseEvent) => {
      const { clientX, clientY } = e;
      const dx = (clientX / window.innerWidth - 0.5) * 10;
      const dy = (clientY / window.innerHeight - 0.5) * 6;
      el.style.setProperty("--px", `${dx}px`);
      el.style.setProperty("--py", `${dy}px`);
    };
    window.addEventListener("mousemove", handleMove);
    return () => window.removeEventListener("mousemove", handleMove);
  }, []);

  return (
    <section
      ref={heroRef}
      className="relative min-h-screen flex items-center justify-center overflow-hidden bg-white"
    >
      <div
        className="absolute inset-0 z-0 transition-transform duration-500 ease-out"
        style={{ transform: "translate(var(--px, 0), var(--py, 0))" }}
      >
        <Map
          theme="light"
          viewport={{ center: [107.4, -6.9], zoom: 7.2 }}
          className="absolute inset-0 w-full h-full pointer-events-none"
          scrollZoom={false}
          dragPan={false}
          dragRotate={false}
          touchZoomRotate={false}
          doubleClickZoom={false}
          keyboard={false}
        >
          {heropins.map((pin) => (
            <MapMarker key={pin.id} longitude={pin.loc[0]} latitude={pin.loc[1]}>
              <MarkerContent>
                <PulsingPin urgency={pin.urgency} />
              </MarkerContent>
            </MapMarker>
          ))}
        </Map>

        <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_70%_at_50%_50%,rgba(255,255,255,0.92)_0%,rgba(255,255,255,0.65)_50%,rgba(255,255,255,0.1)_100%)] pointer-events-none" />
        <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-white to-transparent pointer-events-none" />
        <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-white to-transparent pointer-events-none" />
      </div>

      <div className="relative z-10 max-w-[1200px] mx-auto px-6 w-full pt-32 pb-20 flex flex-col items-center text-center">



        <h1
          data-aos="fade-up"
          data-aos-delay="100"
          className="text-[32px] sm:text-[48px] md:text-[62px] leading-[1.05] font-extrabold tracking-[-0.03em] text-ink-900 font-heading mb-6 max-w-[780px]"
        >
          Satu tindakanmu{" "}
          <span className="text-blue-600">bisa menyelamatkan</span>
          <br className="hidden sm:block" />
          ribuan jiwa di sana.
        </h1>

        <p
          data-aos="fade-up"
          data-aos-delay="200"
          className="text-[15px] sm:text-[17px] text-ink-500 leading-[1.7] mb-10 max-w-[540px]"
        >
          TepatSalur memastikan bantuanmu tiba di tangan yang paling membutuhkan — bukan numpuk di gudang yang salah. Bergabunglah sekarang, bersama kita bisa.
        </p>

        <div
          data-aos="fade-up"
          data-aos-delay="300"
          className="flex flex-col sm:flex-row gap-3 justify-center mb-14 w-full sm:w-auto px-4 sm:px-0"
        >
          <a
            href="/register?role=donatur"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-[14.5px] py-3.5 px-8 rounded-xl transition-all shadow-[0_8px_24px_rgba(37,99,235,0.4)] hover:shadow-[0_8px_32px_rgba(37,99,235,0.5)] hover:-translate-y-0.5 animate-bounce-short"
          >
            Saya Ingin Berdonasi
            <span className="text-[18px] leading-none">→</span>
          </a>
          <a
            href="/register?role=relawan"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 text-ink-700 hover:text-blue-600 font-bold text-[14.5px] py-3.5 px-8 rounded-xl border border-slate-200 hover:border-blue-200 hover:bg-blue-50/80 backdrop-blur-sm transition-all bg-white/70"
          >
            Daftar sebagai Relawan
          </a>
        </div>

        <div
          data-aos="fade-up"
          data-aos-delay="400"
          className="flex flex-wrap gap-8 justify-center items-center pt-6 border-t border-slate-200/70"
        >
          {[
            { value: "1.240+", label: "Posko terdaftar" },
            { value: "38.500", label: "Pengungsi terbantu" },
            { value: "92%", label: "Distribusi tepat sasaran" },
          ].map((stat) => (
            <div key={stat.label} className="text-center">
              <b className="block text-[24px] font-extrabold text-ink-900 font-heading leading-tight">
                {stat.value}
              </b>
              <span className="text-[12px] text-ink-500 font-medium">{stat.label}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
