"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import Image from "next/image";

const testimonials = [
  {
    quote: "TepatSalur bikin koordinasi logistik jauh lebih mudah. Kami langsung tahu posko mana yang paling butuh bantuan — tanpa harus nelpon satu per satu.",
    name: "Budi Santoso",
    role: "Koordinator Relawan",
    org: "PMI Cianjur",
    avatar: "BS",
    color: "from-blue-600 to-blue-800",
  },
  {
    quote: "Akhirnya saya yakin bahwa barang yang saya kirim benar-benar sampai ke tempat yang tepat — bukan numpuk di gudang yang salah. Transparansinya luar biasa.",
    name: "Rina Wulandari",
    role: "Donatur Tetap",
    org: "Individu",
    avatar: "RW",
    color: "from-rose-500 to-rose-700",
  },
  {
    quote: "Fitur lock otomatis benar-benar game-changer. Sistem tahu sendiri kapan posko sudah cukup dan langsung redirect bantuan ke yang lebih butuh.",
    name: "Ahmad Fauzi",
    role: "Kepala Posko Relawan",
    org: "Bansos Garut",
    avatar: "AF",
    color: "from-amber-500 to-orange-600",
  },
  {
    quote: "Dulu kami kesulitan memantau kondisi pengungsi secara real-time. Dengan heatmap TepatSalur, semua terlihat jelas — dari mana dan ke mana bantuan harus bergerak.",
    name: "Dewi Lestari",
    role: "Admin Posko, Sukabumi",
    org: "BNPB Jabar",
    avatar: "DL",
    color: "from-emerald-600 to-teal-700",
  },
  {
    quote: "Saya relawan lapangan. Sebelumnya sering buang-buang waktu di posko yang ternyata sudah kelebihan stok. Sekarang cukup buka app, langsung tahu tujuan yang tepat.",
    name: "Rizky Maulana",
    role: "Relawan Lapangan",
    org: "Relawan Nusantara",
    avatar: "RM",
    color: "from-purple-600 to-indigo-700",
  },
  {
    quote: "Platform ini mengubah cara kami mengelola donasi korporat. Laporan distribusinya transparan dan bisa kami tunjukkan langsung ke stakeholder perusahaan.",
    name: "Sari Indrawati",
    role: "CSR Manager",
    org: "Perusahaan Swasta",
    avatar: "SI",
    color: "from-teal-500 to-cyan-700",
  },
];

const sponsors = [
  { id: "baznas", src: "/sponsor/baznas.png" },
  { id: "garudahack", src: "/sponsor/garudahack.jpeg" },
  { id: "pmi", src: "/sponsor/pmi.jpeg" },
  { id: "sar", src: "/sponsor/sar.jpeg" },
  { id: "sar", src: "/sponsor/sar.jpeg" },
  { id: "sar", src: "/sponsor/sar.jpeg" },
];

const sponsorLoop = [...sponsors, ...sponsors];

