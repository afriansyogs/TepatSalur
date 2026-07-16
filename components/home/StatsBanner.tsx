"use client";

export function StatsBanner() {
  const stats = [
    { value: "1.240+", label: "Posko terdaftar",           icon: (
      <svg viewBox="0 0 28 28" className="w-7 h-7" fill="none">
        <circle cx="14" cy="11" r="6" fill="#dbeafe" stroke="#3b82f6" strokeWidth="1.5"/>
        <path d="M14 17c-5 0-9 2.2-9 5h18c0-2.8-4-5-9-5z" fill="#bfdbfe"/>
        <circle cx="14" cy="11" r="2.5" fill="#2563eb"/>
      </svg>
    )},
    { value: "38.500", label: "Pengungsi terbantu",        icon: (
      <svg viewBox="0 0 28 28" className="w-7 h-7" fill="none">
        <path d="M14 4a4 4 0 100 8 4 4 0 000-8z" fill="#dbeafe" stroke="#3b82f6" strokeWidth="1.5"/>
        <path d="M4 24c0-5.5 4.5-9 10-9s10 3.5 10 9" stroke="#60a5fa" strokeWidth="1.5" strokeLinecap="round"/>
        <path d="M9 17l2 4 3-6 3 6 2-4" stroke="#2563eb" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    )},
    { value: "412",    label: "Posko terpenuhi (locked)",  icon: (
      <svg viewBox="0 0 28 28" className="w-7 h-7" fill="none">
        <rect x="6" y="13" width="16" height="11" rx="3" fill="#d1fae5" stroke="#10b981" strokeWidth="1.5"/>
        <path d="M9.5 13V9.5a4.5 4.5 0 019 0V13" stroke="#10b981" strokeWidth="1.5" strokeLinecap="round"/>
        <circle cx="14" cy="19" r="2" fill="#10b981"/>
      </svg>
    )},
    { value: "92%",    label: "Akurasi skor urgensi AI",   icon: (
      <svg viewBox="0 0 28 28" className="w-7 h-7" fill="none">
        <circle cx="14" cy="14" r="9" fill="#dbeafe" stroke="#3b82f6" strokeWidth="1.5"/>
        <path d="M9 14l3.5 3.5L19 10" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    )},
  ];

  return (
    <section className="relative py-16 bg-slate-50">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent" />
      <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent" />

      <div className="max-w-[1200px] mx-auto px-6 lg:px-10">
        <div data-aos="fade-up" className="grid grid-cols-2 md:grid-cols-4 gap-px bg-slate-200 rounded-[24px] overflow-hidden border border-slate-200">
          {stats.map((stat) => (
            <div
              key={stat.label}
              className="bg-white flex flex-col items-center justify-center py-10 px-6 text-center hover:bg-blue-50/60 transition-colors group"
            >
              <div className="mb-3 opacity-80 group-hover:opacity-100 transition-opacity">
                {stat.icon}
              </div>
              <b className="block font-heading text-[34px] font-extrabold text-ink-900 leading-tight mb-1">
                {stat.value}
              </b>
              <span className="text-ink-500 text-[12.5px] font-medium leading-tight">
                {stat.label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
