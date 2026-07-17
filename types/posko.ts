export type TriaseStatus = "KRITIS" | "WASPADA" | "AMAN";

export interface AiTriase {
  status: TriaseStatus;
  skor: number;
  updatedAt: string;
}

export interface Demografi {
  totalPengungsi: number; 
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


export interface PoskoSummary {
  id: string;
  namaPosko: string;
  alamat: string;
  kecamatan: string;
  triase: AiTriase;
  totalPengungsi: number;
  kebutuhanKritis: string[]; 
  relawanAktif: number;
  mapX?: number; 
  mapY?: number; 
  imageUrl?: string; 
  lat?: number; 
  lng?: number; 
  jenis?: "bencana" | "relawan"; 
}
