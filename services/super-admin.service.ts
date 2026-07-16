import { 
  MembersResponse, 
  LocationsResponse, 
  PatchMemberPayload,
  UpdateInventoryPayload,
  MemberData,
  LocationMetadata
} from "@/types/super-admin";

export const superAdminService = {
  getMembers: async (params?: { search?: string; assignmentType?: string; status?: string }): Promise<MembersResponse> => {
    const url = new URL("/api/super-admin/members", window.location.origin);
    if (params?.search) url.searchParams.set("search", params.search);
    if (params?.assignmentType) url.searchParams.set("assignment_type", params.assignmentType);
    if (params?.status) url.searchParams.set("status", params.status);

    const res = await fetch(url.toString(), {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.error || "Gagal mengambil data anggota");
    }

    const json = await res.json();
    return json as MembersResponse;
  },

  updateMember: async (memberId: string, payload: PatchMemberPayload): Promise<{ success: boolean; error?: string }> => {
    const res = await fetch(`/api/super-admin/members/${memberId}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const json = await res.json();
    if (!res.ok) {
      throw new Error(json.error || "Gagal mengupdate anggota");
    }
    return json;
  },

  getLocations: async (): Promise<LocationsResponse> => {
    const res = await fetch("/api/super-admin/locations", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.error || "Gagal mengambil data lokasi");
    }

    const json = await res.json();
    return json as LocationsResponse;
  },

  updateInventoryStock: async (id: string, payload: UpdateInventoryPayload): Promise<{ success: boolean; error?: string }> => {
    const res = await fetch(`/api/super-admin/locations/inventory/${id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const json = await res.json();
    if (!res.ok) {
      throw new Error(json.error || "Gagal mengupdate stok basecamp");
    }
    return json;
  },

  createLocation: async (type: "POSKO" | "INVENTORY", payload: any): Promise<{ success: boolean; data?: any; error?: string }> => {
    const res = await fetch("/api/super-admin/locations", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ type, payload }),
    });

    const json = await res.json();
    if (!res.ok) {
      throw new Error(json.error || "Gagal membuat lokasi baru");
    }
    return json;
  }
};
