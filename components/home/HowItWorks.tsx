"use client";

import { useState } from "react";

const steps = [
  {
    icon: (
      <svg viewBox="0 0 40 40" className="w-5 h-5" fill="none">
        <rect x="6" y="12" width="28" height="20" rx="3" fill="#dbeafe" />
        <rect x="6" y="12" width="28" height="7" rx="3" fill="#93c5fd" />
        <path d="M14 12v5M26 12v5" stroke="#2563eb" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M12 24h16M12 29h10" stroke="#60a5fa" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
    label: "Donatur mendaftar",
    desc: "Kamu mendaftar sebagai donatur, memilih jenis bantuan yang ingin kamu salurkan — makanan, obat, atau kebutuhan dasar lainnya.",
    color: "bg-blue-50 border-blue-200",
    accent: "#3b82f6",
    left: "20%",
    top: "28%",
  },
  {
    icon: (
      <svg viewBox="0 0 40 40" className="w-5 h-5" fill="none">
        <circle cx="20" cy="16" r="8" fill="#fef3c7" stroke="#f59e0b" strokeWidth="1.5" />
        <circle cx="20" cy="16" r="3" fill="#f59e0b" />
        <path d="M20 24v10M14 34h12" stroke="#f59e0b" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
    label: "AI analisis urgensi",
    desc: "AI kami membaca data demografi — lansia, balita, riwayat penyakit — lalu menetapkan skor urgensi tiap posko secara otomatis.",
    color: "bg-amber-50 border-amber-200",
    accent: "#f59e0b",
    left: "48%",
    top: "52%",
  },
  {
    icon: (
      <svg viewBox="0 0 40 40" className="w-5 h-5" fill="none">
        <rect x="6" y="18" width="28" height="16" rx="3" fill="#d1fae5" />
        <path d="M10 18v-4a10 10 0 0120 0v4" stroke="#10b981" strokeWidth="1.5" strokeLinecap="round" />
        <circle cx="20" cy="26" r="3" fill="#10b981" />
        <path d="M20 26v4" stroke="#10b981" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
    label: "Sistem lock otomatis",
    desc: "Posko yang sudah mencukupi kebutuhannya dikunci otomatis — bantuan berikutnya langsung diarahkan ke posko defisit.",
    color: "bg-green-50 border-green-200",
    accent: "#10b981",
    left: "80%",
    top: "28%",
  },
  {
    icon: (
      <svg viewBox="0 0 40 40" className="w-5 h-5" fill="none">
        <rect x="4" y="4" width="32" height="32" rx="4" fill="#dbeafe" />
        <path d="M4 14h32M14 4v32M22 4v32" stroke="#93c5fd" strokeWidth="1" />
        <circle cx="10" cy="10" r="3" fill="#ef4444" />
        <circle cx="26" cy="20" r="3.5" fill="#f59e0b" />
        <circle cx="18" cy="30" r="3" fill="#10b981" />
      </svg>
    ),
    label: "Relawan menyalurkan",
    desc: "Relawan melihat peta urgensi real-time, mengambil logistik dari Posko Hub, dan menyalurkannya langsung ke lapangan.",
    color: "bg-blue-50 border-blue-200",
    accent: "#6366f1",
    left: "25%",
    top: "78%",
  },
  {
    icon: (
      <svg viewBox="0 0 40 40" className="w-5 h-5" fill="none">
        <path d="M8 20l8 8 16-16" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
    label: "Bantuan tepat sasaran",
    desc: "Pengungsi mendapatkan bantuan yang sesuai kebutuhan mereka, dan kamu bisa melacak distribusinya secara transparan.",
    color: "bg-green-50 border-green-200",
    accent: "#14b8a6",
    left: "75%",
    top: "78%",
  },
];

export function HowItWorks() {
  const [active, setActive] = useState<number | null>(null);

  return (
    <section id="how" className="relative overflow-hidden h-screen flex items-stretch">

      <div className="absolute inset-y-0 left-0 w-full lg:w-1/2 z-0">
        <video
          src="/howitworks.mp4"
          autoPlay muted loop playsInline
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-navy-900/70 via-navy-900/50 to-navy-900/80" />
        <div className="hidden lg:block absolute inset-y-0 right-0 w-20 bg-gradient-to-r from-transparent to-white/10 pointer-events-none" />
      </div>

      <div className="relative z-10 w-full grid lg:grid-cols-2 h-full">

        <div
          data-aos="fade-right"
          className="flex flex-col justify-end pb-14 pl-8 lg:pl-16 pr-8 lg:pr-6"
        >
          <h2 className="text-[26px] sm:text-[42px] font-extrabold font-heading text-white leading-[1.2] mb-4">
            Bagaimana TepatSalur Membantu<br />
            Banyak Nyawa{" "}
            <span className="text-blue-300">Bertahan Hidup</span>
          </h2>
          <p className="text-slate-300 text-[13.5px] leading-[1.75] max-w-[380px]">
            Dari donaturmu hingga tangan pengungsi — setiap langkah dipandu teknologi agar tidak ada bantuan yang terbuang sia-sia.
          </p>
        </div>

        <div
          data-aos="fade-left"
          data-aos-delay="150"
          className="flex flex-col justify-center pl-6 lg:pl-6 pr-8 lg:pr-16 py-16"
        >

  
            <div className="relative w-full h-[320px] bg-slate-50/50 border border-slate-100 rounded-[20px] mb-2 overflow-visible">
              <div className="absolute inset-0 bg-[radial-gradient(#e2e8f0_1.5px,transparent_1.5px)] [background-size:20px_20px] opacity-70 rounded-[20px]" />

              <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 100 100" preserveAspectRatio="none">
                <path
                  d="M 20 28 L 48 52 L 80 28 L 25 78 L 75 78"
                  fill="none"
                  stroke="#cbd5e1"
                  strokeWidth="1.5"
                  strokeDasharray="3 3"
                />
                {active !== null && (
                  <path
                    d={
                      active === 0 ? "M 20 28" :
                      active === 1 ? "M 20 28 L 48 52" :
                      active === 2 ? "M 20 28 L 48 52 L 80 28" :
                      active === 3 ? "M 20 28 L 48 52 L 80 28 L 25 78" :
                      "M 20 28 L 48 52 L 80 28 L 25 78 L 75 78"
                    }
                    fill="none"
                    stroke="#ef4444"
                    strokeWidth="2.5"
                    strokeDasharray="none"
                    className="transition-all duration-500"
                  />
                )}
              </svg>

              {steps.map((s, i) => {
                const isActive = active === i;
                return (
                  <div
                    key={i}
                    className="absolute -translate-x-1/2 -translate-y-1/2 z-10"
                    style={{ left: s.left, top: s.top }}
                  >
                    {isActive && (
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-4 w-[260px] bg-white border border-slate-200/80 rounded-2xl p-4 shadow-[0_12px_30px_-6px_rgba(15,23,42,0.15)] z-50 animate-in fade-in slide-in-from-bottom-2 duration-200">
                        <div className="flex items-start gap-3">
                          <div className={`p-2 rounded-xl border ${s.color} shrink-0`}>
                            {s.icon}
                          </div>
                          <div>
                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">
                              Langkah {i + 1} dari {steps.length}
                            </span>
                            <h4 className="text-[13px] font-extrabold text-slate-800 leading-snug mb-1">
                              {s.label}
                            </h4>
                            <p className="text-[11px] text-slate-500 leading-relaxed font-normal">
                              {s.desc}
                            </p>
                          </div>
                        </div>
                        <div className="absolute top-full left-1/2 -translate-x-1/2 w-3.5 h-3.5 bg-white border-r border-b border-slate-200/80 rotate-45 -mt-[7px] z-10" />
                      </div>
                    )}

                    <button
                      onClick={() => setActive(isActive ? null : i)}
                      className="relative flex flex-col items-center group focus:outline-none"
                    >
                      <span
                        className="absolute rounded-full animate-ping opacity-75"
                        style={{
                          width: "36px",
                          height: "36px",
                          backgroundColor: "#ef4444",
                          animationDuration: isActive ? "1.2s" : "2.5s",
                        }}
                      />

                      <span
                        className="relative w-9 h-9 rounded-full flex items-center justify-center font-bold text-[14px] border-2 transition-all duration-300 shadow-md"
                        style={
                          isActive
                            ? { backgroundColor: "#ef4444", borderColor: "#ef4444", color: "#fff", transform: "scale(1.15)" }
                            : { backgroundColor: "#fff", borderColor: "#cbd5e1", color: "#475569" }
                        }
                      >
                        {i + 1}
                      </span>

                      {!isActive && (
                        <span className="absolute top-full mt-2 whitespace-nowrap text-[10px] font-bold px-2 py-1 rounded-md shadow-sm border bg-white text-slate-600 border-slate-200 opacity-70 group-hover:opacity-100 group-hover:scale-105 transition-all duration-200 pointer-events-none">
                          {s.label}
                        </span>
                      )}
                    </button>
                  </div>
                );
              })}
            </div>

            {active === null && (
              <p className="text-center text-slate-400 text-[12px] py-1">
                Pilih langkah di atas untuk melihat detailnya
              </p>
            )}

        </div>

      </div>
    </section>
  );
}
