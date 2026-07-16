"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Mic, MicOff, Loader2, Sparkles, AlertCircle, Plus, X, ChevronDown, Package, Users, Square, Clock, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { aiService } from "@/services/ai.service";

type KebutuhanKategori = "makanan" | "minuman" | "medis" | "sanitasi" | "perlengkapan" | "lainnya";

type KebutuhanItem = {
  id: string;
  kategori: KebutuhanKategori;
  nama: string;
  qty: number;
  satuan: string;
};

const kategoriConfig: Record<KebutuhanKategori, { label: string; color: string; bgColor: string; items: { nama: string; satuan: string }[] }> = {
  makanan: {
    label: "Makanan", color: "text-amber-700", bgColor: "bg-amber-50 border-amber-200",
    items: [
      { nama: "Beras", satuan: "Kg" }, { nama: "Mie Instan", satuan: "Dus" }, { nama: "Biskuit", satuan: "Dus" },
      { nama: "Makanan Kaleng", satuan: "Dus" }, { nama: "Makanan Bayi", satuan: "Dus" }, { nama: "Susu Formula", satuan: "Karton" },
    ],
  },
  minuman: {
    label: "Minuman", color: "text-blue-700", bgColor: "bg-blue-50 border-blue-200",
    items: [{ nama: "Air Mineral", satuan: "Dus" }, { nama: "Oralit", satuan: "Box" }, { nama: "Susu UHT", satuan: "Karton" }],
  },
  medis: {
    label: "Kebutuhan Medis", color: "text-rose-700", bgColor: "bg-rose-50 border-rose-200",
    items: [
      { nama: "Paracetamol Dewasa", satuan: "Box" }, { nama: "Paracetamol Anak", satuan: "Box" }, { nama: "Obat Diare", satuan: "Box" },
      { nama: "Obat Luka (Betadine)", satuan: "Botol" }, { nama: "Perban & Kasa", satuan: "Box" }, { nama: "Masker Medis", satuan: "Box" },
      { nama: "Sarung Tangan Medis", satuan: "Box" }, { nama: "Infus Set", satuan: "Set" }, { nama: "Antiseptik", satuan: "Botol" },
      { nama: "Obat Demam Anak (Sirup)", satuan: "Botol" },
    ],
  },
  sanitasi: {
    label: "Sanitasi & Kebersihan", color: "text-teal-700", bgColor: "bg-teal-50 border-teal-200",
    items: [
      { nama: "Sabun Mandi", satuan: "Pcs" }, { nama: "Sabun Cuci", satuan: "Pcs" }, { nama: "Sikat Gigi", satuan: "Pcs" },
      { nama: "Pasta Gigi", satuan: "Pcs" }, { nama: "Pembalut Wanita", satuan: "Pack" }, { nama: "Popok Bayi", satuan: "Bal" },
      { nama: "Popok Dewasa", satuan: "Bal" }, { nama: "Tisu Basah", satuan: "Pack" },
    ],
  },
  perlengkapan: {
    label: "Perlengkapan", color: "text-indigo-700", bgColor: "bg-indigo-50 border-indigo-200",
    items: [
      { nama: "Selimut", satuan: "Pcs" }, { nama: "Tikar / Matras", satuan: "Pcs" }, { nama: "Terpal", satuan: "Lembar" },
      { nama: "Pakaian Layak Pakai", satuan: "Stel" }, { nama: "Genset", satuan: "Unit" }, { nama: "Lampu Emergency", satuan: "Pcs" },
    ],
  },
  lainnya: { label: "Lainnya", color: "text-slate-700", bgColor: "bg-slate-50 border-slate-200", items: [] },
};

const allKategoriKeys = Object.keys(kategoriConfig) as KebutuhanKategori[];

