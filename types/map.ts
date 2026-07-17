import type { UrgencyStatus } from "./ai";

export interface StatsResponse {
  totalPengungsi: number;
  totalPoskoMerah: number;
  totalRelawanAktif: number;
}

export interface MapKebutuhanItem {
  id: string;
  itemName: string;
  category: string;
  qtyNeeded: number;
  qtyFulfilled: number;
  status: string;
}

export interface MapInventoryItem {
  id: string;
  itemName: string;
  category: string;
  qtyAvailable: number;
  qtyBooked: number;
}

export interface MapPoskoItem {
  id: string;
  type: "POSKO";
  name: string;
  latitude: number;
  longitude: number;
  aiStatus: UrgencyStatus | null;
  aiUrgencyScore: number | null;
  jumlahPengungsi: number;
  alamat: string | null;
  kabKota: string | null;
  provinsi: string | null;
  totalRelawan: number;
  kebutuhan: MapKebutuhanItem[];
}

export interface MapInventoryLocationItem {
  id: string;
  type: "INVENTORY";
  name: string;
  latitude: number;
  longitude: number;
  isActive: boolean;
  alamat: string | null;
  kabKota: string | null;
  provinsi: string | null;
  totalRelawan: number;
  items: MapInventoryItem[];
}

export interface MapResponse {
  posko: MapPoskoItem[];
  inventory: MapInventoryLocationItem[];
}

export interface PoskoDetailKebutuhan {
  id: string;
  itemName: string;
  category: string;
  qtyNeeded: number;
  qtyBooked: number;
  qtyFulfilled: number;
  status: string;
}

export interface PoskoDetailRelawan {
  name: string;
}

export interface PoskoDetailResponse {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  alamat: string | null;
  kabKota: string | null;
  provinsi: string | null;
  kecamatan: string | null;
  aiStatus: UrgencyStatus | null;
  aiUrgencyScore: number | null;
  jumlahPengungsi: number;
  jumlahDewasa: number;
  jumlahAnak: number;
  jumlahLansia: number;
  jumlahDisabilitas: number;
  jumlahIbuHamil: number;
  catatanMedisDarurat: string | null;
  kebutuhan: PoskoDetailKebutuhan[];
  relawan: PoskoDetailRelawan[];
}

export interface InventoryDetailResponse {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  alamat: string | null;
  kabKota: string | null;
  provinsi: string | null;
  kecamatan: string | null;
  isActive: boolean;
  items: MapInventoryItem[];
  relawan: PoskoDetailRelawan[];
}
