"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Package, Truck, ClipboardList, Plus, Pencil, Trash2, Loader2,
  Warehouse, ArrowLeftRight, AlertTriangle, RefreshCw,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { mapService } from "@/services/map.service";
import { inventoryService } from "@/services/inventory.service";
import { DonasiCard } from "@/components/inventory/DonasiCard";
import { StockFormDialog } from "@/components/inventory/StockFormDialog";
import { ToastContainer, useToast } from "@/components/ui/toast";
import type { InventoryDonasiItem, InventoryStockItem, InventoryDashboard } from "@/types/inventory";
import type { StatsResponse } from "@/types/map";

type Tab = "masuk" | "delivery" | "stok";

const TABS: { key: Tab; label: string; icon: typeof Package }[] = [
  { key: "masuk", label: "Donasi Masuk", icon: Package },
  { key: "delivery", label: "Dalam Perjalanan", icon: Truck },
  { key: "stok", label: "Stok Gudang", icon: ClipboardList },
];

export function InventoryManager() {
  const { toasts, show, dismiss } = useToast();

  const [tab, setTab] = useState<Tab>("masuk");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [stats, setStats] = useState<StatsResponse | null>(null);
  const [donasi, setDonasi] = useState<InventoryDonasiItem[]>([]);
  const [dashboard, setDashboard] = useState<InventoryDashboard | null>(null);

  const [stockDialogOpen, setStockDialogOpen] = useState(false);
  const [editItem, setEditItem] = useState<InventoryStockItem | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [statsData, donasiData, dashboardData] = await Promise.all([
        mapService.getStats(),
        inventoryService.getDonasiMasuk(),
        inventoryService.getDashboard(),
      ]);
      setStats(statsData);
      setDonasi(donasiData);
      setDashboard(dashboardData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal memuat data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const refreshDonasi = useCallback(async () => {
    try {
      const donasiData = await inventoryService.getDonasiMasuk();
      setDonasi(donasiData);
    } catch { /* silent */ }
  }, []);

  const refreshDashboard = useCallback(async () => {
    try {
      const dashData = await inventoryService.getDashboard();
      setDashboard(dashData);
    } catch { /* silent */ }
  }, []);

  const handleAccept = useCallback(async (id: string) => {
    setActionLoading(id);
    try {
      await inventoryService.acceptDonasi(id);
      show("success", "Donasi diterima", "Status diubah ke Dalam Perjalanan");
      await refreshDonasi();
    } catch (err) {
      show("error", "Gagal menerima donasi", err instanceof Error ? err.message : undefined);
    } finally {
      setActionLoading(null);
    }
  }, [show, refreshDonasi]);

  const handleConfirm = useCallback(async (id: string) => {
    setActionLoading(id);
    try {
      await inventoryService.confirmDonasi(id);
      show("success", "Donasi dikonfirmasi", "Barang sudah tercatat di stok gudang");
      await Promise.all([refreshDonasi(), refreshDashboard()]);
    } catch (err) {
      show("error", "Gagal konfirmasi donasi", err instanceof Error ? err.message : undefined);
    } finally {
      setActionLoading(null);
    }
  }, [show, refreshDonasi, refreshDashboard]);

  const handleReject = useCallback(async (id: string) => {
    setActionLoading(id);
    try {
      await inventoryService.rejectDonasi(id);
      show("success", "Donasi ditolak");
      await refreshDonasi();
    } catch (err) {
      show("error", "Gagal menolak donasi", err instanceof Error ? err.message : undefined);
    } finally {
      setActionLoading(null);
    }
  }, [show, refreshDonasi]);

  const handleAddStock = useCallback(async (data: { itemName: string; category: string; qtyAvailable: number }) => {
    try {
      await inventoryService.addStock(data);
      show("success", "Stok berhasil ditambahkan");
      await refreshDashboard();
    } catch (err) {
      show("error", "Gagal menambah stok", err instanceof Error ? err.message : undefined);
      throw err;
    }
  }, [show, refreshDashboard]);

  const handleEditStock = useCallback(async (data: { itemName?: string; category?: string; qtyAvailable?: number }) => {
    if (!editItem) return;
    try {
      await inventoryService.editStock(editItem.id, data);
      show("success", "Stok berhasil diubah");
      setEditItem(null);
      await refreshDashboard();
    } catch (err) {
      show("error", "Gagal mengubah stok", err instanceof Error ? err.message : undefined);
      throw err;
    }
  }, [editItem, show, refreshDashboard]);

  const handleDeleteStock = useCallback(async (id: string, name: string) => {
    setActionLoading(id);
    try {
      await inventoryService.deleteStock(id);
      show("success", `"${name}" berhasil dihapus`);
      await refreshDashboard();
    } catch (err) {
      show("error", "Gagal menghapus stok", err instanceof Error ? err.message : undefined);
    } finally {
      setActionLoading(null);
    }
  }, [show, refreshDashboard]);

  const openEditDialog = (item: InventoryStockItem) => {
    setEditItem(item);
    setStockDialogOpen(true);
  };

  const openAddDialog = () => {
    setEditItem(null);
    setStockDialogOpen(true);
  };

  const pendingDonasi = donasi.filter((d) => d.status === "PENDING");
  const deliveryDonasi = donasi.filter((d) => d.status === "DELIVERY");

  if (loading && !stats && !donasi.length) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-6 h-full flex flex-col">
      <ToastContainer toasts={toasts} onDismiss={dismiss} />

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-3">
          <Warehouse className="w-6 h-6 text-blue-600" />
          Manajemen Inventory
          {dashboard?.gudang && (
            <span className="text-sm font-semibold text-slate-500 bg-slate-100 px-3 py-1 rounded-full">
              {dashboard.gudang.name}
            </span>
          )}
        </h1>
        <button
          onClick={fetchData}
          disabled={loading}
          className="flex items-center gap-2 text-sm font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 px-4 py-2 rounded-xl transition-colors disabled:opacity-50"
        >
          <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} />
          Refresh
        </button>
      </div>

      {error && (
        <div className="mb-6 flex items-center gap-3 bg-rose-50 border border-rose-200 text-rose-700 px-4 py-3 rounded-xl text-sm font-medium">
          <AlertTriangle className="w-5 h-5 shrink-0" />
          {error}
          <button onClick={fetchData} className="ml-auto text-rose-600 underline hover:no-underline font-bold">
            Coba Lagi
          </button>
        </div>
      )}

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {[
            { label: "Total Donasi Masuk", value: stats.totalDonasiPending, icon: Package, color: "bg-amber-50 text-amber-600 border-amber-200" },
            { label: "Dalam Perjalanan", value: stats.totalDonasiDelivery, icon: Truck, color: "bg-blue-50 text-blue-600 border-blue-200" },
            { label: "Total Item Stok", value: stats.totalInventoryItems, icon: Warehouse, color: "bg-emerald-50 text-emerald-600 border-emerald-200" },
            { label: "Relawan Aktif", value: stats.totalRelawanAktif, icon: ArrowLeftRight, color: "bg-purple-50 text-purple-600 border-purple-200" },
          ].map((card) => (
            <div key={card.label} className="border border-slate-200 rounded-2xl p-4 bg-white">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">{card.label}</p>
                <div className={cn("w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold border", card.color)}>
                  <card.icon className="w-4 h-4" />
                </div>
              </div>
              <p className="text-3xl font-black text-slate-800 tabular-nums">{card.value}</p>
            </div>
          ))}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 border-b border-slate-200 mb-6">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={cn(
              "flex items-center gap-2 px-5 py-3 text-sm font-bold border-b-2 transition-colors -mb-px",
              tab === t.key
                ? "text-blue-600 border-blue-600"
                : "text-slate-500 border-transparent hover:text-slate-700 hover:border-slate-300"
            )}
          >
            <t.icon className="w-4 h-4" />
            {t.label}
            {t.key === "masuk" && pendingDonasi.length > 0 && (
              <span className="bg-amber-100 text-amber-700 text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                {pendingDonasi.length}
              </span>
            )}
            {t.key === "delivery" && deliveryDonasi.length > 0 && (
              <span className="bg-blue-100 text-blue-700 text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                {deliveryDonasi.length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Tab: Donasi Masuk */}
      {tab === "masuk" && (
        <div className="flex-1 space-y-4 overflow-y-auto">
          {loading && <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 text-blue-500 animate-spin" /></div>}
          {!loading && pendingDonasi.length === 0 && (
            <div className="text-center py-12 text-slate-500">
              <Package className="w-12 h-12 mx-auto mb-3 text-slate-300" />
              <p className="font-bold text-slate-400">Tidak ada donasi masuk</p>
              <p className="text-sm mt-1">Donasi akan muncul di sini setelah donatur mengirim.</p>
            </div>
          )}
          {!loading && pendingDonasi.map((d) => (
            <DonasiCard
              key={d.id}
              donasi={d}
              onAccept={handleAccept}
              onConfirm={handleConfirm}
              onReject={handleReject}
            />
          ))}
        </div>
      )}

      {/* Tab: Dalam Perjalanan */}
      {tab === "delivery" && (
        <div className="flex-1 space-y-4 overflow-y-auto">
          {loading && <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 text-blue-500 animate-spin" /></div>}
          {!loading && deliveryDonasi.length === 0 && (
            <div className="text-center py-12 text-slate-500">
              <Truck className="w-12 h-12 mx-auto mb-3 text-slate-300" />
              <p className="font-bold text-slate-400">Tidak ada barang dalam perjalanan</p>
              <p className="text-sm mt-1">Barang yang sudah diterima akan muncul di sini.</p>
            </div>
          )}
          {!loading && deliveryDonasi.map((d) => (
            <DonasiCard
              key={d.id}
              donasi={d}
              onAccept={handleAccept}
              onConfirm={handleConfirm}
              onReject={handleReject}
            />
          ))}
        </div>
      )}

      {/* Tab: Stok Gudang */}
      {tab === "stok" && (
        <div className="flex-1 overflow-y-auto">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm font-semibold text-slate-500">
              {dashboard?.stok.length ?? 0} item stok
            </p>
            <button
              onClick={openAddDialog}
              className="flex items-center gap-2 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-xl transition-colors shadow-sm"
            >
              <Plus className="w-4 h-4" />
              Tambah Stok
            </button>
          </div>

          {loading && <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 text-blue-500 animate-spin" /></div>}

          {!loading && (!dashboard?.stok || dashboard.stok.length === 0) && (
            <div className="text-center py-12 text-slate-500">
              <ClipboardList className="w-12 h-12 mx-auto mb-3 text-slate-300" />
              <p className="font-bold text-slate-400">Stok kosong</p>
              <p className="text-sm mt-1">Tambahkan stok untuk mulai mengelola inventory.</p>
            </div>
          )}

          {!loading && dashboard?.stok && dashboard.stok.length > 0 && (
            <div className="border border-slate-200 rounded-2xl overflow-hidden bg-white">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    <th className="text-left px-5 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Nama Barang</th>
                    <th className="text-left px-5 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Kategori</th>
                    <th className="text-right px-5 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Stok</th>
                    <th className="text-right px-5 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Terbooking</th>
                    <th className="text-right px-5 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Tersedia</th>
                    <th className="text-right px-5 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {dashboard.stok.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-5 py-4 font-semibold text-slate-800">{item.itemName}</td>
                      <td className="px-5 py-4">
                        <span className={cn(
                          "text-[10px] font-bold px-2 py-0.5 rounded-full border",
                          item.category === "MAKANAN" ? "bg-orange-50 text-orange-700 border-orange-200" :
                          item.category === "PAKAIAN" ? "bg-blue-50 text-blue-700 border-blue-200" :
                          item.category === "OBAT" ? "bg-purple-50 text-purple-700 border-purple-200" :
                          "bg-slate-100 text-slate-700 border-slate-200"
                        )}>
                          {item.category}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-right font-bold text-slate-800 tabular-nums">{item.qtyAvailable}</td>
                      <td className="px-5 py-4 text-right text-slate-500 tabular-nums">{item.qtyBooked}</td>
                      <td className="px-5 py-4 text-right">
                        <span className={cn(
                          "font-bold tabular-nums",
                          item.qtyFree <= 0 ? "text-rose-600" : "text-emerald-600"
                        )}>
                          {item.qtyFree}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => openEditDialog(item)}
                            className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Edit"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              if (confirm(`Hapus "${item.itemName}"?`)) {
                                handleDeleteStock(item.id, item.itemName);
                              }
                            }}
                            disabled={actionLoading === item.id}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors disabled:opacity-50"
                            title="Hapus"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      <StockFormDialog
        open={stockDialogOpen}
        onOpenChange={setStockDialogOpen}
        onSubmit={editItem ? handleEditStock : handleAddStock}
        editItem={editItem}
      />
    </div>
  );
}
