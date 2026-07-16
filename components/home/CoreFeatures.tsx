"use client";

import { useEffect, useRef, useState } from "react";

function ParticlesBg() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = canvas.offsetWidth);
    let height = (canvas.height = canvas.offsetHeight);

    const particles: Array<{
      x: number;
      y: number;
      vx: number;
      vy: number;
      radius: number;
      alpha: number;
    }> = [];

  
    const particleCount = Math.min(80, Math.floor((width * height) / 11000));

    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.45,
        vy: (Math.random() - 0.5) * 0.45,
        radius: Math.random() * 2 + 1,
        alpha: Math.random() * 0.4 + 0.2,
      });
    }

    let mouse = { x: -1000, y: -1000 };

    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouse.x = e.clientX - rect.left;
      mouse.y = e.clientY - rect.top;
    };

    const handleMouseLeave = () => {
      mouse.x = -1000;
      mouse.y = -1000;
    };

    window.addEventListener("mousemove", handleMouseMove);
    canvas.addEventListener("mouseleave", handleMouseLeave);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = canvas.offsetWidth;
      height = canvas.height = canvas.offsetHeight;
    };
    window.addEventListener("resize", handleResize);

    const animate = () => {
      ctx.clearRect(0, 0, width, height);

     
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < 120) {
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
         
            ctx.strokeStyle = `rgba(191, 219, 254, ${0.12 * (1 - dist / 120)})`;
            ctx.lineWidth = 0.8;
            ctx.stroke();
          }
        }

        const dx = particles[i].x - mouse.x;
        const dy = particles[i].y - mouse.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 140) {
          ctx.beginPath();
          ctx.moveTo(particles[i].x, particles[i].y);
          ctx.lineTo(mouse.x, mouse.y);
          ctx.strokeStyle = `rgba(59, 130, 246, ${0.28 * (1 - dist / 140)})`;
          ctx.lineWidth = 0.9;
          ctx.stroke();
        }
      }

      particles.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;

        if (p.x < 0 || p.x > width) p.vx *= -1;
        if (p.y < 0 || p.y > height) p.vy *= -1;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(191, 219, 254, ${p.alpha})`;
        ctx.fill();
      });

      animationFrameId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener("mousemove", handleMouseMove);
      if (canvas) canvas.removeEventListener("mouseleave", handleMouseLeave);
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  return <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none z-0" />;
}

export function CoreFeatures() {
  const [hovered, setHovered] = useState<number | null>(null);

  const features = [
    {
      num: "01",
      title: "Smart Urgency AI",
      desc: "Algoritma cerdas membaca data demografi pengungsi, kelompok rentan seperti balita dan lansia, serta ketersediaan stok secara berkala. Menghasilkan skor tingkat kedaruratan posko secara instan untuk efisiensi aksi relawan.",
      glowColor: "from-blue-600/15 via-blue-900/5 to-transparent",
      accent: "text-blue-400",
      extra: (
        <div className="mt-8 space-y-3 max-w-[340px] bg-slate-900/40 p-4 rounded-xl border border-white/5 backdrop-blur-sm">
          {[
            { label: "Prioritas Utama", pct: "28%", color: "bg-blue-500", glow: "shadow-[0_0_8px_rgba(59,130,246,0.4)]" },
            { label: "Posko Siaga", pct: "47%", color: "bg-blue-400/50", glow: "" },
            { label: "Cukup Bantuan", pct: "25%", color: "bg-slate-700", glow: "" },
          ].map((bar) => (
            <div key={bar.label} className="flex items-center gap-3">
              <span className="text-slate-400 text-[11px] w-24 font-medium">{bar.label}</span>
              <div className="flex-1 h-1.5 rounded-full bg-white/10 overflow-hidden">
                <div className={`h-full rounded-full ${bar.color} ${bar.glow}`} style={{ width: bar.pct }} />
              </div>
              <span className="text-slate-500 text-[11px] w-8 text-right">{bar.pct}</span>
            </div>
          ))}
        </div>
      ),
    },
    {
      num: "02",
      title: "Sistem Pengunci Otomatis",
      desc: "Bila kebutuhan dasar di suatu lokasi tercapai, sistem secara mandiri mengalihkan distribusi bantuan baru ke posko terdekat yang masih berkekurangan, mencegah ketimpangan logistik di lapangan.",
      glowColor: "from-indigo-600/15 via-indigo-900/5 to-transparent",
      accent: "text-blue-300",
    },
    {
      num: "03",
      title: "Heatmap Distribusi Live",
      desc: "Menyediakan visibilitas peta secara langsung bagi publik dan koordinator lapangan. Pantau seluruh alur pergerakan logistik bantuan yang transparan dari satu dasbor terpadu.",
      glowColor: "from-blue-700/15 via-slate-900/5 to-transparent",
      accent: "text-blue-400",
    },
  ];

  return (
    <section id="features" className="py-32 relative overflow-hidden bg-slate-950">
      <ParticlesBg />

      <div className="absolute top-1/4 left-1/4 w-[600px] h-[600px] bg-blue-900/10 rounded-full blur-[140px] pointer-events-none z-0" />
      <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-indigo-900/10 rounded-full blur-[120px] pointer-events-none z-0" />

      <div className="max-w-[1200px] mx-auto px-6 lg:px-10 relative z-10">
        <div className="grid lg:grid-cols-[1fr_1.2fr] gap-20 items-start">

          <div data-aos="fade-right" className="lg:sticky lg:top-32">
            <h2 className="text-[38px] sm:text-[48px] font-extrabold tracking-tight text-white font-heading leading-[1.15] mb-8">
              Bergerak Lebih Cepat,<br />
              Dipandu Oleh{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-blue-300 to-indigo-400">
                Kecerdasan Data.
              </span>
            </h2>

            <p className="text-slate-400 text-[15.5px] leading-[1.8] max-w-[460px] mb-10">
              Kami memadukan teknologi analisis dengan tindakan nyata. AI mengolah data kerentanan posko, menguji prioritas pasokan, dan mengalihkan surplus secara real-time.
            </p>

            <div className="flex items-center gap-5 p-5 rounded-2xl bg-white/[0.02] border border-white/5 backdrop-blur-md max-w-[420px]">
              <div className="relative flex items-center justify-center shrink-0">
                <span className="absolute w-10 h-10 bg-blue-500/15 rounded-full animate-ping" />
                <div className="w-8 h-8 bg-blue-500/10 border border-blue-400/20 rounded-full flex items-center justify-center font-bold text-blue-400 text-xs">
                  AI
                </div>
              </div>
              <p className="text-[12.5px] leading-relaxed text-slate-400">
                <span className="text-white font-bold block mb-0.5">Automated Allocation Matrix</span>
                Sistem menghitung kebutuhan posko tiap 60 detik demi penyaluran yang merata.
              </p>
            </div>
          </div>

          <div className="relative space-y-16 pl-6 lg:pl-12">
            <div className="absolute left-[3px] lg:left-[7px] top-6 bottom-6 w-[2px] bg-gradient-to-b from-blue-500/30 via-indigo-500/10 to-transparent" />

            {features.map((feat, i) => {
              const isHovered = hovered === i;

              return (
                <div
                  key={feat.title}
                  data-aos="fade-up"
                  data-aos-delay={i * 120}
                  className="relative pl-10 group cursor-pointer"
                  onMouseEnter={() => setHovered(i)}
                  onMouseLeave={() => setHovered(null)}
                >
                  <span
                    className={`absolute left-[-4px] lg:left-[0px] top-2.5 w-[16px] h-[16px] rounded-full border-2 transition-all duration-300 z-20 ${
                      isHovered
                        ? "bg-white border-blue-400 scale-125 shadow-[0_0_12px_rgba(96,165,250,0.8)]"
                        : "bg-slate-950 border-slate-700"
                    }`}
                  />

                  <div
                    className={`absolute inset-0 -my-6 -mx-8 rounded-[28px] bg-gradient-to-br ${feat.glowColor} opacity-0 group-hover:opacity-100 border border-white/0 group-hover:border-white/5 transition-all duration-500 z-0 pointer-events-none`}
                  />

                  <div className="relative z-10">
                    <div className="flex items-baseline gap-4 mb-4">
                      <span className="text-[14px] font-extrabold text-blue-500/60 font-heading tracking-widest uppercase">
                        {feat.num}
                      </span>
                      <h3 className="text-[22px] font-extrabold text-white group-hover:text-blue-300 transition-colors leading-none">
                        {feat.title}
                      </h3>
                    </div>
                    <p className="text-slate-400 text-[14.5px] leading-[1.8] max-w-[540px] pl-8 border-l border-white/5 group-hover:border-blue-500/20 transition-all duration-300">
                      {feat.desc}
                    </p>

                    {feat.extra && (
                      <div className="pl-8">
                        {feat.extra}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

        </div>
      </div>
    </section>
  );
}
