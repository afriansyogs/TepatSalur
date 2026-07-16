export type LocationType = "POSKO" | "INVENTORY" | "UNASSIGNED";
export type MemberStatus = "ACTIVE" | "INACTIVE" | "PENDING";

export interface LocationMetadata {
  id: string;
  name: string;
}

export interface MemberAssignment {
  id: string;
  assignmentType: LocationType;
  status: string;
  assignedAt: string;
  location: LocationMetadata | null;
}

export interface MemberProfile {
  namaLengkap: string;
  alamat: string;
  nik: string;
  tempatLahir: string;
  tanggalLahir: string;
  jenisKelamin: "L" | "P";
}

export interface MemberData {
  id: string;
  name: string;
  email: string;
  phone: string;
  status: MemberStatus;
  createdAt: string;
  profile: MemberProfile | null;
  assignment: MemberAssignment | null;
}

export interface MembersResponse {
  success: boolean;
  data: MemberData[];
  metadata: {
    poskos: LocationMetadata[];
    inventories: LocationMetadata[];
  };
  error?: string;
}

export interface PoskoNeed {
  id: string;
  item_name: string;
  qty_needed: number;
  qty_fulfilled: number;
  status: string;
}

export interface InventoryItem {
  id: string;
  item_name: string;
  category: string;
  qty_available: number;
}

export interface PoskoLocationData {
  id: string;
  type: "POSKO";
  name: string;
  alamat: string;
  latitude: number;
  longitude: number;
  urgencyStatus: string;
  urgencyScore: number;
  totalVolunteers: number;
  needs: PoskoNeed[];
}

export interface InventoryLocationData {
  id: string;
  type: "INVENTORY";
  name: string;
  alamat: string;
  latitude: number;
  longitude: number;
  isActive: boolean;
  totalVolunteers: number;
  needs: InventoryItem[];
}

export interface LocationsResponse {
  success: boolean;
  data: {
    poskos: PoskoLocationData[];
    inventories: InventoryLocationData[];
  };
  error?: string;
}

export interface PatchMemberPayload {
  status?: MemberStatus;
  assignmentType?: LocationType;
  poskoId?: string;
  inventoryLocationId?: string;
}

export interface UpdateInventoryPayload {
  needs: {
    id?: string;
    item_name: string;
    category: string;
    qty_available: number;
    satuan: string;
  }[];
}

export interface CreatePoskoPayload {
  name: string;
  latitude: number;
  longitude: number;
  alamat?: string;
  jumlah_dewasa?: number;
  jumlah_anak?: number;
  jumlah_lansia?: number;
  jumlah_balita?: number;
  jumlah_ibu_hamil?: number;
  jumlah_disabilitas?: number;
  catatan_medis_darurat?: string;
  needs?: {
    item_name: string;
    qty_needed: number;
  }[];
}
