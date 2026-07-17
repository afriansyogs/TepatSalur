import type { InventoryDonasiItem, InventoryDashboard } from "@/types/inventory";

export const inventoryService = {
  getDashboard: async (): Promise<InventoryDashboard> => {
    const res = await fetch("/api/relawan/inventory");
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || "Gagal mengambil data dashboard");
    return json.data as InventoryDashboard;
  },

  getDonasiMasuk: async (): Promise<InventoryDonasiItem[]> => {
    const res = await fetch("/api/relawan/inventory/donasi");
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || "Gagal mengambil data donasi");
    return json.data as InventoryDonasiItem[];
  },

  acceptDonasi: async (id: string): Promise<void> => {
    const res = await fetch(`/api/relawan/inventory/donasi/${id}/accept`, { method: "POST" });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || "Gagal menerima donasi");
  },

  confirmDonasi: async (id: string): Promise<void> => {
    const res = await fetch(`/api/relawan/inventory/donasi/${id}/confirm`, { method: "POST" });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || "Gagal mengonfirmasi donasi");
  },

  rejectDonasi: async (id: string): Promise<void> => {
    const res = await fetch(`/api/relawan/inventory/donasi/${id}/reject`, { method: "POST" });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || "Gagal menolak donasi");
  },

  addStock: async (data: { itemName: string; category: string; qtyAvailable: number }): Promise<{ id: string }> => {
    const res = await fetch("/api/relawan/inventory/items", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || "Gagal menambah stok");
    return json.data as { id: string };
  },

  editStock: async (id: string, data: { itemName?: string; category?: string; qtyAvailable?: number }): Promise<void> => {
    const res = await fetch(`/api/relawan/inventory/items/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || "Gagal mengedit stok");
  },

  deleteStock: async (id: string): Promise<void> => {
    const res = await fetch(`/api/relawan/inventory/items/${id}`, { method: "DELETE" });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || "Gagal menghapus stok");
  },
};
