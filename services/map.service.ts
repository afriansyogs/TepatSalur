import type { MapResponse, StatsResponse, PoskoDetailResponse, InventoryDetailResponse } from "@/types/map";

export const mapService = {
  getStats: async (): Promise<StatsResponse> => {
    const res = await fetch("/api/stats");
    const json = await res.json();
    if (!res.ok) {
      throw new Error(json.error || "Gagal mengambil data statistik");
    }
    return json.data as StatsResponse;
  },

  getMapData: async (filter: "all" | "posko" | "inventory" = "all"): Promise<MapResponse> => {
    const url = new URL("/api/map", window.location.origin);
    url.searchParams.set("filter", filter);

    const res = await fetch(url.toString());
    const json = await res.json();
    if (!res.ok) {
      throw new Error(json.error || "Gagal mengambil data peta");
    }
    return json.data as MapResponse;
  },

  getPoskoDetail: async (id: string): Promise<PoskoDetailResponse> => {
    const res = await fetch(`/api/map/posko/${id}`);
    const json = await res.json();
    if (!res.ok) {
      throw new Error(json.error || "Gagal mengambil detail posko");
    }
    return json.data as PoskoDetailResponse;
  },

  getInventoryDetail: async (id: string): Promise<InventoryDetailResponse> => {
    const res = await fetch(`/api/map/inventory/${id}`);
    const json = await res.json();
    if (!res.ok) {
      throw new Error(json.error || "Gagal mengambil detail gudang");
    }
    return json.data as InventoryDetailResponse;
  },

  getRoute: async (
    origin: [number, number],
    destination: [number, number]
  ): Promise<{
    coordinates: [number, number][];
    distance: string;
    duration: string;
  } | null> => {
    try {
      const res = await fetch(
        `https://router.project-osrm.org/route/v1/driving/${origin[0]},${origin[1]};${destination[0]},${destination[1]}?geometries=geojson&overview=full`,
        { signal: AbortSignal.timeout(10000) }
      );
      const json = await res.json();
      if (json.code !== "Ok" || !json.routes?.length) return null;

      const route = json.routes[0];
      const coords = route.geometry.coordinates;
      const km = route.distance / 1000;
      const min = Math.round(route.duration / 60);

      return {
        coordinates: coords,
        distance: `${km.toFixed(1)} km`,
        duration:
          min >= 60
            ? `${Math.floor(min / 60)} jam ${min % 60} menit`
            : `${min} menit`,
      };
    } catch {
      return null;
    }
  },
};
