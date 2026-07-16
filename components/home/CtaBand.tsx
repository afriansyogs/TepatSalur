export function CtaBand() {
  return (
    <section className="py-24 bg-[#0c0c14] relative">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

      <div className="max-w-[1200px] mx-auto px-6 lg:px-10">
        <div className="relative rounded-[32px] overflow-hidden border border-purple-500/20 p-12 md:p-16 text-center">
          <div className="absolute inset-0 bg-gradient-to-br from-[#1a1030] via-[#13101f] to-[#0f0f1e]" />
          
          <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 rounded-full bg-purple-600/20 blur-[80px] pointer-events-none" />
          <div className="absolute bottom-0 left-1/4 w-56 h-56 rounded-full bg-purple-700/15 blur-[60px] pointer-events-none" />
          <div className="absolute bottom-0 right-1/4 w-56 h-56 rounded-full bg-purple-700/15 blur-[60px] pointer-events-none" />

          <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,rgba(255,255,255,0.05)_1px,transparent_0)] [background-size:28px_28px] pointer-events-none" />

          <div className="relative z-10">
            <div className="inline-flex items-center gap-2 bg-purple-500/15 border border-purple-500/25 text-purple-300 text-[11.5px] font-bold tracking-[0.1em] uppercase py-1.5 px-4 rounded-full mb-7">
              Bergabung Sekarang
            </div>
            
            <h2 className="text-white text-[38px] md:text-[44px] font-extrabold mb-5 font-heading tracking-[-0.02em] leading-[1.1] max-w-[700px] mx-auto">
              Setiap posko yang belum{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-purple-300">
                locked
              </span>
              , masih menunggu bantuan Anda.
            </h2>
            
            <p className="text-gray-400 text-[15.5px] mb-10 max-w-[600px] mx-auto leading-[1.7]">
              Bergabung sebagai donatur atau relawan hari ini — sistem AI kami akan mengarahkan bantuan Anda ke tempat yang paling membutuhkan.
            </p>

            <div className="flex flex-wrap gap-4 justify-center">
              <a
                href="/register"
                className="inline-flex items-center gap-2 bg-purple-600 hover:bg-purple-500 text-white font-bold text-[15px] py-4 px-8 rounded-xl transition-all shadow-[0_8px_28px_rgba(124,58,237,0.5)] hover:shadow-[0_8px_36px_rgba(139,92,246,0.6)] hover:-translate-y-0.5"
              >
                Mulai Berdonasi
              </a>
              <a
                href="/register"
                className="inline-flex items-center gap-2 text-gray-300 hover:text-white font-bold text-[15px] py-4 px-8 rounded-xl border border-white/15 hover:border-white/30 hover:bg-white/5 transition-all"
              >
                Jadi Relawan
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
