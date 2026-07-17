"use client";

import { useState, useEffect } from "react";
import { Users, Clipboard, Plus, Package, AlertTriangle, ShieldAlert, ShieldCheck, Loader2, Tent, MapPinPlus, Edit3, Trash2, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { volunteerPoskoService } from "@/services/volunteer-posko.service";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

type TriaseStatus = "MERAH" | "KUNING" | "HIJAU";
type KebutuhanKategori = "MAKANAN" | "PAKAIAN" | "OBAT" | "LAINNYA";

type KebutuhanItem = {
  id: string;
  kategori: KebutuhanKategori;
  nama: string;
  qty: number;
  qtyFulfilled: number;
  satuan: string;
  status: string;
  isNew?: boolean;
};

const triaseConfig: Record<TriaseStatus, { label: string; color: string; bgColor: string; icon: typeof AlertTriangle }> = {
  MERAH:  { label: "Kritis",  color: "text-red-700",     bgColor: "bg-red-50 border-red-200",     icon: AlertTriangle },
  KUNING: { label: "Waspada", color: "text-amber-700",   bgColor: "bg-amber-50 border-amber-200", icon: ShieldAlert },
  HIJAU:    { label: "Aman",    color: "text-emerald-700", bgColor: "bg-emerald-50 border-emerald-200", icon: ShieldCheck },
};

const kategoriConfig: Record<string, { label: string; color: string; bgColor: string; }> = {
  MAKANAN: { label: "Makanan & Minuman", color: "text-amber-700", bgColor: "bg-amber-50 border-amber-200" },
  PAKAIAN: { label: "Pakaian & Perlengkapan", color: "text-indigo-700", bgColor: "bg-indigo-50 border-indigo-200" },
  OBAT: { label: "Kebutuhan Medis", color: "text-rose-700", bgColor: "bg-rose-50 border-rose-200" },
  LAINNYA: { label: "Sanitasi & Lainnya", color: "text-slate-700", bgColor: "bg-slate-100 border-slate-200" },
};

export function PoskoManager() {
  const [poskoData, setPoskoData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const [kebForm, setKebForm] = useState<KebutuhanItem[]>([]);
  
  // Modal states
  const [isDemoModalOpen, setIsDemoModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editNeedItem, setEditNeedItem] = useState<KebutuhanItem | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Form states
  const [demoForm, setDemoForm] = useState({ 
    jumlah_dewasa: 0, jumlah_anak: 0, jumlah_lansia: 0, 
    jumlah_ibu_hamil: 0, jumlah_disabilitas: 0, catatan_medis_darurat: "" 
  });

  const [addNeedForm, setAddNeedForm] = useState({
    kategori: "MAKANAN" as KebutuhanKategori,
    nama: "",
    qty: 1,
    satuan: "Pcs"
  });

  useEffect(() => {
    fetchPoskoData();
  }, []);

  const fetchPoskoData = async () => {
    setIsLoading(true);
    try {
      const res = await volunteerPoskoService.getPoskoData();
      if (!res.success) throw new Error(res.error || "Gagal memuat data posko");

      setPoskoData(res.data);
      const pd = res.data;
      
      setDemoForm({
        jumlah_dewasa: pd.jumlahDewasa || 0,
        jumlah_anak: pd.jumlahAnak || 0,
        jumlah_lansia: pd.jumlahLansia || 0,
        jumlah_ibu_hamil: pd.jumlahIbuHamil || 0,
        jumlah_disabilitas: pd.jumlahDisabilitas || 0,
        catatan_medis_darurat: pd.catatanMedisDarurat || "",
      });

      const needs = (pd.kebutuhan || []).map((n: any) => {
        let cat = (n.kategori || "").toUpperCase();
        if (!["MAKANAN", "PAKAIAN", "OBAT", "LAINNYA"].includes(cat)) cat = "LAINNYA";
        return {
          id: n.id,
          kategori: cat as KebutuhanKategori,
          nama: n.namaBarang,
          qty: n.qtyNeeded,
          qtyFulfilled: n.qtyFulfilled || 0,
          satuan: "Pcs",
          status: n.status || "OPEN"
        };
      });
      setKebForm(needs);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const saveDemografi = async () => {
    setIsSaving(true);
    try {
      const demoData = {
        dewasa: demoForm.jumlah_dewasa,
        anakAnak: demoForm.jumlah_anak,
        lansia: demoForm.jumlah_lansia,
        disabilitas: demoForm.jumlah_disabilitas,
        ibuHamil: demoForm.jumlah_ibu_hamil,
        catatanMedis: demoForm.catatan_medis_darurat,
      };

      const res = await volunteerPoskoService.updatePoskoData({ demografi: demoData, kebutuhan: undefined as any });
      if (!res.success) throw new Error(res.error || "Gagal memperbarui profil posko");
      
      await fetchPoskoData();
      setIsDemoModalOpen(false);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const saveNewNeed = async () => {
    if (!addNeedForm.nama.trim()) return alert("Nama barang wajib diisi");
    if (addNeedForm.qty < 1) return alert("Jumlah minimal 1");

    setIsSaving(true);
    try {
      const newItem = {
        kategori: addNeedForm.kategori,
        nama: addNeedForm.nama,
        qty: addNeedForm.qty,
        status: "OPEN"
      };
      const updatedKebutuhan = [...kebForm.map(k => ({ id: k.id, kategori: k.kategori, nama: k.nama, qty: k.qty, status: k.status })), newItem];
      
      const res = await volunteerPoskoService.updatePoskoData({ kebutuhan: updatedKebutuhan });
      if (!res.success) throw new Error(res.error || "Gagal menambah kebutuhan");

      await fetchPoskoData();
      setIsAddModalOpen(false);
      setAddNeedForm({ kategori: "MAKANAN", nama: "", qty: 1, satuan: "Pcs" });
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const saveEditNeed = async () => {
    if (!editNeedItem) return;
    if (!editNeedItem.nama.trim()) return alert("Nama barang wajib diisi");
    if (editNeedItem.qty < 1) return alert("Jumlah minimal 1");

    setIsSaving(true);
    try {
      const updatedKebutuhan = kebForm.map(k => {
        if (k.id === editNeedItem.id) {
          return { id: k.id, kategori: editNeedItem.kategori, nama: editNeedItem.nama, qty: editNeedItem.qty, status: k.status };
        }
        return { id: k.id, kategori: k.kategori, nama: k.nama, qty: k.qty, status: k.status };
      });
      
      const res = await volunteerPoskoService.updatePoskoData({ kebutuhan: updatedKebutuhan });
      if (!res.success) throw new Error(res.error || "Gagal memperbarui kebutuhan");

      await fetchPoskoData();
      setEditNeedItem(null);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const deleteNeed = async (id: string) => {
    if (!confirm("Hapus kebutuhan ini?")) return;
    setIsSaving(true);
    try {
      const updatedKebutuhan = kebForm.filter(k => k.id !== id).map(k => ({ id: k.id, kategori: k.kategori, nama: k.nama, qty: k.qty, status: k.status }));
      const res = await volunteerPoskoService.updatePoskoData({ kebutuhan: updatedKebutuhan });
      if (!res.success) throw new Error(res.error || "Gagal menghapus kebutuhan");
      
      await fetchPoskoData();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsSaving(false);
    }
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

  const totalPengungsi = poskoData.jumlahPengungsi || 0;
  const statusAI = poskoData.aiStatus as TriaseStatus || "HIJAU";
  const statusConfig = triaseConfig[statusAI];

  return (
    <div className="flex flex-col h-full animate-in slide-in-from-bottom-4 duration-300">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between p-6 border-b border-slate-100 bg-white rounded-t-3xl shadow-sm gap-4">
        <div className="flex items-center gap-4">
          <div className="bg-blue-100 p-3 rounded-2xl">
            <Tent className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h2 className="text-xl font-black text-slate-800">{poskoData.name}</h2>
            <p className="text-xs font-semibold text-slate-500 mt-1 uppercase tracking-wider flex items-center gap-1.5">
              <MapPinPlus className="w-3.5 h-3.5" /> Posko Assignment
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3">
           <div className={cn("px-4 py-1.5 rounded-full border text-xs font-bold uppercase tracking-wider flex items-center gap-1", statusConfig?.bgColor || "bg-emerald-50", statusConfig?.color || "text-emerald-700")}>
              <statusConfig.icon className="w-3.5 h-3.5" />
              Status: {statusConfig?.label || "Aman"}
           </div>
           <div className="bg-orange-50 px-4 py-1.5 rounded-full border border-orange-100">
             <span className="text-xs font-bold text-orange-700">Urgency Score: {poskoData.urgencyScore || 0}/100</span>
           </div>
           <div className="bg-blue-50 px-4 py-1.5 rounded-full border border-blue-100">
             <span className="text-xs font-bold text-blue-700">Total: {totalPengungsi} Jiwa</span>
           </div>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-6 bg-slate-50 border-x border-b border-slate-100 rounded-b-3xl">
        <div className="max-w-5xl mx-auto space-y-8">
          
          {/* Demografi Section (View Mode) */}
          <section className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50 rounded-bl-full -z-10 opacity-50"></div>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
                <Users className="w-5 h-5 text-blue-600" /> Profil Pengungsi
              </h3>
              <Button onClick={() => setIsDemoModalOpen(true)} variant="outline" size="sm" className="h-9 px-4 rounded-xl border-slate-200 text-blue-600 hover:bg-blue-50 hover:text-blue-700 font-bold">
                <Edit3 className="w-4 h-4 mr-2" /> Edit Profil
              </Button>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div className="bg-slate-50/80 p-4 rounded-2xl border border-slate-100">
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Dewasa</p>
                <p className="text-2xl font-black text-slate-800">{poskoData.jumlahDewasa || 0} <span className="text-xs font-semibold text-slate-400">Jiwa</span></p>
              </div>
              <div className="bg-slate-50/80 p-4 rounded-2xl border border-slate-100">
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Anak-anak</p>
                <p className="text-2xl font-black text-slate-800">{poskoData.jumlahAnak || 0} <span className="text-xs font-semibold text-slate-400">Jiwa</span></p>
              </div>
              <div className="bg-slate-50/80 p-4 rounded-2xl border border-slate-100">
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Lansia</p>
                <p className="text-2xl font-black text-emerald-600">{poskoData.jumlahLansia || 0} <span className="text-xs font-semibold text-slate-400">Jiwa</span></p>
              </div>
              <div className="bg-purple-50/50 p-4 rounded-2xl border border-purple-100">
                <p className="text-[10px] font-bold text-purple-600 uppercase tracking-widest mb-1">Ibu Hamil</p>
                <p className="text-2xl font-black text-purple-700">{poskoData.jumlahIbuHamil || 0} <span className="text-xs font-semibold text-purple-400/70">Jiwa</span></p>
              </div>
              <div className="bg-orange-50/50 p-4 rounded-2xl border border-orange-100">
                <p className="text-[10px] font-bold text-orange-600 uppercase tracking-widest mb-1">Disabilitas</p>
                <p className="text-2xl font-black text-orange-700">{poskoData.jumlahDisabilitas || 0} <span className="text-xs font-semibold text-orange-400/70">Jiwa</span></p>
              </div>
            </div>

            {poskoData.catatanMedisDarurat && (
              <div className="mt-4 bg-red-50/50 p-4 rounded-2xl border border-red-100 flex items-start gap-3">
                <Clipboard className="w-5 h-5 text-red-500 mt-0.5" />
                <div>
                  <p className="text-xs font-bold text-red-700 uppercase tracking-wider mb-1">Catatan Medis & Darurat</p>
                  <p className="text-sm font-medium text-red-900 leading-relaxed">{poskoData.catatanMedisDarurat}</p>
                </div>
              </div>
            )}
          </section>

          {/* Kebutuhan Section (View Mode with modern cards) */}
          <section className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
                <Package className="w-5 h-5 text-amber-500" /> Daftar Kebutuhan
              </h3>
              <Button onClick={() => setIsAddModalOpen(true)} className="bg-amber-500 hover:bg-amber-600 text-white rounded-xl h-9 px-4 font-bold shadow-sm shadow-amber-500/20 transition-all">
                <Plus className="w-4 h-4 mr-1.5" /> Tambah Kebutuhan
              </Button>
            </div>

            {kebForm.length > 0 ? (
              <div className="space-y-6">
                {Object.entries(groupedKebutuhan).map(([cat, items]) => {
                  const cfg = kategoriConfig[cat] || kategoriConfig.LAINNYA;
                  return (
                    <div key={cat} className="space-y-3">
                      <h4 className={cn("text-xs font-black uppercase tracking-widest", cfg.color)}>{cfg.label}</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {items.map(item => {
                          const percent = item.qty > 0 ? Math.min(100, Math.round((item.qtyFulfilled / item.qty) * 100)) : 0;
                          const isFull = percent >= 100;
                          return (
                            <div key={item.id} className="group relative bg-white border border-slate-200 rounded-2xl p-4 shadow-sm hover:shadow-md transition-all hover:border-slate-300">
                              <div className="flex justify-between items-start mb-4">
                                <div className="flex items-center gap-2">
                                  {isFull && <CheckCircle2 className="w-5 h-5 text-emerald-500" />}
                                  <h5 className="font-bold text-slate-800 line-clamp-1" title={item.nama}>{item.nama}</h5>
                                </div>
                                <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                                  <button onClick={() => setEditNeedItem(item)} className="p-1.5 bg-slate-50 hover:bg-blue-50 hover:text-blue-600 text-slate-400 rounded-lg transition-colors">
                                    <Edit3 className="w-3.5 h-3.5" />
                                  </button>
                                  <button onClick={() => deleteNeed(item.id)} className="p-1.5 bg-slate-50 hover:bg-red-50 hover:text-red-600 text-slate-400 rounded-lg transition-colors">
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>
                              
                              <div className="flex flex-col gap-1.5">
                                <div className="flex justify-between items-end">
                                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                    Terkumpul: <span className={cn("text-sm", isFull ? "text-emerald-600" : "text-slate-800")}>{item.qtyFulfilled}</span> <span className="text-slate-300">/</span> {item.qty} {item.satuan}
                                  </div>
                                  <span className={cn("text-xs font-black", isFull ? "text-emerald-500" : "text-blue-500")}>{percent}%</span>
                                </div>
                                <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                                  <div 
                                    className={cn("h-full rounded-full transition-all duration-1000", isFull ? "bg-emerald-500" : "bg-blue-500")} 
                                    style={{ width: `${percent}%` }}
                                  />
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-12 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                <Package className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                <p className="text-sm font-bold text-slate-600 mb-1">Belum ada daftar kebutuhan</p>
                <p className="text-xs text-slate-400">Silakan tambah kebutuhan untuk posko ini agar donatur dapat mengetahuinya.</p>
              </div>
            )}
          </section>
        </div>
      </div>

      {/* MODAL: EDIT DEMOGRAFI */}
      <Dialog open={isDemoModalOpen} onOpenChange={setIsDemoModalOpen}>
        <DialogContent className="max-w-2xl bg-white border-slate-100 p-0 overflow-hidden rounded-3xl">
          <div className="p-6 border-b border-slate-100 bg-slate-50/50">
            <DialogTitle className="text-lg font-black text-slate-800 flex items-center gap-2">
              <Users className="w-5 h-5 text-blue-600" /> Edit Profil Pengungsi
            </DialogTitle>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase">Dewasa</label>
                <input type="number" min="0" value={demoForm.jumlah_dewasa} onChange={e => setDemoForm({...demoForm, jumlah_dewasa: Number(e.target.value)})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm font-bold focus:border-blue-500 outline-none" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase">Anak-anak</label>
                <input type="number" min="0" value={demoForm.jumlah_anak} onChange={e => setDemoForm({...demoForm, jumlah_anak: Number(e.target.value)})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm font-bold focus:border-blue-500 outline-none" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase">Lansia</label>
                <input type="number" min="0" value={demoForm.jumlah_lansia} onChange={e => setDemoForm({...demoForm, jumlah_lansia: Number(e.target.value)})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm font-bold focus:border-emerald-500 outline-none" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-purple-600 uppercase">Ibu Hamil</label>
                <input type="number" min="0" value={demoForm.jumlah_ibu_hamil} onChange={e => setDemoForm({...demoForm, jumlah_ibu_hamil: Number(e.target.value)})} className="w-full bg-purple-50 border border-purple-200 text-purple-900 rounded-xl px-3 py-2 text-sm font-bold focus:border-purple-500 outline-none" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-orange-600 uppercase">Disabilitas</label>
                <input type="number" min="0" value={demoForm.jumlah_disabilitas} onChange={e => setDemoForm({...demoForm, jumlah_disabilitas: Number(e.target.value)})} className="w-full bg-orange-50 border border-orange-200 text-orange-900 rounded-xl px-3 py-2 text-sm font-bold focus:border-orange-500 outline-none" />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-1.5"><Clipboard className="w-3.5 h-3.5" /> Catatan Medis & Darurat</label>
              <textarea value={demoForm.catatan_medis_darurat} onChange={e => setDemoForm({...demoForm, catatan_medis_darurat: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-3 text-sm focus:border-blue-500 outline-none min-h-[100px]" placeholder="Misal: Butuh penanganan cepat untuk..." />
            </div>
          </div>
          <DialogFooter className="p-4 border-t border-slate-100 bg-slate-50">
            <Button variant="ghost" onClick={() => setIsDemoModalOpen(false)} className="rounded-xl font-bold text-slate-500">Batal</Button>
            <Button disabled={isSaving} onClick={saveDemografi} className="rounded-xl font-bold bg-blue-600 hover:bg-blue-700 text-white px-6 shadow-sm shadow-blue-600/20">
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null} Simpan Profil
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* MODAL: ADD KEBUTUHAN */}
      <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <DialogContent className="max-w-md bg-white border-slate-100 p-0 overflow-hidden rounded-3xl">
          <div className="p-5 border-b border-slate-100 bg-slate-50/50">
            <DialogTitle className="text-lg font-black text-slate-800 flex items-center gap-2">
              <Package className="w-5 h-5 text-amber-500" /> Tambah Kebutuhan Baru
            </DialogTitle>
          </div>
          <div className="p-5 space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase">Kategori</label>
              <select 
                value={addNeedForm.kategori} 
                onChange={e => setAddNeedForm({...addNeedForm, kategori: e.target.value as KebutuhanKategori})}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm font-bold focus:border-amber-500 outline-none"
              >
                {Object.entries(kategoriConfig).map(([k, cfg]) => (
                  <option key={k} value={k}>{cfg.label}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase">Nama Barang</label>
              <input 
                type="text" 
                value={addNeedForm.nama} 
                onChange={e => setAddNeedForm({...addNeedForm, nama: e.target.value})}
                placeholder="Contoh: Beras Premium"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm font-bold focus:border-amber-500 outline-none" 
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase">Jumlah Dibutuhkan</label>
                <input 
                  type="number" min="1" 
                  value={addNeedForm.qty} 
                  onChange={e => setAddNeedForm({...addNeedForm, qty: Number(e.target.value)})}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm font-bold focus:border-amber-500 outline-none" 
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase">Satuan</label>
                <input 
                  type="text" 
                  value={addNeedForm.satuan} 
                  onChange={e => setAddNeedForm({...addNeedForm, satuan: e.target.value})}
                  placeholder="Kg, Dus, dsb."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm font-bold focus:border-amber-500 outline-none" 
                />
              </div>
            </div>
          </div>
          <DialogFooter className="p-4 border-t border-slate-100 bg-slate-50">
            <Button variant="ghost" onClick={() => setIsAddModalOpen(false)} className="rounded-xl font-bold text-slate-500">Batal</Button>
            <Button disabled={isSaving} onClick={saveNewNeed} className="rounded-xl font-bold bg-amber-500 hover:bg-amber-600 text-white px-6 shadow-sm shadow-amber-500/20">
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Plus className="w-4 h-4 mr-1.5" />} Tambahkan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* MODAL: EDIT KEBUTUHAN */}
      <Dialog open={!!editNeedItem} onOpenChange={(open) => !open && setEditNeedItem(null)}>
        <DialogContent className="max-w-md bg-white border-slate-100 p-0 overflow-hidden rounded-3xl">
          <div className="p-5 border-b border-slate-100 bg-slate-50/50">
            <DialogTitle className="text-lg font-black text-slate-800 flex items-center gap-2">
              <Edit3 className="w-5 h-5 text-blue-600" /> Edit Kebutuhan
            </DialogTitle>
          </div>
          {editNeedItem && (
            <div className="p-5 space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase">Kategori</label>
                <select 
                  value={editNeedItem.kategori} 
                  onChange={e => setEditNeedItem({...editNeedItem, kategori: e.target.value as KebutuhanKategori})}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm font-bold focus:border-blue-500 outline-none"
                >
                  {Object.entries(kategoriConfig).map(([k, cfg]) => (
                    <option key={k} value={k}>{cfg.label}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase">Nama Barang</label>
                <input 
                  type="text" 
                  value={editNeedItem.nama} 
                  onChange={e => setEditNeedItem({...editNeedItem, nama: e.target.value})}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm font-bold focus:border-blue-500 outline-none" 
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase">Total Target Kebutuhan</label>
                <input 
                  type="number" min={Math.max(1, editNeedItem.qtyFulfilled)} 
                  value={editNeedItem.qty} 
                  onChange={e => setEditNeedItem({...editNeedItem, qty: Number(e.target.value)})}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm font-bold focus:border-blue-500 outline-none" 
                />
                <p className="text-[10px] text-slate-400 font-medium">Harus lebih besar atau sama dengan jumlah yang sudah terpenuhi ({editNeedItem.qtyFulfilled}).</p>
              </div>
            </div>
          )}
          <DialogFooter className="p-4 border-t border-slate-100 bg-slate-50">
            <Button variant="ghost" onClick={() => setEditNeedItem(null)} className="rounded-xl font-bold text-slate-500">Batal</Button>
            <Button disabled={isSaving} onClick={saveEditNeed} className="rounded-xl font-bold bg-blue-600 hover:bg-blue-700 text-white px-6 shadow-sm shadow-blue-600/20">
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null} Simpan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
}
