export type TriaseStatus = "KRITIS" | "WASPADA" | "AMAN";

export interface AiTriase {
  status: TriaseStatus;
  skor: number;
  updatedAt: string;
}

export interface Demografi {
  totalPengungsi: number; // This can now be a derived sum or kept as total
  dewasa?: number;
  anakAnak?: number;
  lansia: number;
  balita: number;
  ibuHamil?: number;
  disabilitas?: number;
  catatanMedis: string;
}

export type LogistikStatus = "KURANG" | "MENUNGGU" | "TERPENUHI";

export interface LogistikItem {
  id: string;
  nama: string;
  satuan: string;
  target: number;
  booked: number;
  fulfilled: number;
  status: LogistikStatus;
}

export interface Kedatangan {
  id: string;
  namaRelawan: string;
  barang: string;
  jumlah: number;
  satuan: string;
  statusKedatangan: "MENUJU_LOKASI" | "TIBA" | "DIKONFIRMASI";
}

export interface PoskoData {
  id: string;
  namaPosko: string;
  alamat: string;
  triase: AiTriase;
  demografi: Demografi;
  logistik: LogistikItem[];
  kedatangan: Kedatangan[];
}

/** Lightweight summary used on the list page */
export interface PoskoSummary {
  id: string;
  namaPosko: string;
  alamat: string;
  kecamatan: string;
  triase: AiTriase;
  totalPengungsi: number;
  kebutuhanKritis: string[]; // top 2 items still KURANG
  relawanAktif: number;
  mapX?: number; // percentage coordinate on SVG map (0-100)
  mapY?: number; // percentage coordinate on SVG map (0-100)
  imageUrl?: string; // image preview url
  lat?: number; // Real GPS Latitude
  lng?: number; // Real GPS Longitude
  jenis?: "bencana" | "relawan"; // Untuk membedakan di peta
}
