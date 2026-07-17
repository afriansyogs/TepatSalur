"use client";

import { useState, useEffect } from "react";
import { Edit3, Users, Clipboard, Save, Plus, X, ArrowLeft, MapPinPlus, Package, ChevronDown, AlertTriangle, ShieldAlert, ShieldCheck, Mic, MicOff, Loader2, Sparkles, Tent } from "lucide-react";
import { cn } from "@/lib/utils";

type TriaseStatus = "MERAH" | "KUNING" | "HIJAU";

type KebutuhanKategori = "MAKANAN" | "PAKAIAN" | "OBAT" | "LAINNYA";

type KebutuhanItem = {
  id: string;
  kategori: KebutuhanKategori;
  nama: string;
  qty: number;
  satuan: string;
  status?: string;
};

const kategoriConfig: Record<KebutuhanKategori, { label: string; color: string; bgColor: string; items: { nama: string; satuan: string }[] }> = {
  MAKANAN: {
    label: "Makanan & Minuman", color: "text-amber-700", bgColor: "bg-amber-50 border-amber-200",
    items: [
      { nama: "Beras", satuan: "Kg" }, { nama: "Mie Instan", satuan: "Dus" }, { nama: "Biskuit", satuan: "Dus" },
      { nama: "Makanan Kaleng", satuan: "Dus" }, { nama: "Susu Formula", satuan: "Karton" }, { nama: "Air Mineral", satuan: "Dus" },
    ],
  },
  PAKAIAN: {
    label: "Pakaian & Perlengkapan", color: "text-indigo-700", bgColor: "bg-indigo-50 border-indigo-200",
    items: [
      { nama: "Selimut", satuan: "Pcs" }, { nama: "Tikar / Matras", satuan: "Pcs" }, { nama: "Terpal", satuan: "Lembar" },
      { nama: "Pakaian Layak Pakai", satuan: "Stel" },
    ],
  },
  OBAT: {
    label: "Kebutuhan Medis", color: "text-rose-700", bgColor: "bg-rose-50 border-rose-200",
    items: [
      { nama: "Paracetamol Dewasa", satuan: "Box" }, { nama: "Paracetamol Anak", satuan: "Box" }, { nama: "Obat Diare", satuan: "Box" },
      { nama: "Obat Luka (Betadine)", satuan: "Botol" }, { nama: "Perban & Kasa", satuan: "Box" }, { nama: "Masker Medis", satuan: "Box" },
    ],
  },
  LAINNYA: {
    label: "Sanitasi & Lainnya", color: "text-slate-700", bgColor: "bg-slate-100 border-slate-200",
    items: [
      { nama: "Sabun Mandi", satuan: "Pcs" }, { nama: "Sabun Cuci", satuan: "Pcs" }, { nama: "Pembalut Wanita", satuan: "Pack" },
      { nama: "Popok Bayi", satuan: "Bal" }, { nama: "Popok Dewasa", satuan: "Bal" },
    ],
  },
};

const allKategoriKeys = Object.keys(kategoriConfig) as KebutuhanKategori[];

const triaseConfig: Record<TriaseStatus, { label: string; color: string; bgColor: string; icon: typeof AlertTriangle }> = {
  MERAH:  { label: "Kritis",  color: "text-red-700",     bgColor: "bg-red-50 border-red-200",     icon: AlertTriangle },
  KUNING: { label: "Waspada", color: "text-amber-700",   bgColor: "bg-amber-50 border-amber-200", icon: ShieldAlert },
  HIJAU:    { label: "Aman",    color: "text-emerald-700", bgColor: "bg-emerald-50 border-emerald-200", icon: ShieldCheck },
};

