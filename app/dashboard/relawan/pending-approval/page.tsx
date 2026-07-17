import { ShieldAlert, Clock, Info } from "lucide-react";

export const metadata = {
  title: "Menunggu Persetujuan - TepatSalur",
};

export default function PendingApprovalPage() {
  return (
    <div className="w-full max-w-3xl mx-auto h-[calc(100vh-8rem)] flex items-center justify-center">
      <div className="bg-white rounded-3xl shadow-sm border border-ink-100 p-10 lg:p-12 text-center relative overflow-hidden">
        {}
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-blue-500 to-indigo-500" />
        
        <div className="w-20 h-20 bg-amber-50 rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm border border-amber-100/50">
          <Clock className="w-10 h-10 text-amber-500" strokeWidth={1.5} />
        </div>
        
        <h1 className="text-3xl font-extrabold text-navy-900 mb-4 tracking-tight">Menunggu Persetujuan</h1>
        
        <p className="text-ink-500 text-lg leading-relaxed max-w-lg mx-auto mb-8">
          Terima kasih telah bergabung dengan <strong>TepatSalur</strong>. Akun relawan Anda saat ini sedang dalam proses peninjauan oleh Super Admin komunitas.
        </p>

        <div className="bg-blue-50/50 border border-blue-100 rounded-2xl p-6 text-left space-y-4 max-w-md mx-auto">
          <div className="flex gap-3">
            <Info className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
            <p className="text-sm text-navy-800 leading-relaxed">
              <strong>Apa selanjutnya?</strong><br/>
              Kami akan memverifikasi data yang telah Anda masukkan. Mohon tunggu beberapa saat hingga akun Anda diaktifkan.
            </p>
          </div>
          <div className="flex gap-3">
            <ShieldAlert className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
            <p className="text-sm text-navy-800 leading-relaxed">
              <strong>Belum bisa mengakses menu?</strong><br/>
              Selama status masih pending, menu dashboard di sebelah kiri akan disembunyikan. Menu akan muncul otomatis setelah akun Anda disetujui.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
