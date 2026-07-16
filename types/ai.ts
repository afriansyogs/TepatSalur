export type KebutuhanKategori = "MAKANAN" | "PAKAIAN" | "OBAT" | "LAINNYA";

export type UrgencyStatus = "MERAH" | "KUNING" | "HIJAU";

export interface KebutuhanItem {
  kategori: KebutuhanKategori;
  namaBarang: string;
  qtyNeeded: number;
}

export interface VoiceParseResult {
  jumlahPengungsi: number;
  jumlahDewasa: number;
  jumlahAnak: number;
  jumlahLansia: number;
  jumlahDisabilitas: number;
  jumlahIbuHamil: number;
  catatanMedisDarurat: string;
  kebutuhan: KebutuhanItem[];
}

export interface TriageResult {
  status: UrgencyStatus;
  score: number;
  reasoning: string;
}

export interface DistribusiRecommendationItem {
  inventoryItemId: string;
  kebutuhanId: string;
  itemName: string;
  category: KebutuhanKategori;
  qtyAllocated: number;
}

export interface DistribusiRecommendation {
  poskoId: string;
  poskoName: string;
  aiStatus: UrgencyStatus | null;
  aiUrgencyScore: number | null;
  reasoning: string;
  items: DistribusiRecommendationItem[];
}

export interface DistribusiRecommendationResponse {
  inventoryLocationId: string;
  recommendations: DistribusiRecommendation[];
}

export interface AssignedPosko {
  id: string;
  communityId: string;
  name: string;
  alamat: string | null;
  provinsi: string | null;
  kabKota: string | null;
  kecamatan: string | null;
  latitude: number;
  longitude: number;
  jumlahPengungsi: number;
  jumlahDewasa: number;
  jumlahAnak: number;
  jumlahLansia: number;
  jumlahDisabilitas: number;
  jumlahIbuHamil: number;
  catatanMedisDarurat: string | null;
  aiStatus: UrgencyStatus | null;
  aiUrgencyScore: number | null;
  createdAt: string;
  updatedAt: string;
}