export function PoskoManager() {
  const [poskoData, setPoskoData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const [demoForm, setDemoForm] = useState({ dewasa: 0, anakAnak: 0, lansia: 0, balita: 0, ibuHamil: 0, disabilitas: 0, catatanMedis: "" });
  const [kebForm, setKebForm] = useState<KebutuhanItem[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [showPicker, setShowPicker] = useState(false);
  const [pickerKategori, setPickerKategori] = useState<KebutuhanKategori>("MAKANAN");

  useEffect(() => {
    fetchPoskoData();
  }, []);

  const fetchPoskoData = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/relawan/posko");
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || "Gagal memuat data posko");
      }

      setPoskoData(json.data);
      const demo = json.data.demographics;
      setDemoForm({
        dewasa: demo.dewasa,
        anakAnak: demo.anakAnak,
        lansia: demo.lansia,
        balita: demo.balita || 0,
        ibuHamil: demo.ibuHamil,
        disabilitas: demo.disabilitas,
        catatanMedis: json.data.catatanMedis,
      });

      const needs = json.data.needs.map((n: any) => {
        let cat = (n.category_kebutuhan || "").toUpperCase();
        if (!["MAKANAN", "PAKAIAN", "OBAT", "LAINNYA"].includes(cat)) {
          cat = "LAINNYA";
        }
        return {
          id: n.id,
          kategori: cat as KebutuhanKategori,
          nama: n.item_name,
          qty: n.qty_needed,
          satuan: "Pcs",
          status: n.status
        };
      });
      setKebForm(needs);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    setError("");
    try {
      const res = await fetch("/api/relawan/posko", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          demografi: demoForm,
          kebutuhan: kebForm
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || "Gagal menyimpan perubahan");
      }
      
      // Reload to get AI urgency updates or normalized data
      await fetchPoskoData();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const addFromPicker = (nama: string, satuan: string) => {
    const exists = kebForm.some(k => k.nama === nama && k.kategori === pickerKategori);
    if (exists) return;
    setKebForm(prev => [...prev, { id: `k-${Date.now()}-${Math.random()}`, kategori: pickerKategori, nama, qty: 1, satuan, status: "OPEN" }]);
  };

  const addCustomKebutuhan = () => {
    setKebForm(prev => [...prev, { id: `k-custom-${Date.now()}`, kategori: "LAINNYA", nama: "", qty: 1, satuan: "Pcs", status: "OPEN" }]);
  };

  const updateKebutuhan = (id: string, field: keyof KebutuhanItem, value: string | number) => {
    setKebForm(prev => prev.map(k => k.id === id ? { ...k, [field]: value } : k));
  };

  const removeKebutuhan = (id: string) => {
    setKebForm(prev => prev.filter(k => k.id !== id));
  };

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (error || !poskoData) {
    return (
      <div className="bg-red-50 text-red-600 p-4 rounded-xl flex items-center gap-3">
        <AlertTriangle className="w-5 h-5" />
        <p className="font-semibold text-sm">{error || "Data posko tidak ditemukan"}</p>
      </div>
    );
  }

  const groupedKebutuhan = kebForm.reduce<Record<string, KebutuhanItem[]>>((acc, item) => {
    if (!acc[item.kategori]) acc[item.kategori] = [];
    acc[item.kategori].push(item);
    return acc;
  }, {});

  const totalPengungsi = demoForm.dewasa + demoForm.anakAnak + demoForm.lansia + demoForm.balita;

  return (
    <div className="flex flex-col h-full animate-in slide-in-from-bottom-4 duration-300">
      <div className="flex items-center justify-between p-6 border-b border-slate-100 bg-white rounded-t-3xl shadow-sm">
        <div className="flex items-center gap-4">
          <div className="bg-blue-100 p-3 rounded-2xl">
            <Tent className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h2 className="text-xl font-black text-slate-800">{poskoData.name}</h2>
            <p className="text-xs font-semibold text-slate-500 mt-1 uppercase tracking-wider flex items-center gap-1.5">
              <MapPinPlus className="w-3.5 h-3.5" /> {poskoData.alamat || "Alamat tidak diisi"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
           <div className={cn("px-4 py-1.5 rounded-full border text-xs font-bold uppercase tracking-wider", triaseConfig[poskoData.urgencyStatus as TriaseStatus]?.bgColor || "bg-emerald-50", triaseConfig[poskoData.urgencyStatus as TriaseStatus]?.color || "text-emerald-700")}>
              Status: {triaseConfig[poskoData.urgencyStatus as TriaseStatus]?.label || "Aman"}
           </div>
           <div className="bg-blue-50 px-4 py-1.5 rounded-full border border-blue-100">
             <span className="text-xs font-bold text-blue-700">Total: {totalPengungsi} Jiwa</span>
           </div>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-6 bg-white border-x border-slate-100">
        <div className="max-w-4xl mx-auto space-y-8">
          {error && (
             <div className="p-3 bg-red-50 text-red-600 border border-red-200 rounded-xl text-sm font-semibold">{error}</div>
          )}

          {/* Demografi */}
          <section>
            <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest flex items-center gap-2 mb-4">
              <Users className="w-5 h-5 text-blue-600" /> Profil Pengungsi
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                <label className="block text-xs font-bold text-slate-500 mb-2">Dewasa (18-59)</label>
                <input type="number" value={demoForm.dewasa} onChange={(e) => setDemoForm({...demoForm, dewasa: Number(e.target.value)})} className="w-full bg-white border border-slate-200 focus:border-blue-500 rounded-xl px-3 py-2 text-lg font-black text-slate-800 shadow-sm" />
              </div>
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                <label className="block text-xs font-bold text-slate-500 mb-2">Anak-anak (6-17)</label>
                <input type="number" value={demoForm.anakAnak} onChange={(e) => setDemoForm({...demoForm, anakAnak: Number(e.target.value)})} className="w-full bg-white border border-slate-200 focus:border-blue-500 rounded-xl px-3 py-2 text-lg font-black text-slate-800 shadow-sm" />
              </div>
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                <label className="block text-xs font-bold text-slate-500 mb-2">Lansia (60+)</label>
                <input type="number" value={demoForm.lansia} onChange={(e) => setDemoForm({...demoForm, lansia: Number(e.target.value)})} className="w-full bg-white border border-slate-200 focus:border-emerald-500 rounded-xl px-3 py-2 text-lg font-black text-slate-800 shadow-sm" />
              </div>
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                <label className="block text-xs font-bold text-slate-500 mb-2">Balita (0-5)</label>
                <input type="number" value={demoForm.balita} onChange={(e) => setDemoForm({...demoForm, balita: Number(e.target.value)})} className="w-full bg-white border border-slate-200 focus:border-rose-500 rounded-xl px-3 py-2 text-lg font-black text-slate-800 shadow-sm" />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div className="bg-purple-50/50 p-4 rounded-2xl border border-purple-100">
                <label className="block text-xs font-bold text-purple-700 mb-2">Ibu Hamil</label>
                <input type="number" value={demoForm.ibuHamil} onChange={(e) => setDemoForm({...demoForm, ibuHamil: Number(e.target.value)})} className="w-full bg-white border border-purple-200 focus:border-purple-500 rounded-xl px-3 py-2 text-lg font-black text-purple-900 shadow-sm" />
              </div>
              <div className="bg-orange-50/50 p-4 rounded-2xl border border-orange-100">
                <label className="block text-xs font-bold text-orange-700 mb-2">Penyandang Disabilitas</label>
                <input type="number" value={demoForm.disabilitas} onChange={(e) => setDemoForm({...demoForm, disabilitas: Number(e.target.value)})} className="w-full bg-white border border-orange-200 focus:border-orange-500 rounded-xl px-3 py-2 text-lg font-black text-orange-900 shadow-sm" />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-600 flex items-center gap-1.5 uppercase tracking-wider"><Clipboard className="w-4 h-4 text-slate-400" /> Catatan Medis & Kondisi Darurat</label>
              <textarea value={demoForm.catatanMedis} onChange={(e) => setDemoForm({...demoForm, catatanMedis: e.target.value})} className="w-full bg-white border border-slate-200 focus:border-blue-500 rounded-2xl px-4 py-3 text-sm min-h-[100px] shadow-sm leading-relaxed" placeholder="Adakah penyakit menular atau kondisi darurat?" />
            </div>
          </section>

          {/* Kebutuhan with Category Picker */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
                <Package className="w-5 h-5 text-amber-500" /> Permintaan Kebutuhan
              </h3>
              <div className="flex gap-2">
                <button onClick={addCustomKebutuhan} className="text-xs font-bold text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 px-3 py-1.5 rounded-lg transition-colors">
                  + Custom
                </button>
                <button
                  onClick={() => setShowPicker(!showPicker)}
                  className="text-xs font-bold text-amber-700 bg-amber-50 border border-amber-200 hover:bg-amber-100 px-3 py-1.5 rounded-lg flex items-center gap-1 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" /> Pilih Barang
                  <ChevronDown className={cn("w-3.5 h-3.5 transition-transform", showPicker && "rotate-180")} />
                </button>
              </div>
            </div>

            {showPicker && (
              <div className="bg-white border border-slate-200 rounded-2xl shadow-lg p-4 mb-5 animate-in slide-in-from-top-2 duration-200">
                <div className="flex gap-1.5 mb-4 overflow-x-auto pb-1 scrollbar-hide">
                  {allKategoriKeys.filter(k => k !== "LAINNYA").map(k => (
                    <button
                      key={k}
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
                    const alreadyAdded = kebForm.some(k => k.nama === item.nama && k.kategori === pickerKategori);
                    return (
                      <button
                        key={item.nama}
                        disabled={alreadyAdded}
                        onClick={() => addFromPicker(item.nama, item.satuan)}
                        className={cn(
                          "px-3 py-2 rounded-xl text-xs font-bold border transition-all",
                          alreadyAdded
                            ? "bg-emerald-50 text-emerald-600 border-emerald-200 cursor-default"
                            : "bg-white text-slate-700 border-slate-200 hover:bg-amber-50 hover:border-amber-300 hover:text-amber-700"
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

            {Object.keys(groupedKebutuhan).length > 0 ? (
              <div className="space-y-3">
                {Object.entries(groupedKebutuhan).map(([cat, items]) => {
                  const cfg = kategoriConfig[cat as KebutuhanKategori] || kategoriConfig.lainnya;
                  return (
                    <div key={cat} className={cn("rounded-2xl border p-4", cfg.bgColor)}>
                      <p className={cn("text-[10px] font-black uppercase tracking-widest mb-3", cfg.color)}>{cfg.label}</p>
                      <div className="space-y-2">
                        {items.map(item => (
                          <div key={item.id} className="flex items-center gap-2 bg-white rounded-xl px-3 py-2 border border-white/80 shadow-sm">
                            <span className="flex-1 text-sm font-bold text-slate-800 truncate">
                              {item.kategori === "lainnya" ? (
                                <input type="text" value={item.nama} onChange={e => updateKebutuhan(item.id, "nama", e.target.value)} className="w-full bg-transparent outline-none text-sm font-bold" placeholder="Nama barang..." />
                              ) : item.nama}
                            </span>
                            <input type="number" value={item.qty} onChange={e => updateKebutuhan(item.id, "qty", Number(e.target.value))} className="w-16 text-center bg-slate-50 border border-slate-200 rounded-lg px-1 py-1 text-sm font-black outline-none focus:border-amber-400" />
                            <span className="text-xs font-semibold text-slate-400 w-14 text-center">{item.satuan}</span>
                            <button onClick={() => removeKebutuhan(item.id)} className="p-1 text-slate-400 hover:text-red-500 transition-colors" title="Hapus">
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
          </section>
        </div>
      </div>

      <div className="p-6 bg-white border-x border-b border-slate-100 rounded-b-3xl shadow-sm flex justify-end">
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm px-8 py-3.5 rounded-2xl flex items-center gap-2 transition-all shadow-[0_8px_24px_rgba(37,99,235,0.3)] disabled:opacity-70 disabled:shadow-none"
        >
          {isSaving ? (
            <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Menyimpan...</>
          ) : (
            <><Save className="w-5 h-5" /> Simpan Perubahan</>
          )}
        </button>
      </div>
    </div>
  );
}
