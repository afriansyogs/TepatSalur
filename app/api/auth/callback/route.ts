import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')

  let next = searchParams.get('next') ?? '/dashboard'

  if (code) {
    const supabase = await createClient()
    const { data: authData, error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (!error && authData.user) {
      if (next === '/dashboard') {
        const { data: profile } = await supabase
          .from("users")
          .select("role, created_at")
          .eq("id", authData.user.id)
          .single();
        
        let role = profile?.role;
        const requestedRole = searchParams.get('requested_role');
        
        let isNewUser = false;
        if (profile?.created_at) {
          let createdAtStr = profile.created_at;
          if (!createdAtStr.endsWith("Z") && !createdAtStr.includes("+") && !createdAtStr.includes("-")) {
            createdAtStr += "Z";
          }
          const createdAtTime = new Date(createdAtStr).getTime();
          // Use 10 minutes (600000 ms) to handle clock drift
          isNewUser = Math.abs(Date.now() - createdAtTime) < 600000;
        }
        
        if (requestedRole) {
          const mappedRole = requestedRole.toUpperCase();
          const validRoles = ["ADMIN_POSKO", "RELAWAN", "DONATUR"];
          
          if (validRoles.includes(mappedRole)) {
            // Update if user is new, or if their current role is the default RELAWAN and they requested DONATUR
            const isUpgrading = role === "RELAWAN" && mappedRole === "DONATUR";
            if (isNewUser || isUpgrading) {
              await supabase.from("users").update({ role: mappedRole }).eq("id", authData.user.id);
              role = mappedRole;
            }
          }
        }
        
        if (role === "ADMIN_POSKO" || role === "SUPER_ADMIN") {
          const { data: profileRow } = await supabase
            .from("user_profiles")
            .select("is_completed")
            .eq("user_id", authData.user.id)
            .single();

          if (!profileRow?.is_completed) {
            next = "/onboarding/admin";
          } else {
            next = "/dashboard/super-admin";
          }
        } else if (role === "DONATUR") {
          next = "/dashboard/donatur/buat-donasi";
        } else {
          const { data: profileRow } = await supabase
            .from("user_profiles")
            .select("is_completed")
            .eq("user_id", authData.user.id)
            .single();

          if (!profileRow?.is_completed) {
            next = "/onboarding/relawan";
          } else {
            next = "/dashboard/relawan";
          }
        }
      }

      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  return NextResponse.redirect(`${origin}/login?error=Could+not+authenticate+user`)
}
