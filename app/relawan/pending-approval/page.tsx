export const metadata = {
  title: "Menunggu Persetujuan - TepatSalur",
};

export default function PendingApprovalPage() {
  return (
    <main className="min-h-screen bg-paper flex items-center justify-center px-6">
      <div className="w-full max-w-md text-center">
        <div className="bg-white rounded-3xl shadow-sm border border-ink-100 p-10">
          <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg
              className="w-8 h-8 text-yellow-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-navy-800 mb-3">Menunggu Persetujuan</h1>
          <p className="text-ink-500 leading-relaxed">
            Pendaftaran Anda sedang ditinjau oleh Super Admin komunitas. Anda akan mendapatkan
            akses penuh setelah disetujui.
          </p>
        </div>
      </div>
    </main>
  );
}
