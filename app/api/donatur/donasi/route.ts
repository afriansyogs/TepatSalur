import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { donasiInsertSchema } from "@/schemas/donasi";
import { RecommendedInventory } from "@/types/donasi";

function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's radius in kilometers
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export async function POST(req: Request) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { data: dbUser } = await supabase
      .from("users")
      .select("role")
      .eq("id", user.id)
      .single();

    if (!dbUser || dbUser.role !== "DONATUR") {
      return NextResponse.json({ success: false, error: "Akses ditolak" }, { status: 403 });
    }

    const body = await req.json();
    const validated = donasiInsertSchema.parse(body);

    const { data: locations, error: locationsError } = await supabase
      .from("inventory_locations")
      .select("id, name, alamat, latitude, longitude")
      .eq("is_active", true);

    if (locationsError) {
      return NextResponse.json({ success: false, error: locationsError.message }, { status: 500 });
    }

    if (!locations || locations.length === 0) {
      return NextResponse.json(
        { success: false, error: "Tidak ada lokasi gudang/inventory yang aktif saat ini" },
        { status: 500 }
      );
    }

    // Calculate closest location or use manually specified target
    let closestLocation: typeof locations[0] | null = null;
    let minDistance = Infinity;

    const manualInventoryId = (validated as any).recommendedInventoryId;

    if (manualInventoryId) {
      const selected = locations.find((l) => l.id === manualInventoryId);
      if (selected) {
        closestLocation = selected;
        minDistance = calculateDistance(
          validated.latitude,
          validated.longitude,
          selected.latitude,
          selected.longitude
        );
      }
    }

    if (!closestLocation) {
      for (const loc of locations) {
        const distance = calculateDistance(
          validated.latitude,
          validated.longitude,
          loc.latitude,
          loc.longitude
        );
        if (distance < minDistance) {
          minDistance = distance;
          closestLocation = loc;
        }
      }
    }

    if (!closestLocation) {
      return NextResponse.json(
        { success: false, error: "Gagal menghitung gudang rekomendasi" },
        { status: 500 }
      );
    }

    const donationRows = validated.items.map((item) => ({
      donatur_id: user.id,
      item_name: item.itemName,
      category: item.category,
      qty_donated: item.qtyDonated,
      latitude: validated.latitude,
      longitude: validated.longitude,
      alamat_pickup: validated.alamatPickup,
      recommended_inventory_id: closestLocation.id,
      status: "PENDING",
    }));

    const { data: donations, error: donationError } = await supabase
      .from("donasi")
      .insert(donationRows)
      .select("id");

    if (donationError) {
      return NextResponse.json({ success: false, error: donationError.message }, { status: 500 });
    }

    const recommendedInventory: RecommendedInventory = {
      id: closestLocation.id,
      name: closestLocation.name,
      alamat: closestLocation.alamat ?? null,
      latitude: closestLocation.latitude,
      longitude: closestLocation.longitude,
      distanceKm: Number(minDistance.toFixed(2)),
    };

    const donationIds = donations.map((d) => d.id as string);

    return NextResponse.json({
      success: true,
      data: {
        donationIds,
        recommendedInventory,
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Terjadi kesalahan";
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}