export function Testimonials() {
  const [current, setCurrent] = useState(0);
  const [sliding, setSliding] = useState<"left" | "right" | null>(null);
  const autoRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const total = testimonials.length;

  const goTo = useCallback((next: number, dir: "left" | "right") => {
    setSliding(dir);
    setTimeout(() => {
      setCurrent((next + total) % total);
      setSliding(null);
    }, 350);
  }, [total]);

  const prev = useCallback(() => goTo(current - 1, "right"), [current, goTo]);
  const next = useCallback(() => goTo(current + 1, "left"), [current, goTo]);

  useEffect(() => {
    autoRef.current = setInterval(() => goTo(current + 1, "left"), 5500);
    return () => { if (autoRef.current) clearInterval(autoRef.current); };
  }, [current, goTo]);

  const indices = [
    (current + total - 1) % total,
    current,
    (current + 1) % total,
  ];

  return (
    <>
      <section className="py-24 bg-slate-50 relative overflow-hidden">
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent" />
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[700px] h-[350px] bg-blue-100/30 rounded-full blur-[100px] pointer-events-none" />

        <div className="max-w-[1200px] mx-auto px-6 lg:px-10 relative z-10">

          <div data-aos="fade-up" className="text-center max-w-[560px] mx-auto mb-14">
            <h2 className="text-[34px] font-extrabold tracking-[-0.02em] text-ink-900 font-heading mb-4">
              Dipercaya oleh para{" "}
              <span className="text-blue-600">penggerak kemanusiaan</span>
            </h2>
            <p className="text-ink-500 text-[15px] leading-[1.65]">
              Relawan, donatur, dan koordinator posko yang sudah merasakan perbedaannya — dalam kata-kata mereka sendiri.
            </p>
          </div>

          <div data-aos="fade-up" data-aos-delay="100" className="relative">
            <div
              className="grid md:grid-cols-3 gap-5"
              style={{
                transition: "opacity 0.35s ease, transform 0.35s ease",
                opacity: sliding ? 0.3 : 1,
                transform: sliding === "left"
                  ? "translateX(-12px)"
                  : sliding === "right"
                  ? "translateX(12px)"
                  : "translateX(0)",
              }}
            >
              {indices.map((idx, pos) => {
                const t = testimonials[idx];
                const isCenter = pos === 1;
                return (
                  <div
                    key={`${idx}-${pos}`}
                    className={`relative flex flex-col rounded-[28px] overflow-hidden transition-all duration-350 ${
                      isCenter
                        ? "shadow-[0_20px_60px_-12px_rgba(37,99,235,0.2)] scale-[1.03]"
                        : "opacity-60 scale-[0.97]"
                    }`}
                  >
                    <div className={`bg-gradient-to-br ${t.color} p-6 relative overflow-hidden`}>
                      <div className="absolute -top-6 -right-6 w-24 h-24 bg-white/10 rounded-full" />
                      <div className="absolute -bottom-4 -left-4 w-16 h-16 bg-white/10 rounded-full" />

                      <div className="relative z-10 flex items-center gap-3">
                        <div className="w-11 h-11 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-white font-bold text-[14px] border border-white/30">
                          {t.avatar}
                        </div>
                        <div>
                          <div className="text-white font-bold text-[14px]">{t.name}</div>
                          <div className="text-white/70 text-[12px]">{t.role}</div>
                        </div>
                        <span className="ml-auto text-[10.5px] font-semibold text-white/80 bg-white/15 border border-white/20 px-2.5 py-1 rounded-full">
                          {t.org}
                        </span>
                      </div>
                    </div>

                    <div className="bg-white flex-1 p-6 border border-t-0 border-slate-100 rounded-b-[28px]">
                      <div className="flex gap-0.5 mb-4">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <svg key={i} viewBox="0 0 16 16" className="w-3.5 h-3.5 fill-amber-400">
                            <path d="M8 1l1.8 3.6L14 5.4l-3 2.9.7 4.1L8 10.4l-3.7 1.9.7-4.1-3-2.9 4.2-.8L8 1z" />
                          </svg>
                        ))}
                      </div>
                      <p className="text-ink-700 text-[14px] leading-[1.8] italic">
                        &ldquo;{t.quote}&rdquo;
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex items-center justify-center gap-4 mt-10">
              <button
                onClick={prev}
                aria-label="Testimoni sebelumnya"
                className="w-11 h-11 rounded-full border border-slate-200 bg-white flex items-center justify-center text-slate-600 hover:border-blue-300 hover:text-blue-600 hover:bg-blue-50 transition-all shadow-sm hover:shadow-md hover:-translate-x-0.5"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>

              <div className="flex gap-2 items-center">
                {testimonials.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => goTo(i, i > current ? "left" : "right")}
                    aria-label={`Testimoni ${i + 1}`}
                    className={`rounded-full transition-all duration-300 ${
                      i === current
                        ? "w-7 h-2.5 bg-blue-600"
                        : "w-2.5 h-2.5 bg-slate-300 hover:bg-blue-300"
                    }`}
                  />
                ))}
              </div>

              <button
                onClick={next}
                aria-label="Testimoni berikutnya"
                className="w-11 h-11 rounded-full border border-slate-200 bg-white flex items-center justify-center text-slate-600 hover:border-blue-300 hover:text-blue-600 hover:bg-blue-50 transition-all shadow-sm hover:shadow-md hover:translate-x-0.5"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </section>

      <section className="py-14 bg-white border-t border-slate-100 overflow-hidden">
        <div className="max-w-[1100px] mx-auto px-6 lg:px-10 mb-10">
          <p className="text-center text-ink-400 text-[13px] font-semibold tracking-widest uppercase">
            Didukung &amp; bermitra dengan
          </p>
        </div>
        <div className="relative">
          <div className="absolute left-0 top-0 bottom-0 w-24 bg-gradient-to-r from-white to-transparent z-10 pointer-events-none" />
          <div className="absolute right-0 top-0 bottom-0 w-24 bg-gradient-to-l from-white to-transparent z-10 pointer-events-none" />
          <div className="flex gap-6 animate-marquee w-max">
            {sponsorLoop.map((s, i) => (
              <div
                key={`${s.id}-${i}`}
                className="flex items-center justify-center border border-slate-100 bg-slate-50/30 hover:bg-slate-50/70 rounded-2xl px-6 py-4 shrink-0 transition-all cursor-default w-32 h-20"
              >
                <Image
                  src={s.src}
                  alt={s.id}
                  width={96}
                  height={48}
                  style={{ width: "auto", height: "auto" }}
                  className="object-contain max-h-12 w-auto h-auto grayscale opacity-60 hover:grayscale-0 hover:opacity-100 transition-all duration-300"
                />
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