export function AddPoskoForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [recordingState, setRecordingState] = useState<"idle" | "recording" | "processing" | "done">("idle");
  const [duration, setDuration] = useState(0);
  const [aiError, setAiError] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const formatDuration = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  const cleanupRecording = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    mediaRecorderRef.current = null;
    chunksRef.current = [];
  }, []);

  useEffect(() => {
    return cleanupRecording;
  }, [cleanupRecording]);

  const [formData, setFormData] = useState({
    namaPosko: "",
    catatanMedis: "",
  });

  const [demografi, setDemografi] = useState({
    dewasa: 0,
    anakAnak: 0,
    lansia: 0,
    balita: 0,
    ibuHamil: 0,
    disabilitas: 0,
  });

  const [kebutuhanList, setKebutuhanList] = useState<KebutuhanItem[]>([]);
  const [showPicker, setShowPicker] = useState(false);
  const [pickerKategori, setPickerKategori] = useState<KebutuhanKategori>("makanan");

  const totalPengungsi = demografi.dewasa + demografi.anakAnak + demografi.lansia + demografi.balita;

  const addKebutuhanFromPicker = (nama: string, satuan: string) => {
    const exists = kebutuhanList.some(k => k.nama === nama && k.kategori === pickerKategori);
    if (exists) return;
    setKebutuhanList(prev => [
      ...prev,
      { id: `kb-${Date.now()}-${Math.random()}`, kategori: pickerKategori, nama, qty: 1, satuan },
    ]);
  };

  const addCustomKebutuhan = () => {
    setKebutuhanList(prev => [
      ...prev,
      { id: `kb-custom-${Date.now()}`, kategori: "lainnya", nama: "", qty: 1, satuan: "Pcs" },
    ]);
  };

  const updateKebutuhan = (id: string, field: keyof KebutuhanItem, value: string | number) => {
    setKebutuhanList(prev => prev.map(k => k.id === id ? { ...k, [field]: value } : k));
  };

  const removeKebutuhan = (id: string) => {
    setKebutuhanList(prev => prev.filter(k => k.id !== id));
  };

  const startRecording = async () => {
    try {
      setAiError(null);
      setDuration(0);

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const recorder = new MediaRecorder(stream, { mimeType: "audio/webm" });
      mediaRecorderRef.current = recorder;
      chunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      recorder.onstop = async () => {
        if (timerRef.current) {
          clearInterval(timerRef.current);
          timerRef.current = null;
        }
        streamRef.current?.getTracks().forEach((t) => t.stop());

        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        chunksRef.current = [];

        setRecordingState("processing");

        const result = await aiService.extractVoiceInput(blob);

        if (!result.success || !result.data) {
          setAiError(result.error ?? "Gagal memproses audio");
          setRecordingState("idle");
          return;
        }

        const resData = result.data;
        
        // Update demografi
        setDemografi(prev => ({
          ...prev,
          dewasa: resData.jumlahDewasa ?? prev.dewasa,
          anakAnak: resData.jumlahAnak ?? prev.anakAnak,
          lansia: resData.jumlahLansia ?? prev.lansia,
          ibuHamil: resData.jumlahIbuHamil ?? prev.ibuHamil,
          disabilitas: resData.jumlahDisabilitas ?? prev.disabilitas,
        }));

        // Update catatan medis
        if (resData.catatanMedisDarurat) {
          setFormData(prev => ({ ...prev, catatanMedis: resData.catatanMedisDarurat || prev.catatanMedis }));
        }

        // Update kebutuhan
        if (resData.kebutuhan && resData.kebutuhan.length > 0) {
          const newKebutuhan = resData.kebutuhan.map(k => {
            let cat: KebutuhanKategori = "lainnya";
            const lowerK = k.kategori.toLowerCase();
            if (lowerK === "makanan") cat = "makanan";
            else if (lowerK === "pakaian") cat = "perlengkapan";
            else if (lowerK === "obat") cat = "medis";
            return {
              id: `kb-ai-${Date.now()}-${Math.random()}`,
              kategori: cat,
              nama: k.namaBarang,
              qty: k.qtyNeeded,
              satuan: "Pcs"
            };
          });
          setKebutuhanList(prev => [...prev, ...newKebutuhan]);
        }

        setRecordingState("done");
      };

      recorder.start();
      setRecordingState("recording");

      timerRef.current = setInterval(() => {
        setDuration((prev) => prev + 1);
      }, 1000);
    } catch {
      setAiError("Tidak dapat mengakses mikrofon. Pastikan izin diberikan.");
      setRecordingState("idle");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }
  };

  const groupedKebutuhan = kebutuhanList.reduce<Record<string, KebutuhanItem[]>>((acc, item) => {
    const cat = item.kategori;
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(item);
    return acc;
  }, {});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.namaPosko.trim()) {
      alert("Nama Posko harus diisi");
      return;
    }

    setIsSubmitting(true);
    try {
      const { superAdminService } = await import("@/services/super-admin.service");
      
      const payload = {
        name: formData.namaPosko,
        latitude: -6.2, // Default mock location since maps are not implemented here
        longitude: 106.8,
        jumlah_dewasa: demografi.dewasa,
        jumlah_anak: demografi.anakAnak,
        jumlah_lansia: demografi.lansia,
        jumlah_balita: demografi.balita,
        jumlah_ibu_hamil: demografi.ibuHamil,
        jumlah_disabilitas: demografi.disabilitas,
        catatan_medis_darurat: formData.catatanMedis,
        needs: kebutuhanList.map(k => ({
          item_name: k.nama,
          qty_needed: k.qty
        }))
      };

      await superAdminService.createLocation("POSKO", payload);
      setSubmitSuccess(true);
      
      // Reset form
      setFormData({ namaPosko: "", catatanMedis: "" });
      setDemografi({ dewasa: 0, anakAnak: 0, lansia: 0, balita: 0, ibuHamil: 0, disabilitas: 0 });
      setKebutuhanList([]);
      
      setTimeout(() => setSubmitSuccess(false), 5000);
    } catch (err: any) {
      alert("Gagal menambahkan Posko: " + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col lg:flex-row h-full">
      {/* Left Sidebar: Voice Note */}
      <div className="w-full lg:w-1/3 bg-slate-50 border-r border-slate-200 p-6 flex flex-col items-center justify-center min-h-[300px]">
        <div className="text-center mb-8 max-w-[250px]">
          <h3 className="text-lg font-bold text-slate-800 mb-2">Input Suara AI</h3>
          <p className="text-xs text-slate-500">
            Tekan tombol di bawah lalu laporkan kondisi posko. AI akan otomatis mengisikan form untuk Anda.
          </p>
        </div>

        <div className="flex flex-col items-center gap-4">
          {recordingState === "idle" && (
            <button
              type="button"
              onClick={startRecording}
              className="relative w-24 h-24 rounded-full flex items-center justify-center transition-all shadow-xl group bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Mic className="w-8 h-8 group-hover:scale-110 transition-transform" />
            </button>
          )}

          {recordingState === "recording" && (
            <div className="flex flex-col items-center gap-3">
              <button
                type="button"
                onClick={stopRecording}
                className="relative w-24 h-24 rounded-full flex items-center justify-center transition-all shadow-xl bg-rose-500 hover:bg-rose-600 text-white"
              >
                <div className="absolute inset-0 rounded-full border-4 border-rose-500/30 animate-ping" />
                <MicOff className="w-8 h-8" />
              </button>
              <div className="flex items-center gap-2 bg-rose-50 px-4 py-2 rounded-full border border-rose-200 mt-2">
                <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                <span className="text-sm font-bold text-rose-700 tabular-nums">
                  <Clock className="w-3.5 h-3.5 inline mr-1" />
                  {formatDuration(duration)}
                </span>
              </div>
            </div>
          )}

          {recordingState === "processing" && (
            <div className="flex flex-col items-center gap-3">
              <button
                disabled
                className="relative w-24 h-24 rounded-full flex items-center justify-center transition-all shadow-xl bg-blue-600 opacity-80 cursor-not-allowed"
              >
                <Loader2 className="w-8 h-8 text-white animate-spin" />
              </button>
            </div>
          )}

          {recordingState === "done" && (
            <div className="flex items-center gap-2 bg-emerald-50 px-4 py-2 rounded-full border border-emerald-200 mt-4">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span className="text-sm font-bold text-emerald-700">AI berhasil mengisi form</span>
            </div>
          )}
        </div>

        <div className="h-10 mt-6 flex items-center justify-center">
          {recordingState === "recording" && (
            <span className="text-rose-600 text-sm font-bold flex items-center gap-2 animate-pulse">
              <span className="w-2 h-2 rounded-full bg-rose-600" /> Mendengarkan...
            </span>
          )}
          {recordingState === "processing" && (
            <span className="text-blue-600 text-sm font-bold flex items-center gap-2">
              <Sparkles className="w-4 h-4" /> AI sedang memproses...
            </span>
          )}
        </div>

        {aiError && (
          <div className="mt-6 bg-red-50 border border-red-200 rounded-xl p-3 text-sm text-red-700 font-medium max-w-[250px] text-center">
            {aiError}
          </div>
        )}
      </div>

      {/* Right Content: Manual Form */}
      <div className="flex-1 p-6 lg:p-8 bg-white overflow-auto">
        <h3 className="text-xl font-bold text-slate-800 mb-6">Detail Posko Pengungsian</h3>

        {submitSuccess && (
          <div className="mb-6 bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <p className="text-sm font-bold text-emerald-800">Berhasil! Posko pengungsian baru telah ditambahkan ke sistem.</p>
          </div>
        )}

        <form className="space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wide">Nama Posko / Lokasi</label>
            <input
              type="text"
              value={formData.namaPosko}
              onChange={(e) => setFormData({ ...formData, namaPosko: e.target.value })}
              className="w-full bg-slate-50 border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 rounded-xl px-4 py-2.5 text-sm font-medium text-slate-900 transition-all outline-none"
              placeholder="Contoh: Posko Balai Desa Suka Maju"
            />
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wide flex items-center gap-1.5">
                <Users className="w-4 h-4 text-blue-500" /> Profil Pengungsi
              </label>
              <div className="bg-blue-50 px-3 py-1 rounded-full border border-blue-100">
                <span className="text-[11px] font-bold text-blue-700">Total: {totalPengungsi} Jiwa</span>
              </div>
            </div>
            
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100">
                <label className="block text-[10px] font-bold text-slate-500 mb-1.5">Dewasa (18-59)</label>
                <input type="number" value={demografi.dewasa} onChange={(e) => setDemografi({...demografi, dewasa: Number(e.target.value)})} className="w-full bg-white border border-slate-200 focus:border-blue-500 rounded-xl px-2.5 py-1.5 text-base font-black text-slate-800 shadow-sm outline-none" />
              </div>
              <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100">
                <label className="block text-[10px] font-bold text-slate-500 mb-1.5">Anak (6-17)</label>
                <input type="number" value={demografi.anakAnak} onChange={(e) => setDemografi({...demografi, anakAnak: Number(e.target.value)})} className="w-full bg-white border border-slate-200 focus:border-blue-500 rounded-xl px-2.5 py-1.5 text-base font-black text-slate-800 shadow-sm outline-none" />
              </div>
              <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100">
                <label className="block text-[10px] font-bold text-slate-500 mb-1.5">Lansia (60+)</label>
                <input type="number" value={demografi.lansia} onChange={(e) => setDemografi({...demografi, lansia: Number(e.target.value)})} className="w-full bg-white border border-slate-200 focus:border-emerald-500 rounded-xl px-2.5 py-1.5 text-base font-black text-slate-800 shadow-sm outline-none" />
              </div>
              <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100">
                <label className="block text-[10px] font-bold text-slate-500 mb-1.5">Balita (0-5)</label>
                <input type="number" value={demografi.balita} onChange={(e) => setDemografi({...demografi, balita: Number(e.target.value)})} className="w-full bg-white border border-slate-200 focus:border-rose-500 rounded-xl px-2.5 py-1.5 text-base font-black text-slate-800 shadow-sm outline-none" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-purple-50/50 p-3 rounded-2xl border border-purple-100">
                <label className="block text-[10px] font-bold text-purple-700 mb-1.5">Ibu Hamil</label>
                <input type="number" value={demografi.ibuHamil} onChange={(e) => setDemografi({...demografi, ibuHamil: Number(e.target.value)})} className="w-full bg-white border border-purple-200 focus:border-purple-500 rounded-xl px-2.5 py-1.5 text-base font-black text-purple-900 shadow-sm outline-none" />
              </div>
              <div className="bg-orange-50/50 p-3 rounded-2xl border border-orange-100">
                <label className="block text-[10px] font-bold text-orange-700 mb-1.5">Peny. Disabilitas</label>
                <input type="number" value={demografi.disabilitas} onChange={(e) => setDemografi({...demografi, disabilitas: Number(e.target.value)})} className="w-full bg-white border border-orange-200 focus:border-orange-500 rounded-xl px-2.5 py-1.5 text-base font-black text-orange-900 shadow-sm outline-none" />
              </div>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wide flex items-center gap-1.5">
              <AlertCircle className="w-3.5 h-3.5 text-rose-500" /> Catatan Medis & Darurat
            </label>
            <textarea
              value={formData.catatanMedis}
              onChange={(e) => setFormData({ ...formData, catatanMedis: e.target.value })}
              className="w-full bg-rose-50/30 border border-rose-200 focus:border-rose-500 focus:ring-2 focus:ring-rose-200 rounded-xl px-4 py-3 text-sm font-medium text-slate-900 transition-all outline-none min-h-[80px] placeholder:text-slate-400"
              placeholder="Adakah pengungsi yang sakit parah atau butuh penanganan medis segera?"
            />
          </div>

          {/* Kebutuhan Posko Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wide flex items-center gap-1.5">
                <Package className="w-4 h-4 text-blue-500" /> Daftar Kebutuhan Posko
              </label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={addCustomKebutuhan}
                  className="text-xs font-bold text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 px-3 py-1.5 rounded-lg transition-colors shadow-sm"
                >
                  + Custom
                </button>
                <button
                  type="button"
                  onClick={() => setShowPicker(!showPicker)}
                  className="text-xs font-bold text-blue-700 bg-blue-50 border border-blue-200 hover:bg-blue-100 px-3 py-1.5 rounded-lg flex items-center gap-1 transition-colors shadow-sm"
                >
                  <Plus className="w-3.5 h-3.5" /> Pilih Barang
                  <ChevronDown className={cn("w-3.5 h-3.5 transition-transform", showPicker && "rotate-180")} />
                </button>
              </div>
            </div>

            {/* Item Picker */}
            {showPicker && (
              <div className="bg-white border border-slate-200 rounded-2xl shadow-lg p-4 animate-in slide-in-from-top-2 duration-200">
                <div className="flex gap-1.5 mb-4 overflow-x-auto pb-1 scrollbar-hide">
                  {allKategoriKeys.filter(k => k !== "lainnya").map(k => (
                    <button
                      key={k}
                      type="button"
                      onClick={() => setPickerKategori(k)}
                      className={cn(
                        "px-3 py-1.5 rounded-lg text-[11px] font-bold whitespace-nowrap transition-all border",
                        pickerKategori === k
                          ? `${kategoriConfig[k].bgColor} ${kategoriConfig[k].color}`
                          : "bg-white text-slate-500 border-slate-200 hover:bg-slate-50"
                      )}
                    >
                      {kategoriConfig[k].label}
                    </button>
                  ))}
                </div>

                <div className="flex flex-wrap gap-2">
                  {kategoriConfig[pickerKategori].items.map(item => {
                    const alreadyAdded = kebutuhanList.some(k => k.nama === item.nama && k.kategori === pickerKategori);
                    return (
                      <button
                        key={item.nama}
                        type="button"
                        disabled={alreadyAdded}
                        onClick={() => addKebutuhanFromPicker(item.nama, item.satuan)}
                        className={cn(
                          "px-3 py-2 rounded-xl text-xs font-bold border transition-all",
                          alreadyAdded
                            ? "bg-emerald-50 text-emerald-600 border-emerald-200 cursor-default"
                            : "bg-white text-slate-700 border-slate-200 hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700"
                        )}
                      >
                        {alreadyAdded ? "v " : "+ "}{item.nama}
                        <span className="ml-1 text-slate-400 font-normal">({item.satuan})</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Added Items by Category */}
            {Object.keys(groupedKebutuhan).length > 0 ? (
              <div className="space-y-3">
                {Object.entries(groupedKebutuhan).map(([cat, items]) => {
                  const cfg = kategoriConfig[cat as KebutuhanKategori];
                  return (
                    <div key={cat} className={cn("rounded-2xl border p-4", cfg.bgColor)}>
                      <p className={cn("text-[10px] font-black uppercase tracking-widest mb-3", cfg.color)}>{cfg.label}</p>
                      <div className="space-y-2">
                        {items.map(item => (
                          <div key={item.id} className="flex items-center gap-2 bg-white rounded-xl px-3 py-2 border border-white/80 shadow-sm">
                            <span className="flex-1 text-sm font-bold text-slate-800 truncate">
                              {item.kategori === "lainnya" ? (
                                <input
                                  type="text"
                                  value={item.nama}
                                  onChange={e => updateKebutuhan(item.id, "nama", e.target.value)}
                                  className="w-full bg-transparent outline-none text-sm font-bold"
                                  placeholder="Nama barang..."
                                />
                              ) : (
                                item.nama
                              )}
                            </span>
                            <input
                              type="number"
                              value={item.qty}
                              onChange={e => updateKebutuhan(item.id, "qty", Number(e.target.value))}
                              className="w-16 text-center bg-slate-50 border border-slate-200 rounded-lg px-1 py-1 text-sm font-black outline-none focus:border-blue-400"
                            />
                            <span className="text-xs font-semibold text-slate-400 w-14 text-center">{item.satuan}</span>
                            <button type="button" onClick={() => removeKebutuhan(item.id)} className="p-1 text-slate-400 hover:text-red-500 transition-colors">
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                <Package className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p className="text-xs font-bold text-slate-400">Belum ada kebutuhan. Klik "Pilih Barang" untuk menambahkan.</p>
              </div>
            )}
          </div>

          <div className="pt-4 flex justify-end">
            <button
              type="submit"
              disabled={isSubmitting}
              className="bg-slate-900 hover:bg-slate-800 disabled:opacity-70 text-white font-bold text-sm px-8 py-3 rounded-xl transition-all shadow-md flex items-center gap-2"
            >
              {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
              Daftarkan Posko
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
