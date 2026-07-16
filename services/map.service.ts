export type PoskoType = "bencana" | "relawan";
export type UrgencyLevel = "kritis" | "siaga" | "aman";

export interface MapMarkerData {
  id: string;
  type: PoskoType;
  name: string;
  location: [number, number]; // [longitude, latitude]
  urgency?: UrgencyLevel;
  refugeesCount?: number;
  needs?: string[];
  description?: string;
}

// Data dummy (seolah-olah dari API)
const dummyData: MapMarkerData[] = [
  // Mark Relawan (Hub)
  {
    id: "hub-1",
    type: "relawan",
    name: "Basecamp Relawan Pusat Jabar",
    location: [107.6191, -6.9175], // Bandung
    description: "Hub distribusi utama untuk wilayah Jawa Barat.",
  },
  {
    id: "hub-2",
    type: "relawan",
    name: "Posko Relawan Garut",
    location: [107.9087, -7.2279], // Garut
    description: "Basecamp koordinasi logistik area Garut dan sekitarnya.",
  },

  // Mark Posko Bencana
  {
    id: "posko-1",
    type: "bencana",
    name: "Posko Harapan Baru",
    location: [107.138, -6.816], // Cianjur area
    urgency: "kritis",
    refugeesCount: 350,
    needs: ["Tenda", "Obat-obatan", "Air Bersih", "Selimut"],
  },
  {
    id: "posko-2",
    type: "bencana",
    name: "Posko Sejahtera",
    location: [107.95, -7.2], // Garut area
    urgency: "siaga",
    refugeesCount: 120,
    needs: ["Pakaian Layak", "Sembako", "Susu Bayi"],
  },
  {
    id: "posko-3",
    type: "bencana",
    name: "Posko Aman Damai",
    location: [107.63, -6.95], // Bandung area
    urgency: "aman",
    refugeesCount: 80,
    needs: ["Alat Kebersihan"],
  },
  {
    id: "posko-4",
    type: "bencana",
    name: "Pengungsian Darurat Sukabumi",
    location: [106.9237, -6.9277], // Sukabumi
    urgency: "kritis",
    refugeesCount: 500,
    needs: ["Genset", "Makanan Siap Saji", "Obat-obatan"],
  },
];

export const mapService = {
  getMapMarkers: async (): Promise<MapMarkerData[]> => {
    // Simulasi delay fetch API
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(dummyData);
      }, 500);
    });
  },
};
