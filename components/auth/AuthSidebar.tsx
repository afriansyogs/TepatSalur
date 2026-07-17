import Image from "next/image";

export function AuthSidebar() {
  return (
    <div className="relative h-full w-full overflow-hidden">
      {}
      <Image
        src="https://images.unsplash.com/photo-1593113598332-cd288d649433?q=80&w=2070&auto=format&fit=crop"
        alt="Relawan bahu-membahu di lokasi bencana — semangat gotong royong"
        fill
        className="object-cover"
        sizes="(max-width: 1024px) 0, 55vw"
        priority
      />

      {}
      <div className="absolute inset-0 bg-gradient-to-r from-navy-900/60 via-navy-900/30 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-t from-navy-900/80 via-navy-900/10 to-transparent" />

      {}
      <div className="absolute bottom-0 left-0 right-0 p-10">
        <p className="text-sm font-bold tracking-[0.2em] text-white/70">
          #BERSATU MELAWAN BENCANA
        </p>
        <p className="mt-2 text-2xl font-bold text-white font-heading leading-tight max-w-xs">
          Setiap tangan <br />yang terulur <br />adalah harapan.
        </p>
        <div className="mt-4 h-px w-12 bg-white/30" />
      </div>
    </div>
  );
}
