export interface InventoryDonasiItem {
  id: string;
  itemName: string;
  category: string;
  qtyDonated: number;
  latitude: number;
  longitude: number;
  alamatPickup: string;
  status: "PENDING" | "DELIVERY" | "ACCEPTED" | "REJECTED";
  createdAt: string;
  updatedAt: string;
  donatur: {
    id: string;
    name: string;
    email: string;
    phone: string;
  } | null;
}

export interface InventoryStockItem {
  id: string;
  itemName: string;
  category: string;
  qtyAvailable: number;
  qtyBooked: number;
  qtyFree: number;
}

export interface InventoryGudang {
  id: string;
  name: string;
  alamat: string;
}

export interface InventoryDashboard {
  inventoryLocationId: string;
  gudang: InventoryGudang | null;
  stok: InventoryStockItem[];
  posko: {
    id: string;
    name: string;
    alamat: string;
    kebutuhan: unknown[];
  }[];
}

export interface InventoryStatCard {
  label: string;
  value: number;
  icon: string;
  color: string;
}
