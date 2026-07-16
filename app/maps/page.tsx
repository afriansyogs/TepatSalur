import type { Metadata } from "next";
import { CombinedMapView } from "@/components/maps/CombinedMapView";

export const metadata: Metadata = {
  title: "Peta Distribusi & Urgensi — TepatSalur",
  description: "Pantau sebaran Posko Relawan dan tingkat urgensi Posko Bencana secara real-time.",
};

export default function MapsPage() {
  return <CombinedMapView />;
}
