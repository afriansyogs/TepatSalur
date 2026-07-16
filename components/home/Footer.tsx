import Link from "next/link";

export function Footer() {
  return (
    <footer className="bg-navy-900 border-t border-white/8 pt-16 pb-8">
      <div className="max-w-[1200px] mx-auto px-6 lg:px-10">
        <div className="grid grid-cols-1 md:grid-cols-[1.6fr_1fr_1fr_1fr] gap-12 mb-14">
          <div>
            <div className="text-white font-extrabold text-[20px] font-heading mb-4">TepatSalur</div>
            <p className="text-slate-500 text-[13.5px] leading-[1.75] max-w-[260px] mb-6">
              Platform distribusi bantuan bencana berbasis AI, dibangun untuk memastikan setiap logistik sampai ke tangan yang tepat.
            </p>
            <div className="flex gap-2.5">
              {["in", "ig", "x"].map((s) => (
                <div
                  key={s}
                  className="w-9 h-9 rounded-xl bg-white/5 border border-white/8 flex items-center justify-center text-[12px] text-slate-400 hover:bg-blue-500/15 hover:border-blue-500/30 hover:text-blue-300 transition-all cursor-pointer font-bold"
                >
                  {s}
                </div>
              ))}
            </div>
          </div>

          <div>
            <h4 className="text-white text-[13px] font-bold mb-5 tracking-wide uppercase">Navigasi</h4>
            <div className="flex flex-col gap-3">
              {["Beranda", "Cara Kerja", "Peta Posko", "Tentang"].map((item) => (
                <Link key={item} href="#" className="text-[13.5px] text-slate-500 hover:text-slate-200 transition-colors">
                  {item}
                </Link>
              ))}
            </div>
          </div>

          <div>
            <h4 className="text-white text-[13px] font-bold mb-5 tracking-wide uppercase">Untuk Anda</h4>
            <div className="flex flex-col gap-3">
              {["Login Donatur", "Login Relawan", "Daftarkan Posko", "Register"].map((item) => (
                <Link key={item} href="#" className="text-[13.5px] text-slate-500 hover:text-slate-200 transition-colors">
                  {item}
                </Link>
              ))}
            </div>
          </div>

\          <div>
            <h4 className="text-white text-[13px] font-bold mb-5 tracking-wide uppercase">Bantuan</h4>
            <div className="flex flex-col gap-3">
              {["FAQ", "Hubungi Kami", "Laporkan Masalah"].map((item) => (
                <Link key={item} href="#" className="text-[13.5px] text-slate-500 hover:text-slate-200 transition-colors">
                  {item}
                </Link>
              ))}
            </div>
          </div>
        </div>

        <div className="border-t border-white/8 pt-7 flex flex-col sm:flex-row justify-between items-center gap-4">
          <span className="text-slate-600 text-[12.5px]">
            © 2026 TepatSalur — Dibangun untuk Garuda Hack 7.0
          </span>
          <div className="flex items-center gap-1.5 text-slate-600 text-[12.5px]">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
            Semua sistem berjalan normal
          </div>
          <span className="text-slate-600 text-[12.5px]">Tema: Safety</span>
        </div>
      </div>
    </footer>
  );
}
