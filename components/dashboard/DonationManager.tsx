"use client";

import { useState } from "react";
import { Package, CheckCircle, Clock, Truck, UploadCloud, FileImage, User } from "lucide-react";
import { cn } from "@/lib/utils";

type LogistikItem = {
  nama: string;
  qty: number;
  satuan: string;
};

type Donation = {
  id: string;
  donaturName: string;
  items: LogistikItem[];
  expectedArrival: string;
  status: "Menunggu" | "Diterima";
  receiptPhoto?: string;
};

const initialDonations: Donation[] = [
  {
    id: "DON-001",
    donaturName: "Budi Santoso",
    items: [
      { nama: "Beras", qty: 50, satuan: "Karung" },
      { nama: "Minyak Goreng", qty: 20, satuan: "Dus" },
    ],
    expectedArrival: "Hari ini, 14:00 WIB",
    status: "Menunggu",
  },
  {
    id: "DON-002",
    donaturName: "PT. Maju Mundur",
    items: [
      { nama: "Popok Bayi", qty: 100, satuan: "Bal" },
      { nama: "Susu Formula", qty: 50, satuan: "Karton" },
    ],
    expectedArrival: "Hari ini, 16:30 WIB",
    status: "Menunggu",
  },
];

export function DonationManager() {
  const [donations, setDonations] = useState<Donation[]>(initialDonations);
  const [selectedDonation, setSelectedDonation] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleConfirmReceipt = (id: string) => {
    setSelectedDonation(id);
  };

  const submitConfirmation = () => {
    if (!selectedDonation) return;
    setIsUploading(true);
    
    
    setTimeout(() => {
      setDonations((prev) =>
        prev.map((d) =>
          d.id === selectedDonation
            ? { ...d, status: "Diterima", receiptPhoto: "uploaded-photo-url.jpg" }
            : d
        )
      );
      setIsUploading(false);
      setSelectedDonation(null);
    }, 1500);
  };

  return (
    <div className="p-6 h-full flex flex-col">
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <Package className="w-5 h-5 text-emerald-600" /> Stok Basecamp Relawan
          </h2>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { nama: "Air Mineral", qty: 150, satuan: "Dus", alert: false },
            { nama: "Beras", qty: 850, satuan: "Kg", alert: false },
            { nama: "Popok Bayi", qty: 15, satuan: "Bal", alert: true },
            { nama: "Obat Diare", qty: 5, satuan: "Box", alert: true },
          ].map((item, idx) => (
            <div key={idx} className={cn("p-4 rounded-2xl border", item.alert ? "bg-rose-50 border-rose-200" : "bg-slate-50 border-slate-200")}>
              <p className="text-xs font-bold text-slate-500 mb-1">{item.nama}</p>
              <div className="flex items-end gap-1">
                <span className={cn("text-2xl font-black tabular-nums leading-none", item.alert ? "text-rose-700" : "text-slate-800")}>{item.qty}</span>
                <span className="text-sm font-semibold text-slate-500 mb-0.5">{item.satuan}</span>
              </div>
              {item.alert && <p className="text-[10px] font-bold text-rose-600 mt-2 uppercase tracking-wider">Menipis!</p>}
            </div>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-between mb-4 border-t border-slate-200 pt-6">
        <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
          <Truck className="w-5 h-5 text-blue-600" /> Barang Masuk (Donasi)
        </h2>
        <div className="flex gap-2">
          <span className="bg-amber-50 text-amber-600 text-xs font-bold px-3 py-1 rounded-full border border-amber-200">
            {donations.filter((d) => d.status === "Menunggu").length} Menunggu
          </span>
          <span className="bg-emerald-50 text-emerald-600 text-xs font-bold px-3 py-1 rounded-full border border-emerald-200">
            {donations.filter((d) => d.status === "Diterima").length} Diterima
          </span>
        </div>
      </div>

      <div className="grid gap-4">
        {donations.map((donation) => (
          <div
            key={donation.id}
            className="border border-slate-200 rounded-2xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all hover:border-blue-200 hover:shadow-md bg-white"
          >
            {}
            <div className="space-y-3 flex-1">
              <div className="flex items-center gap-3">
                <span className="text-xs font-black text-slate-400 uppercase tracking-wider">
                  {donation.id}
                </span>
                <span
                  className={cn(
                    "text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider flex items-center gap-1",
                    donation.status === "Menunggu"
                      ? "bg-amber-100 text-amber-700"
                      : "bg-emerald-100 text-emerald-700"
                  )}
                >
                  {donation.status === "Menunggu" ? (
                    <Clock className="w-3 h-3" />
                  ) : (
                    <CheckCircle className="w-3 h-3" />
                  )}
                  {donation.status}
                </span>
              </div>

              <div className="flex items-center gap-2 text-sm text-slate-600 font-medium">
                <User className="w-4 h-4 text-slate-400" />
                Donatur: <span className="font-bold text-slate-800">{donation.donaturName}</span>
              </div>

              <div className="flex items-center gap-2 text-sm text-slate-600 font-medium">
                <Clock className="w-4 h-4 text-slate-400" />
                Estimasi Tiba: <span className="font-bold text-slate-800">{donation.expectedArrival}</span>
              </div>

              <div className="flex flex-wrap gap-2 mt-2">
                {donation.items.map((item, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1.5 bg-slate-50 border border-slate-200 text-slate-700 px-3 py-1.5 rounded-lg text-sm font-medium"
                  >
                    <Package className="w-3.5 h-3.5 text-blue-500" />
                    {item.nama} <span className="font-bold text-slate-900">{item.qty} {item.satuan}</span>
                  </span>
                ))}
              </div>
            </div>

            {}
            <div className="flex-shrink-0 flex flex-col justify-center min-w-[200px]">
              {donation.status === "Menunggu" ? (
                selectedDonation === donation.id ? (
                  <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl space-y-3 animate-in fade-in zoom-in-95 duration-200">
                    <p className="text-xs font-bold text-slate-700 text-center">Unggah Bukti Terima</p>
                    <label className="flex flex-col items-center justify-center w-full h-20 border-2 border-dashed border-blue-200 bg-blue-50/50 hover:bg-blue-50 rounded-lg cursor-pointer transition-colors group">
                      <div className="flex flex-col items-center justify-center pt-2 pb-3">
                        <UploadCloud className="w-6 h-6 text-blue-400 group-hover:text-blue-500 mb-1 transition-colors" />
                        <p className="text-[10px] text-blue-600 font-medium">Klik untuk pilih foto</p>
                      </div>
                      <input type="file" className="hidden" accept="image/*" />
                    </label>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setSelectedDonation(null)}
                        className="flex-1 px-2 py-2 text-xs font-bold text-slate-600 bg-white border border-slate-200 hover:bg-slate-100 rounded-lg transition-colors"
                        disabled={isUploading}
                      >
                        Batal
                      </button>
                      <button
                        onClick={submitConfirmation}
                        disabled={isUploading}
                        className="flex-1 px-2 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors flex items-center justify-center gap-1"
                      >
                        {isUploading ? (
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                          "Konfirmasi"
                        )}
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => handleConfirmReceipt(donation.id)}
                    className="w-full bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold py-3 px-4 rounded-xl transition-colors border border-blue-200 shadow-sm"
                  >
                    Konfirmasi Diterima
                  </button>
                )
              ) : (
                <div className="flex flex-col items-center justify-center p-4 bg-emerald-50 rounded-xl border border-emerald-100">
                  <FileImage className="w-8 h-8 text-emerald-400 mb-2" />
                  <span className="text-emerald-700 text-xs font-bold text-center">
                    Bukti foto telah diunggah & diverifikasi.
                  </span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
