export interface DonasiFormInput {
  poskoIds: string[];
  kategori: 'makanan' | 'pakaian' | 'medis' | 'logistik' | 'uang';
  namaBarang?: string;
  jumlah: number;
  satuan: string;
  metodePengiriman: 'kurir' | 'antar_langsung' | 'jemput';
  namaDonatur: string;
  kontak: string;
  deskripsi: string;
}

export interface DonasiRecord extends DonasiFormInput {
  id: string;
  tanggal: string;
}

export type KebutuhanCategory = "MAKANAN" | "PAKAIAN" | "OBAT" | "LAINNYA";

export interface DonationItemInput {
  itemName: string;
  category: KebutuhanCategory;
  qtyDonated: number;
}

export interface DonasiInsertPayload {
  items: DonationItemInput[];
  latitude: number;
  longitude: number;
  alamatPickup: string;
  recommendedInventoryId?: string;
}

export interface RecommendedInventory {
  id: string;
  name: string;
  alamat: string | null;
  latitude: number;
  longitude: number;
  distanceKm: number;
}

export interface DonasiResponse {
  donationIds: string[];
  recommendedInventory: RecommendedInventory;
}

export interface DonationHistoryRecord {
  id: string;
  donaturId: string;
  itemName: string;
  category: KebutuhanCategory;
  qtyDonated: number;
  latitude: number;
  longitude: number;
  alamatPickup: string;
  status: string;
  createdAt: string;
  recommendedInventory: {
    id: string;
    name: string;
    alamat: string | null;
  } | null;
}

