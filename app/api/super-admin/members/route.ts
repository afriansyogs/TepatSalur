import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getMembersQuerySchema } from "@/schemas/members";

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { data: adminRow, error: adminError } = await supabase
      .from("users")
      .select("role, community_id")
      .eq("id", user.id)
      .single();

    if (adminError || !adminRow || adminRow.role !== "SUPER_ADMIN") {
      return NextResponse.json({ success: false, error: "Akses ditolak" }, { status: 403 });
    }

    const adminCommunityId = adminRow.community_id;
    if (!adminCommunityId) {
      return NextResponse.json({
        success: true,
        data: [],
        metadata: {
          poskos: [],
          inventories: [],
        },
      });
    }

    const searchParams = req.nextUrl.searchParams;
    const search = searchParams.get("search") || undefined;
    const assignmentType = searchParams.get("assignment_type")?.toUpperCase() || undefined;
    const status = searchParams.get("status")?.toUpperCase() || undefined;

    const parsedQuery = getMembersQuerySchema.safeParse({
      search,
      assignment_type: assignmentType,
      status,
    });

    if (!parsedQuery.success) {
      return NextResponse.json(
        { success: false, error: parsedQuery.error.message },
        { status: 400 }
      );
    }

    let query = supabase
      .from("users")
      .select(`
        id,
        name,
        email,
        phone,
        status,
        created_at,
        user_profiles (
          nama_lengkap,
          alamat,
          nik,
          tempat_lahir,
          tanggal_lahir,
          jenis_kelamin
        ),
        relawan_assignments (
          id,
          assignment_type,
          status,
          assigned_at,
          is_active,
          posko (
            id,
            name
          ),
          inventory_locations (
            id,
            name
          )
        )
      `)
      .eq("role", "RELAWAN")
      .eq("community_id", adminCommunityId);

    if (status) {
      query = query.eq("status", status);
    }

    const { data: rawMembers, error: membersError } = await query;
    if (membersError) {
      return NextResponse.json({ success: false, error: membersError.message }, { status: 500 });
    }

    let members = rawMembers || [];

    const extractSingle = (val: any) => {
      return Array.isArray(val) ? val[0] : val;
    };

    const findActiveAssignment = (assignments: any) => {
      if (!assignments) return null;
      const list = Array.isArray(assignments) ? assignments : [assignments];
      return list.find((a: any) => a.is_active === true) || null;
    };

    if (search) {
      const searchLower = search.toLowerCase();
      members = members.filter((m: any) => {
        const nameMatch = m.name?.toLowerCase().includes(searchLower) || false;
        const emailMatch = m.email?.toLowerCase().includes(searchLower) || false;
        const phoneMatch = m.phone?.toLowerCase().includes(searchLower) || false;

        const profile = extractSingle(m.user_profiles);
        const profileMatch = profile?.nama_lengkap?.toLowerCase().includes(searchLower) || false;

        return nameMatch || emailMatch || phoneMatch || profileMatch;
      });
    }

    if (assignmentType) {
      members = members.filter((m: any) => {
        const activeAssign = findActiveAssignment(m.relawan_assignments);
        if (assignmentType === "UNASSIGNED") {
          return !activeAssign;
        } else {
          return activeAssign?.assignment_type === assignmentType;
        }
      });
    }

    const mappedData = members.map((m: any) => {
      const profile = extractSingle(m.user_profiles);
      const activeAssign = findActiveAssignment(m.relawan_assignments);

      let assignment = null;
      if (activeAssign) {
        let location = null;
        if (activeAssign.assignment_type === "POSKO") {
          const posko = extractSingle(activeAssign.posko);
          if (posko) {
            location = {
              id: posko.id,
              name: posko.name,
            };
          }
        } else if (activeAssign.assignment_type === "INVENTORY") {
          const inventory = extractSingle(activeAssign.inventory_locations);
          if (inventory) {
            location = {
              id: inventory.id,
              name: inventory.name,
            };
          }
        }

        assignment = {
          id: activeAssign.id,
          assignmentType: activeAssign.assignment_type,
          status: activeAssign.status,
          assignedAt: activeAssign.assigned_at || activeAssign.created_at,
          location,
        };
      }

      return {
        id: m.id,
        name: m.name,
        email: m.email,
        phone: m.phone,
        status: m.status,
        createdAt: m.created_at,
        profile: profile
          ? {
              namaLengkap: profile.nama_lengkap,
              alamat: profile.alamat,
              nik: profile.nik,
              tempatLahir: profile.tempat_lahir,
              tanggalLahir: profile.tanggal_lahir,
              jenisKelamin: profile.jenis_kelamin,
            }
          : null,
        assignment,
      };
    });

    const { data: poskoList, error: poskoError } = await supabase
      .from("posko")
      .select("id, name")
      .eq("community_id", adminCommunityId);

    const { data: inventoryList, error: inventoryError } = await supabase
      .from("inventory_locations")
      .select("id, name")
      .eq("community_id", adminCommunityId)
      .eq("is_active", true);

    if (poskoError || inventoryError) {
      return NextResponse.json(
        {
          success: false,
          error: poskoError?.message || inventoryError?.message || "Gagal memproses metadata",
        },
        { status: 500 }
      );
    }

    const metadata = {
      poskos: (poskoList || []).map((p: any) => ({ id: p.id, name: p.name })),
      inventories: (inventoryList || []).map((i: any) => ({ id: i.id, name: i.name })),
    };

    return NextResponse.json({
      success: true,
      data: mappedData,
      metadata,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal Server Error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
