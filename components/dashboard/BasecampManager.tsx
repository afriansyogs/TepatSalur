"use client";

import { useState, useEffect } from "react";
import { Warehouse, MapPinPlus, Plus, Edit3, Package, Trash2, Search, X, ArrowLeft, Save, ChevronDown, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { superAdminService } from "@/services/super-admin.service";
import { PoskoLocationData, InventoryLocationData } from "@/types/super-admin";

type StokKategori = "makanan" | "minuman" | "medis" | "sanitasi" | "perlengkapan" | "lainnya" | string;

type StokItem = {
  id: string;
  kategori: StokKategori;
  nama: string;
  qty: number;
  satuan: string;
};

const kategoriConfig: Record<string, { label: string; color: string; bgColor: string; items: { nama: string; satuan: string }[] }> = {
  makanan: {
    label: "Makanan",
    color: "text-amber-700",
    bgColor: "bg-amber-50 border-amber-200",
    items: [
      { nama: "Beras", satuan: "Kg" },
      { nama: "Mie Instan", satuan: "Dus" },
      { nama: "Biskuit", satuan: "Dus" },
      { nama: "Makanan Kaleng", satuan: "Dus" },
      { nama: "Makanan Bayi", satuan: "Dus" },
      { nama: "Susu Formula", satuan: "Karton" },
    ],
  },
  minuman: {
    label: "Minuman",
    color: "text-blue-700",
    bgColor: "bg-blue-50 border-blue-200",
    items: [
      { nama: "Air Mineral", satuan: "Dus" },
      { nama: "Oralit", satuan: "Box" },
      { nama: "Susu UHT", satuan: "Karton" },
    ],
  },
  medis: {
    label: "Kebutuhan Medis",
    color: "text-rose-700",
    bgColor: "bg-rose-50 border-rose-200",
    items: [
      { nama: "Paracetamol Dewasa", satuan: "Box" },
      { nama: "Paracetamol Anak", satuan: "Box" },
      { nama: "Obat Diare", satuan: "Box" },
      { nama: "Obat Luka (Betadine)", satuan: "Botol" },
      { nama: "Perban & Kasa", satuan: "Box" },
      { nama: "Masker Medis", satuan: "Box" },
      { nama: "Sarung Tangan Medis", satuan: "Box" },
      { nama: "Infus Set", satuan: "Set" },
      { nama: "Antiseptik", satuan: "Botol" },
    ],
  },
  sanitasi: {
    label: "Sanitasi & Kebersihan",
    color: "text-teal-700",
    bgColor: "bg-teal-50 border-teal-200",
    items: [
      { nama: "Sabun Mandi", satuan: "Pcs" },
      { nama: "Sabun Cuci", satuan: "Pcs" },
      { nama: "Sikat Gigi", satuan: "Pcs" },
      { nama: "Pembalut Wanita", satuan: "Pack" },
      { nama: "Popok Bayi", satuan: "Bal" },
      { nama: "Popok Dewasa", satuan: "Bal" },
      { nama: "Tisu Basah", satuan: "Pack" },
    ],
  },
  perlengkapan: {
    label: "Perlengkapan",
    color: "text-indigo-700",
    bgColor: "bg-indigo-50 border-indigo-200",
    items: [
      { nama: "Selimut", satuan: "Pcs" },
      { nama: "Tikar / Matras", satuan: "Pcs" },
      { nama: "Terpal", satuan: "Lembar" },
      { nama: "Pakaian Layak Pakai", satuan: "Stel" },
      { nama: "Genset", satuan: "Unit" },
      { nama: "Lampu Emergency", satuan: "Pcs" },
    ],
  },
  lainnya: {
    label: "Lainnya",
    color: "text-slate-700",
    bgColor: "bg-slate-100 border-slate-200",
    items: [],
  },
};

const allKategoriKeys = Object.keys(kategoriConfig);

type ViewMode = "list" | "edit-basecamp";

export function BasecampManager() {
  const [basecamps, setBasecamps] = useState<InventoryLocationData[]>([]);
  const [poskos, setPoskos] = useState<PoskoLocationData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [editingBasecampId, setEditingBasecampId] = useState<string | null>(null);
  const [editingStok, setEditingStok] = useState<StokItem[]>([]);
  
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"basecamp" | "posko">("basecamp");
  const [isSaving, setIsSaving] = useState(false);
  const [showPicker, setShowPicker] = useState(false);
  const [pickerKategori, setPickerKategori] = useState<string>("makanan");

  const fetchData = async () => {
    try {
      const res = await superAdminService.getLocations();
      setBasecamps(res.data.inventories);
      setPoskos(res.data.poskos);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const getSatuanForName = (name: string, category: string) => {
    const config = kategoriConfig[category];
    if (config) {
      const item = config.items.find(i => i.nama === name);
      if (item) return item.satuan;
    }
    return "Pcs";
  };

  const handleEditBasecamp = (bc: InventoryLocationData) => {
    const mappedStok = bc.needs.map(n => ({
      id: n.id || `temp-${Math.random()}`,
      kategori: n.category,
      nama: n.item_name,
      qty: n.qty_available,
      satuan: getSatuanForName(n.item_name, n.category)
    }));
    setEditingBasecampId(bc.id);
    setEditingStok(mappedStok);
    setViewMode("edit-basecamp");
    setShowPicker(false);
  };

  const handleSaveBasecamp = async () => {
    if (!editingBasecampId) return;
    setIsSaving(true);
    try {
      const payload = {
        needs: editingStok.map(s => ({
          item_name: s.nama,
          category: (s.kategori || "lainnya").toUpperCase(),
          qty_available: s.qty,
          satuan: s.satuan
        }))
      };
      await superAdminService.updateInventoryStock(editingBasecampId, payload);
      await fetchData();
      setViewMode("list");
      setEditingBasecampId(null);
    } catch (err) {
      console.error(err);
      alert("Gagal menyimpan stok");
    } finally {
      setIsSaving(false);
    }
  };

  const addFromPicker = (nama: string, satuan: string) => {
    const exists = editingStok.some(s => s.nama === nama && s.kategori === pickerKategori);
    if (exists) return;
    setEditingStok([...editingStok, { id: `s-${Date.now()}-${Math.random()}`, kategori: pickerKategori, nama, qty: 0, satuan }]);
  };

  const addCustomStok = () => {
    setEditingStok([...editingStok, { id: `s-custom-${Date.now()}`, kategori: "lainnya", nama: "", qty: 0, satuan: "Pcs" }]);
  };

  const updateStok = (id: string, field: keyof StokItem, value: string | number) => {
    setEditingStok(editingStok.map(s => s.id === id ? { ...s, [field]: value } : s));
  };

  const removeStok = (id: string) => {
    setEditingStok(editingStok.filter(s => s.id !== id));
  };

  const groupedStok = editingStok.reduce<Record<string, StokItem[]>>((acc, item) => {
    const cat = item.kategori || "lainnya";
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(item);
    return acc;
  }, {});

  const currentEditingBasecamp = basecamps.find(b => b.id === editingBasecampId);

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
      </div>
    );
  }

  if (viewMode === "edit-basecamp" && currentEditingBasecamp) {
    return (
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden flex flex-col h-full animate-in slide-in-from-bottom-4 duration-300">
        <div className="flex items-center justify-between p-6 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-4">
            <button
              onClick={() => { setViewMode("list"); setEditingBasecampId(null); }}
              className="p-2 bg-white border border-slate-200 hover:bg-slate-100 rounded-full transition-colors text-slate-500 shadow-sm"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h2 className="text-xl font-black text-slate-800">{currentEditingBasecamp.name}</h2>
              <p className="text-xs font-semibold text-slate-500 mt-1 uppercase tracking-wider">Edit Stok Basecamp</p>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-auto p-6">
          <div className="max-w-4xl mx-auto space-y-6">
            <section className="bg-white p-6 rounded-3xl border border-slate-200 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
                  <Package className="w-5 h-5 text-emerald-600" /> Inventaris Stok
                </h3>
                <div className="flex gap-2">
                  <button
                    onClick={addCustomStok}
                    className="text-xs font-bold text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 px-3 py-1.5 rounded-lg transition-colors"
                  >
                    + Custom
                  </button>
                  <button
                    onClick={() => setShowPicker(!showPicker)}
                    className="text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 hover:bg-emerald-100 px-3 py-1.5 rounded-lg flex items-center gap-1 transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" /> Pilih Barang
                    <ChevronDown className={cn("w-3.5 h-3.5 transition-transform", showPicker && "rotate-180")} />
                  </button>
                </div>
              </div>

              {/* Item Picker */}
              {showPicker && (
                <div className="bg-white border border-slate-200 rounded-2xl shadow-lg p-4 mb-5 animate-in slide-in-from-top-2 duration-200">
                  <div className="flex gap-1.5 mb-4 overflow-x-auto pb-1 scrollbar-hide">
                    {allKategoriKeys.filter(k => k !== "lainnya").map(k => (
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
                      const alreadyAdded = editingStok.some(s => s.nama === item.nama && s.kategori === pickerKategori);
                      return (
                        <button
                          key={item.nama}
                          disabled={alreadyAdded}
                          onClick={() => addFromPicker(item.nama, item.satuan)}
                          className={cn(
                            "px-3 py-2 rounded-xl text-xs font-bold border transition-all",
                            alreadyAdded
                              ? "bg-emerald-50 text-emerald-600 border-emerald-200 cursor-default"
                              : "bg-white text-slate-700 border-slate-200 hover:bg-emerald-50 hover:border-emerald-300 hover:text-emerald-700"
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

              {/* Grouped Stock Items */}
              {Object.keys(groupedStok).length > 0 ? (
                <div className="space-y-3">
                  {Object.entries(groupedStok).map(([cat, items]) => {
                    const cfg = kategoriConfig[cat] || kategoriConfig["lainnya"];
                    return (
                      <div key={cat} className={cn("rounded-2xl border p-4", cfg.bgColor)}>
                        <p className={cn("text-[10px] font-black uppercase tracking-widest mb-3", cfg.color)}>{cfg.label}</p>
                        <div className="space-y-2">
                          {items.map(item => (
                            <div key={item.id} className="flex flex-wrap sm:flex-nowrap items-center gap-2 bg-white rounded-xl px-3 py-2 border border-white/80 shadow-sm">
                              <span className="flex-1 w-full sm:w-auto text-sm font-bold text-slate-800 truncate">
                                {item.kategori === "lainnya" ? (
                                  <input
                                    type="text"
                                    value={item.nama}
                                    onChange={e => updateStok(item.id, "nama", e.target.value)}
                                    className="w-full bg-transparent outline-none text-sm font-bold placeholder:text-slate-300"
                                    placeholder="Nama barang..."
                                  />
                                ) : (
                                  item.nama
                                )}
                              </span>
                              <div className="flex items-center gap-2 ml-auto">
                                <input
                                  type="number"
                                  value={item.qty}
                                  onChange={e => updateStok(item.id, "qty", Number(e.target.value))}
                                  className="w-20 text-center bg-slate-50 border border-slate-200 rounded-lg px-1 py-1.5 text-sm font-black outline-none focus:border-emerald-400"
                                />
                                {item.kategori === "lainnya" ? (
                                  <input
                                    type="text"
                                    value={item.satuan}
                                    onChange={e => updateStok(item.id, "satuan", e.target.value)}
                                    className="w-16 text-center bg-slate-50 border border-slate-200 rounded-lg px-1 py-1.5 text-xs font-semibold text-slate-600 outline-none focus:border-emerald-400"
                                    placeholder="Pcs"
                                  />
                                ) : (
                                  <span className="text-xs font-semibold text-slate-400 w-14 text-center">{item.satuan}</span>
                                )}
                                <button onClick={() => removeStok(item.id)} className="p-1 text-slate-400 hover:text-red-500 transition-colors">
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
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
                  <p className="text-xs font-bold text-slate-400">Belum ada stok. Klik "Pilih Barang" atau "+ Custom" untuk menambahkan.</p>
                </div>
              )}
            </section>
          </div>
        </div>

        <div className="p-6 border-t border-slate-100 bg-white flex justify-end">
          <button
            onClick={handleSaveBasecamp}
            disabled={isSaving}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm px-8 py-3.5 rounded-2xl flex items-center gap-2 transition-all shadow-[0_8px_24px_rgba(5,150,105,0.3)] disabled:opacity-70 disabled:shadow-none"
          >
            {isSaving ? (
              <><Loader2 className="w-5 h-5 animate-spin" /> Menyimpan...</>
            ) : (
              <><Save className="w-5 h-5" /> Simpan Perubahan</>
            )}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex gap-2 bg-white rounded-2xl border border-slate-200 p-1.5 shadow-sm w-fit">
        <button
          onClick={() => setActiveTab("basecamp")}
          className={cn(
            "px-5 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-2",
            activeTab === "basecamp" ? "bg-slate-900 text-white shadow-sm" : "text-slate-500 hover:text-slate-800 hover:bg-slate-50"
          )}
        >
          <Warehouse className="w-4 h-4" /> Basecamp
        </button>
        <button
          onClick={() => setActiveTab("posko")}
          className={cn(
            "px-5 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-2",
            activeTab === "posko" ? "bg-slate-900 text-white shadow-sm" : "text-slate-500 hover:text-slate-800 hover:bg-slate-50"
          )}
        >
          <MapPinPlus className="w-4 h-4" /> Posko
        </button>
      </div>

      {activeTab === "basecamp" ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-black text-slate-800">Daftar Basecamp</h2>
              <p className="text-sm text-slate-500 mt-1">Kelola pusat logistik dan distribusi bantuan.</p>
            </div>
            {/* 
            <button className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm px-5 py-2.5 rounded-xl flex items-center gap-2 transition-colors shadow-sm hidden">
              <Plus className="w-4 h-4" /> Tambah Basecamp
            </button>
            */}
          </div>

          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Cari basecamp..."
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:border-blue-500 focus:outline-none shadow-sm"
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {basecamps
              .filter(bc => bc.name.toLowerCase().includes(searchQuery.toLowerCase()))
              .map(bc => {
                const grouped = bc.needs.reduce<Record<string, typeof bc.needs>>((acc, s) => {
                  const cat = s.category || "lainnya";
                  if (!acc[cat]) acc[cat] = [];
                  acc[cat].push(s);
                  return acc;
                }, {});

                return (
                  <div key={bc.id} className="bg-white border border-slate-200 rounded-3xl p-6 hover:border-emerald-300 hover:shadow-lg transition-all group flex flex-col h-full">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-lg font-black text-slate-800">{bc.name}</h3>
                        <p className="text-xs text-slate-500 mt-1 line-clamp-2">{bc.alamat}</p>
                        <p className="text-xs text-slate-400 mt-1 flex items-center gap-1">
                          <Warehouse className="w-3.5 h-3.5" /> 
                          {bc.totalVolunteers} Relawan Aktif
                        </p>
                      </div>
                      <button
                        onClick={() => handleEditBasecamp(bc)}
                        className="p-2.5 rounded-xl bg-slate-50 group-hover:bg-emerald-50 text-slate-400 group-hover:text-emerald-600 transition-colors shrink-0 ml-2"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="space-y-2 mt-auto">
                      {Object.entries(grouped).map(([cat, items]) => {
                        const cfg = kategoriConfig[cat] || kategoriConfig["lainnya"];
                        return (
                          <div key={cat}>
                            <p className={cn("text-[10px] font-bold uppercase tracking-wider mb-1", cfg.color)}>{cfg.label}</p>
                            <div className="flex flex-wrap gap-1.5">
                              {items.map(s => (
                                <span key={s.id} className={cn("inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold border", cfg.bgColor, cfg.color)}>
                                  {s.item_name}: <span className="text-slate-900 ml-0.5">{s.qty_available} {getSatuanForName(s.item_name, s.category)}</span>
                                </span>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-black text-slate-800">Daftar Posko</h2>
              <p className="text-sm text-slate-500 mt-1">Lihat semua posko pengungsi yang terdaftar.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
            {poskos.map(p => (
              <div key={p.id} className="bg-white border border-slate-200 rounded-3xl p-6 hover:border-blue-300 hover:shadow-lg transition-all">
                <h3 className="text-lg font-black text-slate-800 mb-1 line-clamp-1" title={p.name}>{p.name}</h3>
                <p className="text-xs text-slate-500 mb-4 line-clamp-2" title={p.alamat}>{p.alamat}</p>
                <div className="flex gap-3">
                  <div className="flex-1 bg-blue-50 rounded-2xl p-3 text-center border border-blue-100 flex flex-col justify-center">
                    <p className="text-lg font-black text-blue-700">{p.urgencyScore}</p>
                    <p className="text-[10px] font-bold text-blue-400 uppercase tracking-wider mt-1">Urgensi</p>
                  </div>
                  <div className="flex-1 bg-emerald-50 rounded-2xl p-3 text-center border border-emerald-100 flex flex-col justify-center">
                    <p className="text-lg font-black text-emerald-700">{p.totalVolunteers}</p>
                    <p className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider mt-1">Relawan</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
