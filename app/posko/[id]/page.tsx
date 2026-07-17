import type { Metadata } from "next";
import { PoskoDashboard } from "@/components/posko/PoskoDashboard";
import type { PoskoData } from "@/types/posko";
import { poskoService } from "@/services/posko.service";

export const metadata: Metadata = {
  title: "Dasbor Posko — TepatSalur",
};

// Mock data — replace with Supabase query in production
const MOCK_POSKO: Record<string, PoskoData> = {
  "1": {
    id: "1",
    namaPosko: "Posko SD Negeri 01",
    alamat: "Jl. Merdeka No. 12, Kec. Cibinong, Bogor",
    triase: {
      status: "KRITIS",
      skor: 87,
      updatedAt: new Date(Date.now() - 2 * 60 * 1000).toISOString(),
    },
    demografi: {
      totalPengungsi: 150,
      lansia: 30,
      balita: 25,
      catatanMedis: "Banyak yang mulai diare. Persediaan oralit menipis.",
    },
    logistik: [
      {
        id: "log-1",
        nama: "Air Mineral",
        satuan: "Dus",
        target: 100,
        booked: 40,
        fulfilled: 10,
        status: "KURANG",
      },
      {
        id: "log-2",
        nama: "Popok Bayi",
        satuan: "Pack",
        target: 50,
        booked: 50,
        fulfilled: 0,
        status: "MENUNGGU",
      },
      {
        id: "log-3",
        nama: "Obat Diare",
        satuan: "Kotak",
        target: 30,
        booked: 0,
        fulfilled: 30,
        status: "TERPENUHI",
      },
    ],
    kedatangan: [
      {
        id: "arr-1",
        namaRelawan: "Budi Santoso",
        barang: "Air Mineral",
        jumlah: 40,
        satuan: "Dus",
        statusKedatangan: "MENUJU_LOKASI",
      },
      {
        id: "arr-2",
        namaRelawan: "Sari Dewi",
        barang: "Popok Bayi",
        jumlah: 50,
        satuan: "Pack",
        statusKedatangan: "MENUJU_LOKASI",
      },
    ],
  },
};

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function PoskoPage({ params }: PageProps) {
  const { id } = await params;

  return <PoskoDashboard poskoId={id} />;
}
